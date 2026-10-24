import asyncio
import logging
import os
import urllib.request
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base, SessionLocal
from .services.templates_seed import seed_demo_project_if_empty
from .routers import (
    subnets_router,
    projects_router,
    subnet_alloc_router,
    devices_router,
    assignments_router,
    links_router,
    validation_router,
    exports_router,
    templates_router,
)

logger = logging.getLogger("netplantool.keepalive")


async def _render_keepalive_worker(url: str, interval_seconds: int = 600):
    """Background worker that pings the Render external URL every 10 min to prevent spinning down."""
    # Delay initial ping by 30 seconds to allow the server to fully bind
    await asyncio.sleep(30)
    health_url = url.rstrip("/") + "/api/health"
    logger.info("Render keep-alive worker started. Target: %s (interval: %ss)", health_url, interval_seconds)
    while True:
        try:
            req = urllib.request.Request(
                health_url,
                headers={"User-Agent": "NetPlanTool-KeepAliveWorker/1.0"}
            )
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, lambda: urllib.request.urlopen(req, timeout=20).close())
            logger.info("Render keep-alive ping succeeded: %s", health_url)
        except Exception as exc:
            logger.debug("Render keep-alive ping notice: %s", exc)
        await asyncio.sleep(interval_seconds)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_project_if_empty(db)
    finally:
        db.close()

    keepalive_task = None
    render_url = os.getenv("RENDER_EXTERNAL_URL") or os.getenv("KEEP_ALIVE_URL")
    if render_url:
        keepalive_task = asyncio.create_task(_render_keepalive_worker(render_url))

    yield

    if keepalive_task:
        keepalive_task.cancel()
        try:
            await keepalive_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Network Planning Toolkit REST API for IPv4 subnet calculation, planning, inventory, and topology.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers under /api
app.include_router(subnets_router, prefix=settings.API_PREFIX)
app.include_router(projects_router, prefix=settings.API_PREFIX)
app.include_router(subnet_alloc_router, prefix=settings.API_PREFIX)
app.include_router(devices_router, prefix=settings.API_PREFIX)
app.include_router(assignments_router, prefix=settings.API_PREFIX)
app.include_router(links_router, prefix=settings.API_PREFIX)
app.include_router(validation_router, prefix=settings.API_PREFIX)
app.include_router(exports_router, prefix=settings.API_PREFIX)
app.include_router(templates_router, prefix=settings.API_PREFIX)


@app.get("/health", tags=["system"])
@app.get("/api/health", tags=["system"])
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME, "version": "1.0.0"}


# In production deployment: mount static SPA built assets
import os
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")


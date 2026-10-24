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


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_project_if_empty(db)
    finally:
        db.close()
    yield


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


@app.get("/api/health", tags=["system"])
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME, "version": "1.0.0"}

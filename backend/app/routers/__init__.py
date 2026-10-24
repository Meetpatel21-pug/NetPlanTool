from .subnets import router as subnets_router
from .projects import router as projects_router
from .subnet_alloc import router as subnet_alloc_router
from .devices import router as devices_router
from .assignments import router as assignments_router
from .links import router as links_router
from .validation import router as validation_router
from .exports import router as exports_router
from .templates import router as templates_router

__all__ = [
    "subnets_router",
    "projects_router",
    "subnet_alloc_router",
    "devices_router",
    "assignments_router",
    "links_router",
    "validation_router",
    "exports_router",
    "templates_router",
]

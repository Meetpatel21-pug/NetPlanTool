from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.template import Template
from ..schemas.template import TemplateSummaryResponse, TemplateInstantiateRequest
from ..schemas.project import ProjectRead
from ..services.templates_seed import STARTER_TEMPLATES, instantiate_template, seed_templates

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("", response_model=List[TemplateSummaryResponse])
def list_starter_templates(db: Session = Depends(get_db)):
    """List available network starter templates."""
    seed_templates(db)
    templates = db.query(Template).all()
    results = []
    for t in templates:
        data = t.template_data or {}
        results.append(
            TemplateSummaryResponse(
                id=t.id,
                name=t.name,
                description=t.description,
                version=t.version,
                subnet_count=len(data.get("subnets", [])),
                device_count=len(data.get("devices", [])),
            )
        )
    return results


@router.post("/{template_id}/instantiate", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def instantiate_project_from_template(
    template_id: str,
    payload: TemplateInstantiateRequest = TemplateInstantiateRequest(),
    db: Session = Depends(get_db)
):
    """Instantiate a new project initialized with template subnets, devices, IP allocations, and diagram layout."""
    try:
        project = instantiate_template(
            db,
            template_id,
            custom_name=payload.name,
            custom_desc=payload.description
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    return ProjectRead(
        id=project.id,
        name=project.name,
        description=project.description,
        owner_id=project.owner_id,
        version=project.version,
        created_at=project.created_at,
        updated_at=project.updated_at,
        subnet_count=len(project.subnets),
        device_count=len(project.devices)
    )

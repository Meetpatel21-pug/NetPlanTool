from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.project import Project
from ..models.device import Device
from ..models.link import Link
from ..schemas.link import LinkCreate, LinkUpdate, LinkRead
from ..schemas.diagram import DiagramLayoutUpdate
from ..dependencies import get_project_or_404

router = APIRouter(prefix="/projects/{project_id}", tags=["links"])


def enrich_link_read(link: Link) -> LinkRead:
    return LinkRead(
        id=link.id,
        project_id=link.project_id,
        source_device_id=link.source_device_id,
        target_device_id=link.target_device_id,
        label=link.label,
        speed_note=link.speed_note,
        diagram_metadata=link.diagram_metadata,
        created_at=link.created_at,
        updated_at=link.updated_at,
        source_device_name=link.source_device.name if link.source_device else None,
        target_device_name=link.target_device.name if link.target_device else None
    )


@router.get("/links", response_model=List[LinkRead])
def list_links(project: Project = Depends(get_project_or_404)):
    return [enrich_link_read(link) for link in project.links]


@router.post("/links", response_model=LinkRead, status_code=status.HTTP_201_CREATED)
def create_link(
    payload: LinkCreate,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    if payload.source_device_id == payload.target_device_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot connect a device to itself."
        )

    src = db.query(Device).filter(Device.id == payload.source_device_id, Device.project_id == project.id).first()
    if not src:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source device '{payload.source_device_id}' not found in project."
        )

    tgt = db.query(Device).filter(Device.id == payload.target_device_id, Device.project_id == project.id).first()
    if not tgt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target device '{payload.target_device_id}' not found in project."
        )

    # Check for existing duplicate link between these devices
    existing = db.query(Link).filter(
        Link.project_id == project.id,
        ((Link.source_device_id == payload.source_device_id) & (Link.target_device_id == payload.target_device_id)) |
        ((Link.source_device_id == payload.target_device_id) & (Link.target_device_id == payload.source_device_id))
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A link already exists between '{src.name}' and '{tgt.name}'."
        )

    link = Link(
        project_id=project.id,
        source_device_id=payload.source_device_id,
        target_device_id=payload.target_device_id,
        label=payload.label.strip() if payload.label else None,
        speed_note=payload.speed_note.strip() if payload.speed_note else None,
        diagram_metadata=payload.diagram_metadata
    )
    db.add(link)
    project.bump_version()
    db.commit()
    db.refresh(link)

    return enrich_link_read(link)


@router.put("/links/{link_id}", response_model=LinkRead)
def update_link(
    link_id: str,
    payload: LinkUpdate,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    link = db.query(Link).filter(Link.id == link_id, Link.project_id == project.id).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Link '{link_id}' not found.")

    if payload.label is not None:
        link.label = payload.label.strip() if payload.label else None
    if payload.speed_note is not None:
        link.speed_note = payload.speed_note.strip() if payload.speed_note else None
    if payload.diagram_metadata is not None:
        link.diagram_metadata = payload.diagram_metadata

    project.bump_version()
    db.commit()
    db.refresh(link)
    return enrich_link_read(link)


@router.delete("/links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_link(
    link_id: str,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    link = db.query(Link).filter(Link.id == link_id, Link.project_id == project.id).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Link '{link_id}' not found.")

    db.delete(link)
    project.bump_version()
    db.commit()
    return None


@router.put("/diagram/layout", status_code=status.HTTP_200_OK)
def update_diagram_layout(
    payload: DiagramLayoutUpdate,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    """Batch persist node canvas coordinates."""
    updated_count = 0
    for pos in payload.positions:
        device = db.query(Device).filter(Device.id == pos.device_id, Device.project_id == project.id).first()
        if device:
            device.diagram_x = pos.diagram_x
            device.diagram_y = pos.diagram_y
            updated_count += 1

    project.bump_version()
    db.commit()
    return {"status": "ok", "updated_nodes": updated_count, "version": project.version}

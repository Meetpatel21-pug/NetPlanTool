import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.project import Project
from ..models.subnet import Subnet
from ..models.device import Device
from ..models.assignment import IPAssignment
from ..models.link import Link
from ..schemas.project import ProjectCreate, ProjectUpdate, ProjectRead, ProjectDetailRead
from ..dependencies import get_project_or_404

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=List[ProjectRead])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.updated_at.desc()).all()
    results = []
    for p in projects:
        results.append(ProjectRead(
            id=p.id,
            name=p.name,
            description=p.description,
            owner_id=p.owner_id,
            version=p.version,
            created_at=p.created_at,
            updated_at=p.updated_at,
            subnet_count=len(p.subnets),
            device_count=len(p.devices)
        ))
    return results


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else None,
        owner_id=payload.owner_id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return ProjectRead(
        id=project.id,
        name=project.name,
        description=project.description,
        owner_id=project.owner_id,
        version=project.version,
        created_at=project.created_at,
        updated_at=project.updated_at,
        subnet_count=0,
        device_count=0
    )


@router.get("/{project_id}", response_model=ProjectDetailRead)
def get_project_details(project: Project = Depends(get_project_or_404)):
    return project


@router.put("/{project_id}", response_model=ProjectRead)
def update_project(
    payload: ProjectUpdate,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    if payload.name is not None:
        project.name = payload.name.strip()
    if payload.description is not None:
        project.description = payload.description.strip() if payload.description else None
    
    project.bump_version()
    db.commit()
    db.refresh(project)
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


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    db.delete(project)
    db.commit()
    return None


@router.post("/{project_id}/duplicate", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def duplicate_project(
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    """Deep clone a project and all associated subnets, devices, assignments, and links."""
    new_project = Project(
        name=f"Copy of {project.name}",
        description=project.description,
        owner_id=project.owner_id,
        version=1
    )
    db.add(new_project)
    db.flush()

    subnet_id_map = {}
    device_id_map = {}

    # 1. Clone subnets
    for old_sub in project.subnets:
        new_sub_id = str(uuid.uuid4())
        subnet_id_map[old_sub.id] = new_sub_id
        new_sub = Subnet(
            id=new_sub_id,
            project_id=new_project.id,
            parent_subnet_id=None,
            cidr=old_sub.cidr,
            label=old_sub.label,
            segment=old_sub.segment,
            gateway=old_sub.gateway,
            dhcp_start=old_sub.dhcp_start,
            dhcp_end=old_sub.dhcp_end,
            requested_hosts=old_sub.requested_hosts,
            notes=old_sub.notes
        )
        db.add(new_sub)
    db.flush()

    # Link parent subnets
    for old_sub in project.subnets:
        if old_sub.parent_subnet_id and old_sub.parent_subnet_id in subnet_id_map:
            new_sub = db.query(Subnet).filter(Subnet.id == subnet_id_map[old_sub.id]).first()
            if new_sub:
                new_sub.parent_subnet_id = subnet_id_map[old_sub.parent_subnet_id]

    # 2. Clone devices
    for old_dev in project.devices:
        new_dev_id = str(uuid.uuid4())
        device_id_map[old_dev.id] = new_dev_id
        new_dev = Device(
            id=new_dev_id,
            project_id=new_project.id,
            name=old_dev.name,
            device_type=old_dev.device_type,
            role=old_dev.role,
            mac_address=old_dev.mac_address,
            location=old_dev.location,
            notes=old_dev.notes,
            diagram_x=old_dev.diagram_x,
            diagram_y=old_dev.diagram_y
        )
        db.add(new_dev)
    db.flush()

    # 3. Clone IP assignments
    for old_assign in project.ip_assignments:
        new_assign = IPAssignment(
            id=str(uuid.uuid4()),
            project_id=new_project.id,
            subnet_id=subnet_id_map.get(old_assign.subnet_id) if old_assign.subnet_id else None,
            device_id=device_id_map.get(old_assign.device_id) if old_assign.device_id else None,
            ipv4_address=old_assign.ipv4_address,
            assignment_type=old_assign.assignment_type,
            status=old_assign.status,
            notes=old_assign.notes
        )
        db.add(new_assign)

    # 4. Clone diagram links
    for old_link in project.links:
        if old_link.source_device_id in device_id_map and old_link.target_device_id in device_id_map:
            new_link = Link(
                id=str(uuid.uuid4()),
                project_id=new_project.id,
                source_device_id=device_id_map[old_link.source_device_id],
                target_device_id=device_id_map[old_link.target_device_id],
                label=old_link.label,
                speed_note=old_link.speed_note,
                diagram_metadata=old_link.diagram_metadata
            )
            db.add(new_link)

    db.commit()
    db.refresh(new_project)
    return ProjectRead(
        id=new_project.id,
        name=new_project.name,
        description=new_project.description,
        owner_id=new_project.owner_id,
        version=new_project.version,
        created_at=new_project.created_at,
        updated_at=new_project.updated_at,
        subnet_count=len(new_project.subnets),
        device_count=len(new_project.devices)
    )

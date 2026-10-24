from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.project import Project
from ..models.subnet import Subnet
from ..models.device import Device
from ..models.assignment import IPAssignment
from ..schemas.assignment import IPAssignmentCreate, IPAssignmentUpdate, IPAssignmentRead
from ..dependencies import get_project_or_404
from ..services.inventory_validator import validate_ip_assignment

router = APIRouter(prefix="/projects/{project_id}/assignments", tags=["assignments"])


def enrich_assignment_read(assignment: IPAssignment) -> IPAssignmentRead:
    return IPAssignmentRead(
        id=assignment.id,
        project_id=assignment.project_id,
        subnet_id=assignment.subnet_id,
        device_id=assignment.device_id,
        ipv4_address=assignment.ipv4_address,
        assignment_type=assignment.assignment_type,  # type: ignore
        status=assignment.status,  # type: ignore
        notes=assignment.notes,
        created_at=assignment.created_at,
        updated_at=assignment.updated_at,
        device_name=assignment.device.name if assignment.device else None,
        device_role=assignment.device.role if assignment.device else None,
        subnet_label=assignment.subnet.label if assignment.subnet else None,
        subnet_cidr=assignment.subnet.cidr if assignment.subnet else None
    )


@router.get("", response_model=List[IPAssignmentRead])
def list_assignments(project: Project = Depends(get_project_or_404)):
    return [enrich_assignment_read(a) for a in project.ip_assignments]


@router.post("", response_model=IPAssignmentRead, status_code=status.HTTP_201_CREATED)
def create_assignment(
    payload: IPAssignmentCreate,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    try:
        # Resolve Subnet if given
        subnet: Optional[Subnet] = None
        if payload.subnet_id:
            subnet = db.query(Subnet).filter(
                Subnet.id == payload.subnet_id,
                Subnet.project_id == project.id
            ).first()
            if not subnet:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Subnet '{payload.subnet_id}' not found in project."
                )

        # Resolve Device if given
        if payload.device_id:
            device = db.query(Device).filter(
                Device.id == payload.device_id,
                Device.project_id == project.id
            ).first()
            if not device:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Device '{payload.device_id}' not found in project."
                )

        # Validate IP rules: duplicate check, subnet boundary, DHCP collision
        validate_ip_assignment(
            ipv4_address=payload.ipv4_address,
            subnet=subnet,
            project_assignments=project.ip_assignments,
            assignment_type=payload.assignment_type
        )

        assignment = IPAssignment(
            project_id=project.id,
            subnet_id=payload.subnet_id,
            device_id=payload.device_id,
            ipv4_address=payload.ipv4_address.strip(),
            assignment_type=payload.assignment_type,
            status=payload.status,
            notes=payload.notes.strip() if payload.notes else None
        )
        db.add(assignment)
        project.bump_version()
        db.commit()
        db.refresh(assignment)

        return enrich_assignment_read(assignment)

    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )


@router.put("/{assignment_id}", response_model=IPAssignmentRead)
def update_assignment(
    assignment_id: str,
    payload: IPAssignmentUpdate,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    assignment = db.query(IPAssignment).filter(
        IPAssignment.id == assignment_id,
        IPAssignment.project_id == project.id
    ).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"IP assignment '{assignment_id}' not found.")

    try:
        new_ip = payload.ipv4_address if payload.ipv4_address is not None else assignment.ipv4_address
        new_sub_id = payload.subnet_id if payload.subnet_id is not None else assignment.subnet_id
        new_type = payload.assignment_type if payload.assignment_type is not None else assignment.assignment_type

        subnet: Optional[Subnet] = None
        if new_sub_id:
            subnet = db.query(Subnet).filter(
                Subnet.id == new_sub_id,
                Subnet.project_id == project.id
            ).first()
            if not subnet:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Subnet '{new_sub_id}' not found.")

        if payload.device_id:
            device = db.query(Device).filter(
                Device.id == payload.device_id,
                Device.project_id == project.id
            ).first()
            if not device:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Device '{payload.device_id}' not found.")

        # Run validations
        validate_ip_assignment(
            ipv4_address=new_ip,
            subnet=subnet,
            project_assignments=project.ip_assignments,
            assignment_type=new_type,
            current_assignment_id=assignment.id
        )

        assignment.ipv4_address = new_ip.strip()
        assignment.subnet_id = new_sub_id
        if payload.device_id is not None:
            assignment.device_id = payload.device_id
        assignment.assignment_type = new_type
        if payload.status is not None:
            assignment.status = payload.status
        if payload.notes is not None:
            assignment.notes = payload.notes.strip() if payload.notes else None

        project.bump_version()
        db.commit()
        db.refresh(assignment)

        return enrich_assignment_read(assignment)

    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(
    assignment_id: str,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    assignment = db.query(IPAssignment).filter(
        IPAssignment.id == assignment_id,
        IPAssignment.project_id == project.id
    ).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Assignment '{assignment_id}' not found.")

    db.delete(assignment)
    project.bump_version()
    db.commit()
    return None

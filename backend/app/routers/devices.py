from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.project import Project
from ..models.device import Device
from ..schemas.device import DeviceCreate, DeviceUpdate, DeviceRead
from ..dependencies import get_project_or_404

router = APIRouter(prefix="/projects/{project_id}/devices", tags=["devices"])


def enrich_device_read(device: Device) -> DeviceRead:
    assigned_ips = [a.ipv4_address for a in device.ip_assignments]
    return DeviceRead(
        id=device.id,
        project_id=device.project_id,
        name=device.name,
        device_type=device.device_type,  # type: ignore
        role=device.role,
        mac_address=device.mac_address,
        location=device.location,
        notes=device.notes,
        diagram_x=device.diagram_x,
        diagram_y=device.diagram_y,
        created_at=device.created_at,
        updated_at=device.updated_at,
        assigned_ips=assigned_ips
    )


@router.get("", response_model=List[DeviceRead])
def list_devices(project: Project = Depends(get_project_or_404)):
    return [enrich_device_read(d) for d in project.devices]


@router.post("", response_model=DeviceRead, status_code=status.HTTP_201_CREATED)
def create_device(
    payload: DeviceCreate,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    device = Device(
        project_id=project.id,
        name=payload.name.strip(),
        device_type=payload.device_type,
        role=payload.role.strip(),
        mac_address=payload.mac_address.strip() if payload.mac_address else None,
        location=payload.location.strip() if payload.location else None,
        notes=payload.notes.strip() if payload.notes else None,
        diagram_x=payload.diagram_x,
        diagram_y=payload.diagram_y
    )
    db.add(device)
    project.bump_version()
    db.commit()
    db.refresh(device)
    return enrich_device_read(device)


@router.get("/{device_id}", response_model=DeviceRead)
def get_device(
    device_id: str,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    device = db.query(Device).filter(Device.id == device_id, Device.project_id == project.id).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Device '{device_id}' not found.")
    return enrich_device_read(device)


@router.put("/{device_id}", response_model=DeviceRead)
def update_device(
    device_id: str,
    payload: DeviceUpdate,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    device = db.query(Device).filter(Device.id == device_id, Device.project_id == project.id).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Device '{device_id}' not found.")

    if payload.name is not None:
        device.name = payload.name.strip()
    if payload.device_type is not None:
        device.device_type = payload.device_type
    if payload.role is not None:
        device.role = payload.role.strip()
    if payload.mac_address is not None:
        device.mac_address = payload.mac_address.strip() if payload.mac_address else None
    if payload.location is not None:
        device.location = payload.location.strip() if payload.location else None
    if payload.notes is not None:
        device.notes = payload.notes.strip() if payload.notes else None
    if payload.diagram_x is not None:
        device.diagram_x = payload.diagram_x
    if payload.diagram_y is not None:
        device.diagram_y = payload.diagram_y

    project.bump_version()
    db.commit()
    db.refresh(device)
    return enrich_device_read(device)


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device(
    device_id: str,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    device = db.query(Device).filter(Device.id == device_id, Device.project_id == project.id).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Device '{device_id}' not found.")

    db.delete(device)
    project.bump_version()
    db.commit()
    return None

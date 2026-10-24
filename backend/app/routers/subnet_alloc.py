from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.project import Project
from ..models.subnet import Subnet
from ..schemas.subnet import SubnetCreate, SubnetUpdate, SubnetRead
from ..dependencies import get_project_or_404
from ..services.subnet_planner import (
    parse_network,
    validate_ip_in_subnet,
    validate_dhcp_range,
    validate_containment,
    validate_no_sibling_overlap,
    check_host_capacity,
)
from ..services.subnet_calc import calculate_subnet

router = APIRouter(prefix="/projects/{project_id}/subnets", tags=["subnets"])


def enrich_subnet_read(subnet: Subnet) -> SubnetRead:
    calc = calculate_subnet(subnet.cidr)
    cap = check_host_capacity(subnet.requested_hosts, calc.prefix)
    return SubnetRead(
        id=subnet.id,
        project_id=subnet.project_id,
        parent_subnet_id=subnet.parent_subnet_id,
        cidr=str(calc.cidr),
        label=subnet.label,
        segment=subnet.segment,
        gateway=subnet.gateway,
        dhcp_start=subnet.dhcp_start,
        dhcp_end=subnet.dhcp_end,
        requested_hosts=subnet.requested_hosts,
        notes=subnet.notes,
        created_at=subnet.created_at,
        updated_at=subnet.updated_at,
        network_address=calc.network_address,
        broadcast_address=calc.broadcast_address,
        netmask=calc.netmask,
        total_addresses=calc.total_addresses,
        usable_addresses=calc.usable_addresses,
        usable_range=calc.usable_range,
        capacity_warning=cap["warning"]
    )


@router.get("", response_model=List[SubnetRead])
def list_project_subnets(
    project: Project = Depends(get_project_or_404)
):
    return [enrich_subnet_read(s) for s in project.subnets]


@router.post("", response_model=SubnetRead, status_code=status.HTTP_201_CREATED)
def create_subnet_allocation(
    payload: SubnetCreate,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    try:
        # 1. Parse and normalize candidate network object
        candidate_net = parse_network(payload.cidr)
        normalized_cidr = str(candidate_net)

        # 2. Validate Gateway and DHCP bounds against candidate subnet
        if payload.gateway:
            validate_ip_in_subnet(payload.gateway, candidate_net, "Default gateway")
        if payload.dhcp_start or payload.dhcp_end:
            validate_dhcp_range(payload.dhcp_start, payload.dhcp_end, candidate_net, payload.gateway)

        # 3. Containment check (if child subnet)
        if payload.parent_subnet_id:
            parent = db.query(Subnet).filter(
                Subnet.id == payload.parent_subnet_id,
                Subnet.project_id == project.id
            ).first()
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Parent subnet '{payload.parent_subnet_id}' does not exist in this project."
                )
            parent_net = parse_network(parent.cidr)
            validate_containment(candidate_net, parent_net)

            # Check overlap against siblings under the same parent
            siblings = [
                (s.id, s.cidr) for s in project.subnets 
                if s.parent_subnet_id == payload.parent_subnet_id
            ]
            validate_no_sibling_overlap(candidate_net, siblings)
        else:
            # Top-level subnet: check overlap against other top-level subnets
            top_level = [
                (s.id, s.cidr) for s in project.subnets 
                if s.parent_subnet_id is None
            ]
            validate_no_sibling_overlap(candidate_net, top_level)

        # 4. Save subnet
        subnet = Subnet(
            project_id=project.id,
            parent_subnet_id=payload.parent_subnet_id,
            cidr=normalized_cidr,
            label=payload.label.strip(),
            segment=payload.segment.strip() if payload.segment else None,
            gateway=payload.gateway.strip() if payload.gateway else None,
            dhcp_start=payload.dhcp_start.strip() if payload.dhcp_start else None,
            dhcp_end=payload.dhcp_end.strip() if payload.dhcp_end else None,
            requested_hosts=payload.requested_hosts,
            notes=payload.notes.strip() if payload.notes else None
        )
        db.add(subnet)
        project.bump_version()
        db.commit()
        db.refresh(subnet)

        return enrich_subnet_read(subnet)

    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )


@router.put("/{subnet_id}", response_model=SubnetRead)
def update_subnet_allocation(
    subnet_id: str,
    payload: SubnetUpdate,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    subnet = db.query(Subnet).filter(
        Subnet.id == subnet_id,
        Subnet.project_id == project.id
    ).first()
    if not subnet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subnet '{subnet_id}' not found in project."
        )

    try:
        new_cidr = payload.cidr if payload.cidr is not None else subnet.cidr
        candidate_net = parse_network(new_cidr)
        normalized_cidr = str(candidate_net)

        if payload.gateway is not None:
            raw_gw = payload.gateway.strip() if isinstance(payload.gateway, str) else ""
            new_gateway = raw_gw if raw_gw else None
        else:
            new_gateway = subnet.gateway

        if new_gateway:
            validate_ip_in_subnet(new_gateway, candidate_net, "Default gateway")

        if payload.dhcp_start is not None:
            raw_s = payload.dhcp_start.strip() if isinstance(payload.dhcp_start, str) else ""
            new_dhcp_start = raw_s if raw_s else None
        else:
            new_dhcp_start = subnet.dhcp_start

        if payload.dhcp_end is not None:
            raw_e = payload.dhcp_end.strip() if isinstance(payload.dhcp_end, str) else ""
            new_dhcp_end = raw_e if raw_e else None
        else:
            new_dhcp_end = subnet.dhcp_end

        if new_dhcp_start or new_dhcp_end:
            validate_dhcp_range(new_dhcp_start, new_dhcp_end, candidate_net, new_gateway)

        if payload.parent_subnet_id is not None:
            raw_p = payload.parent_subnet_id.strip() if isinstance(payload.parent_subnet_id, str) else ""
            parent_id = raw_p if raw_p else None
        else:
            parent_id = subnet.parent_subnet_id

        if parent_id:
            if parent_id == subnet.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A subnet cannot be its own parent."
                )

            parent = db.query(Subnet).filter(
                Subnet.id == parent_id,
                Subnet.project_id == project.id
            ).first()
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Parent subnet '{parent_id}' does not exist in this project."
                )

            # Prevent cyclic hierarchy (parent cannot be a descendant of subnet)
            curr_p = parent
            visited = set()
            while curr_p:
                if curr_p.id == subnet.id or curr_p.parent_subnet_id == subnet.id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Cyclic subnet hierarchy detected. A subnet cannot have one of its descendants as parent."
                    )
                if curr_p.id in visited:
                    break
                visited.add(curr_p.id)
                if not curr_p.parent_subnet_id:
                    break
                curr_p = db.query(Subnet).filter(Subnet.id == curr_p.parent_subnet_id, Subnet.project_id == project.id).first()
            parent_net = parse_network(parent.cidr)
            validate_containment(candidate_net, parent_net)

            siblings = [
                (s.id, s.cidr) for s in project.subnets 
                if s.parent_subnet_id == parent_id
            ]
            validate_no_sibling_overlap(candidate_net, siblings, current_subnet_id=subnet.id)
        else:
            top_level = [
                (s.id, s.cidr) for s in project.subnets 
                if s.parent_subnet_id is None
            ]
            validate_no_sibling_overlap(candidate_net, top_level, current_subnet_id=subnet.id)

        # Apply updates
        subnet.cidr = normalized_cidr
        if payload.label is not None:
            subnet.label = payload.label.strip()
        subnet.parent_subnet_id = parent_id
        if payload.segment is not None:
            subnet.segment = payload.segment.strip() if payload.segment else None
        subnet.gateway = new_gateway.strip() if new_gateway else None
        subnet.dhcp_start = new_dhcp_start.strip() if new_dhcp_start else None
        subnet.dhcp_end = new_dhcp_end.strip() if new_dhcp_end else None
        if payload.requested_hosts is not None:
            subnet.requested_hosts = payload.requested_hosts
        if payload.notes is not None:
            subnet.notes = payload.notes.strip() if payload.notes else None

        project.bump_version()
        db.commit()
        db.refresh(subnet)

        return enrich_subnet_read(subnet)

    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )


@router.delete("/{subnet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subnet_allocation(
    subnet_id: str,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    subnet = db.query(Subnet).filter(
        Subnet.id == subnet_id,
        Subnet.project_id == project.id
    ).first()
    if not subnet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subnet '{subnet_id}' not found."
        )

    db.delete(subnet)
    project.bump_version()
    db.commit()
    return None

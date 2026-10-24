"""
Project-wide network validation service.
Inspects stored planning records (subnets, devices, assignments) and generates
standard ValidationIssue objects without modifying user data.
"""

import uuid
from datetime import datetime, timezone
import ipaddress
from typing import List, Dict
from ..models.project import Project
from ..schemas.validation import ValidationIssueSchema
from .subnet_calc import calculate_subnet


def run_project_validation(project: Project) -> List[ValidationIssueSchema]:
    issues: List[ValidationIssueSchema] = []
    now = datetime.now(timezone.utc)

    # 1. Check for Duplicate IP Assignments
    ip_map: Dict[str, List[str]] = {}
    for a in project.ip_assignments:
        ip = a.ipv4_address.strip()
        ip_map.setdefault(ip, []).append(a.id)

    for ip, record_ids in ip_map.items():
        if len(record_ids) > 1:
            issues.append(ValidationIssueSchema(
                id=str(uuid.uuid4()),
                project_id=project.id,
                issue_code="DUPLICATE_IP",
                severity="error",
                message=f"Duplicate IPv4 assignment: Address '{ip}' is assigned to {len(record_ids)} records in this project.",
                recommended_action="Reassign one of the conflicting records to an unused IP address.",
                related_record_ids=record_ids,
                checked_at=now
            ))

    # 2. Subnet checks: Overlap, Gateway, DHCP, Capacity, Documentation
    subnet_map = {s.id: s for s in project.subnets}

    for i, s1 in enumerate(project.subnets):
        try:
            net1 = ipaddress.IPv4Network(s1.cidr, strict=False)
        except Exception:
            continue

        calc = calculate_subnet(s1.cidr)

        # Capacity check
        if s1.requested_hosts is not None and s1.requested_hosts > calc.usable_addresses:
            issues.append(ValidationIssueSchema(
                id=str(uuid.uuid4()),
                project_id=project.id,
                issue_code="CAPACITY_EXCEEDED",
                severity="warning",
                message=f"Subnet '{s1.label}' ({s1.cidr}) requested {s1.requested_hosts} hosts but only has {calc.usable_addresses} usable addresses.",
                recommended_action=f"Increase prefix allocation to a larger block or reduce expected host count.",
                related_record_ids=[s1.id],
                checked_at=now
            ))

        # Gateway check
        if s1.gateway:
            try:
                gw_addr = ipaddress.IPv4Address(s1.gateway.strip())
                if gw_addr not in net1:
                    issues.append(ValidationIssueSchema(
                        id=str(uuid.uuid4()),
                        project_id=project.id,
                        issue_code="GATEWAY_OUT_OF_RANGE",
                        severity="error",
                        message=f"Default gateway '{s1.gateway}' in subnet '{s1.label}' is outside allocated block {s1.cidr}.",
                        recommended_action="Change the default gateway to an IP address within the subnet range.",
                        related_record_ids=[s1.id],
                        checked_at=now
                    ))
            except Exception:
                pass
        else:
            # Missing gateway warning
            issues.append(ValidationIssueSchema(
                id=str(uuid.uuid4()),
                project_id=project.id,
                issue_code="MISSING_GATEWAY",
                severity="warning",
                message=f"Subnet '{s1.label}' ({s1.cidr}) has no configured default gateway.",
                recommended_action="Assign a default gateway interface if this subnet routes traffic.",
                related_record_ids=[s1.id],
                checked_at=now
            ))

        # DHCP range check
        if s1.dhcp_start and s1.dhcp_end:
            try:
                d_start = ipaddress.IPv4Address(s1.dhcp_start.strip())
                d_end = ipaddress.IPv4Address(s1.dhcp_end.strip())

                if d_start not in net1 or d_end not in net1:
                    issues.append(ValidationIssueSchema(
                        id=str(uuid.uuid4()),
                        project_id=project.id,
                        issue_code="DHCP_OUT_OF_RANGE",
                        severity="error",
                        message=f"DHCP pool ({s1.dhcp_start} - {s1.dhcp_end}) in subnet '{s1.label}' falls outside {s1.cidr}.",
                        recommended_action="Adjust DHCP pool boundaries to lie inside the subnet.",
                        related_record_ids=[s1.id],
                        checked_at=now
                    ))
                elif int(d_start) > int(d_end):
                    issues.append(ValidationIssueSchema(
                        id=str(uuid.uuid4()),
                        project_id=project.id,
                        issue_code="DHCP_OUT_OF_RANGE",
                        severity="error",
                        message=f"DHCP start address '{s1.dhcp_start}' is higher than DHCP end address '{s1.dhcp_end}' in subnet '{s1.label}'.",
                        recommended_action="Ensure DHCP start address is less than or equal to end address.",
                        related_record_ids=[s1.id],
                        checked_at=now
                    ))

                # Gateway inside dynamic DHCP pool collision check
                if s1.gateway:
                    gw_addr = ipaddress.IPv4Address(s1.gateway.strip())
                    if int(d_start) <= int(gw_addr) <= int(d_end):
                        issues.append(ValidationIssueSchema(
                            id=str(uuid.uuid4()),
                            project_id=project.id,
                            issue_code="GATEWAY_IN_DHCP_POOL",
                            severity="error",
                            message=f"Default gateway '{s1.gateway}' in subnet '{s1.label}' falls inside dynamic DHCP pool ({s1.dhcp_start} - {s1.dhcp_end}).",
                            recommended_action="Adjust DHCP pool boundaries so the default gateway IP is excluded.",
                            related_record_ids=[s1.id],
                            checked_at=now
                        ))
            except Exception:
                pass

        # Check sibling overlap against subsequent subnets with same parent
        for s2 in project.subnets[i + 1:]:
            if s1.parent_subnet_id == s2.parent_subnet_id:
                try:
                    net2 = ipaddress.IPv4Network(s2.cidr, strict=False)
                    if net1.overlaps(net2):
                        issues.append(ValidationIssueSchema(
                            id=str(uuid.uuid4()),
                            project_id=project.id,
                            issue_code="SUBNET_OVERLAP",
                            severity="error",
                            message=f"Subnet '{s1.label}' ({s1.cidr}) overlaps with sibling subnet '{s2.label}' ({s2.cidr}).",
                            recommended_action="Adjust the CIDR blocks of either subnet so their address spaces do not collide.",
                            related_record_ids=[s1.id, s2.id],
                            checked_at=now
                        ))
                except Exception:
                    pass

    # 3. IP Assignment Checks: Out of subnet and DHCP collisions
    for a in project.ip_assignments:
        try:
            a_ip = ipaddress.IPv4Address(a.ipv4_address.strip())
        except Exception:
            continue

        if a.subnet_id and a.subnet_id in subnet_map:
            sub = subnet_map[a.subnet_id]
            try:
                sub_net = ipaddress.IPv4Network(sub.cidr, strict=False)
                if a_ip not in sub_net:
                    issues.append(ValidationIssueSchema(
                        id=str(uuid.uuid4()),
                        project_id=project.id,
                        issue_code="OUT_OF_RANGE_IP",
                        severity="error",
                        message=f"Assigned address '{a.ipv4_address}' is outside its assigned subnet '{sub.label}' ({sub.cidr}).",
                        recommended_action=f"Move address to a subnet containing {a.ipv4_address} or choose an IP within {sub.cidr}.",
                        related_record_ids=[a.id, sub.id],
                        checked_at=now
                    ))

                # Network and broadcast address assignment check for standard subnets
                if sub_net.prefixlen < 31:
                    if a_ip == sub_net.network_address:
                        issues.append(ValidationIssueSchema(
                            id=str(uuid.uuid4()),
                            project_id=project.id,
                            issue_code="NETWORK_ADDRESS_ASSIGNED",
                            severity="error",
                            message=f"Assigned IP '{a.ipv4_address}' is the network address for subnet '{sub.label}' ({sub.cidr}).",
                            recommended_action="Reassign to a valid usable host address.",
                            related_record_ids=[a.id, sub.id],
                            checked_at=now
                        ))
                    elif a_ip == sub_net.broadcast_address:
                        issues.append(ValidationIssueSchema(
                            id=str(uuid.uuid4()),
                            project_id=project.id,
                            issue_code="BROADCAST_ADDRESS_ASSIGNED",
                            severity="error",
                            message=f"Assigned IP '{a.ipv4_address}' is the broadcast address for subnet '{sub.label}' ({sub.cidr}).",
                            recommended_action="Reassign to a valid usable host address.",
                            related_record_ids=[a.id, sub.id],
                            checked_at=now
                        ))

                # DHCP pool collision
                if a.assignment_type in ["planned static", "reserved"] and sub.dhcp_start and sub.dhcp_end:
                    d_start = ipaddress.IPv4Address(sub.dhcp_start.strip())
                    d_end = ipaddress.IPv4Address(sub.dhcp_end.strip())
                    if int(d_start) <= int(a_ip) <= int(d_end):
                        issues.append(ValidationIssueSchema(
                            id=str(uuid.uuid4()),
                            project_id=project.id,
                            issue_code="DHCP_RESERVED_COLLISION",
                            severity="error",
                            message=f"Static/reserved address '{a.ipv4_address}' collides with the dynamic DHCP pool ({sub.dhcp_start} - {sub.dhcp_end}) in subnet '{sub.label}'.",
                            recommended_action="Pick an IP address outside the DHCP pool range or modify the DHCP pool boundaries.",
                            related_record_ids=[a.id, sub.id],
                            checked_at=now
                        ))
            except Exception:
                pass

    # 4. Undocumented records (Info)
    for d in project.devices:
        if not d.location and not d.notes:
            issues.append(ValidationIssueSchema(
                id=str(uuid.uuid4()),
                project_id=project.id,
                issue_code="UNDOCUMENTED_RECORD",
                severity="info",
                message=f"Device '{d.name}' ({d.device_type}) has no physical location or documentation notes recorded.",
                recommended_action="Add location or rack details to improve implementation documentation.",
                related_record_ids=[d.id],
                checked_at=now
            ))

    return issues

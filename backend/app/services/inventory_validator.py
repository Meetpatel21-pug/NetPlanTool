"""
Pure functions for IP assignment and device validation.
- Detects duplicate IP addresses within the same project.
- Detects addresses falling outside their assigned subnet.
- Detects static or reserved addresses colliding with configured DHCP pool ranges or gateways.
"""

import ipaddress
from typing import Optional, List
from ..models.assignment import IPAssignment
from ..models.subnet import Subnet
from .subnet_calc import validate_ipv4_address_string


def validate_ip_assignment(
    ipv4_address: str,
    subnet: Optional[Subnet],
    project_assignments: List[IPAssignment],
    assignment_type: str,
    current_assignment_id: Optional[str] = None
) -> None:
    """
    Validate that an IP assignment does not violate project duplicate rules,
    subnet boundaries, or DHCP pool collisions.
    """
    validate_ipv4_address_string(ipv4_address)
    candidate_ip = ipaddress.IPv4Address(ipv4_address.strip())

    # 1. Duplicate check within the project
    for existing in project_assignments:
        if current_assignment_id and existing.id == current_assignment_id:
            continue
        if existing.ipv4_address == ipv4_address.strip():
            raise ValueError(
                f"Duplicate IP assignment: Address '{ipv4_address}' is already assigned in this project."
            )

    # 2. Subnet boundary & pool checks (if assigned to a subnet)
    if subnet:
        network = ipaddress.IPv4Network(subnet.cidr, strict=False)
        if candidate_ip not in network:
            raise ValueError(
                f"IP address '{ipv4_address}' falls outside the assigned subnet {subnet.cidr} ({subnet.label})."
            )

        # Disallow assigning network and broadcast addresses for standard subnets (prefix < 31)
        if network.prefixlen < 31:
            if candidate_ip == network.network_address:
                raise ValueError(
                    f"Cannot assign network address '{ipv4_address}' for subnet {subnet.cidr}."
                )
            if candidate_ip == network.broadcast_address:
                raise ValueError(
                    f"Cannot assign broadcast address '{ipv4_address}' for subnet {subnet.cidr}."
                )

        # 3. Collision with DHCP pool
        # If the assignment is static or reserved, it cannot fall inside the dynamic DHCP pool
        if assignment_type in ["planned static", "reserved"] and subnet.dhcp_start and subnet.dhcp_end:
            start_ip = ipaddress.IPv4Address(subnet.dhcp_start.strip())
            end_ip = ipaddress.IPv4Address(subnet.dhcp_end.strip())
            if int(start_ip) <= int(candidate_ip) <= int(end_ip):
                raise ValueError(
                    f"IP address '{ipv4_address}' collides with the configured DHCP pool "
                    f"({subnet.dhcp_start} - {subnet.dhcp_end}) in subnet '{subnet.label}'."
                )

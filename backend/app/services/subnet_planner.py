"""
Subnet planner validation and business rules service.
Implements pure functions for:
- Normalized IPv4 comparisons (never raw string comparisons)
- Parent-child subnet containment
- Sibling subnet overlap detection
- Gateway and DHCP range validation
- Capacity vs requested hosts check
"""

import ipaddress
from typing import Optional, List, Tuple, Dict, Any
from .subnet_calc import validate_ipv4_address_string, calculate_subnet


def parse_network(cidr: str) -> ipaddress.IPv4Network:
    """Parse and normalize a CIDR string into an IPv4Network object."""
    if not cidr or not cidr.strip():
        raise ValueError("CIDR string cannot be empty.")
    
    parts = cidr.strip().split("/", 1)
    if len(parts) != 2:
        raise ValueError(f"Invalid CIDR format '{cidr}'. Expected 'IP/prefix' (e.g. 192.168.20.0/24).")
    
    validate_ipv4_address_string(parts[0])
    try:
        prefix = int(parts[1].strip())
    except ValueError:
        raise ValueError(f"Prefix length must be a valid integer in '{cidr}'.")
    
    if prefix < 0 or prefix > 32:
        raise ValueError(f"Prefix length /{prefix} is invalid. CIDR prefixes must be between /0 and /32.")
    
    return ipaddress.IPv4Network(cidr.strip(), strict=False)


def validate_ip_in_subnet(ip_str: Optional[str], network: ipaddress.IPv4Network, field_name: str) -> None:
    """Validate that an IPv4 address sits inside the designated subnet."""
    if not ip_str:
        return
    validate_ipv4_address_string(ip_str)
    addr = ipaddress.IPv4Address(ip_str.strip())
    if addr not in network:
        raise ValueError(
            f"{field_name} '{ip_str}' falls outside the allocated subnet {str(network)}."
        )


def validate_dhcp_range(
    dhcp_start: Optional[str],
    dhcp_end: Optional[str],
    network: ipaddress.IPv4Network,
    gateway: Optional[str] = None
) -> None:
    """Validate that DHCP range sits inside the subnet, start <= end, and gateway does not collide."""
    if not dhcp_start and not dhcp_end:
        return
    if (dhcp_start and not dhcp_end) or (dhcp_end and not dhcp_start):
        raise ValueError("Both DHCP start address and DHCP end address must be specified together.")

    validate_ip_in_subnet(dhcp_start, network, "DHCP start address")
    validate_ip_in_subnet(dhcp_end, network, "DHCP end address")

    start_addr = ipaddress.IPv4Address(dhcp_start.strip())
    end_addr = ipaddress.IPv4Address(dhcp_end.strip())

    if int(start_addr) > int(end_addr):
        raise ValueError(
            f"DHCP start address '{dhcp_start}' cannot be higher than DHCP end address '{dhcp_end}'."
        )

    if gateway and gateway.strip():
        gw_addr = ipaddress.IPv4Address(gateway.strip())
        if int(start_addr) <= int(gw_addr) <= int(end_addr):
            raise ValueError(
                f"Configured default gateway '{gateway.strip()}' cannot fall inside the dynamic DHCP pool range "
                f"({dhcp_start.strip()} - {dhcp_end.strip()})."
            )


def validate_containment(child_net: ipaddress.IPv4Network, parent_net: ipaddress.IPv4Network) -> None:
    """Verify child subnet fits completely inside parent subnet block."""
    if not child_net.subnet_of(parent_net):
        raise ValueError(
            f"Child subnet {str(child_net)} does not fit inside parent subnet {str(parent_net)}."
        )


def validate_no_sibling_overlap(
    candidate_net: ipaddress.IPv4Network,
    existing_subnets: List[Tuple[str, str]],  # List of (subnet_id, cidr_str)
    current_subnet_id: Optional[str] = None
) -> None:
    """
    Verify candidate subnet does not overlap with any existing sibling subnet.
    Compares normalized IPv4Network objects, never raw strings.
    """
    for sub_id, cidr_str in existing_subnets:
        if current_subnet_id and sub_id == current_subnet_id:
            continue
        sibling_net = ipaddress.IPv4Network(cidr_str, strict=False)
        if candidate_net.overlaps(sibling_net):
            raise ValueError(
                f"Subnet {str(candidate_net)} overlaps with existing allocated subnet {str(sibling_net)}."
            )


def check_host_capacity(
    requested_hosts: Optional[int],
    prefix: int
) -> Dict[str, Any]:
    """Calculate capacity and compare requested hosts vs usable host capacity."""
    # Use calculation engine for exact usable count based on RFC rules (/0-/30 vs /31 vs /32)
    sample_cidr = f"0.0.0.0/{prefix}"
    calc = calculate_subnet(sample_cidr)
    usable_capacity = calc.usable_addresses

    warning = None
    exceeded = False
    if requested_hosts is not None:
        if requested_hosts < 0:
            raise ValueError("Requested hosts cannot be a negative number.")
        if requested_hosts > usable_capacity:
            exceeded = True
            warning = (
                f"Requested host capacity ({requested_hosts}) exceeds usable subnet capacity "
                f"({usable_capacity} usable hosts for /{prefix})."
            )

    return {
        "requested_hosts": requested_hosts,
        "usable_capacity": usable_capacity,
        "total_addresses": calc.total_addresses,
        "exceeded": exceeded,
        "warning": warning,
    }

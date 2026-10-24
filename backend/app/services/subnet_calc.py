"""
Pure IPv4 calculation engine.
Leverages Python's standard `ipaddress` module for bit math.
Implements standard RFC conventions:
- Conventional /0 - /30: network and broadcast reserved, total - 2 usable.
- /31 (RFC 3021): Point-to-point links, 2 usable addresses, no broadcast.
- /32: Single host/loopback, 1 usable address, no broadcast.
"""

from dataclasses import dataclass
import ipaddress
import re
from typing import Optional


@dataclass(frozen=True)
class SubnetCalculationResult:
    cidr: str
    ip: str
    prefix: int
    netmask: str
    wildcard_mask: str
    network_address: str
    broadcast_address: Optional[str]
    total_addresses: int
    usable_addresses: int
    usable_range_start: Optional[str]
    usable_range_end: Optional[str]
    usable_range: str
    network_bits: int
    host_bits: int
    binary_netmask: str
    binary_network: str
    special_notes: str
    is_private: bool


def _to_binary_quad(ip_int: int) -> str:
    """Format a 32-bit integer as dotted 8-bit binary octets."""
    b = f"{ip_int:032b}"
    return f"{b[0:8]}.{b[8:16]}.{b[16:24]}.{b[24:32]}"


def validate_ipv4_address_string(address_str: str) -> None:
    """
    Validate that an address string is a valid IPv4 address.
    Raises ValueError with descriptive plain-language error messages.
    """
    if not address_str or not address_str.strip():
        raise ValueError("IPv4 address cannot be empty.")
    
    cleaned = address_str.strip()
    parts = cleaned.split(".")
    if len(parts) != 4:
        raise ValueError(
            f"Invalid IPv4 address '{address_str}': Expected exactly 4 octets separated by dots, got {len(parts)}."
        )

    for i, part in enumerate(parts):
        if not part:
            raise ValueError(
                f"Invalid IPv4 address '{address_str}': Octet {i + 1} is empty."
            )
        if not part.isdigit():
            raise ValueError(
                f"Invalid IPv4 address '{address_str}': Octet '{part}' is not a numeric value."
            )
        val = int(part)
        if val < 0 or val > 255:
            raise ValueError(
                f"Invalid IPv4 address '{address_str}': Octet {i + 1} value ({val}) is outside the valid range 0-255."
            )


def parse_and_normalize_prefix(prefix_val: int | str) -> int:
    """
    Validate and return integer prefix length between 0 and 32.
    """
    try:
        prefix_int = int(str(prefix_val).strip())
    except (ValueError, TypeError):
        raise ValueError(f"Prefix length must be a valid integer, received: '{prefix_val}'.")

    if prefix_int < 0 or prefix_int > 32:
        raise ValueError(f"Prefix length /{prefix_int} is invalid. CIDR prefixes must be between /0 and /32.")

    return prefix_int


def calculate_subnet(
    cidr_or_ip: str,
    prefix_or_mask: Optional[int | str] = None
) -> SubnetCalculationResult:
    """
    Pure calculation function for IPv4 subnetting.
    Accepts:
    1. Single CIDR string e.g. "192.168.20.0/26" or "192.168.20.55/26"
    2. IP string and prefix int e.g. ("192.168.20.0", 26)
    3. IP string and netmask string e.g. ("192.168.20.0", "255.255.255.192")
    """
    raw_str = cidr_or_ip.strip()

    if "/" in raw_str:
        ip_part, prefix_part = raw_str.split("/", 1)
        validate_ipv4_address_string(ip_part)
        prefix_len = parse_and_normalize_prefix(prefix_part)
        raw_combined = f"{ip_part.strip()}/{prefix_len}"
    elif prefix_or_mask is not None:
        validate_ipv4_address_string(raw_str)
        if isinstance(prefix_or_mask, int) or (isinstance(prefix_or_mask, str) and prefix_or_mask.strip().isdigit()):
            prefix_len = parse_and_normalize_prefix(prefix_or_mask)
            raw_combined = f"{raw_str}/{prefix_len}"
        else:
            # Netmask string format like '255.255.255.192'
            mask_str = str(prefix_or_mask).strip()
            validate_ipv4_address_string(mask_str)
            try:
                # Use ipaddress to convert mask to prefix
                net_from_mask = ipaddress.IPv4Network(f"0.0.0.0/{mask_str}")
                prefix_len = net_from_mask.prefixlen
                raw_combined = f"{raw_str}/{prefix_len}"
            except Exception as e:
                raise ValueError(f"Invalid subnet mask '{mask_str}': {str(e)}")
    else:
        # Default to /32 if only single IP is provided
        validate_ipv4_address_string(raw_str)
        prefix_len = 32
        raw_combined = f"{raw_str}/32"

    try:
        # strict=False ensures host addresses like 192.168.20.55/26 normalize to 192.168.20.0/26
        network = ipaddress.IPv4Network(raw_combined, strict=False)
    except Exception as exc:
        raise ValueError(f"Cannot calculate subnet for '{raw_combined}': {str(exc)}")

    total_addresses = network.num_addresses
    prefix = network.prefixlen
    netmask_str = str(network.netmask)
    wildcard_str = str(network.hostmask)
    network_addr_str = str(network.network_address)
    normalized_cidr = str(network)
    is_private = network.is_private

    # Determine conventions based on prefix length
    if prefix == 32:
        # Single Host convention
        broadcast_addr_str = None
        usable_addresses = 1
        usable_start = network_addr_str
        usable_end = network_addr_str
        usable_range_desc = f"{network_addr_str} (Single host)"
        special_notes = (
            "/32 Single Host convention: Represents a single host endpoint or loopback "
            "address. 1 address is usable with no broadcast overhead."
        )
    elif prefix == 31:
        # RFC 3021 Point-to-Point convention
        broadcast_addr_str = None
        usable_addresses = 2
        ip_int = int(network.network_address)
        usable_start = str(ipaddress.IPv4Address(ip_int))
        usable_end = str(ipaddress.IPv4Address(ip_int + 1))
        usable_range_desc = f"{usable_start} - {usable_end}"
        special_notes = (
            "/31 RFC 3021 Point-to-Point convention: 31-bit prefixes are used for point-to-point links. "
            "Both addresses are usable as endpoint interfaces with no dedicated network or broadcast addresses."
        )
    else:
        # Conventional /0 to /30
        broadcast_addr_str = str(network.broadcast_address)
        usable_addresses = max(0, total_addresses - 2)
        start_int = int(network.network_address) + 1
        end_int = int(network.broadcast_address) - 1
        usable_start = str(ipaddress.IPv4Address(start_int))
        usable_end = str(ipaddress.IPv4Address(end_int))
        usable_range_desc = f"{usable_start} - {usable_end}"
        special_notes = (
            f"Conventional IPv4 /{prefix} subnetting: Network address ({network_addr_str}) and "
            f"broadcast address ({broadcast_addr_str}) are reserved. 2 addresses are excluded from the usable pool."
        )

    netmask_int = int(network.netmask)
    network_int = int(network.network_address)

    return SubnetCalculationResult(
        cidr=normalized_cidr,
        ip=raw_str.split("/")[0] if "/" in raw_str else raw_str,
        prefix=prefix,
        netmask=netmask_str,
        wildcard_mask=wildcard_str,
        network_address=network_addr_str,
        broadcast_address=broadcast_addr_str,
        total_addresses=total_addresses,
        usable_addresses=usable_addresses,
        usable_range_start=usable_start,
        usable_range_end=usable_end,
        usable_range=usable_range_desc,
        network_bits=prefix,
        host_bits=32 - prefix,
        binary_netmask=_to_binary_quad(netmask_int),
        binary_network=_to_binary_quad(network_int),
        special_notes=special_notes,
        is_private=is_private,
    )

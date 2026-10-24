from typing import Optional
from pydantic import BaseModel, Field, model_validator


class SubnetCalculateRequest(BaseModel):
    cidr: Optional[str] = Field(
        default=None,
        description="CIDR notation e.g. 192.168.20.0/26 or 192.168.20.55/26",
        json_schema_extra={"example": "192.168.20.0/26"}
    )
    ip: Optional[str] = Field(
        default=None,
        description="Standalone IPv4 address e.g. 192.168.20.0",
        json_schema_extra={"example": "192.168.20.0"}
    )
    prefix: Optional[int] = Field(
        default=None,
        ge=0,
        le=32,
        description="CIDR prefix length from 0 to 32",
        json_schema_extra={"example": 26}
    )
    netmask: Optional[str] = Field(
        default=None,
        description="Subnet mask e.g. 255.255.255.192",
        json_schema_extra={"example": "255.255.255.192"}
    )

    @model_validator(mode="after")
    def check_inputs(self):
        if not self.cidr and not self.ip:
            raise ValueError("Either 'cidr' or 'ip' must be provided.")
        return self


class SubnetCalculateResponse(BaseModel):
    cidr: str = Field(description="Normalized CIDR notation, e.g. 192.168.20.0/26")
    ip: str = Field(description="Input or evaluated IP address")
    prefix: int = Field(description="Subnet prefix length (0-32)")
    netmask: str = Field(description="Dotted-decimal subnet mask")
    wildcard_mask: str = Field(description="Dotted-decimal wildcard mask")
    network_address: str = Field(description="Network identifier address")
    broadcast_address: Optional[str] = Field(
        default=None,
        description="Broadcast address (null for /31 and /32 conventions)"
    )
    total_addresses: int = Field(description="Total IPv4 address count in block")
    usable_addresses: int = Field(description="Number of addresses usable by hosts")
    usable_range_start: Optional[str] = Field(description="First usable host IPv4 address")
    usable_range_end: Optional[str] = Field(description="Last usable host IPv4 address")
    usable_range: str = Field(description="Formatted human-readable usable range")
    network_bits: int = Field(description="Count of network prefix bits")
    host_bits: int = Field(description="Count of host bits")
    binary_netmask: str = Field(description="Binary dotted representation of subnet mask")
    binary_network: str = Field(description="Binary dotted representation of network address")
    special_notes: str = Field(description="Plain-language explanation of RFC rules and prefix convention")
    is_private: bool = Field(description="Whether the subnet belongs to RFC 1918 private address space")

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class SubnetBase(BaseModel):
    cidr: str = Field(description="Subnet CIDR notation e.g. 192.168.20.0/24", json_schema_extra={"example": "192.168.20.0/24"})
    label: str = Field(min_length=1, max_length=128, description="Subnet label", json_schema_extra={"example": "Workstations Subnet"})
    parent_subnet_id: Optional[str] = Field(default=None, description="Parent subnet ID if nested child")
    segment: Optional[str] = Field(default=None, description="VLAN or logical segment name", json_schema_extra={"example": "VLAN 20"})
    gateway: Optional[str] = Field(default=None, description="Default gateway IPv4", json_schema_extra={"example": "192.168.20.1"})
    dhcp_start: Optional[str] = Field(default=None, description="DHCP pool start IPv4", json_schema_extra={"example": "192.168.20.100"})
    dhcp_end: Optional[str] = Field(default=None, description="DHCP pool end IPv4", json_schema_extra={"example": "192.168.20.200"})
    requested_hosts: Optional[int] = Field(default=None, ge=0, description="Estimated hosts required")
    notes: Optional[str] = Field(default=None, description="Engineering notes")


class SubnetCreate(SubnetBase):
    pass


class SubnetUpdate(BaseModel):
    cidr: Optional[str] = None
    label: Optional[str] = None
    parent_subnet_id: Optional[str] = None
    segment: Optional[str] = None
    gateway: Optional[str] = None
    dhcp_start: Optional[str] = None
    dhcp_end: Optional[str] = None
    requested_hosts: Optional[int] = Field(default=None, ge=0)
    notes: Optional[str] = None


class SubnetRead(SubnetBase):
    id: str
    project_id: str
    created_at: datetime
    updated_at: datetime
    
    # Calculated attributes
    network_address: Optional[str] = None
    broadcast_address: Optional[str] = None
    netmask: Optional[str] = None
    total_addresses: int = 0
    usable_addresses: int = 0
    usable_range: Optional[str] = None
    capacity_warning: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

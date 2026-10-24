from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

AssignmentType = Literal["planned static", "reserved", "DHCP pool", "gateway", "unassigned"]
AssignmentStatus = Literal["active", "planned", "deprecated", "reserved"]


class IPAssignmentBase(BaseModel):
    ipv4_address: str = Field(description="IPv4 address", json_schema_extra={"example": "192.168.20.10"})
    subnet_id: Optional[str] = Field(default=None, description="Associated subnet ID")
    device_id: Optional[str] = Field(default=None, description="Associated device ID")
    assignment_type: AssignmentType = Field(default="planned static", description="Type of assignment")
    status: AssignmentStatus = Field(default="planned", description="Lifecycle status")
    notes: Optional[str] = Field(default=None, description="Engineering notes")


class IPAssignmentCreate(IPAssignmentBase):
    pass


class IPAssignmentUpdate(BaseModel):
    ipv4_address: Optional[str] = None
    subnet_id: Optional[str] = None
    device_id: Optional[str] = None
    assignment_type: Optional[AssignmentType] = None
    status: Optional[AssignmentStatus] = None
    notes: Optional[str] = None


class IPAssignmentRead(IPAssignmentBase):
    id: str
    project_id: str
    created_at: datetime
    updated_at: datetime

    # Populated metadata for table views
    device_name: Optional[str] = None
    device_role: Optional[str] = None
    subnet_label: Optional[str] = None
    subnet_cidr: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

DeviceType = Literal["router", "switch", "server", "workstation", "printer", "access_point"]


class DeviceBase(BaseModel):
    name: str = Field(min_length=1, max_length=128, description="Device hostname or label", json_schema_extra={"example": "core-router-01"})
    device_type: DeviceType = Field(description="Hardware category symbol", json_schema_extra={"example": "router"})
    role: str = Field(min_length=1, max_length=64, description="Functional role e.g. Core Gateway, Edge Switch", json_schema_extra={"example": "Default Gateway"})
    mac_address: Optional[str] = Field(default=None, max_length=17, description="Hardware MAC address", json_schema_extra={"example": "00:1A:2B:3C:4D:5E"})
    location: Optional[str] = Field(default=None, max_length=128, description="Physical location or rack", json_schema_extra={"example": "Server Room Rack A"})
    notes: Optional[str] = Field(default=None, description="Engineering notes")
    diagram_x: float = Field(default=100.0, description="X coordinate on topology canvas")
    diagram_y: float = Field(default=100.0, description="Y coordinate on topology canvas")


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    device_type: Optional[DeviceType] = None
    role: Optional[str] = None
    mac_address: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    diagram_x: Optional[float] = None
    diagram_y: Optional[float] = None


class DeviceRead(DeviceBase):
    id: str
    project_id: str
    created_at: datetime
    updated_at: datetime
    assigned_ips: list[str] = []

    model_config = ConfigDict(from_attributes=True)

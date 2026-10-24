from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class LinkBase(BaseModel):
    source_device_id: str = Field(description="Source device UUID")
    target_device_id: str = Field(description="Target device UUID")
    label: Optional[str] = Field(default=None, max_length=64, description="Edge label e.g. Trunk, Uplink")
    speed_note: Optional[str] = Field(default=None, max_length=32, description="Speed e.g. 1 Gbps, 10 Gbps")
    diagram_metadata: Optional[Dict[str, Any]] = Field(default=None, description="Canvas handles and routing points")


class LinkCreate(LinkBase):
    pass


class LinkUpdate(BaseModel):
    label: Optional[str] = None
    speed_note: Optional[str] = None
    diagram_metadata: Optional[Dict[str, Any]] = None


class LinkRead(LinkBase):
    id: str
    project_id: str
    created_at: datetime
    updated_at: datetime

    source_device_name: Optional[str] = None
    target_device_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

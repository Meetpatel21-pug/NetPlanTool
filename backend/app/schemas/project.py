from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class ProjectBase(BaseModel):
    name: str = Field(min_length=1, max_length=128, description="Project name", json_schema_extra={"example": "Computer Lab"})
    description: Optional[str] = Field(default=None, description="Detailed project description")
    owner_id: Optional[str] = Field(default=None, description="User identifier for authorization")


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=128)
    description: Optional[str] = Field(default=None)


class ProjectRead(ProjectBase):
    id: str
    version: int
    created_at: datetime
    updated_at: datetime
    subnet_count: int = 0
    device_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class ProjectDetailRead(ProjectBase):
    id: str
    version: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

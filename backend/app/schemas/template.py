from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class TemplateSummaryResponse(BaseModel):
    id: str
    name: str
    description: str
    version: int
    subnet_count: int
    device_count: int

    model_config = ConfigDict(from_attributes=True)


class TemplateInstantiateRequest(BaseModel):
    name: Optional[str] = Field(None, description="Custom name for the new project")
    description: Optional[str] = Field(None, description="Custom description for the new project")

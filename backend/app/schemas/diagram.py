from typing import List
from pydantic import BaseModel, Field


class NodePosition(BaseModel):
    device_id: str
    diagram_x: float
    diagram_y: float


class DiagramLayoutUpdate(BaseModel):
    positions: List[NodePosition] = Field(description="List of device coordinates to persist")

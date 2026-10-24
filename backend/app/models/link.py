import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Link(Base):
    __tablename__ = "links"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    source_device_id = Column(String(36), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False)
    target_device_id = Column(String(36), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False)

    label = Column(String(64), nullable=True)
    speed_note = Column(String(32), nullable=True)  # e.g. "1 Gbps", "10 Gbps"
    diagram_metadata = Column(JSON, nullable=True)  # canvas handles, routing info

    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    project = relationship("Project", back_populates="links")
    source_device = relationship("Device", foreign_keys=[source_device_id], back_populates="outgoing_links")
    target_device = relationship("Device", foreign_keys=[target_device_id], back_populates="incoming_links")

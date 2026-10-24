import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Device(Base):
    __tablename__ = "devices"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(128), nullable=False)
    device_type = Column(String(32), nullable=False)  # router, switch, server, workstation, printer, access_point
    role = Column(String(64), nullable=False)
    mac_address = Column(String(17), nullable=True)
    location = Column(String(128), nullable=True)
    notes = Column(Text, nullable=True)

    diagram_x = Column(Float, default=100.0, nullable=False)
    diagram_y = Column(Float, default=100.0, nullable=False)

    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    project = relationship("Project", back_populates="devices")
    ip_assignments = relationship("IPAssignment", back_populates="device")
    outgoing_links = relationship("Link", foreign_keys="Link.source_device_id", back_populates="source_device", cascade="all, delete-orphan")
    incoming_links = relationship("Link", foreign_keys="Link.target_device_id", back_populates="target_device", cascade="all, delete-orphan")

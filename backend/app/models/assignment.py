import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class IPAssignment(Base):
    __tablename__ = "ip_assignments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    subnet_id = Column(String(36), ForeignKey("subnets.id", ondelete="SET NULL"), nullable=True)
    device_id = Column(String(36), ForeignKey("devices.id", ondelete="SET NULL"), nullable=True)

    ipv4_address = Column(String(15), nullable=False)
    assignment_type = Column(String(32), nullable=False)  # planned static, reserved, DHCP pool, gateway, unassigned
    status = Column(String(32), default="planned", nullable=False)  # active, planned, deprecated, reserved
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    project = relationship("Project", back_populates="ip_assignments")
    subnet = relationship("Subnet", back_populates="ip_assignments")
    device = relationship("Device", back_populates="ip_assignments")

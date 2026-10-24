import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Subnet(Base):
    __tablename__ = "subnets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    parent_subnet_id = Column(String(36), ForeignKey("subnets.id", ondelete="SET NULL"), nullable=True)

    cidr = Column(String(18), nullable=False)  # Normalized CIDR e.g. "192.168.20.0/24"
    label = Column(String(128), nullable=False)
    segment = Column(String(64), nullable=True)  # VLAN or segment name
    gateway = Column(String(15), nullable=True)
    dhcp_start = Column(String(15), nullable=True)
    dhcp_end = Column(String(15), nullable=True)
    requested_hosts = Column(Integer, nullable=True)  # Optional requested host count
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="subnets")
    parent = relationship("Subnet", remote_side=[id], back_populates="children")
    children = relationship("Subnet", back_populates="parent", cascade="all")
    ip_assignments = relationship("IPAssignment", back_populates="subnet")

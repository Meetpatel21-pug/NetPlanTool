import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, DateTime
from sqlalchemy.orm import relationship
from ..database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(String(64), nullable=True)  # Reserved for project-level authorization
    version = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    subnets = relationship("Subnet", back_populates="project", cascade="all, delete-orphan")
    devices = relationship("Device", back_populates="project", cascade="all, delete-orphan")
    ip_assignments = relationship("IPAssignment", back_populates="project", cascade="all, delete-orphan")
    links = relationship("Link", back_populates="project", cascade="all, delete-orphan")
    validation_issues = relationship("ValidationIssue", back_populates="project", cascade="all, delete-orphan")

    def bump_version(self):
        self.version += 1
        self.updated_at = utc_now()

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ValidationIssue(Base):
    __tablename__ = "validation_issues"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)

    issue_code = Column(String(64), nullable=False)
    severity = Column(String(16), nullable=False)  # error, warning, info
    message = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    related_record_ids = Column(JSON, nullable=False)  # List of related record IDs
    checked_at = Column(DateTime, default=utc_now, nullable=False)

    project = relationship("Project", back_populates="validation_issues")

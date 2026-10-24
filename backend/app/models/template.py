from sqlalchemy import Column, String, Text, JSON, Integer
from ..database import Base


class Template(Base):
    __tablename__ = "templates"

    id = Column(String(64), primary_key=True)  # e.g. "small-office", "college-lab"
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    template_data = Column(JSON, nullable=False)
    version = Column(Integer, default=1, nullable=False)

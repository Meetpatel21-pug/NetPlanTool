from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from .database import get_db
from .models.project import Project


def get_project_or_404(
    project_id: str,
    db: Session = Depends(get_db)
) -> Project:
    """
    Project-level authorization and existence dependency.
    Resolves {project_id} from path parameter and checks DB.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' was not found."
        )
    return project

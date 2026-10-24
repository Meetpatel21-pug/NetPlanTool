from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.project import Project
from ..models.validation import ValidationIssue
from ..schemas.validation import ValidationReportResponse, ValidationIssueSchema
from ..dependencies import get_project_or_404
from ..services.validator import run_project_validation

router = APIRouter(prefix="/projects/{project_id}", tags=["validation"])


@router.post("/validate", response_model=ValidationReportResponse)
def validate_project(
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db)
):
    """
    Run comprehensive rule validation on the project.
    Never modifies user data; reports issues with plain-language recommendations.
    """
    issues = run_project_validation(project)

    # Sync to validation_issues table
    db.query(ValidationIssue).filter(ValidationIssue.project_id == project.id).delete()
    for iss in issues:
        db_iss = ValidationIssue(
            id=iss.id,
            project_id=project.id,
            issue_code=iss.issue_code,
            severity=iss.severity,
            message=iss.message,
            recommended_action=iss.recommended_action,
            related_record_ids=iss.related_record_ids,
            checked_at=iss.checked_at
        )
        db.add(db_iss)
    db.commit()

    errors = sum(1 for i in issues if i.severity == "error")
    warnings = sum(1 for i in issues if i.severity == "warning")
    infos = sum(1 for i in issues if i.severity == "info")

    return ValidationReportResponse(
        project_id=project.id,
        total_issues=len(issues),
        error_count=errors,
        warning_count=warnings,
        info_count=infos,
        issues=issues,
        checked_at=datetime.now(timezone.utc)
    )

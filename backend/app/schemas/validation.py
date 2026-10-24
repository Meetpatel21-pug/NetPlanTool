from datetime import datetime
from typing import List, Literal
from pydantic import BaseModel, Field, ConfigDict

SeverityLevel = Literal["error", "warning", "info"]


class ValidationIssueSchema(BaseModel):
    id: str
    project_id: str
    issue_code: str = Field(description="Unique code identifying the check, e.g. DUPLICATE_IP, SUBNET_OVERLAP")
    severity: SeverityLevel = Field(description="Severity classification")
    message: str = Field(description="Plain-language description of the issue")
    recommended_action: str = Field(description="Suggested correction for the engineer")
    related_record_ids: List[str] = Field(default=[], description="IDs of affected subnets, devices, or assignments")
    checked_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ValidationReportResponse(BaseModel):
    project_id: str
    total_issues: int
    error_count: int
    warning_count: int
    info_count: int
    issues: List[ValidationIssueSchema]
    checked_at: datetime

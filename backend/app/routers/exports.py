from fastapi import APIRouter, Depends, Response
from ..models.project import Project
from ..dependencies import get_project_or_404
from ..services.reports import generate_csv_inventory, generate_pdf_report
from ..services.validator import run_project_validation

router = APIRouter(prefix="/projects/{project_id}", tags=["exports"])


@router.get("/export.csv")
def export_csv_inventory(project: Project = Depends(get_project_or_404)):
    """Export project IP inventory as CSV with spreadsheet formula injection protection."""
    csv_content = generate_csv_inventory(project)
    clean_name = "".join(c for c in project.name if c.isalnum() or c in ("-", "_")).strip() or "network"
    filename = f"{clean_name}-ip-inventory-v{project.version}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


@router.get("/report.pdf")
def export_pdf_report(project: Project = Depends(get_project_or_404)):
    """Generate and download complete ReportLab PDF technical documentation."""
    issues = run_project_validation(project)
    pdf_bytes = generate_pdf_report(project, issues)
    clean_name = "".join(c for c in project.name if c.isalnum() or c in ("-", "_")).strip() or "network"
    filename = f"{clean_name}-report-v{project.version}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


@router.get("/report/preview")
def preview_report(project: Project = Depends(get_project_or_404)):
    """Preview report sections before download."""
    issues = run_project_validation(project)
    return {
        "project": {
            "name": project.name,
            "version": project.version,
            "description": project.description,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
        },
        "stats": {
            "subnet_count": len(project.subnets),
            "device_count": len(project.devices),
            "assignment_count": len(project.ip_assignments),
            "issue_count": len(issues),
        },
        "issues": issues,
        "notice": (
            "This plan is not aware of the live network. Verify against existing DHCP, "
            "static assignments, VPN ranges, and upstream allocations before implementing."
        )
    }

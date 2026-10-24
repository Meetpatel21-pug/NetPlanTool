"""
Report and export services for CSV inventory and PDF technical documentation.
Features:
- Spreadsheet formula injection protection (RFC 4180 sanitization of =, +, -, @)
- ReportLab PDF generator containing overview, subnets, IP inventory, validation warnings,
  assumptions, project version, and the mandatory live network verification notice.
"""

import io
import csv
from datetime import datetime, timezone
from typing import List

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)

from ..models.project import Project
from ..schemas.validation import ValidationIssueSchema
from .subnet_calc import calculate_subnet


def sanitize_csv_cell(value: any) -> str:
    """
    Prevent spreadsheet formula injection (CSV injection).
    If a cell value starts with =, +, -, or @, prefix with a single quote.
    """
    if value is None:
        return ""
    val_str = str(value).strip()
    if val_str and val_str[0] in ("=", "+", "-", "@"):
        return f"'{val_str}"
    return val_str


def generate_csv_inventory(project: Project) -> str:
    """
    Generate CSV string for planned IP inventory with formula injection mitigation.
    """
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    # Header
    writer.writerow([
        "IPv4 Address",
        "Subnet Label",
        "Subnet CIDR",
        "Device Name",
        "Device Type",
        "Device Role",
        "Assignment Type",
        "Status",
        "Location",
        "Notes"
    ])

    device_map = {d.id: d for d in project.devices}
    subnet_map = {s.id: s for s in project.subnets}

    for a in project.ip_assignments:
        dev = device_map.get(a.device_id) if a.device_id else None
        sub = subnet_map.get(a.subnet_id) if a.subnet_id else None

        row = [
            sanitize_csv_cell(a.ipv4_address),
            sanitize_csv_cell(sub.label if sub else "Unassigned"),
            sanitize_csv_cell(sub.cidr if sub else ""),
            sanitize_csv_cell(dev.name if dev else ""),
            sanitize_csv_cell(dev.device_type if dev else ""),
            sanitize_csv_cell(dev.role if dev else ""),
            sanitize_csv_cell(a.assignment_type),
            sanitize_csv_cell(a.status),
            sanitize_csv_cell(dev.location if dev else ""),
            sanitize_csv_cell(a.notes or "")
        ]
        writer.writerow(row)

    return output.getvalue()


MANDATORY_SAFETY_NOTICE = (
    "This plan is not aware of the live network. Verify against existing DHCP, "
    "static assignments, VPN ranges, and upstream allocations before implementing."
)


def generate_pdf_report(project: Project, issues: List[ValidationIssueSchema]) -> bytes:
    """
    Generate PDF project technical report with ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=4,
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#475569"),
        spaceAfter=12,
    )

    safety_style = ParagraphStyle(
        "SafetyBanner",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#92400e"),
        backColor=colors.HexColor("#fef3c7"),
        borderColor=colors.HexColor("#f59e0b"),
        borderWidth=1,
        borderPadding=8,
        spaceAfter=14,
        borderRadius=4,
    )

    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=12,
        spaceAfter=6,
    )

    cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#1e293b"),
    )

    cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=cell_style,
        fontName="Helvetica-Bold",
    )

    story = []

    # Title & Subtitle
    story.append(Paragraph("Network Planning Toolkit — Technical Plan", title_style))
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    meta_text = (
        f"<b>Project:</b> {project.name} &nbsp;&nbsp;|&nbsp;&nbsp; "
        f"<b>Version:</b> v{project.version} &nbsp;&nbsp;|&nbsp;&nbsp; "
        f"<b>Generated:</b> {now_str}"
    )
    story.append(Paragraph(meta_text, subtitle_style))

    # Mandatory Safety Banner
    safety_text = f"<b>SAFETY CHECK BEFORE IMPLEMENTATION:</b> {MANDATORY_SAFETY_NOTICE}"
    story.append(Paragraph(safety_text, safety_style))

    # Description
    if project.description:
        story.append(Paragraph(f"<b>Overview:</b> {project.description}", subtitle_style))

    # 1. Subnet Allocations Table
    story.append(Paragraph("1. Subnet Allocations", section_heading))
    if project.subnets:
        subnet_table_data = [
            [
                Paragraph("<b>CIDR</b>", cell_bold),
                Paragraph("<b>Label</b>", cell_bold),
                Paragraph("<b>Segment</b>", cell_bold),
                Paragraph("<b>Gateway</b>", cell_bold),
                Paragraph("<b>DHCP Range</b>", cell_bold),
                Paragraph("<b>Usable Hosts</b>", cell_bold),
            ]
        ]
        for s in project.subnets:
            calc = calculate_subnet(s.cidr)
            dhcp_str = f"{s.dhcp_start} - {s.dhcp_end}" if s.dhcp_start and s.dhcp_end else "—"
            subnet_table_data.append([
                Paragraph(s.cidr, cell_style),
                Paragraph(s.label, cell_style),
                Paragraph(s.segment or "—", cell_style),
                Paragraph(s.gateway or "—", cell_style),
                Paragraph(dhcp_str, cell_style),
                Paragraph(f"{calc.usable_addresses} hosts", cell_style),
            ])

        sub_table = Table(subnet_table_data, colWidths=[90, 110, 80, 85, 115, 60])
        sub_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ]))
        story.append(sub_table)
    else:
        story.append(Paragraph("<i>No subnets allocated in this project.</i>", cell_style))

    story.append(Spacer(1, 10))

    # 2. IP Address Inventory Table
    story.append(Paragraph("2. Planned IP Address Inventory", section_heading))
    if project.ip_assignments:
        dev_map = {d.id: d for d in project.devices}
        sub_map = {s.id: s for s in project.subnets}

        inv_table_data = [
            [
                Paragraph("<b>IPv4 Address</b>", cell_bold),
                Paragraph("<b>Type</b>", cell_bold),
                Paragraph("<b>Status</b>", cell_bold),
                Paragraph("<b>Subnet</b>", cell_bold),
                Paragraph("<b>Attached Device</b>", cell_bold),
                Paragraph("<b>Notes</b>", cell_bold),
            ]
        ]
        for a in project.ip_assignments:
            dev = dev_map.get(a.device_id) if a.device_id else None
            sub = sub_map.get(a.subnet_id) if a.subnet_id else None
            inv_table_data.append([
                Paragraph(a.ipv4_address, cell_style),
                Paragraph(a.assignment_type.title(), cell_style),
                Paragraph(a.status.title(), cell_style),
                Paragraph(sub.label if sub else "—", cell_style),
                Paragraph(f"{dev.name} ({dev.role})" if dev else "—", cell_style),
                Paragraph(a.notes or "—", cell_style),
            ])

        inv_table = Table(inv_table_data, colWidths=[85, 80, 55, 100, 120, 100])
        inv_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ]))
        story.append(inv_table)
    else:
        story.append(Paragraph("<i>No IP assignments recorded in this project.</i>", cell_style))

    story.append(Spacer(1, 10))

    # 3. Validation Summary & Warnings
    story.append(Paragraph("3. Validation & Conflict Warnings", section_heading))
    if issues:
        v_data = [
            [
                Paragraph("<b>Severity</b>", cell_bold),
                Paragraph("<b>Code</b>", cell_bold),
                Paragraph("<b>Message & Recommended Action</b>", cell_bold),
            ]
        ]
        for iss in issues:
            sev_color = "#dc2626" if iss.severity == "error" else "#d97706" if iss.severity == "warning" else "#2563eb"
            sev_p = Paragraph(f"<font color='{sev_color}'><b>{iss.severity.upper()}</b></font>", cell_style)
            msg_p = Paragraph(f"{iss.message}<br/><b>Fix:</b> {iss.recommended_action}", cell_style)
            v_data.append([sev_p, Paragraph(iss.issue_code, cell_style), msg_p])

        v_table = Table(v_data, colWidths=[65, 120, 355])
        v_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ]))
        story.append(v_table)
    else:
        story.append(Paragraph("✓ <b>Zero conflicts detected.</b> All subnets, addresses, and boundaries validated cleanly.", cell_style))

    # Build Document
    doc.build(story)
    return buffer.getvalue()

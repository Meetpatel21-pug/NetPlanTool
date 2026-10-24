import pytest
from fastapi.testclient import TestClient
from backend.app.services.reports import sanitize_csv_cell, MANDATORY_SAFETY_NOTICE


class TestExportsAndReports:
    def test_csv_injection_cell_sanitization(self):
        # Formula injection characters: =, +, -, @
        assert sanitize_csv_cell("=SUM(A1:A10)") == "'=SUM(A1:A10)"
        assert sanitize_csv_cell("+cmd|'/c calc'!A0") == "'+cmd|'/c calc'!A0"
        assert sanitize_csv_cell("-10+20") == "'-10+20"
        assert sanitize_csv_cell("@evil.com") == "'@evil.com"
        # Normal strings unaffected
        assert sanitize_csv_cell("192.168.1.1") == "192.168.1.1"
        assert sanitize_csv_cell("Core Router") == "Core Router"
        assert sanitize_csv_cell(None) == ""

    def test_csv_export_endpoint(self, client: TestClient):
        p = client.post("/api/projects", json={"name": "CSV Export Project"}).json()
        p_id = p["id"]

        sub = client.post(
            f"/api/projects/{p_id}/subnets",
            json={"cidr": "192.168.50.0/24", "label": "Sales Net"}
        ).json()

        # Add assignment with formula-like note
        client.post(
            f"/api/projects/{p_id}/assignments",
            json={
                "ipv4_address": "192.168.50.10",
                "subnet_id": sub["id"],
                "assignment_type": "planned static",
                "notes": "=SUM(B2:B10)"
            }
        )

        resp = client.get(f"/api/projects/{p_id}/export.csv")
        assert resp.status_code == 200
        assert "text/csv" in resp.headers["content-type"]
        assert "Content-Disposition" in resp.headers
        csv_body = resp.text
        # Assert formula prefix was sanitized with single quote
        assert "'=SUM(B2:B10)" in csv_body
        assert "192.168.50.10" in csv_body

    def test_pdf_report_endpoint(self, client: TestClient):
        p = client.post("/api/projects", json={"name": "PDF Report Project", "description": "Enterprise lab"}).json()
        p_id = p["id"]

        client.post(
            f"/api/projects/{p_id}/subnets",
            json={"cidr": "10.100.0.0/24", "label": "DMZ", "gateway": "10.100.0.1"}
        )

        resp = client.get(f"/api/projects/{p_id}/report.pdf")
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "application/pdf"
        assert len(resp.content) > 1000
        # Valid PDF header
        assert resp.content.startswith(b"%PDF-")

    def test_report_preview_endpoint(self, client: TestClient):
        p = client.post("/api/projects", json={"name": "Preview Project"}).json()
        p_id = p["id"]

        resp = client.get(f"/api/projects/{p_id}/report/preview")
        assert resp.status_code == 200
        data = resp.json()
        assert data["project"]["name"] == "Preview Project"
        assert "stats" in data
        assert MANDATORY_SAFETY_NOTICE in data["notice"]

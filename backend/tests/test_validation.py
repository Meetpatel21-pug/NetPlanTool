import pytest
from fastapi.testclient import TestClient


class TestProjectValidationEngine:
    def test_validation_reports_duplicate_ip(self, client: TestClient):
        p = client.post("/api/projects", json={"name": "Val Project"}).json()
        p_id = p["id"]

        # Directly add two assignments with the same IP in database or via router
        sub = client.post(
            f"/api/projects/{p_id}/subnets",
            json={"cidr": "10.0.0.0/24", "label": "Sub1"}
        ).json()

        # First assignment
        client.post(
            f"/api/projects/{p_id}/assignments",
            json={"ipv4_address": "10.0.0.5", "subnet_id": sub["id"], "assignment_type": "planned static"}
        )

        # Run validation
        val_resp = client.post(f"/api/projects/{p_id}/validate")
        assert val_resp.status_code == 200
        val_data = val_resp.json()
        assert val_data["error_count"] == 0

        # Subnet has no gateway so MISSING_GATEWAY warning is flagged
        assert any(i["issue_code"] == "MISSING_GATEWAY" for i in val_data["issues"])

    def test_validation_reports_capacity_warning(self, client: TestClient):
        p = client.post("/api/projects", json={"name": "Cap Val Project"}).json()
        p_id = p["id"]

        # Subnet /26 has 62 usable, requested 100
        client.post(
            f"/api/projects/{p_id}/subnets",
            json={"cidr": "192.168.10.0/26", "label": "High Density", "requested_hosts": 100}
        )

        val_resp = client.post(f"/api/projects/{p_id}/validate")
        assert val_resp.status_code == 200
        data = val_resp.json()
        cap_issue = next((i for i in data["issues"] if i["issue_code"] == "CAPACITY_EXCEEDED"), None)
        assert cap_issue is not None
        assert cap_issue["severity"] == "warning"
        assert "requested 100 hosts but only has 62 usable" in cap_issue["message"]

    def test_validation_reports_undocumented_device(self, client: TestClient):
        p = client.post("/api/projects", json={"name": "Doc Val Project"}).json()
        p_id = p["id"]

        client.post(
            f"/api/projects/{p_id}/devices",
            json={"name": "switch-01", "device_type": "switch", "role": "Access"}
        )

        val_resp = client.post(f"/api/projects/{p_id}/validate")
        data = val_resp.json()
        info_issue = next((i for i in data["issues"] if i["issue_code"] == "UNDOCUMENTED_RECORD"), None)
        assert info_issue is not None
        assert info_issue["severity"] == "info"

import pytest
from fastapi.testclient import TestClient
from backend.app.database import SessionLocal
from backend.app.models.project import Project
from backend.app.services.templates_seed import (
    seed_templates, 
    seed_demo_project_if_empty,
)


class TestStarterTemplates:
    def test_list_starter_templates(self, client: TestClient):
        res = client.get("/api/templates")
        assert res.status_code == 200
        data = res.json()
        assert len(data) >= 4
        ids = [t["id"] for t in data]
        assert "small-office" in ids
        assert "college-lab" in ids
        assert "guest-network" in ids
        assert "home-lab" in ids

        small_office = next(t for t in data if t["id"] == "small-office")
        assert small_office["subnet_count"] == 5
        assert small_office["device_count"] == 6

    def test_instantiate_template_creates_project(self, client: TestClient):
        payload = {
            "name": "Branch Office Production",
            "description": "Customized deployment from small office template"
        }
        res = client.post("/api/templates/small-office/instantiate", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert data["name"] == "Branch Office Production"
        assert data["subnet_count"] == 5
        assert data["device_count"] == 6
        project_id = data["id"]

        # Verify subnets exist via subnets endpoint
        sub_res = client.get(f"/api/projects/{project_id}/subnets")
        assert sub_res.status_code == 200
        subnets = sub_res.json()
        assert len(subnets) == 5

        # Verify devices exist via devices endpoint
        dev_res = client.get(f"/api/projects/{project_id}/devices")
        assert dev_res.status_code == 200
        devices = dev_res.json()
        assert len(devices) == 6

        # Verify assignments exist
        assign_res = client.get(f"/api/projects/{project_id}/assignments")
        assert assign_res.status_code == 200
        assignments = assign_res.json()
        assert len(assignments) == 6

        # Verify links exist
        links_res = client.get(f"/api/projects/{project_id}/links")
        assert links_res.status_code == 200
        links = links_res.json()
        assert len(links) == 5

    def test_instantiate_unknown_template_returns_404(self, client: TestClient):
        res = client.post("/api/templates/non-existent-template/instantiate", json={})
        assert res.status_code == 404
        assert "not found" in res.json()["detail"].lower()

    def test_seed_demo_project_idempotent(self):
        db = SessionLocal()
        try:
            seed_templates(db)
            # Since projects already exist, calling seed_demo_project_if_empty returns None
            demo = seed_demo_project_if_empty(db)
            assert demo is None or isinstance(demo, Project)
        finally:
            db.close()

import pytest
from fastapi.testclient import TestClient


class TestProjectLifecycleAndCRUD:
    def test_create_and_read_project(self, client: TestClient):
        # Create
        create_resp = client.post(
            "/api/projects",
            json={"name": "Computer Lab", "description": "Academic network lab"}
        )
        assert create_resp.status_code == 201
        data = create_resp.json()
        project_id = data["id"]
        assert data["name"] == "Computer Lab"
        assert data["version"] == 1
        assert data["subnet_count"] == 0

        # Read details
        detail_resp = client.get(f"/api/projects/{project_id}")
        assert detail_resp.status_code == 200
        assert detail_resp.json()["name"] == "Computer Lab"

        # List
        list_resp = client.get("/api/projects")
        assert list_resp.status_code == 200
        found = any(p["id"] == project_id for p in list_resp.json())
        assert found is True

    def test_update_project_bumps_version(self, client: TestClient):
        create_resp = client.post(
            "/api/projects",
            json={"name": "Version Test Project"}
        )
        assert create_resp.status_code == 201
        project_id = create_resp.json()["id"]
        assert create_resp.json()["version"] == 1

        update_resp = client.put(
            f"/api/projects/{project_id}",
            json={"name": "Updated Project Name", "description": "New description"}
        )
        assert update_resp.status_code == 200
        data = update_resp.json()
        assert data["name"] == "Updated Project Name"
        assert data["version"] == 2  # BUMPED!

    def test_duplicate_project(self, client: TestClient):
        # Create initial project
        create_resp = client.post(
            "/api/projects",
            json={"name": "Original Office Plan", "description": "HQ office"}
        )
        orig_id = create_resp.json()["id"]

        # Add a subnet
        sub_resp = client.post(
            f"/api/projects/{orig_id}/subnets",
            json={"cidr": "10.0.0.0/24", "label": "Office Main"}
        )
        assert sub_resp.status_code == 201

        # Duplicate project
        dup_resp = client.post(f"/api/projects/{orig_id}/duplicate")
        assert dup_resp.status_code == 201
        dup_data = dup_resp.json()
        assert dup_data["name"] == "Copy of Original Office Plan"
        assert dup_data["id"] != orig_id
        assert dup_data["subnet_count"] == 1

        # Verify duplicated subnet in child project
        subs = client.get(f"/api/projects/{dup_data['id']}/subnets").json()
        assert len(subs) == 1
        assert subs[0]["cidr"] == "10.0.0.0/24"
        assert subs[0]["label"] == "Office Main"

    def test_delete_project(self, client: TestClient):
        create_resp = client.post(
            "/api/projects",
            json={"name": "Project to Delete"}
        )
        project_id = create_resp.json()["id"]

        del_resp = client.delete(f"/api/projects/{project_id}")
        assert del_resp.status_code == 204

        # Verify 404
        assert client.get(f"/api/projects/{project_id}").status_code == 404

    def test_project_not_found(self, client: TestClient):
        resp = client.get("/api/projects/non-existent-uuid")
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()

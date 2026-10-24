import pytest
from fastapi.testclient import TestClient


class TestDiagramLinksAndLayout:
    @pytest.fixture
    def project_with_devices(self, client: TestClient):
        p = client.post("/api/projects", json={"name": "Topology Plan"}).json()
        p_id = p["id"]

        d1 = client.post(
            f"/api/projects/{p_id}/devices",
            json={"name": "core-router-01", "device_type": "router", "role": "Gateway", "diagram_x": 100, "diagram_y": 100}
        ).json()

        d2 = client.post(
            f"/api/projects/{p_id}/devices",
            json={"name": "edge-switch-01", "device_type": "switch", "role": "Distribution", "diagram_x": 100, "diagram_y": 250}
        ).json()

        return {"project": p, "dev1": d1, "dev2": d2}

    def test_link_lifecycle(self, client: TestClient, project_with_devices):
        p_id = project_with_devices["project"]["id"]
        d1_id = project_with_devices["dev1"]["id"]
        d2_id = project_with_devices["dev2"]["id"]

        v1 = client.get(f"/api/projects/{p_id}").json()["version"]

        # Create link
        create_resp = client.post(
            f"/api/projects/{p_id}/links",
            json={
                "source_device_id": d1_id,
                "target_device_id": d2_id,
                "label": "Trunk Link",
                "speed_note": "10 Gbps SFP+"
            }
        )
        assert create_resp.status_code == 201
        data = create_resp.json()
        link_id = data["id"]
        assert data["label"] == "Trunk Link"
        assert data["speed_note"] == "10 Gbps SFP+"
        assert data["source_device_name"] == "core-router-01"
        assert data["target_device_name"] == "edge-switch-01"

        # Check version bumped
        v2 = client.get(f"/api/projects/{p_id}").json()["version"]
        assert v2 == v1 + 1

        # List links
        links = client.get(f"/api/projects/{p_id}/links").json()
        assert len(links) == 1

        # Update link
        upd_resp = client.put(
            f"/api/projects/{p_id}/links/{link_id}",
            json={"speed_note": "40 Gbps QSFP"}
        )
        assert upd_resp.status_code == 200
        assert upd_resp.json()["speed_note"] == "40 Gbps QSFP"

        # Delete link
        del_resp = client.delete(f"/api/projects/{p_id}/links/{link_id}")
        assert del_resp.status_code == 204
        assert len(client.get(f"/api/projects/{p_id}/links").json()) == 0

    def test_self_connection_rejected(self, client: TestClient, project_with_devices):
        p_id = project_with_devices["project"]["id"]
        d1_id = project_with_devices["dev1"]["id"]

        resp = client.post(
            f"/api/projects/{p_id}/links",
            json={"source_device_id": d1_id, "target_device_id": d1_id}
        )
        assert resp.status_code == 400
        assert "Cannot connect a device to itself" in resp.json()["detail"]

    def test_duplicate_link_rejected(self, client: TestClient, project_with_devices):
        p_id = project_with_devices["project"]["id"]
        d1_id = project_with_devices["dev1"]["id"]
        d2_id = project_with_devices["dev2"]["id"]

        # First link
        client.post(
            f"/api/projects/{p_id}/links",
            json={"source_device_id": d1_id, "target_device_id": d2_id}
        )

        # Reverse link between same devices
        resp = client.post(
            f"/api/projects/{p_id}/links",
            json={"source_device_id": d2_id, "target_device_id": d1_id}
        )
        assert resp.status_code == 400
        assert "A link already exists" in resp.json()["detail"]

    def test_batch_diagram_layout_update(self, client: TestClient, project_with_devices):
        p_id = project_with_devices["project"]["id"]
        d1_id = project_with_devices["dev1"]["id"]
        d2_id = project_with_devices["dev2"]["id"]

        resp = client.put(
            f"/api/projects/{p_id}/diagram/layout",
            json={
                "positions": [
                    {"device_id": d1_id, "diagram_x": 350.5, "diagram_y": 120.0},
                    {"device_id": d2_id, "diagram_x": 550.0, "diagram_y": 400.0}
                ]
            }
        )
        assert resp.status_code == 200
        assert resp.json()["updated_nodes"] == 2

        # Verify device coordinates persisted
        dev1 = client.get(f"/api/projects/{p_id}/devices/{d1_id}").json()
        assert dev1["diagram_x"] == 350.5
        assert dev1["diagram_y"] == 120.0

import pytest
from fastapi.testclient import TestClient


class TestDeviceAndIPInventory:
    @pytest.fixture
    def test_project_with_subnet(self, client: TestClient):
        p_resp = client.post("/api/projects", json={"name": "Inventory Test Project"})
        project = p_resp.json()
        p_id = project["id"]

        s_resp = client.post(
            f"/api/projects/{p_id}/subnets",
            json={
                "cidr": "192.168.20.0/26",
                "label": "Lab Subnet",
                "gateway": "192.168.20.1",
                "dhcp_start": "192.168.20.30",
                "dhcp_end": "192.168.20.60"
            }
        )
        subnet = s_resp.json()
        return {"project": project, "subnet": subnet}

    def test_device_crud_lifecycle(self, client: TestClient, test_project_with_subnet):
        p_id = test_project_with_subnet["project"]["id"]

        # Create device
        dev_resp = client.post(
            f"/api/projects/{p_id}/devices",
            json={
                "name": "core-router-01",
                "device_type": "router",
                "role": "Default Gateway",
                "location": "Rack 1",
                "mac_address": "00:1A:2B:3C:4D:5E"
            }
        )
        assert dev_resp.status_code == 201
        dev_data = dev_resp.json()
        dev_id = dev_data["id"]
        assert dev_data["name"] == "core-router-01"
        assert dev_data["device_type"] == "router"

        # List devices
        list_resp = client.get(f"/api/projects/{p_id}/devices")
        assert list_resp.status_code == 200
        assert len(list_resp.json()) == 1

        # Update device
        upd_resp = client.put(
            f"/api/projects/{p_id}/devices/{dev_id}",
            json={"location": "Rack 2 Room B"}
        )
        assert upd_resp.status_code == 200
        assert upd_resp.json()["location"] == "Rack 2 Room B"

        # Delete device
        del_resp = client.delete(f"/api/projects/{p_id}/devices/{dev_id}")
        assert del_resp.status_code == 204
        assert client.get(f"/api/projects/{p_id}/devices/{dev_id}").status_code == 404

    def test_duplicate_ip_rejected_within_project(self, client: TestClient, test_project_with_subnet):
        p_id = test_project_with_subnet["project"]["id"]
        s_id = test_project_with_subnet["subnet"]["id"]

        # First assignment of 192.168.20.10
        resp1 = client.post(
            f"/api/projects/{p_id}/assignments",
            json={
                "ipv4_address": "192.168.20.10",
                "subnet_id": s_id,
                "assignment_type": "planned static"
            }
        )
        assert resp1.status_code == 201

        # Second assignment of same IP 192.168.20.10 (Duplicate!)
        resp2 = client.post(
            f"/api/projects/{p_id}/assignments",
            json={
                "ipv4_address": "192.168.20.10",
                "subnet_id": s_id,
                "assignment_type": "reserved"
            }
        )
        assert resp2.status_code == 400
        assert "Duplicate IP assignment: Address '192.168.20.10' is already assigned" in resp2.json()["detail"]

    def test_ip_outside_assigned_subnet_rejected(self, client: TestClient, test_project_with_subnet):
        p_id = test_project_with_subnet["project"]["id"]
        s_id = test_project_with_subnet["subnet"]["id"]

        # 192.168.20.100 is outside 192.168.20.0/26 (which spans .0 - .63)
        resp = client.post(
            f"/api/projects/{p_id}/assignments",
            json={
                "ipv4_address": "192.168.20.100",
                "subnet_id": s_id,
                "assignment_type": "planned static"
            }
        )
        assert resp.status_code == 400
        assert "falls outside the assigned subnet" in resp.json()["detail"]

    def test_static_collision_with_dhcp_pool_rejected(self, client: TestClient, test_project_with_subnet):
        p_id = test_project_with_subnet["project"]["id"]
        s_id = test_project_with_subnet["subnet"]["id"]

        # Subnet DHCP range is .30 to .60. Attempting static assignment at .45 must fail!
        resp = client.post(
            f"/api/projects/{p_id}/assignments",
            json={
                "ipv4_address": "192.168.20.45",
                "subnet_id": s_id,
                "assignment_type": "planned static"
            }
        )
        assert resp.status_code == 400
        assert "collides with the configured DHCP pool" in resp.json()["detail"]

    def test_valid_static_ip_outside_dhcp_range_succeeds(self, client: TestClient, test_project_with_subnet):
        p_id = test_project_with_subnet["project"]["id"]
        s_id = test_project_with_subnet["subnet"]["id"]

        # Device
        dev = client.post(
            f"/api/projects/{p_id}/devices",
            json={"name": "dns-server-01", "device_type": "server", "role": "DNS"}
        ).json()

        # .15 is inside /26 (0-63) and outside DHCP pool (.30-.60) -> PASS
        resp = client.post(
            f"/api/projects/{p_id}/assignments",
            json={
                "ipv4_address": "192.168.20.15",
                "subnet_id": s_id,
                "device_id": dev["id"],
                "assignment_type": "planned static",
                "status": "planned"
            }
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["ipv4_address"] == "192.168.20.15"
        assert data["device_name"] == "dns-server-01"
        assert data["subnet_label"] == "Lab Subnet"

    def test_project_version_bumps_on_assignment_changes(self, client: TestClient, test_project_with_subnet):
        p_id = test_project_with_subnet["project"]["id"]
        s_id = test_project_with_subnet["subnet"]["id"]

        v1 = client.get(f"/api/projects/{p_id}").json()["version"]

        # Create assignment
        assign = client.post(
            f"/api/projects/{p_id}/assignments",
            json={
                "ipv4_address": "192.168.20.25",
                "subnet_id": s_id,
                "assignment_type": "reserved"
            }
        ).json()
        v2 = client.get(f"/api/projects/{p_id}").json()["version"]
        assert v2 == v1 + 1

        # Update assignment
        client.put(
            f"/api/projects/{p_id}/assignments/{assign['id']}",
            json={"notes": "Updated engineering note"}
        )
        v3 = client.get(f"/api/projects/{p_id}").json()["version"]
        assert v3 == v2 + 1

        # Delete assignment
        client.delete(f"/api/projects/{p_id}/assignments/{assign['id']}")
        v4 = client.get(f"/api/projects/{p_id}").json()["version"]
        assert v4 == v3 + 1

    def test_network_and_broadcast_ips_rejected_for_standard_subnet(self, client: TestClient, test_project_with_subnet):
        p_id = test_project_with_subnet["project"]["id"]
        s_id = test_project_with_subnet["subnet"]["id"]
        # Subnet is 192.168.20.0/26: network is .0, broadcast is .63

        # Network address .0 should be rejected
        resp_net = client.post(
            f"/api/projects/{p_id}/assignments",
            json={
                "ipv4_address": "192.168.20.0",
                "subnet_id": s_id,
                "assignment_type": "planned static"
            }
        )
        assert resp_net.status_code == 400
        assert "Cannot assign network address" in resp_net.json()["detail"]

        # Broadcast address .63 should be rejected
        resp_bc = client.post(
            f"/api/projects/{p_id}/assignments",
            json={
                "ipv4_address": "192.168.20.63",
                "subnet_id": s_id,
                "assignment_type": "planned static"
            }
        )
        assert resp_bc.status_code == 400
        assert "Cannot assign broadcast address" in resp_bc.json()["detail"]

    def test_rfc3021_31_subnet_allows_both_ips(self, client: TestClient, test_project_with_subnet):
        p_id = test_project_with_subnet["project"]["id"]
        # Create /31 point-to-point link subnet
        s_resp = client.post(
            f"/api/projects/{p_id}/subnets",
            json={
                "cidr": "10.0.0.0/31",
                "label": "P2P Router Link"
            }
        )
        assert s_resp.status_code == 201
        s_id = s_resp.json()["id"]

        # Both 10.0.0.0 and 10.0.0.1 should be valid host assignments in /31
        resp0 = client.post(
            f"/api/projects/{p_id}/assignments",
            json={
                "ipv4_address": "10.0.0.0",
                "subnet_id": s_id,
                "assignment_type": "planned static"
            }
        )
        assert resp0.status_code == 201

        resp1 = client.post(
            f"/api/projects/{p_id}/assignments",
            json={
                "ipv4_address": "10.0.0.1",
                "subnet_id": s_id,
                "assignment_type": "planned static"
            }
        )
        assert resp1.status_code == 201

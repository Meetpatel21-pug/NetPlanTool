import pytest
from fastapi.testclient import TestClient


class TestSubnetPlannerAllocations:
    @pytest.fixture
    def test_project(self, client: TestClient):
        resp = client.post("/api/projects", json={"name": "Subnet Planning Test Project"})
        return resp.json()

    def test_create_top_level_subnet(self, client: TestClient, test_project):
        p_id = test_project["id"]
        resp = client.post(
            f"/api/projects/{p_id}/subnets",
            json={
                "cidr": "192.168.20.0/24",
                "label": "Parent Corporate Block",
                "segment": "VLAN 20",
                "gateway": "192.168.20.1",
                "dhcp_start": "192.168.20.50",
                "dhcp_end": "192.168.20.150",
                "requested_hosts": 100
            }
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["cidr"] == "192.168.20.0/24"
        assert data["network_address"] == "192.168.20.0"
        assert data["broadcast_address"] == "192.168.20.255"
        assert data["usable_addresses"] == 254
        assert data["capacity_warning"] is None

    def test_parent_child_containment(self, client: TestClient, test_project):
        p_id = test_project["id"]
        # Create parent /24
        parent_resp = client.post(
            f"/api/projects/{p_id}/subnets",
            json={"cidr": "192.168.20.0/24", "label": "Parent Block"}
        )
        parent_id = parent_resp.json()["id"]

        # Valid child /26 (192.168.20.0/26 is inside 192.168.20.0/24)
        child_resp = client.post(
            f"/api/projects/{p_id}/subnets",
            json={
                "cidr": "192.168.20.0/26",
                "label": "Lab Subnet",
                "parent_subnet_id": parent_id
            }
        )
        assert child_resp.status_code == 201
        assert child_resp.json()["cidr"] == "192.168.20.0/26"

        # Invalid child (192.168.21.0/26 is NOT inside 192.168.20.0/24)
        invalid_child = client.post(
            f"/api/projects/{p_id}/subnets",
            json={
                "cidr": "192.168.21.0/26",
                "label": "Outside Lab",
                "parent_subnet_id": parent_id
            }
        )
        assert invalid_child.status_code == 400
        assert "does not fit inside parent subnet" in invalid_child.json()["detail"]

    def test_sibling_overlap_detection(self, client: TestClient, test_project):
        p_id = test_project["id"]
        parent_resp = client.post(
            f"/api/projects/{p_id}/subnets",
            json={"cidr": "172.16.0.0/16", "label": "Campus Supernet"}
        )
        parent_id = parent_resp.json()["id"]

        # First child: 172.16.10.0/24
        child1 = client.post(
            f"/api/projects/{p_id}/subnets",
            json={"cidr": "172.16.10.0/24", "label": "Engineering", "parent_subnet_id": parent_id}
        )
        assert child1.status_code == 201

        # Second child: 172.16.11.0/24 (Adjacent, no overlap)
        child2 = client.post(
            f"/api/projects/{p_id}/subnets",
            json={"cidr": "172.16.11.0/24", "label": "Marketing", "parent_subnet_id": parent_id}
        )
        assert child2.status_code == 201

        # Overlapping child: 172.16.10.128/25 (Overlaps child1 172.16.10.0/24)
        overlap_child = client.post(
            f"/api/projects/{p_id}/subnets",
            json={"cidr": "172.16.10.128/25", "label": "Overlap Subnet", "parent_subnet_id": parent_id}
        )
        assert overlap_child.status_code == 400
        assert "overlaps with existing allocated subnet" in overlap_child.json()["detail"]

    def test_gateway_outside_subnet_rejected(self, client: TestClient, test_project):
        p_id = test_project["id"]
        resp = client.post(
            f"/api/projects/{p_id}/subnets",
            json={
                "cidr": "192.168.20.0/26",
                "label": "Gateway Test",
                "gateway": "192.168.20.100"  # 100 is outside /26 (0-63)
            }
        )
        assert resp.status_code == 400
        assert "Default gateway '192.168.20.100' falls outside" in resp.json()["detail"]

    def test_dhcp_range_validation(self, client: TestClient, test_project):
        p_id = test_project["id"]
        # DHCP out of range
        resp_out = client.post(
            f"/api/projects/{p_id}/subnets",
            json={
                "cidr": "192.168.20.0/26",
                "label": "DHCP Out",
                "dhcp_start": "192.168.20.10",
                "dhcp_end": "192.168.20.80"  # 80 is outside /26
            }
        )
        assert resp_out.status_code == 400
        assert "falls outside the allocated subnet" in resp_out.json()["detail"]

        # DHCP start > end
        resp_inverted = client.post(
            f"/api/projects/{p_id}/subnets",
            json={
                "cidr": "192.168.20.0/26",
                "label": "DHCP Inverted",
                "dhcp_start": "192.168.20.50",
                "dhcp_end": "192.168.20.20"
            }
        )
        assert resp_inverted.status_code == 400
        assert "cannot be higher than DHCP end address" in resp_inverted.json()["detail"]

    def test_capacity_warning_when_hosts_exceed_usable(self, client: TestClient, test_project):
        p_id = test_project["id"]
        # /26 has 62 usable addresses; requested 100
        resp = client.post(
            f"/api/projects/{p_id}/subnets",
            json={
                "cidr": "192.168.20.0/26",
                "label": "High Density Lab",
                "requested_hosts": 100
            }
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["capacity_warning"] is not None
        assert "exceeds usable subnet capacity (62 usable hosts for /26)" in data["capacity_warning"]

    def test_project_version_bumps_on_subnet_operations(self, client: TestClient, test_project):
        p_id = test_project["id"]
        v1 = client.get(f"/api/projects/{p_id}").json()["version"]

        # Add subnet
        sub_resp = client.post(
            f"/api/projects/{p_id}/subnets",
            json={"cidr": "10.20.0.0/24", "label": "Initial"}
        )
        sub_id = sub_resp.json()["id"]
        v2 = client.get(f"/api/projects/{p_id}").json()["version"]
        assert v2 == v1 + 1

        # Update subnet
        client.put(
            f"/api/projects/{p_id}/subnets/{sub_id}",
            json={"label": "Renamed Subnet"}
        )
        v3 = client.get(f"/api/projects/{p_id}").json()["version"]
        assert v3 == v2 + 1

        # Delete subnet
        client.delete(f"/api/projects/{p_id}/subnets/{sub_id}")
        v4 = client.get(f"/api/projects/{p_id}").json()["version"]
        assert v4 == v3 + 1

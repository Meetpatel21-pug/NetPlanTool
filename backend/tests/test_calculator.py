import pytest
from fastapi.testclient import TestClient
from backend.app.services.subnet_calc import (
    calculate_subnet,
    validate_ipv4_address_string,
    parse_and_normalize_prefix,
    SubnetCalculationResult,
)


class TestPureCalculatorFunctions:
    def test_required_test_vector_192_168_20_0_26(self):
        """Test vector from requirements: 192.168.20.0/26 -> 64 total, net .0, bcast .63, 62 usable."""
        res = calculate_subnet("192.168.20.0/26")
        assert isinstance(res, SubnetCalculationResult)
        assert res.cidr == "192.168.20.0/26"
        assert res.network_address == "192.168.20.0"
        assert res.broadcast_address == "192.168.20.63"
        assert res.netmask == "255.255.255.192"
        assert res.wildcard_mask == "0.0.0.63"
        assert res.total_addresses == 64
        assert res.usable_addresses == 62
        assert res.usable_range_start == "192.168.20.1"
        assert res.usable_range_end == "192.168.20.62"
        assert res.network_bits == 26
        assert res.host_bits == 6
        assert res.is_private is True

    def test_normalization_from_arbitrary_host_ip(self):
        """Passing a host IP in CIDR (192.168.20.55/26) normalizes to network block 192.168.20.0/26."""
        res = calculate_subnet("192.168.20.55/26")
        assert res.cidr == "192.168.20.0/26"
        assert res.network_address == "192.168.20.0"
        assert res.broadcast_address == "192.168.20.63"
        assert res.total_addresses == 64
        assert res.usable_addresses == 62

    def test_rfc3021_prefix_31_point_to_point(self):
        """Prefix /31: 2 usable addresses, no broadcast address."""
        res = calculate_subnet("10.0.0.0/31")
        assert res.cidr == "10.0.0.0/31"
        assert res.total_addresses == 2
        assert res.usable_addresses == 2
        assert res.broadcast_address is None
        assert res.usable_range_start == "10.0.0.0"
        assert res.usable_range_end == "10.0.0.1"
        assert "RFC 3021" in res.special_notes

    def test_prefix_32_single_host(self):
        """Prefix /32: 1 usable address (single host/loopback), no broadcast."""
        res = calculate_subnet("172.16.50.1/32")
        assert res.cidr == "172.16.50.1/32"
        assert res.total_addresses == 1
        assert res.usable_addresses == 1
        assert res.broadcast_address is None
        assert res.usable_range_start == "172.16.50.1"
        assert res.usable_range_end == "172.16.50.1"
        assert "/32 Single Host" in res.special_notes

    def test_prefix_30_point_to_point(self):
        """Prefix /30: 4 total addresses, 2 usable (first and last are net and bcast)."""
        res = calculate_subnet("10.1.1.0/30")
        assert res.total_addresses == 4
        assert res.usable_addresses == 2
        assert res.network_address == "10.1.1.0"
        assert res.broadcast_address == "10.1.1.3"
        assert res.usable_range_start == "10.1.1.1"
        assert res.usable_range_end == "10.1.1.2"

    def test_prefix_24_standard(self):
        """Prefix /24: 256 total, 254 usable."""
        res = calculate_subnet("192.168.1.0/24")
        assert res.total_addresses == 256
        assert res.usable_addresses == 254
        assert res.netmask == "255.255.255.0"
        assert res.broadcast_address == "192.168.1.255"

    def test_prefix_0_boundary(self):
        """Prefix /0: 4,294,967,296 total addresses."""
        res = calculate_subnet("0.0.0.0/0")
        assert res.total_addresses == 4294967296
        assert res.usable_addresses == 4294967294
        assert res.broadcast_address == "255.255.255.255"

    def test_split_ip_and_prefix_integer(self):
        """Calculate using IP string and prefix int."""
        res = calculate_subnet("192.168.20.0", 26)
        assert res.cidr == "192.168.20.0/26"
        assert res.total_addresses == 64

    def test_split_ip_and_netmask_string(self):
        """Calculate using IP string and subnet mask string."""
        res = calculate_subnet("192.168.20.0", "255.255.255.192")
        assert res.cidr == "192.168.20.0/26"
        assert res.prefix == 26
        assert res.total_addresses == 64

    def test_invalid_octets_rejected(self):
        with pytest.raises(ValueError, match="outside the valid range"):
            calculate_subnet("256.1.1.1/24")
        with pytest.raises(ValueError, match="Expected exactly 4 octets"):
            calculate_subnet("192.168.1/24")
        with pytest.raises(ValueError, match="not a numeric value"):
            calculate_subnet("192.168.a.1/24")

    def test_invalid_prefix_rejected(self):
        with pytest.raises(ValueError, match="must be between /0 and /32"):
            calculate_subnet("192.168.1.0/33")
        with pytest.raises(ValueError, match="must be between /0 and /32"):
            calculate_subnet("192.168.1.0/-1")
        with pytest.raises(ValueError, match="valid integer"):
            calculate_subnet("192.168.1.0/foo")

    def test_empty_string_rejected(self):
        with pytest.raises(ValueError, match="IPv4 address cannot be empty"):
            calculate_subnet("")


class TestSubnetCalculateEndpoint:
    def test_endpoint_vector_192_168_20_0_26(self, client: TestClient):
        response = client.post(
            "/api/subnets/calculate",
            json={"cidr": "192.168.20.0/26"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["cidr"] == "192.168.20.0/26"
        assert data["network_address"] == "192.168.20.0"
        assert data["broadcast_address"] == "192.168.20.63"
        assert data["netmask"] == "255.255.255.192"
        assert data["wildcard_mask"] == "0.0.0.63"
        assert data["total_addresses"] == 64
        assert data["usable_addresses"] == 62
        assert data["usable_range_start"] == "192.168.20.1"
        assert data["usable_range_end"] == "192.168.20.62"
        assert data["usable_range"] == "192.168.20.1 - 192.168.20.62"
        assert data["network_bits"] == 26
        assert data["host_bits"] == 6
        assert data["is_private"] is True

    def test_endpoint_host_normalization(self, client: TestClient):
        response = client.post(
            "/api/subnets/calculate",
            json={"cidr": "192.168.20.55/26"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["cidr"] == "192.168.20.0/26"
        assert data["network_address"] == "192.168.20.0"

    def test_endpoint_prefix_31_p2p(self, client: TestClient):
        response = client.post(
            "/api/subnets/calculate",
            json={"ip": "10.0.0.0", "prefix": 31}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["cidr"] == "10.0.0.0/31"
        assert data["broadcast_address"] is None
        assert data["usable_addresses"] == 2
        assert data["usable_range_start"] == "10.0.0.0"
        assert data["usable_range_end"] == "10.0.0.1"
        assert "RFC 3021" in data["special_notes"]

    def test_endpoint_prefix_32_host(self, client: TestClient):
        response = client.post(
            "/api/subnets/calculate",
            json={"ip": "172.16.1.5", "prefix": 32}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["cidr"] == "172.16.1.5/32"
        assert data["broadcast_address"] is None
        assert data["usable_addresses"] == 1
        assert "/32 Single Host" in data["special_notes"]

    def test_endpoint_ip_and_netmask(self, client: TestClient):
        response = client.post(
            "/api/subnets/calculate",
            json={"ip": "192.168.10.0", "netmask": "255.255.255.0"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["cidr"] == "192.168.10.0/24"
        assert data["prefix"] == 24
        assert data["usable_addresses"] == 254

    def test_endpoint_invalid_octet_returns_400(self, client: TestClient):
        response = client.post(
            "/api/subnets/calculate",
            json={"cidr": "256.0.0.1/24"}
        )
        assert response.status_code == 400
        assert "outside the valid range" in response.json()["detail"]

    def test_endpoint_invalid_prefix_returns_400(self, client: TestClient):
        response = client.post(
            "/api/subnets/calculate",
            json={"cidr": "192.168.1.0/35"}
        )
        assert response.status_code == 400
        assert "between /0 and /32" in response.json()["detail"]

    def test_endpoint_empty_body_returns_422(self, client: TestClient):
        response = client.post(
            "/api/subnets/calculate",
            json={}
        )
        assert response.status_code == 422

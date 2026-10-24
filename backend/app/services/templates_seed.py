import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from ..models.template import Template
from ..models.project import Project
from ..models.subnet import Subnet
from ..models.device import Device
from ..models.assignment import IPAssignment
from ..models.link import Link


STARTER_TEMPLATES = [
    {
        "id": "small-office",
        "name": "Small Office Network",
        "description": "Dual-switch office network with separate Management, Corporate LAN, Internal Servers, and Guest Wi-Fi.",
        "template_data": {
            "subnets": [
                {
                    "ref": "sub_super",
                    "parent_ref": None,
                    "cidr": "192.168.0.0/16",
                    "label": "Corporate Campus Supernet",
                    "segment": "Site Supernet",
                    "gateway": None,
                    "dhcp_start": None,
                    "dhcp_end": None,
                    "requested_hosts": None,
                },
                {
                    "ref": "sub_mgmt",
                    "parent_ref": "sub_super",
                    "cidr": "192.168.1.0/24",
                    "label": "Network Management & Infra",
                    "segment": "VLAN 10",
                    "gateway": "192.168.1.1",
                    "dhcp_start": "192.168.1.50",
                    "dhcp_end": "192.168.1.100",
                    "requested_hosts": 15,
                },
                {
                    "ref": "sub_lan",
                    "parent_ref": "sub_super",
                    "cidr": "192.168.10.0/24",
                    "label": "Corporate Workstations",
                    "segment": "VLAN 20",
                    "gateway": "192.168.10.1",
                    "dhcp_start": "192.168.10.50",
                    "dhcp_end": "192.168.10.200",
                    "requested_hosts": 45,
                },
                {
                    "ref": "sub_guest",
                    "parent_ref": "sub_super",
                    "cidr": "192.168.20.0/24",
                    "label": "Guest Wi-Fi",
                    "segment": "VLAN 30",
                    "gateway": "192.168.20.1",
                    "dhcp_start": "192.168.20.100",
                    "dhcp_end": "192.168.20.250",
                    "requested_hosts": 50,
                },
                {
                    "ref": "sub_srv",
                    "parent_ref": "sub_super",
                    "cidr": "192.168.50.0/24",
                    "label": "Internal Servers & Services",
                    "segment": "VLAN 50",
                    "gateway": "192.168.50.1",
                    "dhcp_start": None,
                    "dhcp_end": None,
                    "requested_hosts": 10,
                },
            ],
            "devices": [
                {
                    "ref": "dev_router",
                    "name": "edge-router-01",
                    "device_type": "router",
                    "role": "Border Gateway & Firewall",
                    "diagram_x": 380,
                    "diagram_y": 60,
                },
                {
                    "ref": "dev_switch",
                    "name": "sw-core-01",
                    "device_type": "switch",
                    "role": "Core Distribution Switch",
                    "diagram_x": 380,
                    "diagram_y": 200,
                },
                {
                    "ref": "dev_ap",
                    "name": "ap-office-01",
                    "device_type": "access_point",
                    "role": "Office Wi-Fi 6 Access Point",
                    "diagram_x": 180,
                    "diagram_y": 340,
                },
                {
                    "ref": "dev_dc",
                    "name": "srv-dc-01",
                    "device_type": "server",
                    "role": "Primary Domain Controller & DNS",
                    "diagram_x": 560,
                    "diagram_y": 340,
                },
                {
                    "ref": "dev_pc1",
                    "name": "ws-finance-01",
                    "device_type": "workstation",
                    "role": "Finance Specialist PC",
                    "diagram_x": 100,
                    "diagram_y": 480,
                },
                {
                    "ref": "dev_printer",
                    "name": "prn-office-color",
                    "device_type": "printer",
                    "role": "Shared Network Printer",
                    "diagram_x": 280,
                    "diagram_y": 480,
                },
            ],
            "assignments": [
                {
                    "subnet_ref": "sub_mgmt",
                    "device_ref": "dev_router",
                    "ipv4_address": "192.168.1.1",
                    "assignment_type": "gateway",
                    "status": "active",
                    "notes": "Internal gateway interface",
                },
                {
                    "subnet_ref": "sub_mgmt",
                    "device_ref": "dev_switch",
                    "ipv4_address": "192.168.1.2",
                    "assignment_type": "planned static",
                    "status": "active",
                    "notes": "VLAN 10 Switch SVI",
                },
                {
                    "subnet_ref": "sub_mgmt",
                    "device_ref": "dev_ap",
                    "ipv4_address": "192.168.1.10",
                    "assignment_type": "planned static",
                    "status": "active",
                    "notes": "AP Management IP",
                },
                {
                    "subnet_ref": "sub_srv",
                    "device_ref": "dev_dc",
                    "ipv4_address": "192.168.50.10",
                    "assignment_type": "planned static",
                    "status": "active",
                    "notes": "Active Directory & DNS",
                },
                {
                    "subnet_ref": "sub_lan",
                    "device_ref": "dev_pc1",
                    "ipv4_address": "192.168.10.55",
                    "assignment_type": "reserved",
                    "status": "active",
                    "notes": "Fixed DHCP Lease for Finance",
                },
                {
                    "subnet_ref": "sub_lan",
                    "device_ref": "dev_printer",
                    "ipv4_address": "192.168.10.20",
                    "assignment_type": "planned static",
                    "status": "active",
                    "notes": "Static office printer",
                },
            ],
            "links": [
                {
                    "source_ref": "dev_router",
                    "target_ref": "dev_switch",
                    "link_type": "trunk",
                    "label": "10GbE Uplink",
                },
                {
                    "source_ref": "dev_switch",
                    "target_ref": "dev_ap",
                    "link_type": "access",
                    "label": "PoE+ GigE",
                },
                {
                    "source_ref": "dev_switch",
                    "target_ref": "dev_dc",
                    "link_type": "access",
                    "label": "Bonded 1GbE",
                },
                {
                    "source_ref": "dev_switch",
                    "target_ref": "dev_pc1",
                    "link_type": "access",
                    "label": "1GbE Port 12",
                },
                {
                    "source_ref": "dev_switch",
                    "target_ref": "dev_printer",
                    "link_type": "access",
                    "label": "100Mb Port 24",
                },
            ],
        },
    },
    {
        "id": "college-lab",
        "name": "College Computer Lab",
        "description": "High-density academic computer lab with instructor station, 60 student seats across dual subnets, and local file storage.",
        "template_data": {
            "subnets": [
                {
                    "ref": "sub_lab_super",
                    "parent_ref": None,
                    "cidr": "10.100.0.0/22",
                    "label": "CS Lab Supernet",
                    "segment": "Campus Lab Block",
                    "gateway": None,
                    "dhcp_start": None,
                    "dhcp_end": None,
                    "requested_hosts": None,
                },
                {
                    "ref": "sub_infra",
                    "parent_ref": "sub_lab_super",
                    "cidr": "10.100.0.0/24",
                    "label": "Lab Infrastructure & Servers",
                    "segment": "VLAN 100",
                    "gateway": "10.100.0.1",
                    "dhcp_start": None,
                    "dhcp_end": None,
                    "requested_hosts": 10,
                },
                {
                    "ref": "sub_row_ab",
                    "parent_ref": "sub_lab_super",
                    "cidr": "10.100.1.0/24",
                    "label": "Student Desktops (Rows A-D)",
                    "segment": "VLAN 101",
                    "gateway": "10.100.1.1",
                    "dhcp_start": "10.100.1.20",
                    "dhcp_end": "10.100.1.200",
                    "requested_hosts": 30,
                },
                {
                    "ref": "sub_row_cd",
                    "parent_ref": "sub_lab_super",
                    "cidr": "10.100.2.0/24",
                    "label": "Student Desktops (Rows E-H)",
                    "segment": "VLAN 102",
                    "gateway": "10.100.2.1",
                    "dhcp_start": "10.100.2.20",
                    "dhcp_end": "10.100.2.200",
                    "requested_hosts": 30,
                },
            ],
            "devices": [
                {
                    "ref": "dev_lab_gw",
                    "name": "lab-gateway-01",
                    "device_type": "router",
                    "role": "Lab L3 Gateway & DHCP",
                    "diagram_x": 380,
                    "diagram_y": 60,
                },
                {
                    "ref": "dev_lab_sw",
                    "name": "sw-lab-dist",
                    "device_type": "switch",
                    "role": "48-Port Managed PoE Switch",
                    "diagram_x": 380,
                    "diagram_y": 200,
                },
                {
                    "ref": "dev_instructor",
                    "name": "pc-instructor",
                    "device_type": "workstation",
                    "role": "Instructor Teaching Station",
                    "diagram_x": 180,
                    "diagram_y": 340,
                },
                {
                    "ref": "dev_nas",
                    "name": "nas-lab-storage",
                    "device_type": "server",
                    "role": "NFS Student Share Storage",
                    "diagram_x": 580,
                    "diagram_y": 340,
                },
            ],
            "assignments": [
                {
                    "subnet_ref": "sub_infra",
                    "device_ref": "dev_lab_gw",
                    "ipv4_address": "10.100.0.1",
                    "assignment_type": "gateway",
                    "status": "active",
                    "notes": "Lab Gateway Interface",
                },
                {
                    "subnet_ref": "sub_infra",
                    "device_ref": "dev_lab_sw",
                    "ipv4_address": "10.100.0.2",
                    "assignment_type": "planned static",
                    "status": "active",
                    "notes": "Switch Management",
                },
                {
                    "subnet_ref": "sub_infra",
                    "device_ref": "dev_instructor",
                    "ipv4_address": "10.100.0.10",
                    "assignment_type": "planned static",
                    "status": "active",
                    "notes": "Lectern Desktop",
                },
                {
                    "subnet_ref": "sub_infra",
                    "device_ref": "dev_nas",
                    "ipv4_address": "10.100.0.20",
                    "assignment_type": "planned static",
                    "status": "active",
                    "notes": "Shared Lab File Storage",
                },
            ],
            "links": [
                {
                    "source_ref": "dev_lab_gw",
                    "target_ref": "dev_lab_sw",
                    "link_type": "trunk",
                    "label": "10G Fiber",
                },
                {
                    "source_ref": "dev_lab_sw",
                    "target_ref": "dev_instructor",
                    "link_type": "access",
                    "label": "Gigabit Ethernet",
                },
                {
                    "source_ref": "dev_lab_sw",
                    "target_ref": "dev_nas",
                    "link_type": "access",
                    "label": "10GbE DAC",
                },
            ],
        },
    },
    {
        "id": "guest-network",
        "name": "Isolated Guest Wi-Fi",
        "description": "Public hospitality and visitor wireless network segregated from enterprise infrastructure with captive portal gateway.",
        "template_data": {
            "subnets": [
                {
                    "ref": "sub_gsuper",
                    "parent_ref": None,
                    "cidr": "172.16.0.0/20",
                    "label": "Hospitality Guest Supernet",
                    "segment": "Visitor Zone",
                    "gateway": None,
                    "dhcp_start": None,
                    "dhcp_end": None,
                    "requested_hosts": None,
                },
                {
                    "ref": "sub_control",
                    "parent_ref": "sub_gsuper",
                    "cidr": "172.16.1.0/24",
                    "label": "Guest Portal & Controllers",
                    "segment": "VLAN 200",
                    "gateway": "172.16.1.1",
                    "dhcp_start": None,
                    "dhcp_end": None,
                    "requested_hosts": 5,
                },
                {
                    "ref": "sub_clients",
                    "parent_ref": "sub_gsuper",
                    "cidr": "172.16.4.0/22",
                    "label": "Dynamic Guest Client Range",
                    "segment": "VLAN 210",
                    "gateway": "172.16.4.1",
                    "dhcp_start": "172.16.4.10",
                    "dhcp_end": "172.16.7.250",
                    "requested_hosts": 500,
                },
            ],
            "devices": [
                {
                    "ref": "dev_firewall",
                    "name": "guest-fw-portal",
                    "device_type": "router",
                    "role": "Captive Portal & NAT Gateway",
                    "diagram_x": 380,
                    "diagram_y": 70,
                },
                {
                    "ref": "dev_ap_lobby",
                    "name": "ap-lobby-guest",
                    "device_type": "access_point",
                    "role": "Lobby Access Point",
                    "diagram_x": 220,
                    "diagram_y": 240,
                },
                {
                    "ref": "dev_ap_conference",
                    "name": "ap-conf-guest",
                    "device_type": "access_point",
                    "role": "Conference Hall AP",
                    "diagram_x": 540,
                    "diagram_y": 240,
                },
            ],
            "assignments": [
                {
                    "subnet_ref": "sub_control",
                    "device_ref": "dev_firewall",
                    "ipv4_address": "172.16.1.1",
                    "assignment_type": "gateway",
                    "status": "active",
                    "notes": "Captive Portal Gateway",
                },
                {
                    "subnet_ref": "sub_control",
                    "device_ref": "dev_ap_lobby",
                    "ipv4_address": "172.16.1.10",
                    "assignment_type": "planned static",
                    "status": "active",
                    "notes": "Lobby AP Mgmt",
                },
                {
                    "subnet_ref": "sub_control",
                    "device_ref": "dev_ap_conference",
                    "ipv4_address": "172.16.1.11",
                    "assignment_type": "planned static",
                    "status": "active",
                    "notes": "Conference Hall AP Mgmt",
                },
            ],
            "links": [
                {
                    "source_ref": "dev_firewall",
                    "target_ref": "dev_ap_lobby",
                    "link_type": "access",
                    "label": "PoE Uplink",
                },
                {
                    "source_ref": "dev_firewall",
                    "target_ref": "dev_ap_conference",
                    "link_type": "access",
                    "label": "PoE Uplink",
                },
            ],
        },
    },
    {
        "id": "home-lab",
        "name": "Home Lab & Hypervisor",
        "description": "Self-hosted enthusiast cluster with virtualization server, TrueNAS storage, smart home IoT segment, and secure management.",
        "template_data": {
            "subnets": [
                {
                    "ref": "sub_hl_mgmt",
                    "parent_ref": None,
                    "cidr": "10.0.0.0/24",
                    "label": "Management & Trusted LAN",
                    "segment": "VLAN 1",
                    "gateway": "10.0.0.1",
                    "dhcp_start": "10.0.0.100",
                    "dhcp_end": "10.0.0.200",
                    "requested_hosts": 20,
                },
                {
                    "ref": "sub_hl_storage",
                    "parent_ref": None,
                    "cidr": "10.0.10.0/24",
                    "label": "Storage & VM Migration SAN",
                    "segment": "VLAN 10",
                    "gateway": "10.0.10.1",
                    "dhcp_start": None,
                    "dhcp_end": None,
                    "requested_hosts": 8,
                },
                {
                    "ref": "sub_hl_iot",
                    "parent_ref": None,
                    "cidr": "10.0.50.0/24",
                    "label": "Smart Home & IoT Devices",
                    "segment": "VLAN 50",
                    "gateway": "10.0.50.1",
                    "dhcp_start": "10.0.50.20",
                    "dhcp_end": "10.0.50.200",
                    "requested_hosts": 40,
                },
            ],
            "devices": [
                {
                    "ref": "dev_pfsense",
                    "name": "opnsense-gw",
                    "device_type": "router",
                    "role": "Firewall & Inter-VLAN Router",
                    "diagram_x": 380,
                    "diagram_y": 60,
                },
                {
                    "ref": "dev_sw_smart",
                    "name": "sw-managed-24p",
                    "device_type": "switch",
                    "role": "24-Port Managed Switch",
                    "diagram_x": 380,
                    "diagram_y": 190,
                },
                {
                    "ref": "dev_proxmox",
                    "name": "pve-node-01",
                    "device_type": "server",
                    "role": "Proxmox Virtualization Hypervisor",
                    "diagram_x": 200,
                    "diagram_y": 340,
                },
                {
                    "ref": "dev_truenas",
                    "name": "truenas-scale",
                    "device_type": "server",
                    "role": "ZFS Storage & iSCSI Target",
                    "diagram_x": 560,
                    "diagram_y": 340,
                },
            ],
            "assignments": [
                {
                    "subnet_ref": "sub_hl_mgmt",
                    "device_ref": "dev_pfsense",
                    "ipv4_address": "10.0.0.1",
                    "assignment_type": "gateway",
                    "status": "active",
                    "notes": "Firewall LAN Gateway",
                },
                {
                    "subnet_ref": "sub_hl_mgmt",
                    "device_ref": "dev_sw_smart",
                    "ipv4_address": "10.0.0.2",
                    "assignment_type": "planned static",
                    "status": "active",
                    "notes": "Switch Web GUI IP",
                },
                {
                    "subnet_ref": "sub_hl_mgmt",
                    "device_ref": "dev_proxmox",
                    "ipv4_address": "10.0.0.10",
                    "assignment_type": "planned static",
                    "status": "active",
                    "notes": "Proxmox Management WebUI",
                },
                {
                    "subnet_ref": "sub_hl_storage",
                    "device_ref": "dev_truenas",
                    "ipv4_address": "10.0.10.15",
                    "assignment_type": "planned static",
                    "status": "active",
                    "notes": "Storage Pool 10GbE Interface",
                },
            ],
            "links": [
                {
                    "source_ref": "dev_pfsense",
                    "target_ref": "dev_sw_smart",
                    "link_type": "trunk",
                    "label": "All VLANs Trunk",
                },
                {
                    "source_ref": "dev_sw_smart",
                    "target_ref": "dev_proxmox",
                    "link_type": "trunk",
                    "label": "VLAN Trunk 1, 10, 50",
                },
                {
                    "source_ref": "dev_sw_smart",
                    "target_ref": "dev_truenas",
                    "link_type": "access",
                    "label": "Storage VLAN 10",
                },
            ],
        },
    },
]


def seed_templates(db: Session) -> None:
    """Populates or updates the templates table with starter network blueprints."""
    for item in STARTER_TEMPLATES:
        t = db.query(Template).filter(Template.id == item["id"]).first()
        if not t:
            t = Template(
                id=item["id"],
                name=item["name"],
                description=item["description"],
                template_data=item["template_data"],
                version=1
            )
            db.add(t)
        else:
            t.name = item["name"]
            t.description = item["description"]
            t.template_data = item["template_data"]
    db.commit()


def instantiate_template(db: Session, template_id: str, custom_name: str | None = None, custom_desc: str | None = None) -> Project:
    """Clones a template into a living Project with complete subnets, devices, assignments, and links."""
    t = db.query(Template).filter(Template.id == template_id).first()
    if not t:
        raise ValueError(f"Template '{template_id}' not found")

    data = t.template_data
    proj_name = custom_name or t.name
    proj_desc = custom_desc or t.description

    now = datetime.now(timezone.utc)
    new_project = Project(
        id=str(uuid.uuid4()),
        name=proj_name,
        description=proj_desc,
        version=1,
        created_at=now,
        updated_at=now
    )
    db.add(new_project)
    db.flush()

    subnet_map = {}  # ref -> Subnet.id
    # Sort subnets so parents (parent_ref is None) are created first
    raw_subnets = list(data.get("subnets", []))
    raw_subnets.sort(key=lambda s: 0 if not s.get("parent_ref") else 1)

    for s in raw_subnets:
        sub_id = str(uuid.uuid4())
        parent_id = subnet_map.get(s.get("parent_ref")) if s.get("parent_ref") else None
        db_sub = Subnet(
            id=sub_id,
            project_id=new_project.id,
            parent_subnet_id=parent_id,
            cidr=s["cidr"],
            label=s["label"],
            segment=s.get("segment"),
            gateway=s.get("gateway"),
            dhcp_start=s.get("dhcp_start"),
            dhcp_end=s.get("dhcp_end"),
            requested_hosts=s.get("requested_hosts"),
            created_at=now,
            updated_at=now
        )
        db.add(db_sub)
        subnet_map[s["ref"]] = sub_id

    device_map = {}  # ref -> Device.id
    for d in data.get("devices", []):
        dev_id = str(uuid.uuid4())
        db_dev = Device(
            id=dev_id,
            project_id=new_project.id,
            name=d["name"],
            device_type=d["device_type"],
            role=d.get("role"),
            diagram_x=d.get("diagram_x", 100),
            diagram_y=d.get("diagram_y", 100),
            created_at=now,
            updated_at=now
        )
        db.add(db_dev)
        device_map[d["ref"]] = dev_id

    db.flush()

    for a in data.get("assignments", []):
        sub_id = subnet_map.get(a["subnet_ref"])
        dev_id = device_map.get(a["device_ref"]) if a.get("device_ref") else None
        if sub_id:
            db_assign = IPAssignment(
                id=str(uuid.uuid4()),
                project_id=new_project.id,
                subnet_id=sub_id,
                device_id=dev_id,
                ipv4_address=a["ipv4_address"],
                assignment_type=a["assignment_type"],
                status=a.get("status", "active"),
                notes=a.get("notes"),
                created_at=now,
                updated_at=now
            )
            db.add(db_assign)

    for lk in data.get("links", []):
        src_id = device_map.get(lk["source_ref"])
        tgt_id = device_map.get(lk["target_ref"])
        if src_id and tgt_id:
            db_link = Link(
                id=str(uuid.uuid4()),
                project_id=new_project.id,
                source_device_id=src_id,
                target_device_id=tgt_id,
                speed_note=lk.get("speed_note") or lk.get("link_type", "access"),
                label=lk.get("label"),
                created_at=now
            )
            db.add(db_link)

    db.commit()
    db.refresh(new_project)
    return new_project


def seed_demo_project_if_empty(db: Session) -> Project | None:
    """If database has no projects, create the Small Office demo project."""
    seed_templates(db)
    count = db.query(Project).count()
    if count == 0:
        return instantiate_template(
            db, 
            "small-office", 
            custom_name="Demo: Small Office Network", 
            custom_desc="Pre-populated demonstration network with subnets, devices, IP plan, and topology diagram."
        )
    return None

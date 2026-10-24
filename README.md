# Network Planning Toolkit

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python)](https://www.python.org)
[![Vitest](https://img.shields.io/badge/Vitest-3.0+-6E9F18?style=flat&logo=vitest)](https://vitest.dev)
[![ReportLab](https://img.shields.io/badge/ReportLab-PDF-red?style=flat)](https://www.reportlab.com)

A practical, robust web application for planning IPv4 networks: interactive subnet calculation, hierarchical subnet allocation, IP inventory tracking, hardware device records, interactive visual topology diagrams, multi-rule validation diagnostics, and sanitized CSV/PDF technical documentation exports.

> **MANDATORY LIVE-NETWORK SAFETY NOTICE:**  
> *This plan is not aware of the live network. Verify against existing DHCP, static assignments, VPN ranges, and upstream allocations before implementing.*

---

## Key Modules & Features

### 1. IPv4 Subnet Calculator
- Built on Python's robust standard library `ipaddress` module (no hand-rolled bitwise approximations).
- Dual-input mode supporting standard CIDR prefix (`192.168.20.0/26`) and separate IP/Netmask (`192.168.20.0` + `255.255.255.192`).
- Arbitrary host IP normalization: automatically extracts and displays the correct network address while preserving the entered host address.
- Detailed output metrics: Network Address, Broadcast Address, Subnet Mask, Wildcard Mask, Total Addresses, Usable Host Range, Usable Host Count, and CIDR Notation.
- **Interactive 32-Bit Binary Breakdown:** Color-coded network bits (cyan) vs host bits (purple) across all 4 octets.
- Copy-to-clipboard actions on all result metrics.

### 2. Supported RFC Subnet Conventions
- **Conventional Subnets (`/0` through `/30`):**
  - First IP reserved as network ID.
  - Last IP reserved as broadcast address.
  - Usable host capacity: $2^{32 - \text{prefix}} - 2$.
  - Example: `192.168.20.0/26` yields 64 total addresses, `192.168.20.0` as network ID, `192.168.20.63` as broadcast, and 62 usable host addresses (`192.168.20.1` – `192.168.20.62`).
- **Point-to-Point Links (`/31` — RFC 3021):**
  - Implements RFC 3021 for point-to-point router interfaces.
  - 2 total addresses, both fully usable as endpoint interfaces with no dedicated network or broadcast overhead (`broadcast_address = None`).
  - Example: `10.0.0.0/31` yields 2 usable addresses (`10.0.0.0` and `10.0.0.1`).
- **Single Host / Loopback (`/32`):**
  - Represents a single host endpoint or loopback interface.
  - 1 total address and 1 usable address (`broadcast_address = None`).
  - Example: `172.16.50.1/32` yields 1 usable address (`172.16.50.1`).

### 3. Project Management & Hierarchical Subnet Planner
- Full project CRUD with optimistic concurrency versioning (version bumps on every modification).
- One-click project duplication (deep clones all subnets, devices, IP assignments, and topology links).
- Parent-child subnet hierarchy with parent containment validation.
- Real-time sibling collision & overlap prevention.
- Gateway bounds check (gateway must reside within the allocated subnet).
- DHCP start/end pool validation (DHCP pool bounds verified within subnet boundaries).
- Visual capacity indicators with utilization progress bars and host overload warnings.

### 4. IP Inventory & Hardware Device Management
- Hardware inventory tracking routers, switches, servers, workstations, printers, and wireless access points.
- Categorized IP assignment types: `planned static`, `reserved`, `DHCP pool`, `gateway`, `unassigned`.
- Project-wide duplicate IP collision prevention.
- Out-of-subnet IP check: guarantees static IPs match the assigned subnet range.
- DHCP boundary protection: prevents static IP assignments inside dynamic DHCP pools.
- Filtering controls by Subnet, Hardware Role, Assignment Status, and Device Type.

### 5. Interactive Visual Topology Diagram
- Powered by React Flow (`@xyflow/react`).
- Custom `DeviceNode` components with hardware-specific icons, role tags, and multi-directional connection handles (top, bottom, left, right).
- Connect devices with custom styled links (Trunk, Access, or WAN).
- Persistent layout: device node coordinates (`diagram_x`, `diagram_y`) automatically synchronize to SQLite backend via debounced batch position updates.
- One-click raster PNG canvas export (`html-to-image`) for technical documentation and slide decks.

### 6. Multi-Rule Network Validation Engine
- Diagnostic rule validation evaluating project data integrity against RFC standards:
  - `DUPLICATE_IP`: Flags duplicate addresses assigned to multiple devices or interfaces.
  - `SUBNET_OVERLAP`: Detects conflicting sibling subnets.
  - `IP_OUT_OF_RANGE`: Identifies static assignments outside subnet bounds.
  - `DHCP_COLLISION`: Flags static IPs placed inside dynamic DHCP ranges.
  - `GATEWAY_OUT_OF_RANGE`: Catches gateways located outside their subnet.
  - `CAPACITY_EXCEEDED`: Warns when requested host capacity exceeds available addresses.
  - `UNDOCUMENTED_DEVICE`: Alerts on devices lacking IP assignments.
- Non-destructive operation: validates configuration integrity with plain-language recommendations without altering existing records.
- Severity classification: **Error** (critical conflicts), **Warning** (operational risks), and **Advisory** (best practices).

### 7. Documentation & Sanitized Technical Reports
- **CSV Inventory Export:** Exports tabular IP address plans with built-in formula injection sanitization (cells starting with `=`, `+`, `-`, or `@` are safely prefixed with `'`).
- **PDF Technical Documentation:** Generated via ReportLab featuring executive project metadata, subnet allocation tables, hardware inventory, IP assignments, validation audit findings, and the mandatory live-network safety notice.

### 8. Starter Blueprints & Instant Demo
- Built-in blueprints ready for one-click instantiation:
  - **Small Office Network:** Management VLAN 10, Workstations VLAN 20, Guest Wi-Fi VLAN 30, Server Farm VLAN 50.
  - **College Computer Lab:** 60 student workstations across dual subnets, instructor station, NFS storage, and lab distribution switch.
  - **Isolated Guest Wi-Fi:** Captive portal gateway and dynamic guest range segregated from enterprise infrastructure.
  - **Home Lab & Hypervisor:** Proxmox virtualization node, TrueNAS storage SAN, and isolated smart home IoT VLAN.
- Automatic demo seeding: on initial empty database boot, the Small Office demo project is automatically created so users can immediately explore rich, populated network data.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy, SQLite, Pydantic v2, Python `ipaddress` |
| **PDF & CSV** | ReportLab, Python `csv` (Formula injection protection) |
| **Frontend** | React 18, TypeScript, Vite, React Flow (`@xyflow/react`), React Router v6, Lucide Icons |
| **Styling** | Vanilla CSS (Obsidian Slate design system, glassmorphism, responsive tokens) |
| **Testing** | pytest + httpx (Backend), Vitest + React Testing Library (Frontend) |

---

## Setup & Running Locally

### Prerequisites
- Python 3.11 or higher
- Node.js 18 or higher (with npm)

### 1. Backend Setup

```bash
# From workspace root
pip install -r backend/requirements.txt

# Start FastAPI server on port 8000
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

- API Base URL: `http://127.0.0.1:8000/api`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`
- Redoc Documentation: `http://127.0.0.1:8000/redoc`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

- Frontend Application: `http://localhost:5173`
- The Vite dev server proxies `/api` calls directly to `http://127.0.0.1:8000`.

---

## Automated Test Suites

### Backend Unit & Integration Tests (pytest)
Runs 53 comprehensive automated tests covering the calculation engine, RFC 3021/32 edge cases, project CRUD, subnet allocation hierarchy, device inventory, diagram links, multi-rule validation, CSV injection sanitization, PDF generation, and starter blueprints:

```bash
python -m pytest backend/tests -v
```

### Frontend Component & Integration Tests (Vitest)
Runs 24 automated unit and integration tests across 7 test suites validating the subnet calculator UI, project dashboard, subnet planner, IP inventory, React Flow diagram canvas, validation panel, and report exports:

```bash
npm --prefix frontend test
```

### Production Bundle Verification
```bash
npm --prefix frontend run build
```

---

## Security & Implementation Guarantees

1. **Spreadsheet Formula Injection Mitigation:**  
   Per OWASP recommendations, any CSV export cell starting with `=`, `+`, `-`, or `@` is prepended with a single quote (`'`), ensuring spreadsheet applications like Microsoft Excel, LibreOffice Calc, and Google Sheets do not execute user-provided strings as formulas.

2. **Accidental Live Deployment Protection:**  
   Every PDF report and the frontend reports view prominently feature the mandatory safety banner to prevent mistaking planning artifacts for live discovery scans.

3. **Non-Destructive Validation Engine:**  
   Running the validation diagnostic scans project state and returns actionable findings without mutating or deleting user subnets, IP records, or hardware.

4. **Planning Scope Boundaries:**  
   The application intentionally avoids active network probes (e.g. ICMP ping, ARP snooping, SNMP discovery) and hardware configuration provisioning. It is strictly designed for safe, offline network architecture and capacity planning.

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface NetworkDeviceData {
  id: string;
  name: string;
  type: 'router' | 'switch' | 'server' | 'workstation' | 'printer' | 'access_point';
  role: string;
  ip: string;
  subnet: string;
  status: 'active' | 'planned' | 'warning';
  position: [number, number, number];
  modelUrl?: string; // Optional custom GLB/GLTF model URL
}

export interface SubnetZoneData {
  id: string;
  name: string;
  cidr: string;
  color: number;
  center: [number, number, number];
  size: [number, number];
}

// ============================================================================
// ENTERPRISE HARDWARE INDUSTRIAL MATERIALS & PROCEDURAL TEXTURES
// ============================================================================

/**
 * Procedural anisotropic brushed metal bump texture for realistic titanium/aluminum sheen
 */
export function createBrushedMetalBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  try {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 512, 512);

      for (let i = 0; i < 3500; i++) {
        const y = Math.random() * 512;
        const x = Math.random() * 512;
        const length = 40 + Math.random() * 180;
        const gray = 95 + Math.floor(Math.random() * 65);
        const alpha = 0.2 + Math.random() * 0.3;
        ctx.strokeStyle = `rgba(${gray}, ${gray}, ${gray}, ${alpha})`;
        ctx.lineWidth = 1 + Math.random();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + length, y);
        ctx.stroke();
      }
    }
  } catch {
    // Canvas fallback
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

/**
 * Procedural stamped honeycomb ventilation mesh texture for server and router bezels
 */
export function createHoneycombMeshTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  try {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#141720';
      ctx.fillRect(0, 0, 256, 256);

      const r = 3.5;
      const spacingX = 12;
      const spacingY = 10.5;
      for (let y = 0; y < 256; y += spacingY) {
        const isOdd = Math.floor(y / spacingY) % 2 === 1;
        const offsetX = isOdd ? spacingX / 2 : 0;
        for (let x = -spacingX; x < 256 + spacingX; x += spacingX) {
          ctx.beginPath();
          ctx.arc(x + offsetX, y, r, 0, Math.PI * 2);
          ctx.fillStyle = '#06070a';
          ctx.fill();
          ctx.lineWidth = 0.8;
          ctx.strokeStyle = '#2d3748';
          ctx.stroke();
        }
      }
    }
  } catch {
    // Canvas fallback
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

const brushedMetalBumpTex = createBrushedMetalBumpTexture();
const honeycombMeshTex = createHoneycombMeshTexture();

// Matte Enterprise Graphite / Dark Titanium Steel (Cisco / Dell / Ubiquiti enterprise finish)
export const chassisMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x1b1f28,
  roughness: 0.28,
  metalness: 0.88,
  clearcoat: 0.35,
  clearcoatRoughness: 0.15,
  reflectivity: 0.9,
  bumpMap: brushedMetalBumpTex,
  bumpScale: 0.02,
});

// Precision Anodized Space Gray / Aluminum Trim
export const chassisAccentMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x2e3542,
  roughness: 0.24,
  metalness: 0.82,
  clearcoat: 0.45,
  clearcoatRoughness: 0.12,
  bumpMap: brushedMetalBumpTex,
  bumpScale: 0.015,
});

// Deep Obsidian Bezel Faceplate
export const darkFaceplateMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x0c0e12,
  roughness: 0.38,
  metalness: 0.72,
  clearcoat: 0.25,
  clearcoatRoughness: 0.2,
  bumpMap: brushedMetalBumpTex,
  bumpScale: 0.015,
});

// Honeycomb ventilation grille material
export const honeycombVentMaterial = new THREE.MeshStandardMaterial({
  color: 0x161a22,
  roughness: 0.45,
  metalness: 0.75,
  map: honeycombMeshTex,
  bumpMap: honeycombMeshTex,
  bumpScale: 0.035,
});

// Real Industrial Gold/Copper Plating for RJ-45 Pins & Antenna Joints
export const metalPortMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xd4af37,
  metalness: 0.94,
  roughness: 0.16,
  reflectivity: 0.95,
});

// High-Polish Structural Chrome / Rack Mount Bolts
export const chromeMetalMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xd8dce8,
  metalness: 0.96,
  roughness: 0.12,
  clearcoat: 0.9,
  clearcoatRoughness: 0.1,
});

// SFP+ 10G/25G Optical Transceiver Polymer (Aqua OM4 / Single-mode Yellow)
export const sfpOpticMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x00c2cb,
  metalness: 0.75,
  roughness: 0.2,
  clearcoat: 0.8,
});

// Industrial Silicone Rubber Grommets / Anti-vibration Feet
export const rubberFootMaterial = new THREE.MeshStandardMaterial({
  color: 0x111317,
  roughness: 0.92,
  metalness: 0.02,
});

// Internal Port Cavity Depth
export const portCavityMaterial = new THREE.MeshStandardMaterial({
  color: 0x08090b,
  roughness: 0.85,
});

// Smoked Tempered Acrylic / Server Indicator Glass
export const translucentGlassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x3b4252,
  transmission: 0.72,
  opacity: 0.85,
  transparent: true,
  roughness: 0.12,
  ior: 1.52,
  thickness: 0.3,
});

// Appliance Chalk / Pearl White (for Ceiling Access Point & Printer Housing)
export const applianceWhiteMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xe5e7eb,
  roughness: 0.28,
  metalness: 0.08,
  clearcoat: 0.45,
  clearcoatRoughness: 0.18,
});

// Vibrant Industrial Micro-LEDs
export const ledActiveGreen = new THREE.MeshStandardMaterial({
  color: 0x22c55e,
  emissive: 0x22c55e,
  emissiveIntensity: 2.6,
  roughness: 0.1,
});

export const ledActivePurple = new THREE.MeshStandardMaterial({
  color: 0xa855f7,
  emissive: 0xa855f7,
  emissiveIntensity: 2.4,
  roughness: 0.1,
});

export const ledAmber = new THREE.MeshStandardMaterial({
  color: 0xf59e0b,
  emissive: 0xf59e0b,
  emissiveIntensity: 2.2,
  roughness: 0.1,
});

export const ledCyan = new THREE.MeshStandardMaterial({
  color: 0x06b6d4,
  emissive: 0x06b6d4,
  emissiveIntensity: 2.8,
  roughness: 0.1,
});

export const ledRose = new THREE.MeshStandardMaterial({
  color: 0xf43f5e,
  emissive: 0xf43f5e,
  emissiveIntensity: 3.0,
  roughness: 0.1,
});

// Shared GLTF Loader instance for external free 3D models
const gltfLoader = new GLTFLoader();

/**
 * Loads a free CC0 / open-source GLTF or GLB 3D model from a local or remote URL
 */
export function loadGLTFModel(
  url: string,
  onSuccess: (group: THREE.Group) => void,
  onError?: (err: any) => void
): void {
  gltfLoader.load(
    url,
    (gltf) => {
      const model = gltf.scene;
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      onSuccess(model);
    },
    undefined,
    (error) => {
      if (onError) onError(error);
    }
  );
}

// ============================================================================
// DYNAMIC PROCEDURAL SCREEN TEXTURE GENERATORS
// ============================================================================

/**
 * Generates an OLED screen canvas texture for router & server diagnostics
 */
export function createOledCanvasTexture(title: string, ip: string, statusText: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Deep OLED dark gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, '#0d0718');
    grad.addColorStop(1, '#05020a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 128);

    // Subtle OLED scanline grid
    ctx.fillStyle = 'rgba(155, 109, 255, 0.04)';
    for (let y = 0; y < 128; y += 4) {
      ctx.fillRect(0, y, 256, 2);
    }

    // Top status bar
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillText('● WAN 10G', 16, 26);

    ctx.fillStyle = '#10b981';
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText(statusText, 160, 26);

    // Title / Hostname
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.fillText(title, 16, 58);

    // IPv4 Address (Glowing Cyan)
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillText(ip, 16, 88);

    // Bandwidth bar graph
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(16, 104, 224, 8);
    ctx.fillStyle = '#9b6dff';
    ctx.fillRect(16, 104, 168, 8);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Generates an active network console & topology terminal screen texture
 */
export function createMonitorCanvasTexture(hostname: string, ip: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Terminal window background
    ctx.fillStyle = '#140c26';
    ctx.fillRect(0, 0, 512, 320);

    // Window Header Bar
    ctx.fillStyle = '#22163b';
    ctx.fillRect(0, 0, 512, 36);

    // Window controls (Mac/Clay style red, yellow, green dots)
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(20, 18, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(38, 18, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(56, 18, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#a78bfa';
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText(`NetPlan OS v1.0 • ${hostname} (${ip})`, 80, 22);

    // CLI Content
    ctx.font = '15px "Courier New", monospace';
    ctx.fillStyle = '#9b6dff';
    ctx.fillText('admin@netplan:~$ ping -c 3 192.168.1.1', 24, 70);

    ctx.fillStyle = '#34d399';
    ctx.fillText('64 bytes from 192.168.1.1: icmp_seq=1 ttl=64 time=0.34ms', 24, 98);
    ctx.fillText('64 bytes from 192.168.1.1: icmp_seq=2 ttl=64 time=0.29ms', 24, 122);
    ctx.fillText('64 bytes from 192.168.1.1: icmp_seq=3 ttl=64 time=0.31ms', 24, 146);

    // Route Table & Topology Status
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('--- [ACTIVE SUBNET ROUTING & CAPACITY] ---', 24, 184);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText('192.168.1.0/24  gw 192.168.1.1   eth0 [CORE VLAN 1]', 24, 210);
    ctx.fillText('192.168.10.0/24 gw 192.168.1.2   eth1 [DATACENTER]', 24, 232);
    ctx.fillText('192.168.20.0/24 gw 192.168.1.2   eth2 [OFFICE LAN]', 24, 254);

    // Throughput ASCII Graph
    ctx.fillStyle = '#818cf8';
    ctx.fillText('TRAFFIC:  ▂▃▅▆▇██▇▆▅▃▂  1.24 Gbps TX / 8.4 Gbps RX', 24, 292);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Creates precision sheet-metal hardware chassis geometry with crisp chamfered edges
 */
export function createRoundedBoxGeometry(
  width: number,
  height: number,
  depth: number,
  radius: number = 0.025,
  smoothness: number = 3
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const eps = 0.00001;
  // Limit radius to max 0.035 to guarantee crisp sheet-metal engineering edges
  const rad = Math.min(radius, 0.035, width / 2 - eps, height / 2 - eps);

  shape.absarc(-width / 2 + rad, -height / 2 + rad, rad, Math.PI, 1.5 * Math.PI, false);
  shape.absarc(width / 2 - rad, -height / 2 + rad, rad, 1.5 * Math.PI, 2 * Math.PI, false);
  shape.absarc(width / 2 - rad, height / 2 - rad, rad, 0, 0.5 * Math.PI, false);
  shape.absarc(-width / 2 + rad, height / 2 - rad, rad, 0.5 * Math.PI, Math.PI, false);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: depth - rad * 2,
    bevelEnabled: true,
    bevelSegments: smoothness,
    steps: 1,
    bevelSize: rad,
    bevelThickness: rad,
    curveSegments: smoothness,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();
  return geometry;
}

// ============================================================================
// HIGH-FIDELITY 3D DEVICE MODELS
// ============================================================================

/**
 * Model A: Enterprise Border Gateway & Core Router
 * Sculpted chassis, heat sink ridges, 4 articulated antennas, OLED display, 8 RJ45 ports, 2 SFP+ 10G cages
 */
export function createRouterModel(deviceData: NetworkDeviceData): THREE.Group {
  const group = new THREE.Group();
  group.name = `device_${deviceData.id}`;
  group.userData = { ...deviceData };

  // Main Chassis (Crisp Stamped Titanium/Steel Body)
  const chassisGeo = createRoundedBoxGeometry(2.6, 0.58, 2.0, 0.025, 4);
  const chassisMesh = new THREE.Mesh(chassisGeo, chassisMaterial);
  chassisMesh.castShadow = true;
  chassisMesh.receiveShadow = true;
  group.add(chassisMesh);

  // Top Chamfered Accent Inset with Honeycomb Vent Inset
  const topPlateGeo = createRoundedBoxGeometry(2.3, 0.07, 1.7, 0.02, 3);
  const topPlate = new THREE.Mesh(topPlateGeo, chassisAccentMaterial);
  topPlate.position.y = 0.31;
  group.add(topPlate);

  // Top Cooling Vents (Recessed Grooves)
  const ventMat = darkFaceplateMaterial;
  for (let v = -0.5; v <= 0.5; v += 0.25) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.03, 0.08), ventMat);
    vent.position.set(0, 0.35, v);
    group.add(vent);
  }

  // Front Dark Bezel / Faceplate
  const faceplateGeo = new THREE.BoxGeometry(2.4, 0.42, 0.06);
  const faceplate = new THREE.Mesh(faceplateGeo, darkFaceplateMaterial);
  faceplate.position.set(0, 0, 1.01);
  group.add(faceplate);

  // Recessed Front OLED Diagnostic Display
  const oledTexture = createOledCanvasTexture('EDGE-GATEWAY-01', deviceData.ip, 'UP 99.98%');
  const oledMat = new THREE.MeshBasicMaterial({ map: oledTexture });
  const oledMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.32), oledMat);
  oledMesh.position.set(-0.76, 0.02, 1.05);
  group.add(oledMesh);

  // 8 RJ-45 Gigabit Ethernet Ports with Metallic Cavities & Gold Pins
  const portGeo = new THREE.BoxGeometry(0.14, 0.12, 0.06);
  const pinGeo = new THREE.BoxGeometry(0.09, 0.03, 0.02);
  const portStartX = -0.15;
  for (let i = 0; i < 8; i++) {
    const posX = portStartX + (i % 4) * 0.2;
    const posY = i < 4 ? 0.07 : -0.07;

    const port = new THREE.Mesh(portGeo, portCavityMaterial);
    port.position.set(posX, posY, 1.04);
    group.add(port);

    const pin = new THREE.Mesh(pinGeo, metalPortMaterial);
    pin.position.set(posX, posY - 0.03, 1.06);
    group.add(pin);
  }

  // 2 SFP+ 10G Optical Uplink Cages with Release Latches
  [0.82, 1.02].forEach((xPos) => {
    const sfp = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.08), chromeMetalMaterial);
    sfp.position.set(xPos, 0, 1.04);
    group.add(sfp);

    const latch = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.04), sfpOpticMaterial);
    latch.position.set(xPos, -0.05, 1.08);
    group.add(latch);
  });

  // Micro LED Status Lights Array (PWR, SYS, WAN, VPN, SEC)
  const ledGeo = new THREE.SphereGeometry(0.035, 10, 10);
  const leds: THREE.Mesh[] = [];
  const ledColors = [ledActiveGreen, ledActiveGreen, ledCyan, ledAmber, ledActivePurple];
  for (let i = 0; i < ledColors.length; i++) {
    const ledMesh = new THREE.Mesh(ledGeo, ledColors[i]);
    ledMesh.position.set(0.68 + i * 0.1, 0.14, 1.05);
    group.add(ledMesh);
    leds.push(ledMesh);
  }

  // 4 Articulated High-Gain Dual-Hinge Antennas (2 Rear + 2 Angled Sides)
  const antBaseGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.2, 12);
  const antJointGeo = new THREE.SphereGeometry(0.07, 10, 10);
  const antMastGeo = new THREE.CylinderGeometry(0.03, 0.045, 1.35, 12);

  const antennaConfigs = [
    { x: -0.9, z: -0.95, rotZ: 0.22, rotX: -0.2 },
    { x: 0.9, z: -0.95, rotZ: -0.22, rotX: -0.2 },
    { x: -1.25, z: 0.1, rotZ: 0.55, rotX: 0.05 },
    { x: 1.25, z: 0.1, rotZ: -0.55, rotX: 0.05 },
  ];

  antennaConfigs.forEach((cfg) => {
    const base = new THREE.Mesh(antBaseGeo, darkFaceplateMaterial);
    base.position.set(cfg.x, 0.22, cfg.z);
    group.add(base);

    const goldRing = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.04, 12), metalPortMaterial);
    goldRing.position.set(cfg.x, 0.32, cfg.z);
    group.add(goldRing);

    const joint = new THREE.Mesh(antJointGeo, chassisAccentMaterial);
    joint.position.set(cfg.x, 0.38, cfg.z);
    group.add(joint);

    const mast = new THREE.Mesh(antMastGeo, chassisAccentMaterial);
    mast.position.set(cfg.x + cfg.rotZ * 0.6, 0.98, cfg.z + cfg.rotX * 0.5);
    mast.rotation.z = cfg.rotZ;
    mast.rotation.x = cfg.rotX;
    group.add(mast);
  });

  // 4 Rubber Anti-Slip Feet on Underside
  const footGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.06, 12);
  [
    [-1.0, -0.75],
    [1.0, -0.75],
    [-1.0, 0.75],
    [1.0, 0.75],
  ].forEach(([fx, fz]) => {
    const foot = new THREE.Mesh(footGeo, rubberFootMaterial);
    foot.position.set(fx, -0.29, fz);
    group.add(foot);
  });

  group.userData.leds = leds;
  return group;
}

/**
 * Model B: Core Network Switch
 * Sleek 1U rack-mount form factor, rack ears with chrome screws, 24 Gigabit ports, 4 SFP28 cages, and Console port
 */
export function createSwitchModel(deviceData: NetworkDeviceData): THREE.Group {
  const group = new THREE.Group();
  group.name = `device_${deviceData.id}`;
  group.userData = { ...deviceData };

  // Main 1U Switch Chassis (Crisp 19-inch Sheet Metal Enclosure)
  const chassisGeo = createRoundedBoxGeometry(3.3, 0.44, 1.8, 0.02, 3);
  const chassisMesh = new THREE.Mesh(chassisGeo, chassisMaterial);
  chassisMesh.castShadow = true;
  chassisMesh.receiveShadow = true;
  group.add(chassisMesh);

  // Rack Mount Ears with Mounting Screw Holes
  const earGeo = new THREE.BoxGeometry(0.14, 0.52, 0.45);
  const screwGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.04, 8);
  screwGeo.rotateZ(Math.PI / 2);

  [-1.72, 1.72].forEach((x) => {
    const ear = new THREE.Mesh(earGeo, chassisAccentMaterial);
    ear.position.set(x, 0, 0.65);
    group.add(ear);

    // Chrome rack mounting screws
    [-0.14, 0.14].forEach((sy) => {
      const screw = new THREE.Mesh(screwGeo, chromeMetalMaterial);
      screw.position.set(x + (x > 0 ? 0.06 : -0.06), sy, 0.65);
      group.add(screw);
    });
  });

  // Dark Brushed Front Faceplate
  const faceplateGeo = new THREE.BoxGeometry(3.15, 0.34, 0.05);
  const faceplate = new THREE.Mesh(faceplateGeo, darkFaceplateMaterial);
  faceplate.position.set(0, 0, 0.91);
  group.add(faceplate);

  // Dynamic Diagnostic OLED Screen on Left (Matching Model 1 Enterprise Identity)
  const oledTex = createOledCanvasTexture(deviceData.name, deviceData.ip, 'VLAN 10/20/30 UP');
  const oledGeo = new THREE.PlaneGeometry(0.72, 0.26);
  const oledMat = new THREE.MeshBasicMaterial({ map: oledTex });
  const oledScreen = new THREE.Mesh(oledGeo, oledMat);
  oledScreen.position.set(-1.05, 0, 0.94);
  group.add(oledScreen);

  // High-Density Ports (2 rows of 8)
  const portGeo = new THREE.BoxGeometry(0.12, 0.09, 0.05);
  const leds: THREE.Mesh[] = [];
  const ledGeo = new THREE.SphereGeometry(0.022, 8, 8);

  const startX = -0.52;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 8; col++) {
      const posX = startX + col * 0.17;
      const posY = row === 0 ? 0.06 : -0.06;

      const port = new THREE.Mesh(portGeo, portCavityMaterial);
      port.position.set(posX, posY, 0.94);
      group.add(port);

      // Gold pins inside port
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), metalPortMaterial);
      pin.position.set(posX, posY - 0.02, 0.95);
      group.add(pin);

      // Status LED right above each top port
      if (row === 0) {
        const led = new THREE.Mesh(
          ledGeo,
          col % 4 === 0 ? ledActivePurple : col % 2 === 0 ? ledActiveGreen : ledCyan
        );
        led.position.set(posX, 0.13, 0.94);
        group.add(led);
        leds.push(led);
      }
    }
  }


  // 4 SFP28 25G/100G Optical Uplink Cages on Right
  [-0.06, 0.06].forEach((offsetY) => {
    [1.1, 1.3].forEach((xPos) => {
      const sfp = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.09, 0.06), chromeMetalMaterial);
      sfp.position.set(xPos, offsetY, 0.94);
      group.add(sfp);

      const opticalPlug = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.04, 0.03), sfpOpticMaterial);
      opticalPlug.position.set(xPos, offsetY, 0.97);
      group.add(opticalPlug);
    });
  });

  group.userData.leds = leds;
  return group;
}

/**
 * Model C: Enterprise Datacenter Server
 * Robust 4U rack server, honeycomb mesh bezel, 6 hot-swap drive caddies with activity LEDs, power control module, and dual redundant PSUs
 */
export function createServerModel(deviceData: NetworkDeviceData): THREE.Group {
  const group = new THREE.Group();
  group.name = `device_${deviceData.id}`;
  group.userData = { ...deviceData };

  // Tall Server Chassis with Precision Machined Sheet Metal Chamfer
  const chassisGeo = createRoundedBoxGeometry(1.8, 2.2, 1.8, 0.025, 3);
  const chassisMesh = new THREE.Mesh(chassisGeo, chassisMaterial);
  chassisMesh.castShadow = true;
  chassisMesh.receiveShadow = true;
  group.add(chassisMesh);

  // Front Honeycomb Mesh Ventilation Bezel Panel
  const frontGeo = new THREE.BoxGeometry(1.65, 2.05, 0.06);
  const front = new THREE.Mesh(frontGeo, honeycombVentMaterial);
  front.position.set(0, 0, 0.91);
  group.add(front);

  // 6 Hot-Swap Enterprise Drive Caddies with Articulated Latch Levers
  const caddyGeo = new THREE.BoxGeometry(1.5, 0.24, 0.06);
  const latchGeo = new THREE.BoxGeometry(0.35, 0.16, 0.04);
  const leds: THREE.Mesh[] = [];
  const ledGeo = new THREE.SphereGeometry(0.028, 8, 8);

  for (let i = 0; i < 6; i++) {
    const bayY = 0.72 - i * 0.29;

    const caddy = new THREE.Mesh(caddyGeo, chassisAccentMaterial);
    caddy.position.set(0, bayY, 0.94);
    group.add(caddy);

    // Release latch handle
    const latch = new THREE.Mesh(latchGeo, chromeMetalMaterial);
    latch.position.set(0.5, bayY, 0.97);
    group.add(latch);

    // Dual activity & fault micro-LEDs (Green + Cyan)
    const ledActive = new THREE.Mesh(ledGeo, i === 5 ? ledAmber : ledActiveGreen);
    ledActive.position.set(-0.62, bayY, 0.97);
    group.add(ledActive);
    leds.push(ledActive);

    const ledId = new THREE.Mesh(ledGeo, ledCyan);
    ledId.position.set(-0.52, bayY, 0.97);
    group.add(ledId);
    leds.push(ledId);

    // Drive ventilation slots
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.03, 0.02), portCavityMaterial);
    vent.position.set(-0.05, bayY, 0.97);
    group.add(vent);
  }

  // Top Diagnostic Control Module (Power Button & Health Status)
  const powerBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16), ledActiveGreen);
  powerBtn.rotation.x = Math.PI / 2;
  powerBtn.position.set(0.6, 0.95, 0.94);
  group.add(powerBtn);

  // Mini OLED Server Diagnostic Screen
  const oledTex = createOledCanvasTexture(deviceData.name.toUpperCase(), deviceData.ip, 'CPU: 18%');
  const oledMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.22), new THREE.MeshBasicMaterial({ map: oledTex }));
  oledMesh.position.set(-0.25, 0.95, 0.95);
  group.add(oledMesh);

  // Rear Redundant Dual Power Supplies with Pull Handles
  [-0.45, 0.45].forEach((psuX) => {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 8, 16), chromeMetalMaterial);
    handle.position.set(psuX, -0.75, -0.92);
    group.add(handle);

    const psuLed = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), ledActiveGreen);
    psuLed.position.set(psuX + 0.15, -0.75, -0.92);
    group.add(psuLed);
  });

  group.userData.leds = leds;
  return group;
}

/**
 * Model D: Engineering Workstation Endpoint
 * Ultrawide panoramic display with live network topology dashboard, sculpted stand, mechanical keyboard, ergonomic mouse, and compact tower
 */
export function createWorkstationModel(deviceData: NetworkDeviceData): THREE.Group {
  const group = new THREE.Group();
  group.name = `device_${deviceData.id}`;
  group.userData = { ...deviceData };

  // Ultrawide 21:9 Curved Panoramic Display Housing (Slim Frameless Bezel)
  const screenHousingGeo = createRoundedBoxGeometry(2.2, 1.25, 0.08, 0.015, 3);
  const screenHousing = new THREE.Mesh(screenHousingGeo, chassisMaterial);
  screenHousing.position.set(0, 0.85, 0);
  screenHousing.castShadow = true;
  group.add(screenHousing);

  // Active Screen Surface with Dynamic Network Terminal Canvas Texture
  const screenTexture = createMonitorCanvasTexture(deviceData.name, deviceData.ip);
  const screenMat = new THREE.MeshStandardMaterial({
    map: screenTexture,
    roughness: 0.25,
    metalness: 0.1,
    emissive: new THREE.Color(0x9b6dff),
    emissiveIntensity: 0.45,
  });
  const screenSurfaceGeo = new THREE.PlaneGeometry(2.08, 1.12);
  const screen = new THREE.Mesh(screenSurfaceGeo, screenMat);
  screen.position.set(0, 0.85, 0.065);
  group.add(screen);

  // Display Stand Neck (Brushed Aluminum Cylinder with Cable Pass-through)
  const standStemGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.65, 16);
  const stem = new THREE.Mesh(standStemGeo, chromeMetalMaterial);
  stem.position.set(0, 0.35, -0.06);
  group.add(stem);

  // Display Stand Heavy Cast Base
  const standFootGeo = createRoundedBoxGeometry(0.7, 0.04, 0.55, 0.04, 4);
  const foot = new THREE.Mesh(standFootGeo, chassisAccentMaterial);
  foot.position.set(0, 0.02, 0.06);
  foot.receiveShadow = true;
  group.add(foot);

  // Extended Desk Pad
  const deskPadGeo = createRoundedBoxGeometry(2.4, 0.02, 1.1, 0.05, 3);
  const deskPad = new THREE.Mesh(deskPadGeo, darkFaceplateMaterial);
  deskPad.position.set(0, 0.01, 0.65);
  deskPad.receiveShadow = true;
  group.add(deskPad);

  // Low-Profile Mechanical Keyboard with Keycaps
  const kbGeo = createRoundedBoxGeometry(1.2, 0.035, 0.42, 0.03, 3);
  const kb = new THREE.Mesh(kbGeo, chassisMaterial);
  kb.position.set(-0.25, 0.03, 0.68);
  kb.rotation.x = 0.06;
  group.add(kb);

  // Keycap Row Detail
  const keysRowMat = chassisAccentMaterial;
  for (let r = 0; r < 4; r++) {
    const keyRow = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.015, 0.07), keysRowMat);
    keyRow.position.set(-0.25, 0.05, 0.56 + r * 0.09);
    keyRow.rotation.x = 0.06;
    group.add(keyRow);
  }

  // Ergonomic Optical Mouse with Illuminated Wheel
  const mouseGeo = createRoundedBoxGeometry(0.2, 0.07, 0.32, 0.06, 4);
  const mouse = new THREE.Mesh(mouseGeo, chassisMaterial);
  mouse.position.set(0.68, 0.04, 0.72);
  group.add(mouse);

  const mouseWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 8), ledActivePurple);
  mouseWheel.rotation.z = Math.PI / 2;
  mouseWheel.position.set(0.68, 0.075, 0.63);
  group.add(mouseWheel);

  // Workstation Tower (Precision Anodized ITX Enclosure Beside the Monitor)
  const towerGeo = createRoundedBoxGeometry(0.6, 1.1, 1.1, 0.02, 3);
  const tower = new THREE.Mesh(towerGeo, chassisMaterial);
  tower.position.set(1.65, 0.55, 0.2);
  tower.castShadow = true;
  group.add(tower);

  // Tower Tempered Glass Window with Glowing Internal Cooler Ring
  const windowGeo = new THREE.PlaneGeometry(0.9, 0.9);
  const windowMesh = new THREE.Mesh(windowGeo, translucentGlassMaterial);
  windowMesh.rotation.y = -Math.PI / 2;
  windowMesh.position.set(1.34, 0.55, 0.2);
  group.add(windowMesh);

  const coolerRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 10, 24), ledActivePurple);
  coolerRing.rotation.y = Math.PI / 2;
  coolerRing.position.set(1.5, 0.65, 0.2);
  group.add(coolerRing);

  group.userData.screen = screen;
  group.userData.screenMat = screenMat;
  group.userData.leds = [mouseWheel, coolerRing];
  return group;
}

/**
 * Model E: Enterprise Wi-Fi 6E/7 Wireless Access Point
 * Aerodynamically sculpted dome, 360° glowing Fresnel halo ring, and concealed ceiling mount
 */
export function createAccessPointModel(deviceData: NetworkDeviceData): THREE.Group {
  const group = new THREE.Group();
  group.name = `device_${deviceData.id}`;
  group.userData = { ...deviceData };

  // Sleek Monolithic Chalk White Saucer (No dark concentric rings or reticles)
  const saucerGeo = new THREE.CylinderGeometry(0.85, 0.75, 0.18, 32);
  const saucer = new THREE.Mesh(saucerGeo, applianceWhiteMaterial);
  saucer.castShadow = true;
  saucer.receiveShadow = true;
  group.add(saucer);

  // Subtle curved upper crown
  const domeGeo = new THREE.SphereGeometry(0.82, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.28);
  const dome = new THREE.Mesh(domeGeo, applianceWhiteMaterial);
  dome.position.y = 0.06;
  group.add(dome);

  // Single micro-LED status dot (soft cyan power status, no target rings)
  const statusLed = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), ledCyan);
  statusLed.position.set(0, 0.16, 0.25);
  group.add(statusLed);

  group.userData.leds = [statusLed];
  return group;
}

/**
 * Model F: Enterprise Network Multi-Function Laser Printer
 * Dual-tier paper drawers, interactive color LCD touchscreen, document feeder, and output catch bin
 */
export function createPrinterModel(deviceData: NetworkDeviceData): THREE.Group {
  const group = new THREE.Group();
  group.name = `device_${deviceData.id}`;
  group.userData = { ...deviceData };

  // Main Printer Lower Base & Paper Cassette Drawers
  const baseGeo = createRoundedBoxGeometry(1.6, 0.8, 1.4, 0.025, 3);
  const base = new THREE.Mesh(baseGeo, applianceWhiteMaterial);
  base.position.set(0, 0.4, 0);
  base.castShadow = true;
  group.add(base);

  // Dual Paper Cassettes with Chrome Grip Handles
  [-0.12, 0.12].forEach((offsetY) => {
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.04), chromeMetalMaterial);
    handle.position.set(0, 0.4 + offsetY, 0.72);
    group.add(handle);
  });

  // Center Recessed Output Paper Catch Bin
  const binGeo = new THREE.BoxGeometry(1.3, 0.22, 1.0);
  const bin = new THREE.Mesh(binGeo, darkFaceplateMaterial);
  bin.position.set(0, 0.88, 0.1);
  group.add(bin);

  // Printed Network Report Page Resting on Output Tray
  const pageGeo = new THREE.PlaneGeometry(0.7, 0.95);
  const pageMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
  const page = new THREE.Mesh(pageGeo, pageMat);
  page.rotation.x = -Math.PI / 2;
  page.position.set(0, 0.98, 0.1);
  group.add(page);

  // Top Automatic Document Feeder & Scanner Lid
  const topFeederGeo = createRoundedBoxGeometry(1.5, 0.35, 1.3, 0.02, 3);
  const topFeeder = new THREE.Mesh(topFeederGeo, applianceWhiteMaterial);
  topFeeder.position.set(0, 1.25, 0);
  topFeeder.castShadow = true;
  group.add(topFeeder);

  // Angled Color LCD Touchscreen Control Panel
  const panelStand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8), chromeMetalMaterial);
  panelStand.position.set(0.65, 1.05, 0.65);
  group.add(panelStand);

  const screenGeo = createRoundedBoxGeometry(0.48, 0.32, 0.04, 0.02, 3);
  const screenHousing = new THREE.Mesh(screenGeo, darkFaceplateMaterial);
  screenHousing.position.set(0.65, 1.18, 0.72);
  screenHousing.rotation.x = -0.35;
  group.add(screenHousing);

  const oledTex = createOledCanvasTexture('PRINTER 01', deviceData.ip, 'READY');
  const screenSurface = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.26),
    new THREE.MeshBasicMaterial({ map: oledTex })
  );
  screenSurface.position.set(0.65, 1.18, 0.745);
  screenSurface.rotation.x = -0.35;
  group.add(screenSurface);

  // Status LED (Green)
  const statusLed = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), ledActiveGreen);
  statusLed.position.set(0.45, 1.18, 0.75);
  group.add(statusLed);

  group.userData.leds = [statusLed];
  return group;
}

/**
 * Factory dispatch to build the correct model for any network device
 */
export function createDevice3DModel(device: NetworkDeviceData): THREE.Group {
  let model: THREE.Group;
  switch (device.type) {
    case 'router':
      model = createRouterModel(device);
      break;
    case 'switch':
      model = createSwitchModel(device);
      break;
    case 'server':
      model = createServerModel(device);
      break;
    case 'workstation':
      model = createWorkstationModel(device);
      break;
    case 'access_point':
      model = createAccessPointModel(device);
      break;
    case 'printer':
      model = createPrinterModel(device);
      break;
    default:
      model = createWorkstationModel(device);
      break;
  }

  model.position.set(...device.position);
  return model;
}

// ============================================================================
// ANIMATED OPTICAL CONNECTION SPLINES & COMET PULSES
// ============================================================================

/**
 * Creates an animated 3D cable spline connecting two device endpoints with RJ-45 boots & comet particles
 */
export function createConnectionSpline(
  startPos: THREE.Vector3,
  endPos: THREE.Vector3,
  cableColor: number = 0x9b6dff,
  arcHeight: number = 0.75
): {
  curve: THREE.CatmullRomCurve3;
  mesh: THREE.Mesh;
  particles: { mesh: THREE.Mesh; progress: number; speed: number }[];
} {
  // Compute midpoint with natural vertical catenary arch
  const midX = (startPos.x + endPos.x) / 2;
  const midY = Math.max(startPos.y, endPos.y) + arcHeight;
  const midZ = (startPos.z + endPos.z) / 2;
  const midPos = new THREE.Vector3(midX, midY, midZ);

  const curve = new THREE.CatmullRomCurve3([startPos, midPos, endPos]);

  // Cable tube with physical silicone sheen
  const tubeGeo = new THREE.TubeGeometry(curve, 48, 0.04, 10, false);
  const tubeMat = new THREE.MeshPhysicalMaterial({
    color: cableColor,
    roughness: 0.25,
    metalness: 0.15,
    clearcoat: 0.4,
    transparent: true,
    opacity: 0.9,
  });
  const mesh = new THREE.Mesh(tubeGeo, tubeMat);

  // Molded RJ-45 Rubber Strain-Relief Boots at Cable Endpoints
  const bootGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.22, 10);
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x1f1435, roughness: 0.6 });

  const bootStart = new THREE.Mesh(bootGeo, bootMat);
  bootStart.position.copy(startPos);
  mesh.add(bootStart);

  const bootEnd = new THREE.Mesh(bootGeo, bootMat);
  bootEnd.position.copy(endPos);
  mesh.add(bootEnd);

  // Traveling Comet Packet Pulses (Head + Trailing Tail)
  const particles: { mesh: THREE.Mesh; progress: number; speed: number }[] = [];
  const headGeo = new THREE.SphereGeometry(0.09, 12, 12);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: cableColor,
    emissiveIntensity: 3.2,
    roughness: 0.1,
  });

  const tailGeo = new THREE.CylinderGeometry(0.02, 0.08, 0.35, 8);
  tailGeo.rotateX(Math.PI / 2);
  const tailMat = new THREE.MeshStandardMaterial({
    color: cableColor,
    emissive: cableColor,
    emissiveIntensity: 1.8,
    transparent: true,
    opacity: 0.6,
  });

  [0.0, 0.5].forEach((initialProgress) => {
    const pGroup = new THREE.Group();
    const head = new THREE.Mesh(headGeo, headMat);
    pGroup.add(head);

    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.z = -0.2;
    pGroup.add(tail);

    const initPoint = curve.getPointAt(initialProgress);
    pGroup.position.copy(initPoint);

    particles.push({
      mesh: pGroup as unknown as THREE.Mesh,
      progress: initialProgress,
      speed: 0.0038 + Math.random() * 0.002,
    });
  });

  return { curve, mesh, particles };
}

// ============================================================================
// SUBNET ZONE BOUNDARY MATS
// ============================================================================

/**
 * Creates a translucent Claymorphic Subnet Zone boundary on the floor
 */
export function createSubnetZoneMesh(zone: SubnetZoneData): THREE.Group {
  const group = new THREE.Group();
  group.position.set(zone.center[0], 0.02, zone.center[2]);

  // Soft translucent floor plane
  const [width, height] = zone.size;
  const planeGeo = createRoundedBoxGeometry(width, 0.04, height, 0.45, 5);
  const planeMat = new THREE.MeshPhysicalMaterial({
    color: zone.color,
    transparent: true,
    opacity: 0.14,
    roughness: 0.25,
    metalness: 0.05,
    clearcoat: 0.5,
  });
  const plane = new THREE.Mesh(planeGeo, planeMat);
  plane.receiveShadow = true;
  group.add(plane);

  // Outer border ring line
  const edgeGeo = new THREE.EdgesGeometry(planeGeo);
  const edgeMat = new THREE.LineBasicMaterial({
    color: zone.color,
    transparent: true,
    opacity: 0.55,
    linewidth: 2,
  });
  const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
  group.add(edgeLine);

  group.userData.planeMat = planeMat;
  group.userData.edgeMat = edgeMat;
  group.userData.zone = zone;

  return group;
}

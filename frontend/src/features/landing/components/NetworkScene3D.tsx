import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  NetworkDeviceData,
  SubnetZoneData,
  createDevice3DModel,
  createConnectionSpline,
  createSubnetZoneMesh,
} from '../models/NetworkModels';
import { NetworkSceneFallback } from './NetworkSceneFallback';

export interface NetworkScene3DProps {
  onSelectDevice?: (device: NetworkDeviceData | null) => void;
  selectedDeviceId?: string | null;
  scrollProgress?: number; // 0.0 to 1.0
}

// Production network dataset representing realistic multi-tier topology
const initialDevices: NetworkDeviceData[] = [
  {
    id: 'edge-router-01',
    name: 'edge-router-01',
    type: 'router',
    role: 'Border Gateway & Firewall',
    ip: '192.168.1.1',
    subnet: '192.168.1.0/24',
    status: 'active',
    position: [0, 0.35, -1.6],
  },
  {
    id: 'sw-core-01',
    name: 'sw-core-01',
    type: 'switch',
    role: 'VLAN Core Distribution Switch',
    ip: '192.168.1.2',
    subnet: '192.168.1.0/24',
    status: 'active',
    position: [0, 0.25, 0.9],
  },
  {
    id: 'srv-dc-01',
    name: 'srv-dc-01',
    type: 'server',
    role: 'Primary Domain Controller & DNS',
    ip: '192.168.10.10',
    subnet: '192.168.10.0/24',
    status: 'active',
    position: [-3.8, 0.9, -0.4],
  },
  {
    id: 'srv-app-02',
    name: 'srv-app-02',
    type: 'server',
    role: 'Enterprise Application Host',
    ip: '192.168.10.20',
    subnet: '192.168.10.0/24',
    status: 'active',
    position: [-3.8, 0.9, 1.8],
  },
  {
    id: 'ws-finance-01',
    name: 'ws-finance-01',
    type: 'workstation',
    role: 'Finance Specialist Workstation',
    ip: '192.168.20.15',
    subnet: '192.168.20.0/24',
    status: 'active',
    position: [3.6, 0.15, 0.2],
  },
  {
    id: 'ws-eng-04',
    name: 'ws-eng-04',
    type: 'workstation',
    role: 'Network Engineering Terminal',
    ip: '192.168.20.24',
    subnet: '192.168.20.0/24',
    status: 'active',
    position: [3.6, 0.15, 2.2],
  },
  {
    id: 'ap-campus-01',
    name: 'ap-campus-01',
    type: 'access_point',
    role: 'Campus Wi-Fi 6 Access Point',
    ip: '192.168.30.5',
    subnet: '192.168.30.0/24',
    status: 'active',
    position: [0, 0.15, 3.2],
  },
  {
    id: 'prn-dept-01',
    name: 'prn-dept-01',
    type: 'printer',
    role: 'Department Multi-Function Laser',
    ip: '192.168.20.50',
    subnet: '192.168.20.0/24',
    status: 'active',
    position: [5.1, 0.4, 1.2],
  },
];

const subnetZones: SubnetZoneData[] = [
  {
    id: 'zone-mgmt',
    name: 'Management & Backbone',
    cidr: '192.168.1.0/24',
    color: 0x9b6dff,
    center: [0, 0, -0.4],
    size: [3.4, 4.4],
  },
  {
    id: 'zone-servers',
    name: 'Datacenter Services',
    cidr: '192.168.10.0/24',
    color: 0x7c5cbf,
    center: [-3.8, 0, 0.7],
    size: [2.8, 4.2],
  },
  {
    id: 'zone-lan',
    name: 'Corporate Campus LAN',
    cidr: '192.168.20.0/24',
    color: 0x5ec4a0,
    center: [4.3, 0, 1.2],
    size: [3.8, 4.0],
  },
  {
    id: 'zone-wifi',
    name: 'Campus Wireless',
    cidr: '192.168.30.0/24',
    color: 0x06b6d4,
    center: [0, 0, 3.2],
    size: [2.6, 2.2],
  },
];

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

// Linear interpolation helper
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

export const NetworkScene3D: React.FC<NetworkScene3DProps> = ({
  onSelectDevice,
  selectedDeviceId: _selectedDeviceId,
  scrollProgress = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGLAvailable, setWebGLAvailable] = useState<boolean>(true);
  const [hoveredDevice, setHoveredDevice] = useState<NetworkDeviceData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const targetCameraPosRef = useRef(new THREE.Vector3(0, 2.8, 2.6));
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0.4, -1.6));
  const dynamicStateRef = useRef({
    serverHighlight: 0,
    lanHighlight: 0,
    conflictVal: 0,
    speedMul: 1.0,
  });

  // Calculate target camera & visual state from scrollProgress (0.0 to 1.0)
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const isSmallMobile = window.innerWidth < 480;

    const p = Math.max(0, Math.min(1, scrollProgress));

    // 7 Key Camera Waypoints across the scroll progress
    const waypoints = [
      // 0.00: Scene 1 Entrance (Approach Border Gateway)
      {
        p: 0.0,
        pos: [0, isSmallMobile ? 3.8 : isMobile ? 3.2 : 2.8, isSmallMobile ? 4.0 : isMobile ? 3.2 : 2.6],
        look: [0, isSmallMobile ? 0.8 : 0.4, -1.6],
        serverHighlight: 0,
        lanHighlight: 0,
        conflictVal: 0,
        speedMul: 1.0,
      },
      // 0.18: Scene 1 Close-up (Gateway Core Focus, LEDs & Uplinks)
      {
        p: 0.18,
        pos: [0, isSmallMobile ? 2.6 : isMobile ? 2.2 : 1.85, isSmallMobile ? 2.2 : isMobile ? 1.6 : 1.15],
        look: [0, isSmallMobile ? 0.7 : 0.4, -1.6],
        serverHighlight: 0,
        lanHighlight: 0,
        conflictVal: 0,
        speedMul: 1.0,
      },
      // 0.38: Scene 2 (Subnet Boundaries / Datacenter Servers)
      {
        p: 0.38,
        pos: [isSmallMobile ? -2.2 : -1.6, isSmallMobile ? 3.6 : 2.6, isSmallMobile ? 5.2 : 3.6],
        look: [-3.8, isSmallMobile ? 1.3 : 0.9, 0.7],
        serverHighlight: 1,
        lanHighlight: 0,
        conflictVal: 0,
        speedMul: 1.0,
      },
      // 0.60: Scene 3 (Topology Architecture / Streaming Packets)
      {
        p: 0.60,
        pos: [isSmallMobile ? 6.2 : 5.2, isSmallMobile ? 9.5 : 7.2, isSmallMobile ? 12.0 : 8.2],
        look: [0, isSmallMobile ? 0.8 : 0.35, 0.7],
        serverHighlight: 0,
        lanHighlight: 0,
        conflictVal: 0,
        speedMul: 1.8,
      },
      // 0.75: Scene 4A (Conflict Active - Warning Rose)
      {
        p: 0.75,
        pos: [isSmallMobile ? 2.6 : 2.0, isSmallMobile ? 3.4 : 2.3, isSmallMobile ? 5.0 : 3.4],
        look: [3.6, isSmallMobile ? 0.9 : 0.3, 0.6],
        serverHighlight: 0,
        lanHighlight: 1,
        conflictVal: 1, // Warning
        speedMul: 1.0,
      },
      // 0.85: Scene 4B (Conflict Resolved - Emerald Green)
      {
        p: 0.85,
        pos: [isSmallMobile ? 2.4 : 1.8, isSmallMobile ? 3.6 : 2.4, isSmallMobile ? 5.2 : 3.6],
        look: [3.6, isSmallMobile ? 0.9 : 0.3, 0.6],
        serverHighlight: 0,
        lanHighlight: 1,
        conflictVal: 2, // Resolved
        speedMul: 1.0,
      },
      // 1.00: Scene 5 (Executive Overview & Audit Documentation)
      {
        p: 1.0,
        pos: [0, isSmallMobile ? 13.5 : 9.8, isSmallMobile ? 15.0 : 10.8],
        look: [0, isSmallMobile ? 0.8 : 0.2, 0.6],
        serverHighlight: 0.5,
        lanHighlight: 0.5,
        conflictVal: 0,
        speedMul: 1.2,
      },
    ];

    // Find the two waypoints surrounding p
    let idx = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      if (p >= waypoints[i].p && p <= waypoints[i + 1].p) {
        idx = i;
        break;
      }
    }

    const w1 = waypoints[idx];
    const w2 = waypoints[Math.min(idx + 1, waypoints.length - 1)];
    const segmentSpan = w2.p - w1.p || 0.001;
    const t = Math.max(0, Math.min(1, (p - w1.p) / segmentSpan));

    // Smooth sinusoidal ease
    const smoothT = 0.5 - 0.5 * Math.cos(t * Math.PI);

    targetCameraPosRef.current.set(
      lerp(w1.pos[0], w2.pos[0], smoothT),
      lerp(w1.pos[1], w2.pos[1], smoothT),
      lerp(w1.pos[2], w2.pos[2], smoothT)
    );

    targetLookAtRef.current.set(
      lerp(w1.look[0], w2.look[0], smoothT),
      lerp(w1.look[1], w2.look[1], smoothT),
      lerp(w1.look[2], w2.look[2], smoothT)
    );

    dynamicStateRef.current = {
      serverHighlight: lerp(w1.serverHighlight, w2.serverHighlight, smoothT),
      lanHighlight: lerp(w1.lanHighlight, w2.lanHighlight, smoothT),
      conflictVal: t > 0.5 ? w2.conflictVal : w1.conflictVal,
      speedMul: lerp(w1.speedMul, w2.speedMul, smoothT),
    };
  }, [scrollProgress]);

  useEffect(() => {
    if (!isWebGLAvailable()) {
      setWebGLAvailable(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- Scene, Camera, Renderer ---
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.copy(targetCameraPosRef.current);
    camera.lookAt(targetLookAtRef.current);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebGLAvailable(false);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    container.appendChild(renderer.domElement);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // --- Studio 3-Point Lighting ---
    const ambientLight = new THREE.AmbientLight(0xf4eeff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff8fd, 1.9);
    keyLight.position.set(9, 16, 11);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0006;
    scene.add(keyLight);

    const purpleRimLight = new THREE.PointLight(0x9b6dff, 3.2, 30);
    purpleRimLight.position.set(-9, 6, -7);
    scene.add(purpleRimLight);

    const cyanFillLight = new THREE.PointLight(0x38bdf8, 2.2, 25);
    cyanFillLight.position.set(9, 5, -5);
    scene.add(cyanFillLight);

    // --- Ground Shadow Plane ---
    const shadowPlaneGeo = new THREE.PlaneGeometry(32, 32);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.16 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0;
    shadowPlane.receiveShadow = true;
    worldGroup.add(shadowPlane);

    // --- Device Contact Shadow Discs (Ambient Occlusion Grounding) ---
    const createContactShadowTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(25, 12, 45, 0.45)');
        grad.addColorStop(0.5, 'rgba(25, 12, 45, 0.16)');
        grad.addColorStop(1, 'rgba(25, 12, 45, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.flipY = false;
      tex.premultiplyAlpha = false;
      tex.minFilter = THREE.LinearFilter;
      return tex;
    };
    const contactShadowMat = new THREE.MeshBasicMaterial({
      map: createContactShadowTexture(),
      transparent: true,
      depthWrite: false,
    });

    // --- Subnet Zones ---
    const zoneGroups: Record<string, THREE.Group> = {};
    subnetZones.forEach((zone) => {
      const zoneMesh = createSubnetZoneMesh(zone);
      worldGroup.add(zoneMesh);
      zoneGroups[zone.id] = zoneMesh;
    });

    // --- Device Models & Contact Shadows ---
    const deviceGroups: THREE.Group[] = [];
    const ledsToAnimate: THREE.Mesh[] = [];
    let conflictDeviceGroup: THREE.Group | null = null;

    initialDevices.forEach((dev) => {
      const model = createDevice3DModel(dev);
      worldGroup.add(model);
      deviceGroups.push(model);

      // Contact shadow disc under each device
      const shadowDiscRadius = dev.type === 'switch' ? 1.8 : dev.type === 'server' ? 1.4 : dev.type === 'router' ? 1.5 : 1.2;
      const contactDisc = new THREE.Mesh(
        new THREE.PlaneGeometry(shadowDiscRadius * 2, shadowDiscRadius * 2),
        contactShadowMat
      );
      contactDisc.rotation.x = -Math.PI / 2;
      contactDisc.position.set(dev.position[0], 0.025, dev.position[2]);
      worldGroup.add(contactDisc);

      if (model.userData?.leds) {
        ledsToAnimate.push(...model.userData.leds);
      }

      if (dev.id === 'ws-finance-01') {
        conflictDeviceGroup = model;
      }
    });

    // --- Atmospheric Floating Network Packets ---
    const ambientParticleCount = 45;
    const ambientParticleGeo = new THREE.BufferGeometry();
    const ambientPositions = new Float32Array(ambientParticleCount * 3);
    for (let i = 0; i < ambientParticleCount * 3; i += 3) {
      ambientPositions[i] = (Math.random() - 0.5) * 18;
      ambientPositions[i + 1] = 0.5 + Math.random() * 5.0;
      ambientPositions[i + 2] = (Math.random() - 0.5) * 16;
    }
    ambientParticleGeo.setAttribute('position', new THREE.BufferAttribute(ambientPositions, 3));
    const ambientParticleMat = new THREE.PointsMaterial({
      color: 0x9b6dff,
      size: 0.08,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    const ambientParticles = new THREE.Points(ambientParticleGeo, ambientParticleMat);
    worldGroup.add(ambientParticles);

    // --- Connections & Real-time Packets ---
    const connections = [
      { fromId: 'edge-router-01', toId: 'sw-core-01', color: 0x9b6dff },
      { fromId: 'sw-core-01', toId: 'srv-dc-01', color: 0x7c5cbf },
      { fromId: 'sw-core-01', toId: 'srv-app-02', color: 0x7c5cbf },
      { fromId: 'sw-core-01', toId: 'ws-finance-01', color: 0x5ec4a0 },
      { fromId: 'sw-core-01', toId: 'ws-eng-04', color: 0x5ec4a0 },
      { fromId: 'sw-core-01', toId: 'prn-dept-01', color: 0x5ec4a0 },
      { fromId: 'sw-core-01', toId: 'ap-campus-01', color: 0x06b6d4 },
    ];

    const activeSplines: {
      curve: THREE.CatmullRomCurve3;
      particles: { mesh: THREE.Mesh; progress: number; speed: number }[];
    }[] = [];

    connections.forEach((conn) => {
      const fromDev = initialDevices.find((d) => d.id === conn.fromId);
      const toDev = initialDevices.find((d) => d.id === conn.toId);
      if (!fromDev || !toDev) return;

      const p1 = new THREE.Vector3(...fromDev.position);
      const p2 = new THREE.Vector3(...toDev.position);

      const splineData = createConnectionSpline(p1, p2, conn.color, 0.75);
      worldGroup.add(splineData.mesh);
      splineData.particles.forEach((p) => worldGroup.add(p.mesh));
      activeSplines.push({ curve: splineData.curve, particles: splineData.particles });
    });

    // --- Pointer Interaction & Parallax ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.x = normX;
      mouse.y = normY;

      if (!prefersReducedMotion) {
        targetRotationY = normX * 0.08;
        targetRotationX = normY * 0.05;
      }

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(deviceGroups, true);

      if (intersects.length > 0) {
        let parent: THREE.Object3D | null = intersects[0].object;
        while (parent && !parent.userData?.id && parent !== scene) {
          parent = parent.parent;
        }

        if (parent && parent.userData?.id) {
          const dev = initialDevices.find((d) => d.id === parent?.userData.id);
          if (dev) {
            setHoveredDevice(dev);
            setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            container.style.cursor = 'pointer';
            return;
          }
        }
      }

      setHoveredDevice(null);
      container.style.cursor = 'default';
    };

    const handlePointerClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(deviceGroups, true);

      if (intersects.length > 0) {
        let parent: THREE.Object3D | null = intersects[0].object;
        while (parent && !parent.userData?.id && parent !== scene) {
          parent = parent.parent;
        }

        if (parent && parent.userData?.id) {
          const dev = initialDevices.find((d) => d.id === parent?.userData.id);
          if (dev && onSelectDevice) {
            onSelectDevice(dev);
          }
        }
      }
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('click', handlePointerClick);

    // --- Render Loop (With smooth lerp dampening) ---
    let animId: number;
    const startTime = performance.now() * 0.001;
    const currentCameraPos = camera.position.clone();
    const currentLookAt = new THREE.Vector3(0, 0.4, -1.6);
    const targetWithParallax = new THREE.Vector3();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = performance.now() * 0.001 - startTime;
      const state = dynamicStateRef.current;

      // Pointer Parallax
      let parallaxX = 0;
      let parallaxY = 0;
      if (!prefersReducedMotion) {
        parallaxX = targetRotationY * 0.55;
        parallaxY = targetRotationX * 0.35;
      }

      targetWithParallax.copy(targetCameraPosRef.current);
      targetWithParallax.x += parallaxX;
      targetWithParallax.y += parallaxY;

      // Luxurious smooth lerp camera tracking
      currentCameraPos.lerp(targetWithParallax, 0.08);
      currentLookAt.lerp(targetLookAtRef.current, 0.08);

      camera.position.copy(currentCameraPos);
      camera.lookAt(currentLookAt);

      // Subnet Zone Highlighting
      const srvZone = zoneGroups['zone-servers'];
      if (srvZone && srvZone.userData.planeMat) {
        srvZone.userData.planeMat.opacity = 0.12 + state.serverHighlight * 0.28;
      }

      const lanZone = zoneGroups['zone-lan'];
      if (lanZone && lanZone.userData.planeMat) {
        if (state.conflictVal === 1) {
          lanZone.userData.planeMat.color.setHex(0xe87088);
          lanZone.userData.planeMat.opacity = 0.28 + 0.1 * Math.sin(time * 6);
        } else if (state.conflictVal === 2) {
          lanZone.userData.planeMat.color.setHex(0x10b981);
          lanZone.userData.planeMat.opacity = 0.25;
        } else {
          lanZone.userData.planeMat.color.setHex(0x5ec4a0);
          lanZone.userData.planeMat.opacity = 0.12 + state.lanHighlight * 0.18;
        }
      }

      // Conflict Workstation Shading (ws-finance-01)
      if (conflictDeviceGroup && conflictDeviceGroup.userData.screenMat) {
        const mat = conflictDeviceGroup.userData.screenMat as any;
        if (state.conflictVal === 1) {
          if (mat.color?.setHex) mat.color.setHex(0xe87088);
          if (mat.emissive?.setHex) mat.emissive.setHex(0xe87088);
          if ('emissiveIntensity' in mat) mat.emissiveIntensity = 1.6 + 0.6 * Math.sin(time * 8);
        } else if (state.conflictVal === 2) {
          if (mat.color?.setHex) mat.color.setHex(0x10b981);
          if (mat.emissive?.setHex) mat.emissive.setHex(0x10b981);
          if ('emissiveIntensity' in mat) mat.emissiveIntensity = 1.35;
        } else {
          if (mat.color?.setHex) mat.color.setHex(0x9b6dff);
          if (mat.emissive?.setHex) mat.emissive.setHex(0x9b6dff);
          if ('emissiveIntensity' in mat) mat.emissiveIntensity = 0.45;
        }
      }

      // Blinking device activity LEDs
      ledsToAnimate.forEach((led, i) => {
        const intensity = 0.8 + 0.6 * Math.sin(time * 3.5 + i * 1.4);
        if (led.material && 'emissiveIntensity' in led.material) {
          (led.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
        }
      });

      // Flowing packet particles
      const speedMul = state.speedMul || 1.0;
      activeSplines.forEach((spline) => {
        spline.particles.forEach((p) => {
          p.progress = (p.progress + p.speed * speedMul) % 1;
          const pt = spline.curve.getPointAt(p.progress);
          p.mesh.position.copy(pt);
        });
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || window.innerWidth;
      const newH = container.clientHeight || window.innerHeight;

      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('click', handlePointerClick);

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [onSelectDevice]);

  if (!webGLAvailable) {
    return (
      <NetworkSceneFallback
        devices={initialDevices}
        zones={subnetZones}
        onSelectDevice={onSelectDevice}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Real-time Hover Tooltip */}
      {hoveredDevice && tooltipPos && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(tooltipPos.x + 16, (containerRef.current?.clientWidth || 300) - 180),
            top: Math.max(tooltipPos.y - 48, 12),
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(255, 255, 255, 0.95)',
            boxShadow: 'var(--clay-shadow-sm)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.45rem 0.75rem',
            pointerEvents: 'none',
            zIndex: 40,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-white)' }}>
            {hoveredDevice.name}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            {hoveredDevice.role}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--accent-indigo)',
              fontWeight: 700,
              marginTop: '0.15rem',
            }}
          >
            {hoveredDevice.ip}
          </div>
        </div>
      )}
    </div>
  );
};

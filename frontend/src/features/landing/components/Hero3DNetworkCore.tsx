import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Zap, CheckCircle2, Server, Layers } from 'lucide-react';

export const Hero3DNetworkCore: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Check WebGL availability on a detached test canvas
    try {
      const testCanvas = document.createElement('canvas');
      const gl =
        testCanvas.getContext('webgl2') ||
        testCanvas.getContext('webgl') ||
        testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    const width = container.clientWidth || 1180;
    const height = container.clientHeight || 580;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0.0, 5.4);
    camera.lookAt(0, 0, 0);

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
    } catch {
      setWebglSupported(false);
      return;
    }

    // 2. Lighting - Elegant Purple & White Studio Key, Rim & Fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(8, 10, 6);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const purpleRim = new THREE.DirectionalLight(0x9b6dff, 3.2);
    purpleRim.position.set(-8, 5, -5);
    scene.add(purpleRim);

    const cyanFill = new THREE.DirectionalLight(0x06b6d4, 1.4);
    cyanFill.position.set(0, -6, 5);
    scene.add(cyanFill);

    // 3. Central Model Group (Enterprise 48-Port Modular Core Switch with Fiber Patches)
    const switchCoreGroup = new THREE.Group();
    scene.add(switchCoreGroup);

    // Materials - Purple & White Theme
    const pearlWhiteChassisMat = new THREE.MeshPhysicalMaterial({
      color: 0xfaf9fd,
      roughness: 0.22,
      metalness: 0.15,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
    });

    const royalPurpleTrimMat = new THREE.MeshPhysicalMaterial({
      color: 0x7c3aed,
      roughness: 0.28,
      metalness: 0.82,
      clearcoat: 0.6,
      clearcoatRoughness: 0.12,
    });

    const chromeBoltMat = new THREE.MeshPhysicalMaterial({
      color: 0xd8dce8,
      metalness: 0.95,
      roughness: 0.12,
      clearcoat: 0.9,
    });

    const darkBezelMat = new THREE.MeshStandardMaterial({
      color: 0x14101e,
      roughness: 0.35,
      metalness: 0.7,
    });

    const goldPinMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.95,
      roughness: 0.15,
    });

    const sfpAquaMat = new THREE.MeshPhysicalMaterial({
      color: 0x00c2cb,
      metalness: 0.7,
      roughness: 0.2,
      clearcoat: 0.8,
    });

    const ledActiveGreen = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 3.5,
      roughness: 0.1,
    });

    const ledActivePurple = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0xa855f7,
      emissiveIntensity: 3.2,
      roughness: 0.1,
    });

    const ledAmber = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 3.0,
      roughness: 0.1,
    });

    // 3A. Main 2U Enterprise Switch Chassis (Ceramic Pearl White Body)
    const chassisGeo = new THREE.BoxGeometry(4.8, 0.78, 2.6);
    const chassis = new THREE.Mesh(chassisGeo, pearlWhiteChassisMat);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    switchCoreGroup.add(chassis);

    // 3B. Anodized Royal Purple Top Cover & Side Accent Rails
    const topPlateGeo = new THREE.BoxGeometry(4.82, 0.04, 2.62);
    const topPlate = new THREE.Mesh(topPlateGeo, royalPurpleTrimMat);
    topPlate.position.y = 0.4;
    switchCoreGroup.add(topPlate);

    // Rack Mount Ears with Chrome Mounting Screws on both sides
    const earGeo = new THREE.BoxGeometry(0.16, 0.9, 0.6);
    const screwGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.05, 8);
    screwGeo.rotateZ(Math.PI / 2);

    [-2.48, 2.48].forEach((x) => {
      const ear = new THREE.Mesh(earGeo, royalPurpleTrimMat);
      ear.position.set(x, 0, 0.8);
      switchCoreGroup.add(ear);

      [-0.24, 0.24].forEach((sy) => {
        const screw = new THREE.Mesh(screwGeo, chromeBoltMat);
        screw.position.set(x + (x > 0 ? 0.07 : -0.07), sy, 0.8);
        switchCoreGroup.add(screw);
      });
    });

    // 3C. Front Faceplate Panel (High-density Computer Network Bezel)
    const faceplateGeo = new THREE.BoxGeometry(4.7, 0.68, 0.06);
    const faceplate = new THREE.Mesh(faceplateGeo, darkBezelMat);
    faceplate.position.set(0, 0, 1.32);
    switchCoreGroup.add(faceplate);

    // 3D. Dynamic Diagnostic OLED Display (Hostname, CIDR, VLANs, Packet Rate)
    const oledCanvas = document.createElement('canvas');
    oledCanvas.width = 512;
    oledCanvas.height = 200;
    const oledCtx = oledCanvas.getContext('2d');
    if (oledCtx) {
      oledCtx.fillStyle = '#0a0614';
      oledCtx.fillRect(0, 0, 512, 200);

      // Header Bar
      oledCtx.fillStyle = '#9b6dff';
      oledCtx.font = 'bold 24px "Courier New", monospace';
      oledCtx.fillText('● L3-CORE-SW01', 24, 42);

      oledCtx.fillStyle = '#10b981';
      oledCtx.font = 'bold 20px "Courier New", monospace';
      oledCtx.fillText('VLAN 10/20/30 UP', 310, 42);

      // IP & CIDR Prefix
      oledCtx.fillStyle = '#ffffff';
      oledCtx.font = 'bold 36px "Segoe UI", sans-serif';
      oledCtx.fillText('10.0.0.1 /16', 24, 98);

      // Network Stats
      oledCtx.fillStyle = '#38bdf8';
      oledCtx.font = '22px "Courier New", monospace';
      oledCtx.fillText('RATE: 1.48 MPPS • 0 DROPS', 24, 142);

      // Progress Bandwidth Bar
      oledCtx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      oledCtx.fillRect(24, 162, 464, 14);
      oledCtx.fillStyle = '#9b6dff';
      oledCtx.fillRect(24, 162, 380, 14);
    }
    const oledTexture = new THREE.CanvasTexture(oledCanvas);
    const oledScreenGeo = new THREE.PlaneGeometry(1.25, 0.48);
    const oledScreenMat = new THREE.MeshBasicMaterial({ map: oledTexture });
    const oledScreen = new THREE.Mesh(oledScreenGeo, oledScreenMat);
    oledScreen.position.set(-1.5, 0.02, 1.36);
    switchCoreGroup.add(oledScreen);

    // 3E. 48 High-Density Gigabit Ethernet Ports (2 rows of 24)
    const portCavityGeo = new THREE.BoxGeometry(0.09, 0.075, 0.05);
    const pinGeo = new THREE.BoxGeometry(0.06, 0.015, 0.02);
    const ledGeo = new THREE.SphereGeometry(0.018, 6, 6);
    const portLeds: THREE.Mesh[] = [];

    const startX = -0.68;
    const portPitch = 0.12;

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 20; col++) {
        const posX = startX + col * portPitch;
        const posY = row === 0 ? 0.08 : -0.08;

        const portCavity = new THREE.Mesh(portCavityGeo, darkBezelMat);
        portCavity.position.set(posX, posY, 1.36);
        switchCoreGroup.add(portCavity);

        // Gold contact pins inside RJ-45 cavity
        const pin = new THREE.Mesh(pinGeo, goldPinMat);
        pin.position.set(posX, posY - 0.015, 1.37);
        switchCoreGroup.add(pin);

        // Activity Link LED directly above each port
        if (row === 0) {
          const led = new THREE.Mesh(
            ledGeo,
            col % 3 === 0 ? ledActivePurple : col % 5 === 0 ? ledAmber : ledActiveGreen
          );
          led.position.set(posX, 0.18, 1.36);
          switchCoreGroup.add(led);
          portLeds.push(led);
        }
      }
    }

    // 3F. 4 x 10G/40G SFP+ Optical Fiber Transceiver Uplink Cages on Right
    [1.85, 2.05].forEach((xPos) => {
      [-0.08, 0.08].forEach((yPos) => {
        const sfpCage = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.06), chromeBoltMat);
        sfpCage.position.set(xPos, yPos, 1.36);
        switchCoreGroup.add(sfpCage);

        // Optical transceiver with aqua pull latch
        const optic = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.05), sfpAquaMat);
        optic.position.set(xPos, yPos, 1.38);
        switchCoreGroup.add(optic);

        const opticLed = new THREE.Mesh(ledGeo, ledActivePurple);
        opticLed.position.set(xPos, yPos + 0.08, 1.36);
        switchCoreGroup.add(opticLed);
        portLeds.push(opticLed);
      });
    });

    // 4. Photonic Fiber Patch Cables (Authentic Port-to-Port Structured Jumpers)
    const cableConfigs = [
      // Purple Cat6 Loop: Port 1 to Port 5
      {
        start: new THREE.Vector3(-0.44, 0.08, 1.38),
        mid: new THREE.Vector3(-0.30, -0.28, 1.72),
        end: new THREE.Vector3(-0.16, 0.08, 1.38),
        color: 0x9b6dff,
      },
      // Cyan Cat6 Loop: Port 7 to Port 11
      {
        start: new THREE.Vector3(0.04, 0.08, 1.38),
        mid: new THREE.Vector3(0.21, -0.32, 1.78),
        end: new THREE.Vector3(0.38, 0.08, 1.38),
        color: 0x06b6d4,
      },
      // Royal Violet Cat6: Lower Port 4 to Lower Port 10
      {
        start: new THREE.Vector3(-0.24, -0.08, 1.38),
        mid: new THREE.Vector3(0.02, -0.38, 1.84),
        end: new THREE.Vector3(0.28, -0.08, 1.38),
        color: 0x8b5cf6,
      },
      // Sky Blue Optical Fiber: SFP+ Uplink 1 to SFP+ Uplink 2
      {
        start: new THREE.Vector3(1.68, 0.08, 1.38),
        mid: new THREE.Vector3(1.82, -0.24, 1.75),
        end: new THREE.Vector3(1.95, -0.08, 1.38),
        color: 0x38bdf8,
      },
    ];

    const travelingPhotons: { mesh: THREE.Mesh; curve: THREE.CatmullRomCurve3; progress: number; speed: number }[] = [];

    cableConfigs.forEach((cfg) => {
      const curve = new THREE.CatmullRomCurve3([cfg.start, cfg.mid, cfg.end]);

      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.03, 8, false);
      const tubeMat = new THREE.MeshPhysicalMaterial({
        color: cfg.color,
        roughness: 0.25,
        metalness: 0.2,
        clearcoat: 0.6,
      });
      const cableMesh = new THREE.Mesh(tubeGeo, tubeMat);
      switchCoreGroup.add(cableMesh);

      // RJ-45 Snagless Boot at both ends
      [cfg.start, cfg.end].forEach((pos) => {
        const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 8), darkBezelMat);
        boot.position.copy(pos);
        boot.rotation.x = Math.PI / 2;
        switchCoreGroup.add(boot);
      });

      // Traveling Packet Photon Pulse along the cable
      const photonMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: cfg.color,
        emissiveIntensity: 4.5,
      });
      const photon = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), photonMat);
      switchCoreGroup.add(photon);
      travelingPhotons.push({
        mesh: photon,
        curve,
        progress: Math.random(),
        speed: 0.006 + Math.random() * 0.004,
      });
    });

    // 6. Centered horizontal perspective with out-to-in scroll & mouse interaction
    let scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    let mouseX = 0;
    let mouseY = 0;
    let tiltX = 0;
    let tiltY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      }
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 7. Animation Loop (Out-to-In entrance and Out-to-In scroll zoom)
    let animId: number;
    const startTime = performance.now() * 0.001;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = performance.now() * 0.001 - startTime;
      const isMobile = window.innerWidth < 768;

      // Initial Mount: Out-to-In entrance fly-in over 1.2s
      const entranceDuration = 1.2;
      const entranceT = Math.min(elapsed / entranceDuration, 1.0);
      const easeOut = 1 - Math.pow(1 - entranceT, 3); // Cubic ease out

      // Entrance begins out in deep space (-2.5) and arrives in at 0
      const entranceZ = (1 - easeOut) * -2.5;
      const entranceScale = 0.7 + easeOut * 0.3;
      const entranceRotY = (1 - easeOut) * 0.32;

      // Scroll-linked animation: "Out to In" (zooming inward towards the user)
      const scrollT = Math.min(Math.max(0, scrollY) / 520, 1.0);
      const scrollZoomIn = scrollT * (isMobile ? 0.85 : 1.45);
      const scrollScaleIn = 1.0 + scrollT * (isMobile ? 0.08 : 0.16);

      // Inward rotation & tilt toward the user/center
      const scrollInwardRotY = -scrollT * 0.26;
      const scrollInwardRotX = -scrollT * 0.14;

      // Smooth mouse follow
      tiltX += (mouseY * 0.1 - tiltX) * 0.05;
      tiltY += (mouseX * 0.16 - tiltY) * 0.05;

      // Apply combined Out-to-In transform
      const finalZ = entranceZ + scrollZoomIn;
      const finalScale = entranceScale * scrollScaleIn;

      switchCoreGroup.position.z = finalZ;
      switchCoreGroup.scale.set(finalScale, finalScale, finalScale);
      switchCoreGroup.rotation.x = scrollInwardRotX + tiltX;
      switchCoreGroup.rotation.y = entranceRotY + scrollInwardRotY + tiltY;
      switchCoreGroup.position.y = Math.sin(elapsed * 1.2) * 0.035 + scrollT * 0.12;

      // Animate packet photons traveling along cables (flowing from port to port)
      travelingPhotons.forEach((p) => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;
        const pt = p.curve.getPointAt(p.progress);
        p.mesh.position.copy(pt);
      });

      // Animate port LEDs blinking randomly with network traffic
      portLeds.forEach((led, idx) => {
        if (led.material && 'emissiveIntensity' in led.material) {
          const blink = Math.sin(elapsed * 8 + idx * 1.8) > 0 ? 3.5 : 0.4;
          (led.material as THREE.MeshStandardMaterial).emissiveIntensity = blink;
        }
      });

      if (renderer) {
        renderer.render(scene, camera);
      }
    };

    animate();

    // 8. Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      if (newW > 0 && newH > 0) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH, false);
      }
    });

    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      resizeObserver.disconnect();
      renderer?.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="hero-3d-fullspace-container"
      style={{
        position: 'relative',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        marginRight: 'calc(-50vw + 50%)',
        height: 'clamp(380px, 52vh, 600px)',
        background: 'transparent',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Ambient Purple & Cyan Glow Highlights */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 130, 245, 0.2) 0%, transparent 70%)',
          filter: 'blur(50px)',
          top: '10%',
          left: '20%',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
          filter: 'blur(45px)',
          bottom: '10%',
          right: '18%',
          pointerEvents: 'none',
        }}
      />

      {/* WebGL Canvas spanning full page space */}
      {webglSupported ? (
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            cursor: 'grab',
          }}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(145deg, #8b5cf6, #7c3aed)',
              margin: '0 auto 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--clay-shadow-md)',
            }}
          >
            <Server className="w-10 h-10 text-white" />
          </div>
          <h4 style={{ fontWeight: 800, color: '#2d1f4e' }}>
            Enterprise 48-Port L3 Distribution Core
          </h4>
          <p style={{ fontSize: '0.85rem', color: '#6b5a8a', marginTop: '0.25rem' }}>
            10.0.0.1/16 • 100G SFP+ Uplinks • Active Packet Flow
          </p>
        </div>
      )}

      {/* Floating Network Telemetry Chips Across Full Page Space */}
      {/* Top Left: 48-Port Core Switch Badge */}
      <div
        className="clay-badge-float hero-top-left-chip"
        style={{
          position: 'absolute',
          top: '1.5rem',
          left: 'max(1.75rem, calc((100vw - 1320px) / 2 + 1.75rem))',
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(16px)',
          padding: '0.6rem 1.1rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: '4px 6px 16px rgba(124, 92, 191, 0.1), inset 1px 1px 2px #ffffff',
          border: '1.5px solid rgba(255, 255, 255, 0.95)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.825rem',
          fontWeight: 700,
          color: '#2d1f4e',
          zIndex: 10,
        }}
      >
        <span
          style={{
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 10px #10b981',
            display: 'inline-block',
          }}
        />
        <span>48-Port L3 Core Switch • Line-Rate ASIC</span>
      </div>

      {/* Top Right: Optical SFP+ Uplink */}
      <div
        className="clay-badge-float hero-top-right-chip"
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: 'max(1.75rem, calc((100vw - 1320px) / 2 + 1.75rem))',
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(16px)',
          padding: '0.6rem 1.1rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: '4px 6px 16px rgba(124, 92, 191, 0.1), inset 1px 1px 2px #ffffff',
          border: '1.5px solid rgba(255, 255, 255, 0.95)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.55rem',
          fontSize: '0.825rem',
          fontWeight: 700,
          color: '#2d1f4e',
          zIndex: 10,
        }}
      >
        <Zap className="w-4 h-4 text-purple-600" />
        <span>4x 10G/40G SFP+ Optical Uplink</span>
      </div>

      {/* Bottom Center: CIDR & Default Route */}
      <div
        className="hero-bottom-bar"
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          left: 'max(1.75rem, calc((100vw - 1320px) / 2 + 1.75rem))',
          right: 'max(1.75rem, calc((100vw - 1320px) / 2 + 1.75rem))',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          padding: '0.75rem 1.4rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '4px 8px 20px rgba(124, 92, 191, 0.12), inset 1px 1px 2px #ffffff',
          border: '1.5px solid rgba(255, 255, 255, 0.95)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              background: 'linear-gradient(145deg, #ede7fb, #e0d4f7)',
              padding: '0.45rem',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'inset 1px 1px 2px rgba(255, 255, 255, 0.8)',
            }}
          >
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#2d1f4e' }}>
              Core Distribution Switch L3-SW01
            </div>
            <div style={{ fontSize: '0.725rem', color: '#6b5a8a' }}>
              Default Gateway 10.0.0.1/16 • 48 Cat6 Ethernet Ports & 4x Optical Transceivers
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#7c6a96' }}>
            Forwarding: <strong style={{ color: '#2d1f4e' }}>1.48 MPPS</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2d1f4e' }}>
              RFC 1918 Verified • 0 Collisions
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

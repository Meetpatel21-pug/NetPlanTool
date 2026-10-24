import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const IngrassiaParticleAtmosphere: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      if (!gl) return;
    } catch {
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 220;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: 'low-power',
      });
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    } catch {
      return;
    }

    // 2. Generate Network Constellation Point Cloud (Purple & White Palette)
    const particleCount = 2800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const baseColor1 = new THREE.Color('#7c3aed'); // Royal Purple
    const baseColor2 = new THREE.Color('#9b6dff'); // Amethyst
    const baseColor3 = new THREE.Color('#b088f9'); // Lavender
    const baseColor4 = new THREE.Color('#06b6d4'); // Soft Cyan Accent

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const theta = Math.random() * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * Math.random() - 1.0);
      const radius = 90 + Math.pow(Math.random(), 2.0) * 240;

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.7;
      positions[i3 + 2] = radius * Math.cos(phi);

      const rand = Math.random();
      const mixedColor =
        rand > 0.65
          ? baseColor1
          : rand > 0.35
          ? baseColor2
          : rand > 0.15
          ? baseColor3
          : baseColor4;

      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle texture (soft circular glow)
    const particleCanvas = document.createElement('canvas');
    particleCanvas.width = 32;
    particleCanvas.height = 32;
    const ctx = particleCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(124, 58, 237, 1)');
      grad.addColorStop(0.35, 'rgba(155, 109, 255, 0.75)');
      grad.addColorStop(0.7, 'rgba(176, 136, 249, 0.25)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
    }
    const particleTexture = new THREE.CanvasTexture(particleCanvas);
    particleTexture.flipY = false;
    particleTexture.premultiplyAlpha = false;

    const material = new THREE.PointsMaterial({
      size: 3.2,
      map: particleTexture,
      transparent: true,
      opacity: 0.32,
      vertexColors: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // 3. Pointer & Scroll Velocity Tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleScroll = () => {
      const currentScroll = window.scrollY;
      scrollVelocity = (currentScroll - lastScrollY) * 0.12;
      lastScrollY = currentScroll;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 4. Animation Loop
    let animId: number;
    const startTime = performance.now() * 0.001;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = performance.now() * 0.001 - startTime;

      // Smooth mouse follow
      targetX += (mouseX * 28 - targetX) * 0.04;
      targetY += (mouseY * 20 - targetY) * 0.04;

      scrollVelocity *= 0.92;

      // Gentle continuous drift
      particles.rotation.y = elapsed * 0.03 + targetX * 0.006;
      particles.rotation.x = Math.sin(elapsed * 0.02) * 0.1 - targetY * 0.006;
      particles.rotation.z += scrollVelocity * 0.0015;

      camera.position.x += (targetX - camera.position.x) * 0.03;
      camera.position.y += (targetY - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      if (renderer) {
        renderer.render(scene, camera);
      }
    };

    animate();

    // 5. Window Resize
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer?.setSize(w, h, false);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      material.dispose();
      particleTexture.dispose();
      renderer?.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* Soft Luminous Purple & White Glow Radiance */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '10%',
          width: '650px',
          height: '650px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 130, 245, 0.14) 0%, transparent 65%)',
          filter: 'blur(70px)',
          transform: 'translate3d(0,0,0)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          right: '5%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 92, 191, 0.1) 0%, transparent 65%)',
          filter: 'blur(75px)',
          transform: 'translate3d(0,0,0)',
        }}
      />

      {/* WebGL Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  );
};

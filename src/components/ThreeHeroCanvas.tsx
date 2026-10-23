"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export const ThreeHeroCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Group for all floating objects
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Interactive 3D Toy Robot
    const robotGroup = new THREE.Group();
    robotGroup.position.set(0.6, 0.2, 0);

    // Materials - Playful glossy claymorphic finishes
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1, // Electric indigo
      roughness: 0.2,
      metalness: 0.15,
    });
    const bellyMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Cyan
      roughness: 0.2,
      metalness: 0.1,
    });
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e, // Pop pink glowing visor
      emissive: 0xf43f5e,
      emissiveIntensity: 0.45,
      roughness: 0.1,
      metalness: 0.3,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24, // Bright Gold
      metalness: 0.8,
      roughness: 0.2,
    });
    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
    });

    // Robot Head (rounded cube)
    const headGeo = new THREE.BoxGeometry(1.6, 1.4, 1.4, 4, 4, 4);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = 1.3;
    robotGroup.add(head);

    // Visor
    const visorGeo = new THREE.BoxGeometry(1.2, 0.45, 0.3);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.35, 0.65);
    robotGroup.add(visor);

    // Antenna
    const antStemGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.6);
    const antStem = new THREE.Mesh(antStemGeo, whiteMat);
    antStem.position.set(0, 2.2, 0);
    robotGroup.add(antStem);

    const antSphereGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const antSphere = new THREE.Mesh(antSphereGeo, goldMat);
    antSphere.position.set(0, 2.5, 0);
    robotGroup.add(antSphere);

    // Robot Ears (headphone dials)
    const earGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.3, 16);
    const leftEar = new THREE.Mesh(earGeo, goldMat);
    leftEar.rotation.z = Math.PI / 2;
    leftEar.position.set(-0.9, 1.35, 0);
    robotGroup.add(leftEar);

    const rightEar = leftEar.clone();
    rightEar.position.x = 0.9;
    robotGroup.add(rightEar);

    // Robot Body
    const bodyGeo = new THREE.BoxGeometry(1.8, 1.7, 1.3, 4, 4, 4);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = -0.2;
    robotGroup.add(body);

    // Belly Screen
    const bellyGeo = new THREE.BoxGeometry(1.2, 1.0, 0.2);
    const belly = new THREE.Mesh(bellyGeo, bellyMat);
    belly.position.set(0, -0.15, 0.6);
    robotGroup.add(belly);

    // Limbs - Floating arms
    const armGeo = new THREE.CapsuleGeometry(0.26, 0.7, 4, 8);
    const leftArm = new THREE.Mesh(armGeo, whiteMat);
    leftArm.position.set(-1.25, -0.1, 0);
    leftArm.rotation.z = 0.35;
    robotGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, whiteMat);
    rightArm.position.set(1.25, 0.15, 0.2);
    rightArm.rotation.z = -0.55;
    robotGroup.add(rightArm);

    // Glowing Heart Core on Belly
    const heartGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const heartCore = new THREE.Mesh(heartGeo, visorMat);
    heartCore.position.set(0, -0.15, 0.72);
    robotGroup.add(heartCore);

    mainGroup.add(robotGroup);

    // 2. Floating Mystery Box (Left)
    const boxGroup = new THREE.Group();
    boxGroup.position.set(-2.6, 1.2, 1.0);

    const boxMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.25,
      metalness: 0.1,
    });
    const boxRibbonMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.1,
      metalness: 0.8,
    });

    const boxGeo = new THREE.BoxGeometry(1.1, 1.1, 1.1);
    const mysteryBox = new THREE.Mesh(boxGeo, boxMat);
    boxGroup.add(mysteryBox);

    const ribbonH = new THREE.Mesh(new THREE.BoxGeometry(1.13, 0.22, 1.13), boxRibbonMat);
    boxGroup.add(ribbonH);
    const ribbonV = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.13, 1.13), boxRibbonMat);
    boxGroup.add(ribbonV);

    mainGroup.add(boxGroup);

    // 3. Floating 3D Gold Star Collectible (Right)
    const starGroup = new THREE.Group();
    starGroup.position.set(2.8, -1.0, 1.2);

    // Star geometry using ExtrudeGeometry or intersecting icosahedron
    const starGeo = new THREE.OctahedronGeometry(0.85, 0);
    const starMesh = new THREE.Mesh(starGeo, goldMat);
    starGroup.add(starMesh);

    // Outer shiny orbit ring
    const ringGeo = new THREE.TorusGeometry(1.3, 0.08, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.35,
      roughness: 0.2,
      metalness: 0.5,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 3;
    starGroup.add(ringMesh);

    mainGroup.add(starGroup);

    // 4. Sparkling Particle Galaxy (Candy Dots & Mini Stars)
    const particleCount = 140;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorPalette = [
      new THREE.Color(0xf43f5e), // Pink
      new THREE.Color(0x6366f1), // Indigo
      new THREE.Color(0x06b6d4), // Cyan
      new THREE.Color(0xfbbf24), // Gold
      new THREE.Color(0x10b981), // Emerald
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;

      const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(5, 8, 7);
    scene.add(dirLight1);

    // Colorful rim lights for that flashy toy look
    const pinkRim = new THREE.PointLight(0xf43f5e, 2.5, 15);
    pinkRim.position.set(-6, -3, 4);
    scene.add(pinkRim);

    const cyanRim = new THREE.PointLight(0x06b6d4, 2.5, 15);
    cyanRim.position.set(6, 4, 3);
    scene.add(cyanRim);

    // Mouse movement tracking with smooth lerp
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;
      if ("touches" in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("clientX" in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const rect = container.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width - 0.5;
      const y = (clientY - rect.top) / rect.height - 0.5;

      targetX = x * 2;
      targetY = y * 2;
    };

    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("touchmove", onPointerMove);

    // Resize handler
    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", onResize);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth mouse lerping
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      // Robot gentle hover & cursor tilt
      robotGroup.position.y = 0.2 + Math.sin(elapsed * 1.8) * 0.18;
      robotGroup.rotation.y = mouseX * 0.45;
      robotGroup.rotation.x = -mouseY * 0.35;
      robotGroup.rotation.z = Math.sin(elapsed * 1.2) * 0.04;

      // Wave right arm
      rightArm.rotation.z = -0.55 + Math.sin(elapsed * 3) * 0.25;

      // Heartbeat pulse glow
      const pulse = 1 + Math.sin(elapsed * 4) * 0.15;
      heartCore.scale.set(pulse, pulse, pulse);

      // Mystery Box rotation & float
      boxGroup.position.y = 1.2 + Math.cos(elapsed * 2.2) * 0.22;
      boxGroup.rotation.x = elapsed * 0.5;
      boxGroup.rotation.y = elapsed * 0.7;

      // Gold Star rotation
      starGroup.position.y = -1.0 + Math.sin(elapsed * 2.5 + 1) * 0.2;
      starMesh.rotation.y = elapsed * 1.2;
      starMesh.rotation.z = elapsed * 0.8;
      ringMesh.rotation.z = -elapsed * 0.9;

      // Particles gentle drift
      particles.rotation.y = elapsed * 0.03;
      particles.rotation.x = Math.sin(elapsed * 0.02) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("resize", onResize);
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-full min-h-[380px] md:min-h-[480px] lg:min-h-[550px] relative pointer-events-auto cursor-grab active:cursor-grabbing"
      aria-label="Interactive 3D Toy Robot and Collectibles"
    />
  );
};

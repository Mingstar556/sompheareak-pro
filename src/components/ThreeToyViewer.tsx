"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Product } from "@/types/store";
import { useStore } from "@/context/StoreContext";
import { sounds } from "@/utils/audio";
import { X, Sparkles, RefreshCw, ShoppingCart, Eye, Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/utils/currency";

interface ThreeToyViewerProps {
  product: Product | null;
  onClose: () => void;
}

export const ThreeToyViewer: React.FC<ThreeToyViewerProps> = ({ product, onClose }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { addToCart, currency, t } = useStore();
  const [activeColor, setActiveColor] = useState<string>("#6366f1");
  const [wireframe, setWireframe] = useState<boolean>(false);
  const toyMeshRef = useRef<THREE.Group | null>(null);
  const matRef = useRef<THREE.MeshStandardMaterial | null>(null);

  useEffect(() => {
    if (!product) return;
    const container = mountRef.current;
    if (!container) return;

    // Setup scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group for the customizable 3D toy
    const group = new THREE.Group();
    toyMeshRef.current = group;
    scene.add(group);

    // Dynamic material that user can change color / wireframe on the fly
    const toyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(activeColor),
      metalness: 0.25,
      roughness: 0.2,
      wireframe: wireframe,
    });
    matRef.current = toyMat;

    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24, // Gold
      metalness: 0.8,
      roughness: 0.15,
      wireframe: wireframe,
    });

    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Cyan glow
      emissive: 0x06b6d4,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      wireframe: wireframe,
    });

    // Build geometry based on product category
    if (product.cat === "minifigure") {
      // Robot / Warrior figure
      const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 1), toyMat);
      head.position.y = 1.1;
      group.add(head);

      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.5), glowMat);
      visor.position.set(0, 1.15, 0.6);
      group.add(visor);

      const torso = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.3, 0.9), toyMat);
      torso.position.y = -0.3;
      group.add(torso);

      const chestEmblem = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16), accentMat);
      chestEmblem.rotation.x = Math.PI / 2;
      chestEmblem.position.set(0, -0.2, 0.5);
      group.add(chestEmblem);
    } else if (product.cat === "blind-box") {
      // Mystery Capsule / Lucky Egg
      const capsule = new THREE.Mesh(new THREE.SphereGeometry(1.3, 32, 32), toyMat);
      capsule.scale.set(1, 1.3, 1);
      group.add(capsule);

      const band = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.1, 16, 64), accentMat);
      band.rotation.x = Math.PI / 2;
      group.add(band);

      const lock = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), glowMat);
      lock.position.set(0, 0, 1.35);
      group.add(lock);
    } else if (product.cat === "bracelet") {
      // 3D Italian Modular Bracelet Ring with Clean Empty Stainless Links
      const linksCount = 17;
      const radius = 1.5;
      const emptyInoxMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.95,
        roughness: 0.18,
      });
      for (let i = 0; i < linksCount; i++) {
        const angle = (i / linksCount) * Math.PI * 2;
        const linkGeo = new THREE.BoxGeometry(0.5, 0.3, 0.15);
        const link = new THREE.Mesh(linkGeo, emptyInoxMat);
        link.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
        link.rotation.z = angle + Math.PI / 2;
        group.add(link);
      }
    } else {
      // Tech RC / Gadget / Pop Toy (Futuristic Core)
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 1), toyMat);
      group.add(core);

      const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.08, 16, 64), glowMat);
      ring1.rotation.x = Math.PI / 3;
      group.add(ring1);

      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.06, 16, 64), accentMat);
      ring2.rotation.y = Math.PI / 3;
      group.add(ring2);
    }

    // Pedestal Platform
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.5,
      roughness: 0.4,
    });
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.3, 0.25, 32), pedestalMat);
    pedestal.position.y = -2.1;
    scene.add(pedestal);

    // Glowing stage ring
    const stageRing = new THREE.Mesh(
      new THREE.RingGeometry(2.1, 2.3, 32),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide })
    );
    stageRing.rotation.x = Math.PI / 2;
    stageRing.position.y = -1.97;
    scene.add(stageRing);

    // Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(amb);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(5, 6, 6);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xf43f5e, 2, 10);
    rimLight.position.set(-4, 2, 3);
    scene.add(rimLight);

    // Drag to rotate interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let autoRotate = true;

    const onMouseDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      autoRotate = false;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const onMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !group) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - prevMouseX;
      const deltaY = clientY - prevMouseY;

      group.rotation.y += deltaX * 0.012;
      group.rotation.x += deltaY * 0.012;

      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    container.addEventListener("touchstart", onMouseDown);
    window.addEventListener("touchmove", onMouseMove);
    window.addEventListener("touchend", onMouseUp);

    // Resize
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

      if (autoRotate && group) {
        group.rotation.y = elapsed * 0.7;
        group.position.y = Math.sin(elapsed * 2) * 0.12;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("touchstart", onMouseDown);
      window.removeEventListener("touchmove", onMouseMove);
      window.removeEventListener("touchend", onMouseUp);
      window.removeEventListener("resize", onResize);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [product]);

  // Update material color dynamically
  useEffect(() => {
    if (matRef.current) {
      matRef.current.color.set(activeColor);
      matRef.current.wireframe = wireframe;
      matRef.current.needsUpdate = true;
    }
  }, [activeColor, wireframe]);

  if (!product) return null;

  const colorOptions = [
    { name: "Neon Violet", hex: "#6366f1" },
    { name: "Bubblegum Pink", hex: "#f43f5e" },
    { name: "Cyan Spark", hex: "#06b6d4" },
    { name: "Emerald Mint", hex: "#10b981" },
    { name: "Sunburst Gold", hex: "#fbbf24" },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl bg-slate-900 border-2 border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh]"
        >
          {/* Close button */}
          <button
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="absolute top-4 right-4 z-20 w-11 h-11 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white flex items-center justify-center border border-white/20 transition-all hover:scale-105 active:scale-95"
            aria-label="Close 3D Viewer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left: 3D Interactive Stage */}
          <div className="relative flex-1 min-h-[320px] md:min-h-[460px] bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/60 flex items-center justify-center overflow-hidden">
            <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            {/* Interaction hint pill */}
            <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs text-slate-300">
              <RefreshCw className="w-3.5 h-3.5 text-toy-cyan animate-spin" style={{ animationDuration: "6s" }} />
              <span>Drag to rotate 360° · Scroll to zoom</span>
            </div>

            {/* Rarity Badge in corner */}
            {product.rarity && (
              <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-toy-purple/80 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-toy-glow">
                ✨ {product.rarity}
              </div>
            )}
          </div>

          {/* Right: Controls & Purchase Panel */}
          <div className="w-full md:w-[360px] p-6 bg-slate-900 flex flex-col justify-between overflow-y-auto border-t md:border-t-0 md:border-l border-slate-800">
            <div>
              <div className="text-xs uppercase font-extrabold tracking-wider text-toy-pink mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Interactive 3D Studio</span>
              </div>
              <h2 className="text-2xl font-black text-white leading-tight font-fredoka">{product.name}</h2>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{product.bio}</p>

              {/* Price Row */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-black text-toy-yellow font-fredoka">
                  {formatPrice(product.price * (1 - product.discount / 100), currency)}
                </span>
                {product.discount > 0 && (
                  <span className="text-sm line-through text-slate-500 font-bold">
                    {formatPrice(product.price, currency)}
                  </span>
                )}
                <span className="ml-auto text-xs font-bold text-toy-green bg-toy-green/10 px-2 py-1 rounded-full border border-toy-green/30">
                  +{product.pt} VIP Points
                </span>
              </div>

              {/* Empty Inox Band Callout for Bracelets */}
              {product.cat === "bracelet" && (
                <div className="mt-4 p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-xs shadow-md">
                  <div className="flex items-center gap-1.5 font-bold text-toy-green mb-1">
                    <span>🔗</span>
                    <span>Empty Italian Inox Band Base</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed mb-2.5">
                    Viewing the clean, blank 17-link stainless steel base (no charms attached). Open the studio to snap and customize your unique charms!
                  </p>
                  <a
                    href="#custom-bracelet-studio"
                    onClick={() => {
                      sounds.playPop();
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-xs font-fredoka shadow-toy-green-glow transition-all active:scale-95"
                  >
                    <span>Design in Charm Studio 🔗</span>
                  </a>
                </div>
              )}

              {/* 3D Color Customizer */}
              <div className="mt-6">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2.5">
                  <Palette className="w-3.5 h-3.5 text-toy-yellow" />
                  <span>Choose 3D Shell Color:</span>
                </label>
                <div className="flex gap-2.5">
                  {colorOptions.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => {
                        sounds.playPop();
                        setActiveColor(c.hex);
                      }}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        activeColor === c.hex ? "scale-125 border-white shadow-lg" : "border-transparent opacity-75 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Holographic Wireframe Mode Toggle */}
              <div className="mt-5 flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-toy-cyan" />
                  <span className="text-xs font-bold text-slate-200">Holo Wireframe Mode</span>
                </div>
                <button
                  onClick={() => {
                    sounds.playPop();
                    setWireframe(!wireframe);
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                    wireframe ? "bg-toy-cyan" : "bg-slate-700"
                  }`}
                >
                  <motion.div
                    animate={{ x: wireframe ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="w-4 h-4 rounded-full bg-white shadow-md"
                  />
                </button>
              </div>

              {/* Specs & Age */}
              <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                  <span className="text-slate-400 block font-medium">Recommended Age</span>
                  <span className="text-slate-200 font-bold">{product.ageRecommendation || "Ages 5+"}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                  <span className="text-slate-400 block font-medium">Dimensions</span>
                  <span className="text-slate-200 font-bold">{product.dimensions || "Collectible Size"}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  addToCart(product, 1);
                  onClose();
                }}
                className="w-full py-4 px-5 rounded-2xl font-black text-white bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-800 shadow-toy-green-glow border-b-4 border-emerald-950 hover:from-emerald-400 hover:to-green-500 active:scale-95 transition-all flex items-center justify-center gap-2 font-fredoka text-base"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{t("addToCart")}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

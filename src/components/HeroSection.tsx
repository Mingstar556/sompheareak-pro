"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Truck, MessageCircle, ArrowRight, Gift, Zap } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { ThreeHeroCanvas } from "./ThreeHeroCanvas";
import { sounds } from "@/utils/audio";
import styles from "@/styles/ToyEffects.module.css";

export const HeroSection: React.FC = () => {
  const { t, storefrontConfig } = useStore();

  const heroBadge = storefrontConfig?.heroBadge || t("heroBadge");
  const heroTitlePrefix = storefrontConfig?.heroTitlePrefix || t("heroTitlePrefix");
  const heroTitleHighlight = storefrontConfig?.heroTitleHighlight || t("heroTitleHighlight");
  const heroTitleSuffix = storefrontConfig?.heroTitleSuffix || t("heroTitleSuffix");
  const heroSubtitle = storefrontConfig?.heroSubtitle || t("heroSubtitle");

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:py-20 px-4 max-w-7xl mx-auto">
      {/* Background ambient neon glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 dark:bg-toy-purple/25 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-teal-500/15 dark:bg-toy-pink/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-amber-400/15 dark:bg-toy-cyan/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Column: Flashy Kid-Centric Copy & CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="lg:col-span-6 xl:col-span-7 space-y-6 text-center lg:text-left"
        >
          {/* Top Drop Badge & Admin Edit Trigger */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-gradient-to-r dark:from-emerald-500/20 dark:via-toy-purple/20 dark:to-teal-500/20 border border-emerald-400 dark:border-emerald-500/40 shadow-toy-green-glow text-emerald-900 dark:text-white text-xs font-black tracking-wider uppercase font-fredoka"
            >
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-toy-yellow animate-spin" style={{ animationDuration: "6s" }} />
              <span>{heroBadge}</span>
            </motion.div>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 text-slate-950 font-black text-xs font-fredoka shadow-md animate-pulse">
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>TRENDING TIKTOK 2026</span>
            </span>
          </div>

          {/* Hero Main Heading */}
          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black text-slate-900 dark:text-white font-fredoka tracking-tight leading-[1.12]">
            {heroTitlePrefix}{" "}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-green-600 dark:from-toy-yellow dark:via-toy-pink dark:to-toy-cyan bg-clip-text text-transparent drop-shadow-sm">
              {heroTitleHighlight}
            </span>{" "}
            {heroTitleSuffix}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
            {heroSubtitle}
          </p>

          {/* Big Chunky CTA Action Buttons */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
            <a
              href="#toy-catalog"
              onClick={() => sounds.playBounce()}
              className="px-7 py-4 rounded-2xl font-black text-white bg-gradient-to-r from-emerald-500 via-green-600 to-teal-700 shadow-toy-green-glow font-fredoka text-base tracking-wide flex items-center gap-2.5 hover:scale-105 active:scale-95 transition-all select-none border-2 border-emerald-300/30"
            >
              <span>{t("heroCtaShop")}</span>
              <ArrowRight className="w-5 h-5" />
            </a>

            <a
              href="/italy-bracelet"
              onClick={() => sounds.playPop()}
              className="px-6 py-4 rounded-2xl font-black text-slate-900 dark:text-white bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-amber-400 dark:border-toy-yellow/60 shadow-md font-fredoka text-base tracking-wide flex items-center gap-2 transition-all hover:scale-105 active:scale-95 select-none"
            >
              <span>{t("heroCtaCustom")}</span>
            </a>

            <a
              href="#voucher-hub"
              onClick={() => sounds.playChime()}
              className="px-5 py-4 rounded-2xl font-bold text-amber-800 dark:text-toy-yellow bg-amber-100 hover:bg-amber-200 dark:bg-toy-yellow/10 dark:hover:bg-toy-yellow/20 border border-amber-300 dark:border-toy-yellow/30 font-fredoka text-sm flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              <span>Exchange Points for Vouchers 🎟️</span>
            </a>

            <a
              href="/cart"
              onClick={() => sounds.playBounce()}
              className="px-5 py-4 rounded-2xl font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/80 border border-emerald-300 dark:border-emerald-600/50 shadow-sm font-fredoka text-sm flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <span>View Cart & Checkout 🛒</span>
            </a>
          </div>

          {/* Trust & Certification Badges */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-toy-green flex-shrink-0" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">
                {t("safeCertified")}
              </span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 shadow-sm">
              <Truck className="w-5 h-5 text-teal-600 dark:text-toy-cyan flex-shrink-0" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">
                {t("freeDeliveryBadge")}
              </span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 shadow-sm col-span-2 sm:col-span-1">
              <MessageCircle className="w-5 h-5 text-amber-500 dark:text-toy-yellow flex-shrink-0" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">
                {t("telegramOrdersBadge")}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Three.js Interactive 3D Toy Stage */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:col-span-6 xl:col-span-5 relative flex items-center justify-center"
        >
          {/* Floating Toy Stickers */}
          <div className={`${styles.floatingSticker} absolute -top-3.5 -right-3 z-30 hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-xs font-fredoka shadow-2xl border-2 border-white dark:border-slate-900 rotate-6 select-none`}>
            <span>🔥</span>
            <span>TOP TOY DROPS</span>
          </div>

          <div className={`${styles.floatingSticker} absolute -bottom-3.5 -left-3 z-30 hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-xs font-fredoka shadow-2xl border-2 border-white dark:border-slate-900 -rotate-3 select-none`}>
            <span>⭐</span>
            <span>VIP COLLECTOR</span>
          </div>

          {/* Glassmorphic 3D Card Backdrop */}
          <div className="w-full relative rounded-3xl bg-gradient-to-b from-white/90 via-slate-100/70 to-emerald-50/60 dark:from-slate-900/80 dark:via-slate-900/40 dark:to-emerald-950/40 border-2 border-emerald-500/40 shadow-2xl p-2 overflow-hidden backdrop-blur-md transition-colors duration-200">
            {/* Top Interactive Indicator */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-md border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-toy-green animate-ping" />
              <span>Three.js 3D Interactive Stage</span>
            </div>

            {/* Three.js Canvas */}
            <ThreeHeroCanvas />

            {/* Bottom Floating Interactive Floating Badges */}
            <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-between pointer-events-none">
              <div className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-white/10 text-[11px] font-bold text-amber-600 dark:text-toy-yellow flex items-center gap-1.5 shadow-sm">
                <span>⭐</span>
                <span>Move cursor to tilt 3D Toys</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-600 dark:bg-toy-pink/80 backdrop-blur-md text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
                Kid-Approved
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

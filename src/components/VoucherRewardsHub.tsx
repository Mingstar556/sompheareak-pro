"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Ticket, Trophy, Gift, Check, ArrowRight, Star, ShoppingBag, Coins } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { AVAILABLE_VOUCHERS } from "@/data/vouchers";
import { Voucher } from "@/types/store";
import { sounds } from "@/utils/audio";

export const VoucherRewardsHub: React.FC = () => {
  const {
    userPoints,
    exchangePointsForVoucher,
    claimedVouchers,
    activeVoucher,
    applyVoucherCode,
    vouchers: storeVouchers,
    language,
    t,
  } = useStore();

  const [selectedVoucherCode, setSelectedVoucherCode] = useState<string | null>(null);

  const displayVouchers = storeVouchers && storeVouchers.length > 0 ? storeVouchers : AVAILABLE_VOUCHERS;

  const handleExchange = (voucher: Voucher) => {
    const success = exchangePointsForVoucher(voucher);
    if (success) {
      setSelectedVoucherCode(voucher.code);
    }
  };

  return (
    <section id="voucher-hub" className="py-16 px-4 max-w-7xl mx-auto my-12">
      {/* Background radial glows */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-50/80 via-emerald-50/50 to-teal-50 dark:from-indigo-950/60 dark:via-purple-950/40 dark:to-slate-950 border-2 border-emerald-500/40 dark:border-toy-yellow/40 p-6 sm:p-10 shadow-2xl transition-colors duration-200">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/15 dark:bg-toy-yellow/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/15 dark:bg-toy-pink/15 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-10 text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-toy-yellow/20 border border-amber-300 dark:border-toy-yellow/40 text-amber-800 dark:text-toy-yellow text-xs font-black tracking-wider uppercase mb-3 font-fredoka">
            <Coins className="w-4 h-4 text-amber-600 dark:text-toy-yellow animate-bounce" />
            <span>{t("voucherHubBadge")}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white font-fredoka">
            {t("voucherHubTitle")}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 font-medium leading-relaxed">
            {t("voucherHubSubtitle")}
          </p>

          {/* Live Points Counter Pill */}
          <div className="mt-6 inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white dark:bg-slate-900/90 border-2 border-emerald-500 shadow-toy-green-glow">
            <Trophy className="w-6 h-6 text-amber-500 dark:text-toy-yellow fill-amber-400 dark:fill-toy-yellow" />
            <div className="text-left">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block leading-tight">
                {t("yourPoints")}
              </span>
              <span className="text-2xl font-black text-amber-600 dark:text-toy-yellow font-fredoka">
                {userPoints}{" "}
                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">{t("pointsTag")}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Vouchers Grid */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {displayVouchers.map((voucher) => {
            const isClaimed = claimedVouchers.includes(voucher.code);
            const isActive = activeVoucher?.code === voucher.code;
            const canAfford = userPoints >= voucher.pointsCost;
            const pointsNeeded = Math.max(0, voucher.pointsCost - userPoints);

            return (
              <motion.div
                key={voucher.code}
                whileHover={{ y: -6 }}
                className={`relative rounded-3xl p-5 border-2 flex flex-col justify-between transition-all overflow-hidden ${
                  isActive
                    ? "bg-white dark:bg-slate-900 border-amber-500 dark:border-toy-yellow shadow-toy-glow"
                    : "bg-white/90 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-slate-700 shadow-sm"
                }`}
              >
                {/* Perforated Ticket Notches on Top Left & Top Right */}
                <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-850" />
                <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-850" />

                <div>
                  {/* Tier Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r ${voucher.colorGrad || "from-emerald-500 to-teal-600"}`}
                    >
                      {voucher.badge || "PROMO"}
                    </span>
                    <span className="text-xs font-black text-amber-600 dark:text-toy-yellow flex items-center gap-1 font-fredoka">
                      <Star className="w-3.5 h-3.5 fill-amber-500 dark:fill-toy-yellow" />
                      <span>{voucher.pointsCost} pts</span>
                    </span>
                  </div>

                  {/* Discount Display */}
                  <div className="my-2">
                    <div className="text-3xl font-black text-slate-900 dark:text-white font-fredoka">
                      {voucher.discountType === "fixed"
                        ? `$${voucher.fixedDiscountUsd?.toFixed(2)} OFF`
                        : `${voucher.discountPct}% OFF`}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-1">
                      {language === "km" ? voucher.descriptionKh : voucher.description}
                    </p>
                  </div>

                  {/* Voucher Code Box */}
                  <div className="my-3 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-emerald-700 dark:text-toy-cyan tracking-widest">
                      {voucher.code}
                    </span>
                    <Ticket className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                  {isActive ? (
                    <div className="py-2.5 px-4 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-400 font-black text-xs text-center flex items-center justify-center gap-1.5 font-fredoka">
                      <Check className="w-4 h-4" />
                      <span>{t("claimed")}</span>
                    </div>
                  ) : isClaimed ? (
                    <button
                      onClick={() => applyVoucherCode(voucher.code)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-black text-xs font-fredoka transition-all flex items-center justify-center gap-1.5 shadow-toy-green-glow"
                    >
                      <span>{t("applyNow")}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : canAfford ? (
                    <button
                      onClick={() => handleExchange(voucher)}
                      className="w-full py-2.5 px-4 rounded-xl font-black text-white bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-700 hover:from-emerald-400 hover:to-green-500 font-fredoka text-xs transition-all shadow-toy-green-glow border-b-2 border-emerald-900 flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Coins className="w-4 h-4" />
                      <span>{t("exchangeBtn")} ({voucher.pointsCost} pt)</span>
                    </button>
                  ) : (
                    <div className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-950 text-slate-500 font-bold text-[11px] text-center border border-slate-200 dark:border-slate-850">
                      {t("needMorePoints", { n: pointsNeeded })}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* How to Earn Points Rules Strip */}
        <div className="relative z-10 mt-10 p-5 rounded-2xl bg-white/90 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-toy-cyan/20 text-emerald-700 dark:text-toy-cyan flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">{t("howEarnTitle")}:</span>
              <span className="text-slate-600 dark:text-slate-400">
                {t("earnRule1")} • {t("earnRule2")}
              </span>
            </div>
          </div>

          <a
            href="#toy-catalog"
            onClick={() => sounds.playPop()}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-700 dark:text-toy-yellow font-bold text-xs font-fredoka flex items-center gap-1.5 transition-all whitespace-nowrap shadow-sm"
          >
            <span>{t("exploreCatalog")}</span>
          </a>
        </div>
      </div>
    </section>
  );
};

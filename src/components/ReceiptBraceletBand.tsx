"use client";

import React, { useState } from "react";
import { CustomBraceletItem, Charm } from "@/types/store";
import { ConnectedCharmLink } from "./ConnectedCharmLink";
import { Sparkles, Layers } from "lucide-react";

interface ReceiptBraceletBandProps {
  bracelet: CustomBraceletItem;
  compact?: boolean;
}

export const ReceiptBraceletBand: React.FC<ReceiptBraceletBandProps> = ({
  bracelet,
  compact = false,
}) => {
  const [highlightedSlot, setHighlightedSlot] = useState<number | null>(null);

  if (!bracelet || !bracelet.charms || bracelet.charms.length === 0) {
    return null;
  }

  // Normalise charms list (handles both { slot, charm } and direct charm objects)
  const normalizedCharms: { slotIndex: number; charm: Charm }[] = bracelet.charms.map((item, idx) => {
    if ("charm" in item && item.charm) {
      return {
        slotIndex: typeof item.slot === "number" ? item.slot : idx,
        charm: item.charm,
      };
    }
    return {
      slotIndex: idx,
      charm: item as unknown as Charm,
    };
  });

  const finish = bracelet.finish || "silver";
  const finishNames: Record<string, string> = {
    silver: "316L Polished Inox Silver",
    gold: "18K Yellow Gold Ion-Plating",
    rose: "18K Rose Gold Champagne",
    black: "Tactical Matte Obsidian Black",
  };

  const finishDots: Record<string, string> = {
    silver: "bg-slate-300 border-slate-400",
    gold: "bg-amber-400 border-amber-500",
    rose: "bg-rose-300 border-rose-400",
    black: "bg-slate-800 border-slate-700",
  };

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/30 overflow-hidden shadow-sm my-2 text-slate-900 dark:text-white print:border-slate-300">
      {/* 1. Header Spec Bar */}
      <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-black font-fredoka text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Custom Italian Modular Bracelet</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700/50">
                {normalizedCharms.length} Links
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full border ${finishDots[finish] || finishDots.silver}`} />
                <span className="font-semibold">{finishNames[finish] || finish.toUpperCase()}</span>
              </span>
              <span>·</span>
              <span className="capitalize font-semibold text-emerald-600 dark:text-emerald-400">
                {bracelet.packaging === "premium" ? "🎁 Luxury Velvet Gift Box" : "📦 Presentation Packaging"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Full Connected Bracelet Row (Interlocking ribbon track showing exact band sequence) */}
      <div className="p-3 sm:p-4 bg-slate-100 dark:bg-slate-950/80">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-emerald-500" />
            <span>Assembled Modular Band (Slot #1 to #{normalizedCharms.length}):</span>
          </span>
          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold normal-case">
            ← Scroll horizontally to inspect full band →
          </span>
        </div>

        {/* The Seamless Zero-Gap Connected Ribbon Track */}
        <div className="w-full overflow-x-auto py-2 px-1 scrollbar-thin touch-pan-x [-webkit-overflow-scrolling:touch]">
          <div className="flex items-center min-w-max mx-auto py-1">
            {normalizedCharms.map(({ slotIndex, charm }, idx) => (
              <div
                key={`receipt-slot-${idx}-${charm.id || slotIndex}`}
                className="flex flex-col items-center flex-shrink-0"
                onMouseEnter={() => setHighlightedSlot(slotIndex)}
                onMouseLeave={() => setHighlightedSlot(null)}
              >
                <ConnectedCharmLink
                  charm={charm}
                  slotIndex={slotIndex}
                  finish={finish}
                  isSelected={highlightedSlot === slotIndex}
                  onSelect={() => setHighlightedSlot(highlightedSlot === slotIndex ? null : slotIndex)}
                  size={compact ? "compact" : "preview"}
                />

                {/* Slot Number Tag */}
                <span
                  className={`mt-1 text-[8px] font-mono font-black px-1.5 py-0.5 rounded transition-all ${
                    highlightedSlot === slotIndex
                      ? "bg-emerald-500 text-white scale-110 shadow-xs"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  #{slotIndex + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

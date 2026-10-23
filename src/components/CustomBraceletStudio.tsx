"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Trash2,
  Zap,
  ShoppingCart,
  Plus,
  Check,
  Search,
  Dices,
  CircleDot,
  X,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
  Package,
  Share2,
  Copy,
  Code,
  ExternalLink,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Charm, CustomBraceletItem } from "@/types/store";
import { useStore } from "@/context/StoreContext";
import { sounds } from "@/utils/audio";
import { formatPrice } from "@/utils/currency";
import { ConnectedCharmLink } from "./ConnectedCharmLink";
import { getCharmCode } from "@/data/charms";
import {
  generateBraceletCode,
  parseBraceletCode,
  generateBraceletShareUrl,
} from "@/lib/braceletCode";
import Image from "next/image";
import Link from "next/link";

interface AppliedStyleModalData {
  finish: "silver" | "gold" | "rose" | "black";
  charmsCount: number;
  charms: Charm[];
  code: string;
}

interface CustomBraceletStudioProps {
  standalone?: boolean;
  isAdminMode?: boolean;
  onAddAsProduct?: (braceletData: {
    name: string;
    nameKh: string;
    price: number;
    bio: string;
    image: string;
    charms: { slotIndex: number; charm: Charm }[];
    finish: string;
  }) => void;
  onOpenAddCharmModal?: () => void;
}

export const CustomBraceletStudio: React.FC<CustomBraceletStudioProps> = ({
  standalone = false,
  isAdminMode = false,
  onAddAsProduct,
  onOpenAddCharmModal,
}) => {
  const { addCustomBraceletToCart, currency, t, language, charms, deleteCharm } = useStore();

  const MIN_CHARMS = 16;

  const [finish, setFinish] = useState<"silver" | "gold" | "rose" | "black">("silver");
  // The preview starts completely EMPTY; only has elements when customer clicks charms
  const [slots, setSlots] = useState<Charm[]>([]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [packaging, setPackaging] = useState<"basic" | "premium">("basic");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [charmSearch, setCharmSearch] = useState<string>("");
  const [viewMode, setViewMode] = useState<"ribbon" | "wrist">("ribbon");
  const [charmSize, setCharmSize] = useState<"large" | "compact">("large");
  const [isViewBarMinimized, setIsViewBarMinimized] = useState<boolean>(false);
  const ribbonScrollRef = useRef<HTMLDivElement>(null);
  const prevSlotsCountRef = useRef(slots.length);

  // Shareable Friend Bracelet Code System & Search Bar
  const [friendCodeInput, setFriendCodeInput] = useState<string>("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [codeModalOpen, setCodeModalOpen] = useState<boolean>(false);
  const [codeInputValue, setCodeInputValue] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [styleLoadFeedback, setStyleLoadFeedback] = useState<string | null>(null);
  const [appliedModalData, setAppliedModalData] = useState<AppliedStyleModalData | null>(null);

  const premiumBoxPrice = 0.5;

  // Real-time live detection for friend code input
  const liveParsedPreview = useMemo(() => {
    const trimmed = friendCodeInput.trim();
    if (trimmed.length < 2) return null;
    return parseBraceletCode(trimmed, charms || []);
  }, [friendCodeInput, charms]);

  // Current build code for sharing
  const currentBuildCode = useMemo(() => {
    return generateBraceletCode(finish, slots);
  }, [finish, slots]);

  // Detect if user pasted a full bracelet code into bottom charm search bar
  const detectedStyle = useMemo(() => {
    const q = charmSearch.trim();
    if (q.length >= 6 && (q.toUpperCase().startsWith("SRB-") || q.includes(":"))) {
      return parseBraceletCode(q, charms || []);
    }
    return null;
  }, [charmSearch, charms]);

  // Auto-load style code if passed in URL query param (?code= or ?style=)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const codeParam = urlParams.get("code") || urlParams.get("style");
      if (codeParam) {
        const parsed = parseBraceletCode(codeParam, charms || []);
        if (parsed) {
          setFinish(parsed.finish);
          setSlots(parsed.charms);
          setSelectedSlotIndex(null);
          setFriendCodeInput(codeParam);
          sounds.playFanfare();
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.5 },
          });
          setStyleLoadFeedback(
            `Loaded shared bracelet style with ${parsed.charms.length} links in ${parsed.finish.toUpperCase()}! 🎉`
          );
          setAppliedModalData({
            finish: parsed.finish,
            charmsCount: parsed.charms.length,
            charms: parsed.charms,
            code: codeParam,
          });
        }
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
  }, [charms]);

  // Auto-scroll ribbon horizontally to the newly added charm so customer always sees design evolve
  useEffect(() => {
    if (slots.length > prevSlotsCountRef.current && ribbonScrollRef.current) {
      setTimeout(() => {
        if (ribbonScrollRef.current) {
          ribbonScrollRef.current.scrollTo({
            left: ribbonScrollRef.current.scrollWidth,
            behavior: "smooth",
          });
        }
      }, 50);
    }
    prevSlotsCountRef.current = slots.length;
  }, [slots.length]);

  // Paste code directly from clipboard
  const handlePasteFromClipboard = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setFriendCodeInput(text.trim());
          setInputError(null);
          const parsed = parseBraceletCode(text.trim(), charms || []);
          if (parsed) {
            sounds.playPop();
          }
        }
      }
    } catch (err) {
      // Fallback gracefully
    }
  };

  // Copy shareable bracelet style code
  const handleCopyBraceletCode = () => {
    const code = currentBuildCode;
    if (!code) return;
    sounds.playFanfare();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    setCopiedCode(true);
    setStyleLoadFeedback(`Copied code: ${code} — Share with your friend! 🎁`);
    setTimeout(() => {
      setCopiedCode(false);
      setStyleLoadFeedback(null);
    }, 4500);
  };

  // Copy shareable direct web link
  const handleCopyShareLink = () => {
    const code = currentBuildCode;
    if (!code) return;
    const url = generateBraceletShareUrl(code);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    sounds.playFanfare();
    setCopiedLink(true);
    setStyleLoadFeedback(`Share link copied: ${url} — Send to your friend! 🔗`);
    setTimeout(() => {
      setCopiedLink(false);
      setStyleLoadFeedback(null);
    }, 4500);
  };

  // Apply parsed bracelet style to studio and trigger popup modal
  const handleApplyStyle = (parsed: {
    finish: "silver" | "gold" | "rose" | "black";
    charms: Charm[];
  }) => {
    sounds.playFanfare();
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.5 },
      colors: ["#10b981", "#fbbf24", "#38bdf8", "#ec4899", "#34d399"],
    });

    setFinish(parsed.finish);
    setSlots(parsed.charms);
    setSelectedSlotIndex(null);
    setCharmSearch("");
    setCodeModalOpen(false);
    setCodeInputValue("");
    setInputError(null);

    const fullCode = generateBraceletCode(parsed.finish, parsed.charms);
    setFriendCodeInput(fullCode);

    setAppliedModalData({
      finish: parsed.finish,
      charmsCount: parsed.charms.length,
      charms: parsed.charms,
      code: fullCode,
    });

    setStyleLoadFeedback(
      `Loaded exact design: ${parsed.charms.length} links in ${parsed.finish.toUpperCase()}! 🎉`
    );
    setTimeout(() => setStyleLoadFeedback(null), 5000);

    setTimeout(() => {
      const elem = document.getElementById("bracelet-view-box");
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 250);
  };

  // Handle "Apply Style" button click from the main search bar
  const handleApplyFriendCode = () => {
    const query = friendCodeInput.trim();
    if (!query) {
      setInputError("Please enter or paste your friend's bracelet code first!");
      sounds.playPop();
      return;
    }

    const parsed = parseBraceletCode(query, charms || []);
    if (!parsed) {
      setInputError(
        "Invalid bracelet code. Please verify the code (e.g. SRB-S:GF1-P01-P02...) or paste the full share link."
      );
      sounds.playPop();
      return;
    }

    setInputError(null);
    handleApplyStyle(parsed);
  };

  // Add charm to ribbon track (appends with no limit)
  const handleAddCharm = (charm: Charm) => {
    sounds.playCharmSnap();
    setSlots((prev) => {
      if (selectedSlotIndex !== null && selectedSlotIndex < prev.length) {
        const copy = [...prev];
        copy[selectedSlotIndex] = charm;
        setSelectedSlotIndex(null);
        return copy;
      }
      return [...prev, charm];
    });
  };

  // Remove charm from specific slot
  const handleRemoveSlot = (slotIdx: number) => {
    sounds.playPop();
    setSlots((prev) => prev.filter((_, i) => i !== slotIdx));
    if (selectedSlotIndex === slotIdx) {
      setSelectedSlotIndex(null);
    }
  };

  // Clear all charms back to completely empty
  const handleClearAll = () => {
    sounds.playPop();
    setSlots([]);
    setSelectedSlotIndex(null);
  };

  // Randomize with surprise mix of charms (auto-fills to minimum 16 charms if charms exist)
  const handleRandomize = () => {
    sounds.playFanfare();
    const available = charms && charms.length > 0 ? charms : [];
    if (available.length === 0) return;

    const count = 16;
    const newSlots = Array(count)
      .fill(null)
      .map(() => {
        return available[Math.floor(Math.random() * available.length)];
      });
    setSlots(newSlots);
    setSelectedSlotIndex(null);
  };

  const activeCharmsCount = slots.length;
  const isMinimumReached = activeCharmsCount >= MIN_CHARMS;
  const charmsNeededForMin = Math.max(0, MIN_CHARMS - activeCharmsCount);
  const progressPercent = Math.min(100, (activeCharmsCount / MIN_CHARMS) * 100);

  // Dynamic price calculation: sum of all attached charms
  const totalCharmsPrice = slots.reduce((acc, c) => acc + (c?.price || 1.5), 0);
  const totalPriceUsd = totalCharmsPrice + (packaging === "premium" ? premiumBoxPrice : 0);
  const rewardPoints = Math.max(10, Math.round(totalPriceUsd * 1.5));

  // Estimated wrist circumference based on attached 9mm links
  const estimatedWristCm = activeCharmsCount > 0 ? (activeCharmsCount * 0.95 + 1.2).toFixed(1) : "0";

  // Extract unique categories from actual charms list
  const allCategories = useMemo(() => {
    const list = charms && charms.length > 0 ? charms : [];
    const set = new Set(list.map((c) => c.category || "emblem"));
    return ["all", ...Array.from(set)];
  }, [charms]);

  // Filtered charms based on category, name, or short code
  const filteredCharms = useMemo(() => {
    const list = charms && charms.length > 0 ? charms : [];
    const q = charmSearch.trim().toLowerCase();

    // If search is a full bracelet code, don't filter out charms
    if (q.startsWith("srb-") || q.includes(":")) {
      return list;
    }

    return list.filter((c) => {
      const matchCat = selectedCategory === "all" || c.category === selectedCategory;
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.nameKh && c.nameKh.toLowerCase().includes(q)) ||
        (c.category && c.category.toLowerCase().includes(q)) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        getCharmCode(c, charms).toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [charms, selectedCategory, charmSearch]);

  const handleAddToCart = () => {
    if (!isMinimumReached) {
      sounds.playPop();
      alert(
        `Please attach at least ${MIN_CHARMS} charms to assemble your Italian modular bracelet! (Current: ${activeCharmsCount}/${MIN_CHARMS})`
      );
      return;
    }

    const charmsAttached: { slot: number; charm: Charm }[] = slots.map((c, idx) => ({
      slot: idx,
      charm: c,
    }));

    const customItem: CustomBraceletItem = {
      id: `custom-bracelet-${Date.now()}`,
      styleId: `italian-band-${finish}-${activeCharmsCount}`,
      finish,
      sizeLinks: activeCharmsCount,
      charms: charmsAttached,
      packaging,
      unitPrice: totalPriceUsd,
      quantity: 1,
      points: rewardPoints,
    };

    addCustomBraceletToCart(customItem);
  };

  const finishDescriptions = {
    silver: "Original 316L Surgical Inox Steel (Polished Silver)",
    gold: "18K Yellow Gold Vacuum Ion-Plating",
    rose: "18K Rose Gold Champagne Ion-Plating",
    black: "Tactical Matte Obsidian Black PVD",
  };

  return (
    <section id="custom-bracelet-studio" className="py-6 sm:py-10 px-3 sm:px-6 max-w-7xl mx-auto">
      {/* Section Header */}
      {!standalone && (
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-600/40 text-emerald-800 dark:text-emerald-300 text-xs font-black tracking-wider uppercase mb-3 font-fredoka">
            <Sparkles className="w-4 h-4 text-emerald-500 animate-spin" style={{ animationDuration: "8s" }} />
            <span>Authentic Italian Modular Workshop</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white font-fredoka tracking-tight">
            Customize Italy Charm Bracelet
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 font-medium leading-relaxed">
            Start with an empty band and tap any charm to connect. Assemble at least 16 charms to complete your custom bracelet with no upper limit!
          </p>
        </div>
      )}

      <div className="space-y-6 sm:space-y-8">
        {/* ==================================================== */}
        {/* TOP SEARCH & STYLE SHARING BAR                      */}
        {/* ==================================================== */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-green-500/10 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-900 border-2 border-emerald-500/40 rounded-3xl p-4 sm:p-6 shadow-lg space-y-4 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-black uppercase font-fredoka tracking-wider border border-emerald-300 dark:border-emerald-700/60 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-spin" style={{ animationDuration: "6s" }} />
                <span>Friend Style Code System</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black font-fredoka text-slate-900 dark:text-white">
                Load Friend&apos;s Finished Bracelet Build
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                Paste the finished bracelet code your friend gave you and click{" "}
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Apply Style</strong>{" "}
                to pop up their exact finish and charms on your screen!
              </p>
            </div>

            {activeCharmsCount > 0 && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/60 shadow-xs flex-shrink-0 self-start sm:self-auto">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold font-fredoka text-slate-700 dark:text-slate-300">
                  Your Current Build:{" "}
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">
                    {activeCharmsCount} Links
                  </span>{" "}
                  ({finish.toUpperCase()})
                </span>
              </div>
            )}
          </div>

          {/* Search Bar Input & Apply Style Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
              <input
                type="text"
                value={friendCodeInput}
                onChange={(e) => {
                  setFriendCodeInput(e.target.value);
                  setInputError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyFriendCode();
                  }
                }}
                placeholder="Paste friend's bracelet code here (e.g. SRB-S:GF1-P01-P02...)"
                className="w-full pl-10 pr-28 py-3 rounded-2xl bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 focus:border-emerald-500 dark:focus:border-emerald-500 text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none shadow-xs transition-all"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {friendCodeInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setFriendCodeInput("");
                      setInputError(null);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                    title="Clear input"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold font-fredoka flex items-center gap-1 active:scale-95 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                  title="Paste from clipboard"
                >
                  <Copy className="w-3 h-3 text-emerald-500" />
                  <span>Paste</span>
                </button>
              </div>
            </div>

            {/* Apply Style Button */}
            <button
              type="button"
              onClick={handleApplyFriendCode}
              disabled={!friendCodeInput.trim()}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-700 hover:from-emerald-400 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-fredoka font-black text-sm tracking-wide shadow-toy-green-glow border-b-4 border-emerald-950 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Apply Style ✨</span>
            </button>
          </div>

          {/* Live Preview of Detected Bracelet Style */}
          {liveParsedPreview && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-white dark:bg-slate-950 border border-emerald-400 dark:border-emerald-700/60 shadow-xs animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Ready to Load:
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-black uppercase font-fredoka">
                  {liveParsedPreview.finish} Inox
                </span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-fredoka">
                  {liveParsedPreview.charms.length} Charms Connected
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleApplyStyle(liveParsedPreview)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-fredoka font-black text-xs flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
              >
                <span>Click to Apply Now 🚀</span>
              </button>
            </div>
          )}

          {/* Input Error Feedback */}
          {inputError && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 shadow-xs">
              <Info className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{inputError}</span>
            </div>
          )}

          {/* Current Finished Build Code (Give to friend) */}
          {activeCharmsCount > 0 && (
            <div className="pt-3.5 border-t border-slate-200 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-black font-fredoka text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Your Finished Build Code (Give this to your friend):</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Copy this code and send it to your friend. When they paste it in the bar above and click Apply Style, your design pops up on their browser!
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-mono font-black text-emerald-700 dark:text-emerald-400 max-w-[200px] sm:max-w-xs truncate select-all">
                  {currentBuildCode}
                </div>

                <button
                  type="button"
                  onClick={handleCopyBraceletCode}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-fredoka font-black text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                  title="Copy finish build bracelet code"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? "Code Copied! 📋" : "Copy Code"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  title="Copy direct share link for friend"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copiedLink ? "Link Copied! 🔗" : "Share Link"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* STEP 1: BAND FINISH SELECTION & WRIST FIT GUIDE      */}
        {/* ==================================================== */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-md space-y-4 transition-colors duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            {/* Finish Selection */}
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">
                1. Select Band Finish (316L Inox Steel):
              </span>
              <div className="flex flex-wrap gap-2">
                {(["silver", "gold", "rose", "black"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      sounds.playPop();
                      setFinish(f);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black capitalize transition-all border flex items-center gap-1.5 ${
                      finish === f
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-toy-green-glow scale-105"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750"
                    }`}
                  >
                    <span
                      className={`w-3 h-3 rounded-full border border-black/20 ${
                        f === "silver"
                          ? "bg-slate-300"
                          : f === "gold"
                          ? "bg-amber-400"
                          : f === "rose"
                          ? "bg-rose-300"
                          : "bg-slate-800"
                      }`}
                    />
                    <span>{f} Inox</span>
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1.5 italic">
                {finishDescriptions[finish]}
              </span>
            </div>

            {/* Bracelet Size & Sizing Guide */}
            <div className="text-left sm:text-right">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                2. Live Band Length:
              </span>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/50">
                <span className="font-fredoka font-black text-base text-emerald-700 dark:text-emerald-400">
                  {activeCharmsCount} Charms
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  (~{estimatedWristCm} cm fit)
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                Min: 16 links · No maximum limit
              </span>
            </div>
          </div>

          {/* Progress towards 16 Charms Minimum */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-500" />
                <span>Bracelet Assembly Status:</span>
              </span>
              <span
                className={`font-black font-fredoka ${
                  isMinimumReached
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {activeCharmsCount} / {MIN_CHARMS} Charms{" "}
                {isMinimumReached ? "✓ Minimum Reached (Add more freely!)" : `(Need ${charmsNeededForMin} more)`}
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isMinimumReached
                    ? "bg-gradient-to-r from-emerald-500 via-green-500 to-teal-400 shadow-toy-green-glow"
                    : "bg-gradient-to-r from-amber-400 to-emerald-500"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* STEP 2: STICKY INTERCONNECTED BRACELET VIEW BAR      */}
        {/* STUCK AT TOP: Remains pinned while customer scrolls! */}
        {/* ==================================================== */}
        <div
          id="bracelet-view-box"
          className="sticky top-20 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 border-emerald-500/70 dark:border-emerald-500/60 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xl shadow-emerald-950/20 space-y-3 transition-all duration-200"
        >
          {/* Header Bar with Live Info, Quick Controls & CTA */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Left: Indicator, Finish Switcher & Live Link Count */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-black text-slate-900 dark:text-white font-fredoka text-xs sm:text-sm">
                  Live Bracelet View
                </span>
              </div>

              {/* Quick Finish Dot Switcher */}
              <div
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                title={`Current finish: ${finish.toUpperCase()} (Tap dot to switch finish)`}
              >
                {(["silver", "gold", "rose", "black"] as const).map((f) => (
                  <button
                    key={`quick-finish-${f}`}
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setFinish(f);
                    }}
                    title={`Switch to ${f} Inox`}
                    className={`w-4 h-4 rounded-full border transition-all ${
                      finish === f
                        ? "scale-125 border-emerald-500 ring-2 ring-emerald-400/50 shadow-xs"
                        : "opacity-60 hover:opacity-100 border-black/20"
                    } ${
                      f === "silver"
                        ? "bg-slate-300"
                        : f === "gold"
                        ? "bg-amber-400"
                        : f === "rose"
                        ? "bg-rose-300"
                        : "bg-slate-900"
                    }`}
                  />
                ))}
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase ml-0.5 font-mono hidden xs:inline">
                  {finish}
                </span>
              </div>

              {/* Live Count Badge */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black font-fredoka border ${
                  isMinimumReached
                    ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-400 dark:border-emerald-600/60"
                    : "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60"
                }`}
              >
                {activeCharmsCount} / {MIN_CHARMS} Links {isMinimumReached ? "✓ Ready" : `(need ${charmsNeededForMin})`}
              </span>
            </div>

            {/* Right: Live Price, View Mode, Controls & Quick Add to Cart */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap ml-auto">
              {/* Total Price Badge */}
              <span className="font-black font-fredoka text-xs sm:text-sm text-amber-600 dark:text-toy-yellow px-2.5 py-0.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40">
                {formatPrice(totalPriceUsd, currency)}
              </span>

              {/* View Mode Toggle (Desktop) */}
              <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setViewMode("ribbon");
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                    viewMode === "ribbon"
                      ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Ribbon View"
                >
                  <Layers className="w-3 h-3" />
                  <span>Ribbon</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setViewMode("wrist");
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                    viewMode === "wrist"
                      ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Wrist Loop View"
                >
                  <CircleDot className="w-3 h-3" />
                  <span>Loop</span>
                </button>
              </div>

              {/* Quick Surprise 16 Mix */}
              <button
                type="button"
                onClick={handleRandomize}
                disabled={!charms || charms.length === 0}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] sm:text-xs font-bold flex items-center gap-1 transition-all active:scale-95 border border-slate-300 dark:border-slate-700 disabled:opacity-50"
                title="Randomize 16 charms starter mix"
              >
                <Dices className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Surprise 16</span>
              </button>

              {/* Quick Clear Button */}
              {activeCharmsCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 text-[10px] sm:text-xs font-bold flex items-center gap-1 border border-rose-200 dark:border-rose-800/60 active:scale-95 transition-all"
                  title="Clear all attached charms"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}

              {/* Quick Checkout CTA Button when 16 minimum reached */}
              {isMinimumReached && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playFanfare();
                    const elem = document.getElementById("packaging-checkout-box");
                    if (elem) {
                      elem.scrollIntoView({ behavior: "smooth", block: "start" });
                    } else {
                      handleAddToCart();
                    }
                  }}
                  className="px-3.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black font-fredoka text-[11px] sm:text-xs shadow-toy-green-glow hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
                  title="Minimum 16 charms reached! Click to review packaging & checkout"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>{isAdminMode ? "Publish 👇" : "Checkout 🛒"}</span>
                </button>
              )}

              {/* Minimize / Expand Toggle */}
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setIsViewBarMinimized(!isViewBarMinimized);
                }}
                className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                title={isViewBarMinimized ? "Expand bracelet view bar" : "Minimize bracelet view bar"}
              >
                {isViewBarMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* VIEW TRACK: The seamless horizontal scrolling ribbon */}
          {!isViewBarMinimized && (
            <div className="relative rounded-2xl bg-slate-100 dark:bg-gradient-to-r dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-2 border-slate-300 dark:border-slate-800 p-2 sm:p-4 overflow-hidden shadow-inner flex items-center justify-center">
              {/* Metallic Sheen Glint Animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[marquee_6s_linear_infinite] pointer-events-none" />

              {activeCharmsCount === 0 ? (
                <div className="py-4 px-2 flex flex-col items-center justify-center text-center space-y-1 select-none">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-dashed border-emerald-500/40 flex items-center justify-center text-emerald-500">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <h4 className="font-black text-xs sm:text-sm font-fredoka text-slate-900 dark:text-white">
                    Your Italian Charm Band is Empty
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm">
                    Tap any charm in the palette below to connect! Minimum <strong className="text-emerald-600 dark:text-emerald-400">16 charms</strong> to assemble.
                  </p>
                </div>
              ) : viewMode === "ribbon" ? (
                /* FLAT INTERLOCKING RIBBON TRACK with smooth auto-scroll */
                <div
                  ref={ribbonScrollRef}
                  className="w-full flex items-center overflow-x-auto py-2 px-1 scrollbar-thin touch-pan-x [-webkit-overflow-scrolling:touch]"
                >
                  <div className="flex items-center min-w-max mx-auto py-0.5">
                    {slots.map((charm, idx) => (
                      <ConnectedCharmLink
                        key={`slot-${idx}-${charm.id}`}
                        charm={charm}
                        slotIndex={idx}
                        finish={finish}
                        isSelected={selectedSlotIndex === idx}
                        onSelect={() => {
                          sounds.playPop();
                          setSelectedSlotIndex(selectedSlotIndex === idx ? null : idx);
                        }}
                        onRemove={() => handleRemoveSlot(idx)}
                        size="workbench"
                      />
                    ))}

                    {/* Dynamic Next Slot Indicator */}
                    <div
                      className="w-[58px] sm:w-[68px] aspect-[1.14/1] rounded-xl border-2 border-dashed border-emerald-400/50 flex flex-col items-center justify-center text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 flex-shrink-0 cursor-default"
                      title="Tap charms below to keep adding!"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 animate-pulse" />
                      <span className="text-[8px] sm:text-[9px] font-black font-fredoka uppercase tracking-wider">
                        #{activeCharmsCount + 1}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* WRIST LOOP PERSPECTIVE */
                <div className="py-3 flex flex-col items-center justify-center relative w-full">
                  <div className="w-56 sm:w-64 h-36 sm:h-40 rounded-full border-2 border-dashed border-emerald-400/40 flex items-center justify-center relative p-3">
                    <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 font-fredoka">
                      Wrist Loop (~{estimatedWristCm} cm)
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                      <div className="flex items-center justify-center flex-wrap gap-1 max-w-[200px]">
                        {slots.slice(0, 10).map((charm, idx) => (
                          <ConnectedCharmLink
                            key={`wrist-preview-${idx}`}
                            charm={charm}
                            slotIndex={idx}
                            finish={finish}
                            size="compact"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* STEP 3: CHARM PALETTE (BELOW THE STICKY VIEW BAR)   */}
        {/* Shows 16 charms per row on PC, 4x4 view on Mobile    */}
        {/* ==================================================== */}
        <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4 transition-colors duration-200">
          {/* Header with Title, Count, Price Range, and Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-fredoka flex items-center gap-2">
                  <span>Italy Charms Palette</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700/50">
                    {filteredCharms.length} Charms Available
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tap any charm to connect it into your bracelet above · Select from our high quality Italian charms
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Density View Toggle: Large (Easy to see) vs Compact */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setCharmSize("large");
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    charmSize === "large"
                      ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Large Charms (High Visibility)"
                >
                  <span>🔍 Large View</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setCharmSize("compact");
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    charmSize === "compact"
                      ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Compact Grid"
                >
                  <span>Compact</span>
                </button>
              </div>

              {/* Charm Search Bar & Load Friend's Code */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={charmSearch}
                    onChange={(e) => setCharmSearch(e.target.value)}
                    placeholder="Search by name or code (GF1, P01)..."
                    className="w-full pl-8 pr-7 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-emerald-500 transition-all font-medium"
                  />
                  {charmSearch && (
                    <button
                      onClick={() => setCharmSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Paste / Load Friend's Bracelet Code Button */}
                <button
                  type="button"
                  onClick={() => setCodeModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap cursor-pointer shadow-xs"
                  title="Paste your friend's bracelet code to get their exact style"
                >
                  <Code className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Load Friend's Code</span>
                </button>
              </div>
            </div>
          </div>

          {/* Detected Bracelet Style Code Banner (If user pasted a bracelet code) */}
          {detectedStyle && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 border-2 border-emerald-500/50 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: "6s" }} />
                </div>
                <div>
                  <div className="font-fredoka font-black text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                    <span>Valid Bracelet Style Code Detected!</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-bold uppercase">
                      {detectedStyle.finish} · {detectedStyle.charms.length} Charms
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                    Tap to apply this exact design and finish to your bracelet above!
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleApplyStyle(detectedStyle)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-fredoka font-black text-xs shadow-sm active:scale-95 cursor-pointer"
              >
                Apply Style Now ✨
              </button>
            </div>
          )}

          {/* Style Load Feedback Toast */}
          {styleLoadFeedback && (
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-400 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{styleLoadFeedback}</span>
            </div>
          )}

          {/* Category Filter Pills (Only shown if categories exist) */}
          {allCategories.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {allCategories.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    sounds.playPop();
                    setSelectedCategory(c);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                    selectedCategory === c
                      ? "bg-emerald-600 text-white shadow-toy-green-glow"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {c === "all" ? "All Motifs" : c}
                </button>
              ))}
            </div>
          )}

          {/* Charms Grid / Empty Notice */}
          {filteredCharms.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
              <Sparkles className="w-10 h-10 mx-auto text-emerald-500 dark:text-emerald-400" />
              <h4 className="font-black text-sm font-fredoka text-slate-800 dark:text-slate-200">
                {charms && charms.length === 0
                  ? isAdminMode
                    ? "Charm Inventory is Empty"
                    : "Italian Charms Collection"
                  : "No charms matched"}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                {charms && charms.length === 0
                  ? isAdminMode
                    ? "Upload charm photos from your device to assemble bracelets and publish products!"
                    : "Our custom Italian charm collection is being refreshed! Please check back shortly to assemble your personalized band."
                  : `No charms found matching "${charmSearch}".`}
              </p>
              {isAdminMode && charms && charms.length === 0 && onOpenAddCharmModal && (
                <button
                  onClick={onOpenAddCharmModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black font-fredoka text-xs shadow-md transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Charm Photo from Device 📸</span>
                </button>
              )}
            </div>
          ) : (
            /* HIGH VISIBILITY CHARMS GRID (4x4 on mobile phone, responsive on tablet/desktop) */
            <div
              className={
                charmSize === "large"
                  ? "grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-1.5 sm:gap-3"
                  : "grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-1.5 sm:gap-2"
              }
            >
              {filteredCharms.map((charm) => (
                <motion.div
                  key={charm.id}
                  whileHover={{ scale: 1.04, y: -3 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleAddCharm(charm)}
                  className={`relative rounded-xl sm:rounded-2xl bg-black dark:bg-black border-2 border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-400 hover:shadow-[0_4px_20px_rgba(16,185,129,0.25)] active:scale-90 transition-all flex flex-col items-center justify-between cursor-pointer group shadow-lg select-none ${
                    charmSize === "large" ? "p-1.5 sm:p-3" : "p-1 sm:p-1.5"
                  }`}
                  title={`${language === "km" ? charm.nameKh : charm.name} - ${formatPrice(charm.price, currency)} (Tap to attach)`}
                >
                  {/* Admin Delete Charm Button (When running in Admin Mode) */}
                  {isAdminMode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to permanently delete charm "${charm.name}" from the store?`)) {
                          sounds.playPop();
                          deleteCharm(charm.id);
                          setSlots((prev) => prev.filter((c) => c.id !== charm.id));
                        }
                      }}
                      className="absolute top-1 left-1 sm:top-2 sm:left-2 z-20 p-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all active:scale-95"
                      title={`Delete charm "${charm.name}" from store`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}

                  {/* Short Charm Code Tag */}
                  <span
                    className={`absolute top-1 sm:top-2 font-mono font-black text-emerald-300 bg-emerald-950/90 border border-emerald-500/60 shadow-xs rounded z-10 ${
                      isAdminMode ? "left-6 sm:left-9" : "left-1 sm:left-2"
                    } text-[7px] sm:text-[9px] px-1 py-0.2`}
                    title={`Charm Code: ${charm.code || getCharmCode(charm, charms)}`}
                  >
                    #{charm.code || getCharmCode(charm, charms)}
                  </span>

                  {/* Top Popularity badge */}
                  {charm.isPopular && (
                    <span
                      className="absolute top-1 right-1 sm:top-2 sm:right-2 text-amber-300 font-black border border-amber-500/60 pointer-events-none rounded-full bg-amber-950/90 text-[7px] sm:text-[9px] px-1.5 shadow-xs"
                    >
                      ⭐<span className="hidden sm:inline"> Popular</span>
                    </span>
                  )}

                  {/* Charm Face Image */}
                  <div
                    className={`relative my-1 flex items-center justify-center ${
                      charmSize === "large"
                        ? "w-11 h-11 sm:w-16 sm:h-16 md:w-20 md:h-20"
                        : "w-8 h-8 sm:w-11 sm:h-11"
                    }`}
                  >
                    <Image
                      src={charm.image || "/assets/charm_clean.png"}
                      alt={charm.name}
                      fill
                      className="object-contain group-hover:scale-110 transition-transform duration-200 filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.12)]"
                      unoptimized={Boolean(charm.image?.startsWith("data:"))}
                      sizes="(max-width: 640px) 25vw, 120px"
                    />
                  </div>

                  {/* Title & Price */}
                  <div className="w-full text-center mt-0.5 pt-1 border-t border-zinc-800/90">
                    <span
                      className={`block font-black text-white truncate max-w-full leading-tight font-fredoka tracking-tight drop-shadow-xs ${
                        charmSize === "large" ? "text-[10px] sm:text-xs" : "text-[8px] sm:text-[9px]"
                      }`}
                    >
                      {language === "km" ? charm.nameKh : charm.name}
                    </span>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <span
                        className={`font-black font-fredoka text-amber-400 drop-shadow-xs ${
                          charmSize === "large" ? "text-[10px] sm:text-xs" : "text-[9px] sm:text-[10px]"
                        }`}
                      >
                        {formatPrice(charm.price, currency)}
                      </span>
                    </div>

                    {/* Add to Band button on larger screens */}
                    <div className="hidden sm:flex mt-1.5 w-full py-0.5 rounded-lg bg-zinc-900 border border-zinc-700/80 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black group-hover:border-emerald-400 text-[10px] font-bold font-fredoka transition-all items-center justify-center gap-1 shadow-xs">
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* STEP 4: PACKAGING & ORDER REVIEW                    */}
        {/* ==================================================== */}
        <div
          id="packaging-checkout-box"
          className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-6 transition-colors duration-200"
        >
          {/* Bottom Split: Packaging Selector + Order Total & Add to Cart CTA */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Packaging Box Selection */}
            <div className="lg:col-span-5 space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                3. Choose Gift Packaging:
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    sounds.playPop();
                    setPackaging("basic");
                  }}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    packaging === "basic"
                      ? "bg-emerald-100 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-white shadow-toy-green-glow"
                      : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>{t("boxBasic")}</span>
                    {packaging === "basic" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                    $0.00 Included
                  </div>
                </button>

                <button
                  onClick={() => {
                    sounds.playPop();
                    setPackaging("premium");
                  }}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    packaging === "premium"
                      ? "bg-rose-100 dark:bg-toy-pink/20 border-rose-400 dark:border-toy-pink text-rose-900 dark:text-white shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>{t("boxPremium")}</span>
                    {packaging === "premium" && <Check className="w-3.5 h-3.5 text-rose-500" />}
                  </div>
                  <div className="text-[10px] text-rose-600 dark:text-toy-pink font-semibold mt-0.5">
                    +$0.50 Luxury Velvet Box
                  </div>
                </button>
              </div>
            </div>

            {/* Pricing Summary & Checkout CTA */}
            <div className="lg:col-span-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <div className="space-y-0.5">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Total Bracelet ({activeCharmsCount} Links):
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-fredoka text-amber-600 dark:text-toy-yellow">
                    {formatPrice(totalPriceUsd, currency)}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    +{rewardPoints} VIP Points
                  </span>
                </div>
              </div>

              <div className="flex-1 sm:max-w-xs">
                {isAdminMode ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (onAddAsProduct && isMinimumReached) {
                        sounds.playFanfare();
                        onAddAsProduct({
                          name: `Custom Italian Charm Bracelet (${finish.toUpperCase()} · ${activeCharmsCount} Charms)`,
                          nameKh: `ខ្សែដៃម៉ូឌុលអ៊ីតាលី (${finish.toUpperCase()} · ${activeCharmsCount} ផ្លាក)`,
                          price: totalPriceUsd,
                          bio: `Hand-crafted 316L Stainless Steel Italian Modular Bracelet (${finish.toUpperCase()} finish) featuring ${activeCharmsCount} connected charms. Includes quick-spring links, hypoallergenic design, and ${packaging === "premium" ? "Velvet Gift Box" : "presentation packaging"}.`,
                          image: slots[0]?.plateImage || slots[0]?.image || "/assets/charm_clean.png",
                          charms: slots.map((c, idx) => ({ slotIndex: idx, charm: c })),
                          finish,
                        });
                      }
                    }}
                    disabled={!isMinimumReached}
                    className={`w-full py-3.5 px-4 rounded-xl font-black text-white font-fredoka text-sm tracking-wide flex items-center justify-center gap-2 transition-all ${
                      isMinimumReached
                        ? "bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-800 shadow-toy-green-glow border-b-4 border-emerald-950 hover:from-emerald-400 hover:to-green-500 active:scale-95 cursor-pointer"
                        : "bg-slate-400 dark:bg-slate-700 opacity-60 cursor-not-allowed border-b-4 border-slate-500 dark:border-slate-800"
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>
                      {isMinimumReached
                        ? `Publish Product (${activeCharmsCount} Links)`
                        : `Need ${charmsNeededForMin} More Links`}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={!isMinimumReached}
                    className={`w-full py-3.5 px-4 rounded-xl font-black text-white font-fredoka text-sm tracking-wide flex items-center justify-center gap-2 transition-all ${
                      isMinimumReached
                        ? "bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-800 shadow-toy-green-glow border-b-4 border-emerald-950 hover:from-emerald-400 hover:to-green-500 active:scale-95 cursor-pointer"
                        : "bg-slate-400 dark:bg-slate-700 opacity-60 cursor-not-allowed border-b-4 border-slate-500 dark:border-slate-800"
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>
                      {isMinimumReached
                        ? `Add to Cart (${activeCharmsCount} Charms)`
                        : `Min 16 Charms (${activeCharmsCount}/${MIN_CHARMS})`}
                    </span>
                  </button>
                )}

                {/* Copy Style Code for Friends */}
                {activeCharmsCount > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handleCopyBraceletCode}
                      className="py-2 px-2.5 rounded-xl border border-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
                      title="Copy short code for your friend"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied Code! 📋</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copy Code 📋</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyShareLink}
                      className="py-2 px-2.5 rounded-xl border border-teal-500/40 bg-teal-50/80 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
                      title="Copy share link for friend"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-teal-600" />
                          <span>Copied Link! 🔗</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5 text-teal-600" />
                          <span>Share Link 🔗</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MODAL: PASTE FRIEND'S BRACELET CODE                  */}
      {/* ==================================================== */}
      <AnimatePresence>
        {codeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setCodeModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-sm">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black font-fredoka text-slate-900 dark:text-white">
                    Load Friend's Bracelet Design
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Paste your friend's style code below to assemble their exact bracelet!
                  </p>
                </div>
              </div>

              {/* Textarea for code */}
              <div className="space-y-3 my-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Paste Bracelet Code:
                  </label>
                  <textarea
                    rows={3}
                    value={codeInputValue}
                    onChange={(e) => setCodeInputValue(e.target.value)}
                    placeholder="e.g. SRB-S:GF1-P01-P02-CAT-P04-S01..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Live parsed preview */}
                {(() => {
                  const parsed = parseBraceletCode(codeInputValue, charms || []);
                  if (!codeInputValue.trim()) return null;
                  if (!parsed) {
                    return (
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-xs font-medium">
                        ⚠️ Please check your code. Valid formats: <code>SRB-S:GF1-P01...</code> or charm codes separated by hyphens.
                      </div>
                    );
                  }
                  return (
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-400 dark:border-emerald-700/60 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        <span>✨ Detected: {parsed.charms.length} Charms</span>
                        <span className="uppercase px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900">
                          Finish: {parsed.finish}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto scrollbar-thin">
                        {parsed.charms.map((c, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono text-[10px] font-bold border border-emerald-200 dark:border-emerald-800"
                          >
                            #{c.code || getCharmCode(c, charms)}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Apply Button */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const parsed = parseBraceletCode(codeInputValue, charms || []);
                      if (parsed) {
                        handleApplyStyle(parsed);
                      } else {
                        alert("Invalid code. Please check that the code contains valid charm codes.");
                      }
                    }}
                    disabled={!parseBraceletCode(codeInputValue, charms || [])}
                    className="flex-1 py-3 px-4 rounded-xl font-black text-white font-fredoka text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Apply This Exact Style to Bracelet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                        navigator.clipboard.readText().then((clip) => {
                          setCodeInputValue(clip);
                        }).catch(() => {});
                      }
                    }}
                    className="px-3.5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
                    title="Paste from clipboard"
                  >
                    Paste
                  </button>
                </div>

                {/* Section to copy current design code */}
                {activeCharmsCount > 0 && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        Your Current Design Code:
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {activeCharmsCount} Charms Attached
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="flex-1 font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate select-all">
                        {generateBraceletCode(finish, slots)}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyBraceletCode}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================== */}
      {/* POP-UP MODAL: FRIEND'S FINISHED STYLE APPLIED        */}
      {/* ==================================================== */}
      <AnimatePresence>
        {appliedModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-3xl p-5 sm:p-7 shadow-2xl text-slate-900 dark:text-white max-h-[92vh] overflow-y-auto space-y-4"
            >
              <button
                type="button"
                onClick={() => setAppliedModalData(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Celebration Header */}
              <div className="text-center space-y-1.5 pt-2">
                <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-toy-green-glow">
                  <Sparkles className="w-7 h-7 animate-spin" style={{ animationDuration: "8s" }} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-fredoka">
                  ✨ Style Successfully Applied!
                </span>
                <h3 className="text-2xl font-black font-fredoka text-slate-900 dark:text-white">
                  Friend&apos;s Bracelet Style Is Live!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Your friend&apos;s custom modular build has been loaded onto your workbench with exact link placement!
                </p>
              </div>

              {/* Summary Badges */}
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Band Finish</span>
                  <span className="text-sm font-black font-fredoka text-emerald-600 dark:text-emerald-400 capitalize">
                    {appliedModalData.finish} Inox Steel
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Modular Links</span>
                  <span className="text-sm font-black font-fredoka text-amber-600 dark:text-toy-yellow">
                    {appliedModalData.charmsCount} Charms Connected
                  </span>
                </div>
              </div>

              {/* Mini Preview Ribbon of Applied Links */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  Loaded Links Sequence ({appliedModalData.charms.length}):
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 px-2 scrollbar-thin bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                  {appliedModalData.charms.map((c, idx) => (
                    <div
                      key={`applied-mini-${idx}`}
                      className="w-11 sm:w-12 aspect-[540/900] rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-1 flex-shrink-0 shadow-xs"
                      title={`${c.name} (#${c.code || getCharmCode(c, charms)})`}
                    >
                      <div className="relative w-7 h-7 sm:w-8 sm:h-8">
                        <Image
                          src={c.image || "/assets/charm_clean.png"}
                          alt={c.name}
                          fill
                          className="object-contain"
                          unoptimized={Boolean(c.image?.startsWith("data:"))}
                        />
                      </div>
                      <span className="text-[8px] font-mono font-black text-emerald-700 dark:text-emerald-400 mt-0.5 truncate max-w-full">
                        #{c.code || getCharmCode(c, charms)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAppliedModalData(null);
                    const elem = document.getElementById("bracelet-view-box");
                    if (elem) {
                      elem.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                  }}
                  className="flex-1 py-3 px-4 rounded-xl font-black text-white font-fredoka text-xs bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-700 hover:from-emerald-400 hover:to-green-500 shadow-toy-green-glow border-b-4 border-emerald-950 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>View Bracelet on Workbench 💫</span>
                </button>

                {appliedModalData.charmsCount >= MIN_CHARMS && !isAdminMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedModalData(null);
                      handleAddToCart();
                    }}
                    className="py-3 px-4 rounded-xl font-black text-slate-800 dark:text-white font-fredoka text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4 text-emerald-500" />
                    <span>Add to Cart 🛒</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { sounds } from "@/utils/audio";
import { CategoryBox } from "@/types/store";
import { ArrowUpRight, Sparkles, Layers } from "lucide-react";
import { motion } from "framer-motion";

export const CategoryBentoGrid: React.FC = () => {
  const router = useRouter();
  const { categoryBoxes, setSelectedCategory, language, t } = useStore();

  const activeBoxes = (categoryBoxes || [])
    .filter((box) => box.active)
    .sort((a, b) => a.order - b.order);

  if (activeBoxes.length === 0) return null;

  const handleBoxClick = (box: CategoryBox) => {
    if (box.actionType === "link") {
      sounds.playFanfare();
      if (box.actionValue.startsWith("http")) {
        window.open(box.actionValue, "_blank");
      } else {
        router.push(box.actionValue);
      }
    } else {
      sounds.playPop();
      setSelectedCategory(box.actionValue);
      const catalogEl = document.getElementById("toy-catalog");
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <section className="w-full max-w-4xl lg:max-w-5xl mx-auto px-3 sm:px-4 mt-6 sm:mt-8 mb-8 sm:mb-12">
      {/* Bento Header matching reference screenshot */}
      <div className="flex items-center justify-between px-2 mb-4 sm:mb-5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="font-black text-[11px] sm:text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 font-fredoka">
            {language === "km"
              ? "• ព្រះរាជាណាចក្រកម្ពុជា • ប្រភេទពេញនិយម"
              : "• CAMBODIA KINGDOM OF WONDER • EXPLORE CATEGORIES"}
          </h2>
        </div>
        <div className="h-px flex-grow ml-3 sm:ml-4 bg-gradient-to-r from-slate-300 dark:from-slate-700 to-transparent" />
      </div>

      {/* Bento Grid: 2 Columns */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-5">
        {activeBoxes.map((box, idx) => {
          const isFull = box.span === "full";

          return (
            <motion.div
              key={box.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.35 }}
              onClick={() => handleBoxClick(box)}
              className={`group relative overflow-hidden rounded-[22px] sm:rounded-[28px] border-2 border-slate-200/90 dark:border-slate-800/80 bg-slate-900 shadow-md hover:shadow-xl hover:border-emerald-500/70 transition-all duration-300 cursor-pointer select-none active:scale-[0.98] ${
                isFull
                  ? "col-span-2 aspect-[21/9] sm:aspect-[2.4/1] min-h-[160px] sm:min-h-[210px]"
                  : "col-span-1 aspect-[4/5] sm:aspect-[1/1] md:aspect-[4/5]"
              }`}
            >
              {/* Background Picture */}
              <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950">
                <Image
                  src={box.image}
                  alt={box.title}
                  fill
                  sizes={isFull ? "(max-width: 768px) 100vw, 900px" : "(max-width: 768px) 50vw, 450px"}
                  className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                  unoptimized={box.image.startsWith("data:")}
                />
              </div>

              {/* Gradient Bottom Shadow for ultra clear typography */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent z-10 pointer-events-none" />

              {/* Top Bar inside Card: Badges and Action Arrow */}
              <div className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 z-20 flex items-center justify-between pointer-events-none">
                {box.badge ? (
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-emerald-400 dark:text-emerald-300 border border-emerald-400/30 text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span>{box.badge}</span>
                  </span>
                ) : (
                  <span />
                )}

                {/* Circular Glass Arrow (Top Right) */}
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/55 backdrop-blur-md text-white border border-white/20 flex items-center justify-center group-hover:bg-emerald-500 group-hover:border-emerald-400 group-hover:text-black group-hover:scale-110 transition-all shadow-md pointer-events-auto">
                  <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              {/* Bottom Card Title & Subtitle */}
              <div className="absolute bottom-0 inset-x-0 p-3.5 sm:p-5 z-20 flex flex-col justify-end">
                {box.titleKh && (
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-300 drop-shadow line-clamp-1 mb-0.5">
                    {box.titleKh}
                  </span>
                )}
                <h3
                  className={`font-black uppercase tracking-tight text-white drop-shadow-lg font-fredoka leading-tight ${
                    isFull ? "text-lg sm:text-2xl md:text-3xl" : "text-sm sm:text-lg md:text-xl"
                  }`}
                >
                  {language === "km" && box.titleKh ? box.titleKh : box.title}
                </h3>
                {box.subtitle && (
                  <p className="text-[10px] sm:text-xs text-slate-300 font-medium line-clamp-1 mt-0.5 drop-shadow">
                    {box.subtitle}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

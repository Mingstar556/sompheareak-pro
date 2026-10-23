"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/context/StoreContext";
import { CheckCircle2, Package, Truck, Sparkles, X, Bell, XCircle } from "lucide-react";

export const NotificationToast: React.FC = () => {
  const { latestNotificationToast, dismissNotificationToast } = useStore();

  if (!latestNotificationToast) return null;

  const getIcon = () => {
    switch (latestNotificationToast.type) {
      case "order_placed":
        return <Package className="w-5 h-5 text-amber-400" />;
      case "order_confirmed":
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case "order_shipped":
        return <Truck className="w-5 h-5 text-teal-400" />;
      case "order_delivered":
        return <Sparkles className="w-5 h-5 text-amber-300" />;
      case "order_rejected":
        return <XCircle className="w-5 h-5 text-rose-400" />;
      default:
        return <Bell className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full pointer-events-none p-2">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="pointer-events-auto bg-slate-900/95 dark:bg-slate-900/95 border-2 border-emerald-500/60 rounded-3xl p-4 shadow-2xl backdrop-blur-md text-white flex gap-3.5 items-start"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-black text-xs font-fredoka text-emerald-400 uppercase tracking-wider">
                Order Status Update
              </span>
              <button
                onClick={dismissNotificationToast}
                className="text-slate-400 hover:text-white p-0.5 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <h4 className="font-black text-sm text-white font-fredoka leading-snug mt-0.5">
              {latestNotificationToast.title}
            </h4>

            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {latestNotificationToast.message}
            </p>

            <div className="mt-2.5 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 font-mono text-[10px] font-bold">
                REF: {latestNotificationToast.orderRef}
              </span>
              <span className="text-[10px] text-slate-400">Just now</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

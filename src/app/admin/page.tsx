"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ExternalLink, Home } from "lucide-react";

export default function AdminNoticePage() {
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "https://sompheareak-admin.onrender.com";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-fredoka">
      <div className="max-w-md w-full bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 shadow-toy-green-glow">
          <ShieldCheck className="w-10 h-10 animate-bounce" />
        </div>

        <h1 className="text-2xl font-black tracking-tight text-white mb-2">
          Admin Desk Relocated
        </h1>
        <p className="text-sm font-medium text-slate-400 mb-6 leading-relaxed">
          The Somphea Reak Admin Management Suite has been separated into its own dedicated application connected to Neon DB.
        </p>

        <div className="space-y-3">
          <a
            href={adminUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm tracking-wide shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <span>Open Dedicated Admin Suite</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Return to Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

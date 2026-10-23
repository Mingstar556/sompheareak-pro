import { NextResponse } from "next/server";
import { getVouchers, addVoucher, deleteVoucher } from "@/lib/db";
import { Voucher } from "@/types/store";

export async function GET() {
  try {
    const vouchers = await getVouchers();
    return NextResponse.json({ success: true, data: vouchers, count: vouchers.length });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch vouchers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.code) {
      return NextResponse.json({ success: false, error: "Voucher code is required" }, { status: 400 });
    }

    const voucher: Voucher = {
      code: body.code.toUpperCase(),
      discountPct: Number(body.discountPct) || 10,
      discountType: body.discountType || "percentage",
      fixedDiscountUsd: body.fixedDiscountUsd ? Number(body.fixedDiscountUsd) : undefined,
      pointsCost: Number(body.pointsCost) || 25,
      minSpend: Number(body.minSpend) || 0,
      description: body.description || `${body.discountPct || 10}% OFF Special Voucher`,
      descriptionKh: body.descriptionKh || `ប័ណ្ណបញ្ចុះតម្លៃ ${body.discountPct || 10}%`,
      badge: body.badge || "PROMO",
      colorGrad: body.colorGrad || "from-emerald-500 to-teal-700",
    };

    const saved = await addVoucher(voucher);
    return NextResponse.json({ success: true, message: "Voucher created", data: saved }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create voucher" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    if (!code) {
      return NextResponse.json({ success: false, error: "Code query param required" }, { status: 400 });
    }
    const ok = await deleteVoucher(code);
    return NextResponse.json({ success: ok, message: ok ? "Voucher deleted" : "Voucher not found" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete voucher" }, { status: 500 });
  }
}

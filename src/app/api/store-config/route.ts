import { NextResponse } from "next/server";
import { getStorefrontConfig, updateStorefrontConfig } from "@/lib/db";

export async function GET() {
  try {
    const config = await getStorefrontConfig();
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch storefront config" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updated = await updateStorefrontConfig(body);
    return NextResponse.json({ success: true, message: "Storefront configuration updated", data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update storefront config" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { resetDb } from "@/lib/db";

export async function POST() {
  try {
    const freshDb = await resetDb();
    return NextResponse.json({ success: true, message: "Testing database reset to initial state", data: freshDb });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to reset database" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getCharmById, updateCharm, deleteCharm } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const charm = await getCharmById(id);
    if (!charm) {
      return NextResponse.json({ success: false, error: "Charm not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: charm });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch charm" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updateCharm(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Charm not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Charm updated successfully", data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update charm" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteCharm(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Charm not found or already deleted" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Charm deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete charm" }, { status: 500 });
  }
}

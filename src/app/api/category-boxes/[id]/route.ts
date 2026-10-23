import { NextResponse } from "next/server";
import { updateCategoryBox, deleteCategoryBox } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const updated = await updateCategoryBox(id, updates);

    if (!updated) {
      return NextResponse.json({ success: false, error: "Category box not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, categoryBox: updated });
  } catch (error) {
    console.error("PUT /api/category-boxes/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to update category box" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ok = await deleteCategoryBox(id);

    if (!ok) {
      return NextResponse.json({ success: false, error: "Category box not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Category box deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/category-boxes/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete category box" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getCategoryBoxes, addCategoryBox, saveCategoryBoxes, resetCategoryBoxes } from "@/lib/db";
import { CategoryBox } from "@/types/store";

export async function GET() {
  try {
    const boxes = await getCategoryBoxes();
    return NextResponse.json({ success: true, categoryBoxes: boxes });
  } catch (error) {
    console.error("GET /api/category-boxes error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch category boxes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "reset") {
      const defaultBoxes = await resetCategoryBoxes();
      return NextResponse.json({ success: true, categoryBoxes: defaultBoxes });
    }

    if (body.action === "reorder" && Array.isArray(body.boxes)) {
      const saved = await saveCategoryBoxes(body.boxes);
      return NextResponse.json({ success: true, categoryBoxes: saved });
    }

    // Creating new category box
    const { title, titleKh, subtitle, image, actionType, actionValue, span, badge, order, active } = body;
    if (!title || !image) {
      return NextResponse.json({ success: false, error: "Title and Image are required" }, { status: 400 });
    }

    const created = await addCategoryBox({
      title,
      titleKh: titleKh || "",
      subtitle: subtitle || "",
      image,
      actionType: actionType || "category",
      actionValue: actionValue || "all",
      span: span === "half" ? "half" : "full",
      badge: badge || "",
      order: typeof order === "number" ? order : Date.now(),
      active: active !== undefined ? Boolean(active) : true,
    });

    return NextResponse.json({ success: true, categoryBox: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/category-boxes error:", error);
    return NextResponse.json({ success: false, error: "Failed to process category box" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getCategories, addCategory, saveCategories, resetCategories } from "@/lib/db";
import { Category } from "@/types/store";

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "reset") {
      const defaultCats = await resetCategories();
      return NextResponse.json({ success: true, categories: defaultCats });
    }

    if (body.action === "reorder" && Array.isArray(body.categories)) {
      const saved = await saveCategories(body.categories);
      return NextResponse.json({ success: true, categories: saved });
    }

    const { id, name, kh, en, icon, grad, sort_order, description } = body;
    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Category name is required" }, { status: 400 });
    }

    const created = await addCategory({
      id,
      name,
      kh: kh || name,
      en: en || name,
      icon: icon || "🏷️",
      grad: grad || "from-emerald-500 to-teal-600",
      sort_order: typeof sort_order === "number" ? sort_order : Date.now(),
      description: description || "",
    });

    return NextResponse.json({ success: true, category: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json({ success: false, error: "Failed to process category" }, { status: 500 });
  }
}

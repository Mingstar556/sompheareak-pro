import { NextResponse } from "next/server";
import { getNotifications, markNotificationAsRead, clearNotifications } from "@/lib/db";

export async function GET() {
  try {
    const notifications = await getNotifications();
    return NextResponse.json({ success: true, data: notifications, count: notifications.length });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (body.id) {
      const ok = await markNotificationAsRead(body.id);
      return NextResponse.json({ success: ok });
    }
    return NextResponse.json({ success: false, error: "Notification ID required" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update notification" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await clearNotifications();
    return NextResponse.json({ success: true, message: "Notifications cleared" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to clear notifications" }, { status: 500 });
  }
}

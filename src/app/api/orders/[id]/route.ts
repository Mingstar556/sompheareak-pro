import { NextResponse } from "next/server";
import { updateOrderStatus, updateOrder, deleteOrder, getOrders } from "@/lib/db";
import { OrderStatus } from "@/types/store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orders = await getOrders();
    const order = orders.find((o) => o.id === id);
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.status && Object.keys(body).length === 1) {
      const status = body.status as OrderStatus;
      const updated = await updateOrderStatus(id, status);
      if (!updated) {
        return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: `Order #${updated.orderRef} status updated to ${status}`,
        data: updated,
      });
    }

    const updated = await updateOrder(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      message: `Order #${updated.orderRef} updated successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update order" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updateOrder(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      message: `Order #${updated.orderRef} updated successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ok = await deleteOrder(id);
    if (!ok) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete order" }, { status: 500 });
  }
}

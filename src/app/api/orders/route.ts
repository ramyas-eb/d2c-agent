import { db } from '@/lib/db';

export async function GET() {
  const orders = await db.order.findMany({ orderBy: { createdAt: 'desc' } });

  // Shape back to the Order type the frontend expects
  return Response.json(
    orders.map((o) => ({
      id: o.id,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      customerWhatsapp: o.customerWhatsapp,
      product: o.product,
      amount: o.amount,
      status: o.status,
      paymentMode: o.paymentMode,
      paymentId: o.paymentId ?? undefined,
      source: o.source,
      createdAt: o.createdAt.toISOString(),
      paidAt: o.paidAt?.toISOString() ?? undefined,
      notes: o.notes ?? undefined,
      whatsappConfirmationSent: o.whatsappConfirmationSent,
      receiptSent: o.receiptSent,
      partial: o.advancePaid != null ? {
        advancePaid: o.advancePaid,
        balanceDue: o.balanceDue!,
        balanceDueDate: o.balanceDueDate!.toISOString(),
        balancePaid: o.balancePaid,
      } : undefined,
      shipment: o.awb ? {
        awb: o.awb,
        courier: o.courier!,
        trackingUrl: o.trackingUrl!,
        triggeredAt: o.shipmentTriggeredAt!.toISOString(),
        status: o.shipmentStatus as 'pending' | 'pickup_scheduled' | 'in_transit' | 'delivered',
      } : undefined,
    }))
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  const order = await db.order.create({ data: body });
  return Response.json(order, { status: 201 });
}

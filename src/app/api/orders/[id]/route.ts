import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id } });
  if (!order) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const order = await db.order.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.paymentId && { paymentId: body.paymentId }),
      ...(body.paidAt && { paidAt: new Date(body.paidAt) }),
      ...(body.whatsappConfirmationSent !== undefined && { whatsappConfirmationSent: body.whatsappConfirmationSent }),
      ...(body.receiptSent !== undefined && { receiptSent: body.receiptSent }),
      ...(body.awb && {
        awb: body.awb,
        courier: body.courier,
        trackingUrl: body.trackingUrl,
        shipmentTriggeredAt: new Date(),
        shipmentStatus: body.shipmentStatus ?? 'pickup_scheduled',
      }),
    },
  });
  return Response.json(order);
}

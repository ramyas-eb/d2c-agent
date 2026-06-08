import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { convId, customerName, customerPhone, amount, product, deliveryAddress } = await req.json();

    if (!convId || !customerName || !amount) {
      return Response.json({ error: 'convId, customerName, and amount are required' }, { status: 400 });
    }

    const orderId = `ORD-COD-${Date.now()}`;

    // Persist to DB — non-fatal
    try {
      const { db } = await import('@/lib/db');

      await db.conversation.upsert({
        where: { id: convId },
        create: { id: convId, customerName, customerHandle: customerPhone || convId, source: 'whatsapp', stage: 'paid' },
        update: { stage: 'paid' },
      });

      await db.order.create({
        data: {
          id: orderId,
          customerName,
          customerPhone: customerPhone || '',
          customerWhatsapp: customerPhone || '',
          product: product || 'COD Order',
          amount,
          status: 'processing',
          paymentMode: 'cod',
          source: 'whatsapp',
          conversationId: convId,
          notes: deliveryAddress ? `Delivery address: ${deliveryAddress}` : null,
        },
      });
    } catch (dbErr) {
      console.warn('[cod-order] DB save failed (non-fatal):', dbErr);
    }

    return Response.json({ orderId, status: 'confirmed', paymentMode: 'cod', amount });
  } catch (err) {
    console.error('[cod-order]', err);
    return Response.json({ error: 'Failed to create COD order' }, { status: 500 });
  }
}

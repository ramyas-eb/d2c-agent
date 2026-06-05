import { NextRequest } from 'next/server';
import { createPaymentLink } from '@/services/razorpay';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, customerName, customerPhone, convId, description } = body;

    if (!amount || !customerName || !convId) {
      return Response.json(
        { error: 'amount, customerName, and convId are required' },
        { status: 400 }
      );
    }

    // Sanitise phone: Razorpay needs a valid mobile number or empty string
    const phone = (customerPhone ?? '').replace(/[^\d+]/g, '');
    const safePhone = phone.length >= 10 ? phone : '';

    const link = await createPaymentLink({
      amount,
      customerName,
      customerPhone: safePhone,
      orderId: convId,
      description: description || `Order for ${customerName}`,
    });

    const url = (link as { short_url?: string }).short_url ?? `https://rzp.io/l/demo-${convId}`;

    // Persist to DB — non-blocking: if the conversation doesn't exist in DB
    // yet (mock data / first run) we still return the real Razorpay URL
    try {
      const { db } = await import('@/lib/db');

      // Upsert the conversation so the FK reference is satisfied
      await db.conversation.upsert({
        where: { id: convId },
        create: {
          id: convId,
          customerName,
          customerHandle: safePhone || convId,
          source: 'whatsapp',
          stage: 'link_sent',
        },
        update: { stage: 'link_sent' },
      });

      await db.paymentLink.create({
        data: {
          razorpayId: link.id,
          url,
          amount,
          status: 'created',
          conversationId: convId,
        },
      });
    } catch (dbErr) {
      // DB failure must not break the payment link flow
      console.warn('[payment-link] DB save failed (non-fatal):', dbErr);
    }

    return Response.json({ id: link.id, url, amount });
  } catch (err) {
    console.error('[payment-link]', err);
    return Response.json({ error: 'Failed to create payment link' }, { status: 500 });
  }
}

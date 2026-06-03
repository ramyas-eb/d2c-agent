import { NextRequest } from 'next/server';
import { createPaymentLink } from '@/services/razorpay';
import { db } from '@/lib/db';

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

    const link = await createPaymentLink({
      amount,
      customerName,
      customerPhone: customerPhone || '',
      orderId: convId,
      description: description || `Order for ${customerName}`,
    });

    const url = (link as { short_url?: string }).short_url ?? `https://rzp.io/l/demo-${convId}`;

    // Persist the payment link so the webhook can match it
    await db.paymentLink.create({
      data: {
        razorpayId: link.id,
        url,
        amount,
        status: 'created',
        conversationId: convId,
      },
    });

    // Move conversation to link_sent stage
    await db.conversation.update({
      where: { id: convId },
      data: { stage: 'link_sent' },
    });

    return Response.json({ id: link.id, url, amount });
  } catch (err) {
    console.error('[payment-link]', err);
    return Response.json({ error: 'Failed to create payment link' }, { status: 500 });
  }
}

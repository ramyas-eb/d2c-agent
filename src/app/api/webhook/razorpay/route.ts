import { NextRequest } from 'next/server';
import { verifyWebhookSignature } from '@/services/razorpay';
import { sendWhatsAppMessage, buildConfirmationMessage, buildShippingMessage } from '@/services/whatsapp';
import { createShiprocketOrder } from '@/services/shiprocket';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-razorpay-signature') || '';

  const valid = await verifyWebhookSignature(body, signature);
  if (!valid) return Response.json({ error: 'Invalid signature' }, { status: 400 });

  const event = JSON.parse(body);

  if (event.event === 'payment.captured' || event.event === 'payment_link.paid') {
    const payment = event.payload?.payment?.entity ?? event.payload?.payment_link?.entity;
    const notes = payment?.notes ?? {};

    const customerName  = payment?.customer_name ?? notes.customer_name ?? 'Customer';
    const customerPhone = payment?.contact ?? notes.phone ?? '';
    const amount        = (payment?.amount ?? 0) / 100;
    const convId        = notes.order_id ?? payment?.id;   // payment link carries conv id in notes
    const product       = notes.product ?? 'Your order';
    const paymentId     = payment?.id;

    // 1. Mark the conversation as paid + update linked order in DB
    if (convId) {
      const conv = await db.conversation.findUnique({ where: { id: convId } });
      if (conv) {
        await db.conversation.update({ where: { id: convId }, data: { stage: 'paid' } });
        await db.message.create({
          data: {
            role: 'agent',
            content: '✅ Payment confirmed! Your order is being packed — tracking AWB will be shared shortly 📦',
            conversationId: convId,
          },
        });
      }

      // Update or create the order record
      const existing = await db.order.findFirst({ where: { conversationId: convId } });
      if (existing) {
        await db.order.update({
          where: { id: existing.id },
          data: { status: 'payment_received', paymentId, paidAt: new Date() },
        });
      } else {
        await db.order.create({
          data: {
            customerName,
            customerPhone,
            customerWhatsapp: customerPhone,
            product,
            amount,
            status: 'payment_received',
            paymentMode: payment?.method ?? 'upi',
            paymentId,
            source: conv?.source ?? 'whatsapp',
            paidAt: new Date(),
            conversationId: convId,
          },
        });
      }

      // Mark payment link as paid
      if (paymentId) {
        await db.paymentLink.updateMany({
          where: { conversationId: convId, status: 'created' },
          data: { status: 'paid', paidAt: new Date() },
        });
      }
    }

    // 2. WhatsApp confirmation
    if (customerPhone) {
      await sendWhatsAppMessage(
        customerPhone,
        buildConfirmationMessage({ customerName, amount, product, orderId: convId })
      );
    }

    // 3. Shiprocket — create shipment if address is in notes
    if (notes.address && notes.city && notes.pincode && notes.state) {
      const shipment = await createShiprocketOrder({
        orderId: convId,
        orderDate: new Date().toISOString().split('T')[0],
        customerName,
        customerPhone,
        address: notes.address,
        city: notes.city,
        pincode: notes.pincode,
        state: notes.state,
        items: [{ name: product, sku: convId, units: 1, sellingPrice: amount }],
        totalAmount: amount,
        paymentMethod: 'Prepaid',
      });

      // Save AWB to order + send tracking WhatsApp
      if (shipment.awb_code && convId) {
        const order = await db.order.findFirst({ where: { conversationId: convId } });
        if (order) {
          await db.order.update({
            where: { id: order.id },
            data: {
              status: 'shipped',
              awb: shipment.awb_code,
              courier: shipment.courier_name,
              trackingUrl: shipment.tracking_url,
              shipmentTriggeredAt: new Date(),
              shipmentStatus: 'pickup_scheduled',
            },
          });
        }
        if (customerPhone) {
          await sendWhatsAppMessage(
            customerPhone,
            buildShippingMessage({
              customerName,
              orderId: convId,
              awb: shipment.awb_code,
              courier: shipment.courier_name,
              trackingUrl: shipment.tracking_url,
            })
          );
        }
      }
    }
  }

  return Response.json({ received: true });
}

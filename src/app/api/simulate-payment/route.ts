import { NextRequest } from 'next/server';
import { sendWhatsAppMessage, buildConfirmationMessage } from '@/services/whatsapp';
import { createShiprocketOrder } from '@/services/shiprocket';

export async function POST(req: NextRequest) {
  const { orderId, customerName, customerPhone, amount, product } = await req.json();

  const results: Record<string, unknown> = {};

  // 1. WhatsApp confirmation
  results.whatsapp = await sendWhatsAppMessage(
    customerPhone,
    buildConfirmationMessage({ customerName, amount, product, orderId })
  );

  // 2. Shiprocket
  results.shiprocket = await createShiprocketOrder({
    orderId,
    orderDate: new Date().toISOString().split('T')[0],
    customerName,
    customerPhone,
    address: '123 Demo Street',
    city: 'Mumbai',
    pincode: '400001',
    state: 'Maharashtra',
    items: [{ name: product, sku: orderId, units: 1, sellingPrice: amount }],
    totalAmount: amount,
    paymentMethod: 'Prepaid',
  });

  return Response.json({ success: true, results });
}

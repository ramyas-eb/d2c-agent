// WhatsApp service — supports Interakt/WATI/Meta Cloud API; mock otherwise

export function isWhatsAppConfigured() {
  return !!(process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_ID);
}

export async function sendWhatsAppMessage(to: string, message: string) {
  if (!isWhatsAppConfigured()) {
    console.log(`[MOCK WhatsApp → ${to}]: ${message}`);
    return { success: true, mock: true, to, message };
  }

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.replace(/\D/g, ''),
        type: 'text',
        text: { body: message },
      }),
    }
  );
  return res.json();
}

export function buildConfirmationMessage(vars: {
  customerName: string;
  amount: number;
  product: string;
  orderId: string;
}) {
  return `Hi ${vars.customerName}! ✅ Your payment of ₹${vars.amount.toLocaleString('en-IN')} for *${vars.product}* (Order #${vars.orderId}) is confirmed.\n\nWe're packing your order now. You'll receive the tracking link shortly! 📦`;
}

export function buildShippingMessage(vars: {
  customerName: string;
  orderId: string;
  awb: string;
  courier: string;
  trackingUrl: string;
}) {
  return `Hi ${vars.customerName}! 🚚 Your order #${vars.orderId} has been shipped via *${vars.courier}*.\n\nTracking: ${vars.awb}\nTrack here: ${vars.trackingUrl}`;
}

export function buildBalanceReminderMessage(vars: {
  customerName: string;
  orderId: string;
  balanceDue: number;
  dueDate: string;
  paymentLink: string;
}) {
  return `Hi ${vars.customerName} 👋, just a reminder — ₹${vars.balanceDue.toLocaleString('en-IN')} is due on ${vars.dueDate} for Order #${vars.orderId}.\n\nPay here: ${vars.paymentLink}`;
}

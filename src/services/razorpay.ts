// Razorpay service — uses real SDK when env vars are set, mock otherwise

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export function isRazorpayConfigured() {
  return !!(KEY_ID && KEY_SECRET);
}

export async function createPaymentLink(params: {
  amount: number;
  customerName: string;
  customerPhone: string;
  orderId: string;
  description: string;
}) {
  if (!isRazorpayConfigured()) {
    return {
      id: `mock_plink_${Date.now()}`,
      short_url: `https://rzp.io/l/demo-${params.orderId}`,
      amount: params.amount * 100,
      status: 'created',
    };
  }

  const Razorpay = (await import('razorpay')).default;
  const rzp = new Razorpay({ key_id: KEY_ID!, key_secret: KEY_SECRET! });

  return rzp.paymentLink.create({
    amount: params.amount * 100,
    currency: 'INR',
    description: params.description,
    customer: {
      name: params.customerName,
      contact: params.customerPhone,
    },
    notify: { sms: true, email: false },
    reminder_enable: true,
    notes: { order_id: params.orderId },
  });
}

export async function verifyWebhookSignature(body: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  // Skip verification in dev when no secret is configured yet
  if (!secret) return true;
  const crypto = await import('crypto');
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return expected === signature;
}

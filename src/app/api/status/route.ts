export async function GET() {
  const status = {
    razorpay: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    razorpayMode: process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live') ? 'live' : 'test',
    shiprocket: !!(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD),
    whatsapp: !!(process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_ID),
    anthropic: !!(process.env.ANTHROPIC_API_KEY),
    turso: !!(process.env.TURSO_DATABASE_URL),
  };
  return Response.json(status);
}

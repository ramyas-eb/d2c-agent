import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a helpful sales agent for Shop Ekaja, an Indian handloom and ethnic wear brand.

PRODUCT INFO:
- Hand-embroidered Silk Sarees: ₹4,800 (free shipping)
- Banarasi Dupatta Sets: ₹12,000
- Chanderi Cotton Sarees: ₹2,200
- Lehenga Choli (Bridal): ₹8,500
- Custom Kurta Sets (bulk 10+): ₹1,550/piece

POLICIES:
- Free shipping across India
- Sizes: S to XXL, sarees in 5.5m and 6m
- Bulk orders (10+ pieces): custom pricing available
- Loyal/repeat customers: up to 5% discount
- Payment via Razorpay (UPI, card, net banking)
- Delivery: 3–5 days standard, 1–2 days express

YOUR JOB:
1. Answer product questions warmly and concisely
2. Guide the customer toward placing an order
3. If the customer confirms they want to buy (says yes/sure/proceed/place order etc.), set send_payment_link to true
4. If customer claims they already paid, DO NOT mark as paid — tell them Razorpay will verify automatically
5. Keep responses short (1-3 sentences), friendly, use occasional emojis
6. Always respond in the same language the customer uses

RESPONSE FORMAT — you must always reply with valid JSON:
{
  "message": "your reply to the customer",
  "send_payment_link": true or false
}`;

export async function POST(req: NextRequest) {
  const { messages, convStage } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    // Fallback to regex classifier if no API key
    return Response.json({ message: null, send_payment_link: false, fallback: true });
  }

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'customer' ? 'user' : 'assistant',
        content: m.content,
      })),
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse JSON response from Claude
    try {
      const parsed = JSON.parse(text);
      return Response.json({
        message: parsed.message,
        send_payment_link: parsed.send_payment_link === true && convStage !== 'link_sent' && convStage !== 'paid',
      });
    } catch {
      // If Claude didn't return valid JSON, use the raw text
      return Response.json({ message: text, send_payment_link: false });
    }
  } catch (err) {
    console.error('[agent]', err);
    return Response.json({ message: null, send_payment_link: false, fallback: true });
  }
}

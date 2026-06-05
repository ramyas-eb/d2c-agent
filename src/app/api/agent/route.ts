import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  inStock: boolean;
}

interface AgentSettings {
  shopName?: string;
  tone?: string;
  returnPolicy?: string;
  shippingDays?: string;
  codAvailable?: boolean;
  discount?: string;
  faqs?: { q: string; a: string }[];
}

function buildSystemPrompt(products: Product[], settings: AgentSettings): string {
  const shopName = settings.shopName || 'Shop Ekaja';
  const tone = settings.tone || 'warm, friendly, and helpful';
  const shippingDays = settings.shippingDays || '3–5';
  const returnPolicy = settings.returnPolicy || '7-day returns accepted for unused items';
  const codAvailable = settings.codAvailable ?? false;
  const discount = settings.discount || '5% for repeat customers';

  const inStock = products.filter(p => p.inStock);
  const outOfStock = products.filter(p => !p.inStock);

  const productLines = inStock.length > 0
    ? inStock.map(p => `- ${p.name} (SKU: ${p.id}): ₹${p.price.toLocaleString('en-IN')} — ${p.description}`).join('\n')
    : '- No products currently in stock';

  const outOfStockLine = outOfStock.length > 0
    ? `\nOUT OF STOCK (do not take orders for these):\n${outOfStock.map(p => `- ${p.name}`).join('\n')}`
    : '';

  const faqLines = settings.faqs && settings.faqs.length > 0
    ? '\nFREQUENTLY ASKED QUESTIONS:\n' + settings.faqs.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n\n')
    : '';

  return `You are a sales agent for ${shopName}, an Indian ethnic wear brand. Your tone is ${tone}.

PRODUCTS IN STOCK:
${productLines}${outOfStockLine}

POLICIES:
- Free shipping across India
- Delivery: ${shippingDays} days standard, 1–2 days express
- Returns: ${returnPolicy}
- COD: ${codAvailable ? 'Available' : 'Not available — online payment only (UPI, card, net banking)'}
- Discounts: ${discount}
- Bulk orders (10+ pieces): custom pricing, ask for details
- Saree lengths: 5.5m and 6m standard
- Sizes: XS to XXL available${faqLines}

YOUR JOB:
1. Answer product questions accurately using the catalog above
2. Guide the customer toward placing an order
3. If the customer confirms they want to buy, set send_payment_link to true
4. If the customer asks about an out-of-stock item, apologise and suggest alternatives from the in-stock list
5. If the customer claims they already paid, do NOT mark as paid — tell them Razorpay will verify automatically
6. Keep responses short (1–3 sentences), friendly, use occasional emojis
7. Always respond in the same language the customer uses

RESPONSE FORMAT — always reply with valid JSON only, no extra text:
{
  "message": "your reply to the customer",
  "send_payment_link": true or false
}`;
}

// Merge consecutive same-role messages and ensure conversation starts with 'user'
function normalizeMessages(messages: { role: string; content: string }[]) {
  const mapped = messages.map(m => ({
    role: (m.role === 'customer' ? 'user' : 'assistant') as 'user' | 'assistant',
    content: m.content,
  }));

  // Merge consecutive same-role messages
  const merged: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const msg of mapped) {
    if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
      merged[merged.length - 1].content += '\n' + msg.content;
    } else {
      merged.push({ ...msg });
    }
  }

  // Claude requires conversation to start with a user message
  while (merged.length > 0 && merged[0].role === 'assistant') {
    merged.shift();
  }

  return merged;
}

export async function POST(req: NextRequest) {
  const { messages, convStage, products = [], agentSettings = {} } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ message: null, send_payment_link: false, fallback: true });
  }

  try {
    const systemPrompt = buildSystemPrompt(products as Product[], agentSettings as AgentSettings);
    const normalizedMessages = normalizeMessages(messages);

    if (normalizedMessages.length === 0) {
      return Response.json({ message: null, send_payment_link: false, fallback: true });
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages: normalizedMessages,
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';

    try {
      // Strip markdown code fences if Claude wrapped the JSON
      const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      const parsed = JSON.parse(clean);
      return Response.json({
        message: parsed.message ?? null,
        send_payment_link:
          parsed.send_payment_link === true &&
          convStage !== 'link_sent' &&
          convStage !== 'paid',
      });
    } catch {
      return Response.json({ message: text, send_payment_link: false });
    }
  } catch (err) {
    console.error('[agent]', err);
    return Response.json({ message: null, send_payment_link: false, fallback: true });
  }
}

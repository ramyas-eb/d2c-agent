// Shared agent logic — used by /api/agent (DM simulation) and /api/webhook/whatsapp (real DMs)

import Anthropic from '@anthropic-ai/sdk';

export interface AgentProduct {
  id: string;
  name: string;
  price: number;
  description: string;
  inStock: boolean;
}

export interface AgentSettings {
  shopName?: string;
  tone?: string;
  returnPolicy?: string;
  shippingDays?: string;
  codAvailable?: boolean;
  discount?: string;
  faqs?: { q: string; a: string }[];
}

export interface AgentMessage {
  role: string;   // 'customer' | 'agent' | 'merchant' | 'user' | 'assistant'
  content: string;
}

export interface AgentResult {
  message: string | null;
  send_payment_link: boolean;
  amount: number;           // product price when send_payment_link is true
  fallback: boolean;
}

export function buildSystemPrompt(products: AgentProduct[], settings: AgentSettings): string {
  const shopName     = settings.shopName     || 'Shop Ekaja';
  const tone         = settings.tone         || 'warm, friendly, and helpful';
  const shippingDays = settings.shippingDays || '3–5';
  const returnPolicy = settings.returnPolicy || '7-day returns accepted for unused items';
  const codAvailable = settings.codAvailable ?? false;
  const discount     = settings.discount     || '5% for repeat customers';

  const inStock    = products.filter(p => p.inStock);
  const outOfStock = products.filter(p => !p.inStock);

  const productLines = inStock.length > 0
    ? inStock.map(p => `- ${p.name} (SKU: ${p.id}): ₹${p.price.toLocaleString('en-IN')} — ${p.description}`).join('\n')
    : '- No products currently in stock';

  const outOfStockLine = outOfStock.length > 0
    ? `\nOUT OF STOCK (do not take orders):\n${outOfStock.map(p => `- ${p.name}`).join('\n')}`
    : '';

  const faqLines = settings.faqs?.length
    ? '\nFREQUENTLY ASKED QUESTIONS:\n' + settings.faqs.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n\n')
    : '';

  return `You are a sales agent for ${shopName}, an Indian ethnic wear brand. Tone: ${tone}.

PRODUCTS IN STOCK:
${productLines}${outOfStockLine}

POLICIES:
- Free shipping across India
- Delivery: ${shippingDays} days standard, 1–2 days express
- Returns: ${returnPolicy}
- COD: ${codAvailable ? 'Available' : 'Not available — online payment only (UPI, card, net banking)'}
- Discounts: ${discount}
- Bulk orders (10+ pieces): custom pricing
- Saree lengths: 5.5m and 6m standard
- Sizes: XS to XXL available${faqLines}

YOUR JOB:
1. Answer product questions accurately using the catalog above
2. Guide the customer toward placing an order
3. When the customer confirms they want to buy, set send_payment_link to true and include the product price in amount
4. If asked about out-of-stock items, apologise and suggest in-stock alternatives
5. If the customer claims they already paid, do NOT confirm — tell them Razorpay verifies automatically
6. Keep responses short (1–3 sentences), use occasional emojis
7. Respond in the same language the customer uses

RESPONSE FORMAT — always reply with valid JSON, no extra text:
{
  "message": "your reply to the customer",
  "send_payment_link": true or false,
  "amount": 0
}
(set amount to the product price when send_payment_link is true, otherwise 0)`;
}

// Merge consecutive same-role messages; ensure conversation starts with 'user'
export function normalizeMessages(messages: AgentMessage[]) {
  const mapped = messages.map(m => ({
    role: (m.role === 'customer' ? 'user' : 'assistant') as 'user' | 'assistant',
    content: m.content,
  }));

  const merged: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const msg of mapped) {
    if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
      merged[merged.length - 1].content += '\n' + msg.content;
    } else {
      merged.push({ ...msg });
    }
  }

  while (merged.length > 0 && merged[0].role === 'assistant') merged.shift();
  return merged;
}

// Run the Claude agent and return a structured result
export async function runAgent({
  messages,
  products,
  settings,
  convStage,
}: {
  messages: AgentMessage[];
  products: AgentProduct[];
  settings: AgentSettings;
  convStage?: string;
}): Promise<AgentResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { message: null, send_payment_link: false, amount: 0, fallback: true };
  }

  const normalized = normalizeMessages(messages);
  if (normalized.length === 0) {
    return { message: null, send_payment_link: false, amount: 0, fallback: true };
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: buildSystemPrompt(products, settings),
      messages: normalized,
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

    try {
      const parsed = JSON.parse(clean);
      const canSendLink = convStage !== 'link_sent' && convStage !== 'paid';
      return {
        message: parsed.message ?? null,
        send_payment_link: parsed.send_payment_link === true && canSendLink,
        amount: parsed.amount ?? 0,
        fallback: false,
      };
    } catch {
      return { message: text, send_payment_link: false, amount: 0, fallback: false };
    }
  } catch (err) {
    console.error('[runAgent]', err);
    return { message: null, send_payment_link: false, amount: 0, fallback: true };
  }
}

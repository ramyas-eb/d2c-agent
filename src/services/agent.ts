// Shared agent logic — used by /api/agent (DM simulation) and /api/webhook/whatsapp (real DMs)

import Anthropic from '@anthropic-ai/sdk';

export interface AgentProduct {
  id: string;
  name: string;
  price: number;
  description: string;
  inStock: boolean;
  variants?: { label: string; options: string[] }[];
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
  send_cod_order: boolean;
  amount: number;
  delivery_address: string;
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
    ? inStock.map(p => {
        const variantLines = (p.variants ?? []).map(v => `    • ${v.label}: ${v.options.join(', ')}`).join('\n');
        return `- ${p.name} (SKU: ${p.id}): ₹${p.price.toLocaleString('en-IN')} — ${p.description}${variantLines ? '\n' + variantLines : ''}`;
      }).join('\n')
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
2. If a product has variants (size, colour, etc.), ask the customer to confirm their preference before sending payment link
3. When the customer confirms they want to buy AND all variants are selected, set send_payment_link to true and include the product price in amount
4. If asked about out-of-stock items, apologise and suggest in-stock alternatives
5. If the customer claims they already paid, do NOT confirm — tell them Razorpay verifies automatically
6. For COD requests: collect full delivery address (house/flat, area, city, pincode, state) then set send_cod_order to true
7. Keep responses short (1–3 sentences), use occasional emojis
8. Respond in the same language the customer uses

RESPONSE FORMAT — always reply with valid JSON, no extra text:
{
  "message": "your reply to the customer",
  "send_payment_link": true or false,
  "send_cod_order": true or false,
  "amount": 0,
  "delivery_address": ""
}
Rules:
- set amount to product price when send_payment_link or send_cod_order is true
- set delivery_address when send_cod_order is true (full address from conversation)
- only one of send_payment_link or send_cod_order can be true at a time`;
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
    return { message: null, send_payment_link: false, send_cod_order: false, amount: 0, delivery_address: '', fallback: true };
  }

  const normalized = normalizeMessages(messages);
  if (normalized.length === 0) {
    return { message: null, send_payment_link: false, send_cod_order: false, amount: 0, delivery_address: '', fallback: true };
  }

  try {
    let text = '';
    const systemPrompt = buildSystemPrompt(products, settings);

    if (process.env.ANTHROPIC_BASE_URL && process.env.ANTHROPIC_DEPLOYMENT) {
      // Azure-hosted Anthropic endpoint
      const base = process.env.ANTHROPIC_BASE_URL.replace(/\/$/, '');
      const deployment = process.env.ANTHROPIC_DEPLOYMENT;
      const url = `${base}/deployments/${deployment}/messages?api-version=2024-10-01-preview`;
      console.log('[runAgent] Azure URL:', url);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          max_tokens: 400,
          system: systemPrompt,
          messages: normalized,
        }),
      });
      const data = await res.json();
      console.log('[runAgent] Azure raw response:', JSON.stringify(data).slice(0, 300));
      if (!res.ok) {
        console.error('[runAgent] Azure error:', res.status, JSON.stringify(data));
        return { message: null, send_payment_link: false, send_cod_order: false, amount: 0, delivery_address: '', fallback: true };
      }
      text = data.content?.[0]?.type === 'text' ? (data.content[0].text ?? '').trim() : '';
    } else {
      // Direct Anthropic API
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: systemPrompt,
        messages: normalized,
      });
      text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    }
    const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

    try {
      const parsed = JSON.parse(clean);
      const canAct = convStage !== 'link_sent' && convStage !== 'paid';
      return {
        message: parsed.message ?? null,
        send_payment_link: parsed.send_payment_link === true && canAct && !parsed.send_cod_order,
        send_cod_order: parsed.send_cod_order === true && canAct,
        amount: parsed.amount ?? 0,
        delivery_address: parsed.delivery_address ?? '',
        fallback: false,
      };
    } catch {
      return { message: text, send_payment_link: false, send_cod_order: false, amount: 0, delivery_address: '', fallback: false };
    }
  } catch (err) {
    console.error('[runAgent]', err);
    return { message: null, send_payment_link: false, send_cod_order: false, amount: 0, delivery_address: '', fallback: true };
  }
}

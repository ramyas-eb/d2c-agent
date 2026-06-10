import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  const { description } = await req.json();

  if (!description?.trim()) {
    return Response.json({ error: 'No description provided' }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ fallback: true });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt = `You are a WhatsApp automation builder for Indian D2C ecommerce shops.

Given a plain-English description of what an automation should do, return a JSON object with:
- trigger: short label (3-5 words max) for what event starts this automation, e.g. "Payment confirmed", "Cart abandoned", "Order delivered"
- timing: when to send, e.g. "Immediately", "1 hr after", "3 days after", "When shipped"
- message: the actual WhatsApp message to send the customer — warm, concise, 1-3 sentences, use 1 emoji, use these placeholders where relevant: {name} {id} {tracking_link} {eta} {product}

IMPORTANT: The message is what gets SENT TO THE CUSTOMER — not an internal action. If the description mentions internal actions (like "create a shiprocket order"), understand the underlying event and write a customer notification for it.

Return ONLY valid JSON, no explanation:
{"trigger": "...", "timing": "...", "message": "..."}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: systemPrompt,
    messages: [{ role: 'user', content: description }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
  const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

  try {
    const parsed = JSON.parse(clean);
    return Response.json({ trigger: parsed.trigger, timing: parsed.timing, message: parsed.message });
  } catch {
    return Response.json({ fallback: true });
  }
}

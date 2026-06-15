/**
 * WhatsApp Business API webhook (Meta Cloud API)
 *
 * GET  — webhook verification (Meta sends hub.challenge on setup)
 * POST — incoming messages → Claude agent → WhatsApp reply
 *
 * Setup in Meta Business Manager:
 *   Callback URL : https://d2c-agent.vercel.app/api/webhook/whatsapp
 *   Verify token : value of WHATSAPP_VERIFY_TOKEN in .env.local
 *   Subscribe to : messages
 */

import { NextRequest } from 'next/server';
import { sendWhatsAppMessage } from '@/services/whatsapp';
import { runAgent, AgentMessage } from '@/services/agent';
import { initialProducts } from '@/store/products';

// Default agent settings (mirrors agent-settings store defaults)
const DEFAULT_SETTINGS = {
  shopName: 'Shop Ekaja',
  tone: 'warm, friendly, and helpful',
  returnPolicy: '7-day returns accepted for unused items',
  shippingDays: '3–5',
  codAvailable: false,
  discount: '5% for repeat customers',
  faqs: [],
};

// ── GET: Meta webhook verification ────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode      = searchParams.get('hub.mode');
  const token     = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[whatsapp-webhook] verified');
    return new Response(challenge ?? '', { status: 200 });
  }
  // Temporary debug — remove after fixing
  return Response.json({
    error: 'Forbidden',
    debug: {
      mode,
      token_received: token,
      env_var_set: !!process.env.WHATSAPP_VERIFY_TOKEN,
      env_var_length: process.env.WHATSAPP_VERIFY_TOKEN?.length ?? 0,
    },
  }, { status: 403 });
}

// ── POST: incoming messages ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Meta sends a test ping on verification — acknowledge it
  if (body.object !== 'whatsapp_business_account') {
    return Response.json({ received: true });
  }

  const changes: unknown[] = body.entry?.[0]?.changes ?? [];

  for (const change of changes as Array<{ field: string; value: Record<string, unknown> }>) {
    if (change.field !== 'messages') continue;

    const value = change.value as {
      messages?: Array<{ from: string; id: string; type: string; text?: { body: string } }>;
      contacts?: Array<{ wa_id: string; profile: { name: string } }>;
    };

    for (const msg of value.messages ?? []) {
      if (msg.type !== 'text' || !msg.text?.body) continue; // ignore media / reactions

      const customerPhone = msg.from;
      const customerName  = value.contacts?.find(c => c.wa_id === customerPhone)?.profile.name ?? 'Customer';
      const messageText   = msg.text.body;

      // Process async — webhook must reply to Meta within 5 s
      handleIncomingMessage({ customerPhone, customerName, messageText }).catch(
        (err) => console.error('[whatsapp-webhook] handler error:', err),
      );
    }
  }

  return Response.json({ received: true });
}

// ── Core handler (runs async after we've ACK'd Meta) ─────────────────
async function handleIncomingMessage({
  customerPhone,
  customerName,
  messageText,
}: {
  customerPhone: string;
  customerName: string;
  messageText: string;
}) {
  // ① Persist message + find/create conversation in DB
  let conv: {
    id: string;
    stage: string;
    messages: Array<{ role: string; content: string }>;
  } | null = null;

  try {
    const { db } = await import('@/lib/db');

    const found = await db.conversation.findFirst({
      where: { customerHandle: customerPhone },
      include: { messages: { orderBy: { id: 'asc' }, take: 20 } },
    });

    if (!found) {
      const created = await db.conversation.create({
        data: {
          customerName,
          customerHandle: customerPhone,
          source: 'whatsapp',
          stage: 'inquiry',
        },
      });
      conv = { id: created.id, stage: created.stage, messages: [] };
    } else {
      conv = {
        id: found.id,
        stage: found.stage,
        messages: found.messages.map(m => ({ role: m.role, content: m.content })),
      };
    }

    await db.message.create({
      data: { role: 'customer', content: messageText, conversationId: conv.id },
    });
  } catch (dbErr) {
    console.warn('[whatsapp-webhook] DB unavailable, using stateless fallback:', dbErr);
    // Continue with no history — agent can still reply to this single message
    conv = { id: `wa-${customerPhone}-${Date.now()}`, stage: 'inquiry', messages: [] };
  }

  // ② Build message history for the agent
  const history: AgentMessage[] = [
    ...conv.messages.slice(-10),
    { role: 'customer', content: messageText },
  ];

  // ③ Run Claude agent
  const result = await runAgent({
    messages: history,
    products: initialProducts,
    settings: DEFAULT_SETTINGS,
    convStage: conv.stage,
  });

  const replyText = result.fallback
    ? "Thanks for your message! We'll get back to you shortly 🙏"
    : (result.message ?? "Thanks! How can I help you today?");

  // ④ Persist agent reply
  try {
    const { db } = await import('@/lib/db');
    await db.message.create({
      data: { role: 'agent', content: replyText, conversationId: conv.id },
    });
  } catch { /* non-fatal */ }

  // ⑤ Send reply back via WhatsApp
  await sendWhatsAppMessage(customerPhone, replyText);

  // ⑥ If agent wants to send a payment link, create one and send it
  if (result.send_payment_link && result.amount > 0) {
    try {
      const { createPaymentLink } = await import('@/services/razorpay');
      const { db } = await import('@/lib/db');

      const link = await createPaymentLink({
        amount: result.amount,
        customerName,
        customerPhone,
        orderId: conv.id,
        description: `Order for ${customerName}`,
      });

      const url = (link as { short_url?: string }).short_url ?? '';

      if (url) {
        const payMsg = `Here's your payment link for ₹${result.amount.toLocaleString('en-IN')}: ${url}\n\nOnce paid, we'll start packing immediately! 📦`;

        await sendWhatsAppMessage(customerPhone, payMsg);

        await db.message.create({
          data: { role: 'agent', content: payMsg, conversationId: conv.id },
        }).catch(() => {});

        await db.conversation.update({
          where: { id: conv.id },
          data: { stage: 'link_sent' },
        }).catch(() => {});

        await db.paymentLink.create({
          data: {
            razorpayId: link.id,
            url,
            amount: result.amount,
            status: 'created',
            conversationId: conv.id,
          },
        }).catch(() => {});
      }
    } catch (err) {
      console.error('[whatsapp-webhook] payment link error:', err);
    }
  }
}

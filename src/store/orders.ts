'use client';
import { create } from 'zustand';
import { Order, DmConversation, WorkflowRule } from '@/types';
import { mockWorkflowRules } from '@/lib/mock-data';

export interface WebhookStep {
  id: string;
  label: string;
  detail: string;
  status: 'pending' | 'running' | 'done' | 'error';
  ts?: string;
}

export interface CustomerWhatsAppMessage {
  id: string;
  type: 'incoming' | 'outgoing';
  content: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
}

interface OrderStore {
  orders: Order[];
  conversations: DmConversation[];
  workflowRules: WorkflowRule[];
  webhookChain: Record<string, WebhookStep[]>;
  customerMessages: Record<string, CustomerWhatsAppMessage[]>;
  // Loaders
  loadOrders: () => Promise<void>;
  loadConversations: () => Promise<void>;
  // Actions
  simulatePayment: (orderId: string) => void;
  simulateShipment: (orderId: string) => void;
  simulatePaymentFromConv: (convId: string) => string;
  addConversationMessage: (convId: string, role: 'customer' | 'agent' | 'merchant', content: string) => void;
  sendPaymentLinkFromConv: (convId: string) => Promise<void>;
  markConvPaid: (convId: string) => void;
  toggleAction: (ruleId: string, actionId: string) => void;
}

const makeSteps = (orderId: string): WebhookStep[] => [
  { id: 's1', label: 'Razorpay webhook received', detail: `event: payment.captured · order: ${orderId}`, status: 'pending' },
  { id: 's2', label: 'Customer details extracted', detail: 'name, phone, address pulled from payment notes', status: 'pending' },
  { id: 's3', label: 'Shiprocket order created', detail: 'POST /v1/external/orders/create/adhoc', status: 'pending' },
  { id: 's4', label: 'AWB assigned', detail: 'courier selected, tracking URL generated', status: 'pending' },
  { id: 's5', label: 'WhatsApp confirmation sent', detail: 'order confirmed + AWB sent to customer', status: 'pending' },
  { id: 's6', label: 'Receipt PDF sent', detail: 'auto-generated, delivered via WhatsApp', status: 'pending' },
];

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  conversations: [],
  workflowRules: mockWorkflowRules,
  webhookChain: {},
  customerMessages: {},

  // ── Loaders ────────────────────────────────────────────────────────────────

  loadOrders: async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) set({ orders: await res.json() });
    } catch (e) {
      console.warn('[loadOrders] failed, using empty state', e);
    }
  },

  loadConversations: async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        // Shape DB rows → DmConversation type the UI expects
        set({
          conversations: data.map((c: {
            id: string; customerName: string; customerHandle: string;
            source: string; stage: string; messages: Array<{
              id: string; role: string; content: string; timestamp: string;
            }>;
          }) => ({
            id: c.id,
            customerName: c.customerName,
            customerHandle: c.customerHandle,
            source: c.source,
            stage: c.stage,
            messages: c.messages.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              timestamp: m.timestamp,
            })),
          })),
        });
      }
    } catch (e) {
      console.warn('[loadConversations] failed, using empty state', e);
    }
  },

  // ── Simulate payment (order dashboard demo) ────────────────────────────────

  simulatePayment: (orderId) => {
    const awb = `SR${Math.floor(Math.random() * 9000000000) + 1000000000}`;
    const order = get().orders.find(o => o.id === orderId);
    if (!order) return;

    const steps = makeSteps(orderId);
    set(s => ({ webhookChain: { ...s.webhookChain, [orderId]: steps } }));

    const delays = [0, 600, 1300, 2100, 2900, 3600];
    steps.forEach((step, i) => {
      setTimeout(() => {
        set(s => ({
          webhookChain: {
            ...s.webhookChain,
            [orderId]: s.webhookChain[orderId].map((st, idx) =>
              idx === i ? { ...st, status: 'running' } : st
            ),
          },
        }));
        setTimeout(() => {
          set(s => ({
            webhookChain: {
              ...s.webhookChain,
              [orderId]: s.webhookChain[orderId].map((st, idx) =>
                idx === i ? { ...st, status: 'done', ts: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) } : st
              ),
            },
          }));

          if (i === 0) {
            const paymentId = `pay_rzp_${Date.now()}`;
            const paidAt = new Date().toISOString();
            set(s => ({
              orders: s.orders.map(o => o.id !== orderId ? o : {
                ...o, status: 'payment_received' as const, paymentId, paidAt,
              }),
            }));
            // Persist to DB
            fetch(`/api/orders/${orderId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'payment_received', paymentId, paidAt }),
            }).catch(console.warn);
          }

          if (i === 3) {
            set(s => ({
              orders: s.orders.map(o => o.id !== orderId ? o : {
                ...o, status: 'processing' as const,
                shipment: {
                  awb, courier: 'Delhivery',
                  trackingUrl: `https://shiprocket.co/tracking/${awb}`,
                  triggeredAt: new Date().toISOString(),
                  status: 'pickup_scheduled' as const,
                },
              }),
            }));
            // Persist shipment to DB
            fetch(`/api/orders/${orderId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                status: 'processing',
                awb, courier: 'Delhivery',
                trackingUrl: `https://shiprocket.co/tracking/${awb}`,
                shipmentStatus: 'pickup_scheduled',
              }),
            }).catch(console.warn);
          }

          if (i === 4) {
            set(s => ({
              orders: s.orders.map(o => o.id !== orderId ? o : { ...o, whatsappConfirmationSent: true }),
              customerMessages: {
                ...s.customerMessages,
                [orderId]: [{
                  id: 'cm1', type: 'outgoing',
                  content: `Hi ${order.customerName.split(' ')[0]}! ✅ Your payment of ₹${order.amount.toLocaleString('en-IN')} for *${order.product}* (Order #${orderId}) is confirmed.\n\nWe're packing your order now 📦`,
                  timestamp: new Date().toISOString(), status: 'read',
                }],
              },
            }));
            fetch(`/api/orders/${orderId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ whatsappConfirmationSent: true }),
            }).catch(console.warn);
          }

          if (i === 5) {
            set(s => ({
              orders: s.orders.map(o => o.id !== orderId ? o : { ...o, receiptSent: true }),
              customerMessages: {
                ...s.customerMessages,
                [orderId]: [
                  ...(s.customerMessages[orderId] || []),
                  {
                    id: 'cm2', type: 'outgoing',
                    content: `🚚 Your order #${orderId} has been picked up by *Delhivery*.\n\nAWB: ${awb}\nTrack: https://shiprocket.co/tracking/${awb}\n\nExpected delivery: 2–3 days`,
                    timestamp: new Date().toISOString(), status: 'delivered',
                  },
                  {
                    id: 'cm3', type: 'outgoing',
                    content: `📄 Here's your receipt for ₹${order.amount.toLocaleString('en-IN')}. Thank you for shopping with *${order.customerName.split(' ')[0]}* 🙏`,
                    timestamp: new Date().toISOString(), status: 'sent',
                  },
                ],
              },
            }));
            fetch(`/api/orders/${orderId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ receiptSent: true }),
            }).catch(console.warn);
          }
        }, 350);
      }, delays[i]);
    });
  },

  simulateShipment: (_orderId) => { /* handled inside simulatePayment */ },

  simulatePaymentFromConv: (convId) => {
    const conv = get().conversations.find((c) => c.id === convId);
    if (!conv) return '';
    const orderId = `ORD-${Date.now()}`;
    const newOrder: Order = {
      id: orderId,
      customerName: conv.customerName,
      customerPhone: conv.customerHandle,
      customerWhatsapp: conv.customerHandle,
      product: 'Hand-embroidered Silk Saree',
      amount: 4800,
      status: 'payment_received',
      paymentMode: 'upi',
      paymentId: `pay_rzp_${Date.now()}`,
      source: conv.source,
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
      whatsappConfirmationSent: false,
      receiptSent: false,
    };
    set((s) => ({ orders: [newOrder, ...s.orders] }));
    // Mark conv paid
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === convId ? { ...c, stage: 'paid' as const, linkedOrderId: orderId } : c
      ),
    }));
    // Run the full webhook animation chain
    get().simulatePayment(orderId);
    return orderId;
  },

  // ── Conversation actions ───────────────────────────────────────────────────

  addConversationMessage: (convId, role, content) => {
    const tempId = `m${Date.now()}`;
    // Optimistic update
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id !== convId ? c : {
          ...c,
          messages: [...c.messages, { id: tempId, role, content, timestamp: new Date().toISOString() }],
        }
      ),
    }));
    // Persist to DB (fire-and-forget — UI is already updated)
    fetch(`/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, content }),
    }).catch(console.warn);
  },

  sendPaymentLinkFromConv: async (convId) => {
    const conv = get().conversations.find((c) => c.id === convId);
    if (!conv) return;

    // Optimistically flip stage
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === convId ? { ...c, stage: 'link_sent' as const } : c
      ),
    }));

    let url = `https://rzp.io/l/demo-${convId}`;
    try {
      const res = await fetch('/api/payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 4800,
          customerName: conv.customerName,
          customerPhone: conv.customerHandle,
          convId,
          description: 'Your order from Shop Ekaja',
        }),
      });
      if (res.ok) url = (await res.json()).url;
    } catch (err) {
      console.warn('[payment-link] API failed, using fallback', err);
    }

    get().addConversationMessage(
      convId, 'agent',
      `Here is your payment link 💳\n${url}\n\nOnce paid, we'll start packing and share your tracking AWB right away! 📦`
    );
  },

  markConvPaid: (convId) => {
    get().addConversationMessage(convId, 'agent',
      '✅ Payment received! Your order is confirmed. We\'re packing now — tracking AWB will be shared shortly. Thank you! 🎉'
    );
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === convId ? { ...c, stage: 'paid' as const } : c
      ),
    }));
    // Persist stage to DB
    fetch(`/api/conversations/${convId}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 'paid' }),
    }).catch(console.warn);
  },

  toggleAction: (ruleId, actionId) => {
    set((state) => ({
      workflowRules: state.workflowRules.map((r) =>
        r.id !== ruleId ? r : {
          ...r,
          actions: r.actions.map((a) =>
            a.id === actionId ? { ...a, enabled: !a.enabled } : a
          ),
        }
      ),
    }));
  },
}));

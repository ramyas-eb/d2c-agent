'use client';
import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────
export type NodeIconName = 'Zap' | 'Truck' | 'MessageCircle' | 'CreditCard' | 'Bell' | 'AlertCircle' | 'Filter';

export interface EditField {
  key: string;
  label: string;
  type: 'select' | 'text' | 'number';
  value: string;
  options?: { label: string; value: string }[];
}

export interface VisualNode {
  id: string;
  type: 'trigger' | 'condition' | 'action';
  title: string;
  detail: string;
  iconName: NodeIconName;
  editFields: EditField[];
}

export type FlowStatus = 'live' | 'draft' | 'paused';

export interface SavedFlow {
  id: string;
  name: string;
  prompt: string;
  nodes: VisualNode[];
  status: FlowStatus;
}

// ─── Shared option lists ──────────────────────────────────────────────
export const TRIGGER_OPTIONS = [
  { label: 'Payment captured', value: 'payment.captured' },
  { label: 'Payment failed', value: 'payment.failed' },
  { label: 'Balance due (D-2)', value: 'balance.due' },
  { label: 'Order shipped', value: 'order.shipped' },
];

export const WHATSAPP_TEMPLATES = [
  { label: 'Order Confirmation', value: 'order_confirmed' },
  { label: 'AWB & Tracking', value: 'awb_sent' },
  { label: 'Receipt PDF', value: 'receipt' },
  { label: 'Balance Reminder', value: 'balance_reminder' },
  { label: 'VIP Thank You', value: 'vip_thankyou' },
  { label: 'Payment Retry Link', value: 'payment_retry' },
];

export const COURIER_OPTIONS = [
  { label: 'Auto-assign (cheapest)', value: 'auto' },
  { label: 'Express (1–2 days)', value: 'express' },
  { label: 'Delhivery', value: 'delhivery' },
  { label: 'BlueDart', value: 'bluedart' },
];

// ─── Seed data ────────────────────────────────────────────────────────
const SEED: SavedFlow[] = [
  {
    id: 'flow-1',
    name: 'Post-payment fulfilment',
    prompt: 'ship via shiprocket and send whatsapp confirmation and receipt',
    status: 'live',
    nodes: [
      { id: 'n1-1', type: 'trigger', title: 'Payment captured', detail: 'event: payment.captured · Razorpay webhook', iconName: 'Zap', editFields: [{ key: 'event', label: 'Trigger event', type: 'select', value: 'payment.captured', options: TRIGGER_OPTIONS }] },
      { id: 'n1-2', type: 'action', title: 'Shiprocket: Standard order', detail: 'POST /v1/external/orders/create/adhoc · Auto-assign courier', iconName: 'Truck', editFields: [{ key: 'courier', label: 'Courier', type: 'select', value: 'auto', options: COURIER_OPTIONS }] },
      { id: 'n1-3', type: 'action', title: 'WhatsApp: Order Confirmation', detail: 'Template: order_confirmed · auto-triggered', iconName: 'MessageCircle', editFields: [{ key: 'template', label: 'Message template', type: 'select', value: 'order_confirmed', options: WHATSAPP_TEMPLATES }, { key: 'delay', label: 'Send after (minutes)', type: 'number', value: '0' }] },
      { id: 'n1-4', type: 'action', title: 'Send Receipt PDF', detail: 'Auto-generated PDF · delivered via WhatsApp', iconName: 'CreditCard', editFields: [{ key: 'format', label: 'Delivery', type: 'select', value: 'pdf', options: [{ label: 'PDF via WhatsApp', value: 'pdf' }, { label: 'PDF via Email', value: 'email' }] }] },
    ],
  },
  {
    id: 'flow-2',
    name: 'Balance due reminder',
    prompt: 'send balance due reminder 2 days before due date',
    status: 'live',
    nodes: [
      { id: 'n2-1', type: 'trigger', title: 'Balance due (D-2)', detail: 'Fires 2 days before the balance payment deadline', iconName: 'Bell', editFields: [{ key: 'event', label: 'Trigger event', type: 'select', value: 'balance.due', options: TRIGGER_OPTIONS }] },
      { id: 'n2-2', type: 'action', title: 'WhatsApp: Balance Reminder', detail: 'Template: balance_reminder · includes payment link', iconName: 'Bell', editFields: [{ key: 'template', label: 'Message template', type: 'select', value: 'balance_reminder', options: WHATSAPP_TEMPLATES }, { key: 'delay', label: 'Send after (minutes)', type: 'number', value: '0' }] },
    ],
  },
  {
    id: 'flow-3',
    name: 'High-value VIP flow',
    prompt: 'for orders over 5000 use priority courier and send VIP message',
    status: 'draft',
    nodes: [
      { id: 'n3-1', type: 'trigger', title: 'Payment captured', detail: 'event: payment.captured · Razorpay webhook', iconName: 'Zap', editFields: [{ key: 'event', label: 'Trigger event', type: 'select', value: 'payment.captured', options: TRIGGER_OPTIONS }] },
      { id: 'n3-2', type: 'condition', title: 'Order value > ₹5,000', detail: 'Proceeds only if this condition is met', iconName: 'Filter', editFields: [{ key: 'field', label: 'Field', type: 'select', value: 'amount', options: [{ label: 'Order value', value: 'amount' }, { label: 'Customer type', value: 'customer_type' }] }, { key: 'operator', label: 'Operator', type: 'select', value: '>', options: [{ label: 'Greater than (>)', value: '>' }, { label: 'Less than (<)', value: '<' }] }, { key: 'value', label: 'Value (₹)', type: 'number', value: '5000' }] },
      { id: 'n3-3', type: 'action', title: 'Shiprocket: Priority order', detail: 'POST /v1/external/orders/create/adhoc · Express courier', iconName: 'Truck', editFields: [{ key: 'courier', label: 'Courier', type: 'select', value: 'express', options: COURIER_OPTIONS }] },
      { id: 'n3-4', type: 'action', title: 'WhatsApp: VIP Thank You', detail: 'Template: vip_thankyou · auto-triggered', iconName: 'MessageCircle', editFields: [{ key: 'template', label: 'Message template', type: 'select', value: 'vip_thankyou', options: WHATSAPP_TEMPLATES }, { key: 'delay', label: 'Send after (minutes)', type: 'number', value: '0' }] },
    ],
  },
  {
    id: 'flow-4',
    name: 'Failed payment retry',
    prompt: 'when payment fails send retry link after 30 minutes',
    status: 'paused',
    nodes: [
      { id: 'n4-1', type: 'trigger', title: 'Payment failed', detail: 'Fires when a Razorpay payment attempt is declined', iconName: 'AlertCircle', editFields: [{ key: 'event', label: 'Trigger event', type: 'select', value: 'payment.failed', options: TRIGGER_OPTIONS }] },
      { id: 'n4-2', type: 'action', title: 'WhatsApp: Payment Retry Link', detail: 'Sends a fresh Razorpay payment link · 30 min delay', iconName: 'MessageCircle', editFields: [{ key: 'template', label: 'Message template', type: 'select', value: 'payment_retry', options: WHATSAPP_TEMPLATES }, { key: 'delay', label: 'Send after (minutes)', type: 'number', value: '30' }] },
    ],
  },
];

// ─── Store ────────────────────────────────────────────────────────────
interface WorkflowStore {
  flows: SavedFlow[];
  activeId: string;
  setActiveId: (id: string) => void;
  addFlow: (name: string, prompt: string, nodes: VisualNode[]) => string;
  updateNode: (flowId: string, nodeId: string, fields: EditField[], title: string) => void;
  deleteNode: (flowId: string, nodeId: string) => void;
  addNode: (flowId: string, node: VisualNode) => void;
  renameFlow: (id: string, name: string) => void;
  setFlowStatus: (id: string, status: FlowStatus) => void;
  deleteFlow: (id: string) => void;
}

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  flows: SEED,
  activeId: SEED[0].id,

  setActiveId: (id) => set({ activeId: id }),

  addFlow: (name, prompt, nodes) => {
    const id = `flow-${Date.now()}`;
    set((state) => ({
      flows: [{ id, name, prompt, nodes, status: 'draft' }, ...state.flows],
      activeId: id,
    }));
    return id;
  },

  updateNode: (flowId, nodeId, fields, title) =>
    set((state) => ({
      flows: state.flows.map((f) =>
        f.id !== flowId ? f : {
          ...f,
          nodes: f.nodes.map((n) => n.id !== nodeId ? n : { ...n, editFields: fields, title }),
        }
      ),
    })),

  deleteNode: (flowId, nodeId) =>
    set((state) => ({
      flows: state.flows.map((f) =>
        f.id !== flowId ? f : { ...f, nodes: f.nodes.filter((n) => n.id !== nodeId) }
      ),
    })),

  addNode: (flowId, node) =>
    set((state) => ({
      flows: state.flows.map((f) =>
        f.id !== flowId ? f : { ...f, nodes: [...f.nodes, node] }
      ),
    })),

  renameFlow: (id, name) =>
    set((state) => ({
      flows: state.flows.map((f) => (f.id === id ? { ...f, name } : f)),
    })),

  setFlowStatus: (id, status) =>
    set((state) => ({
      flows: state.flows.map((f) => (f.id === id ? { ...f, status } : f)),
    })),

  deleteFlow: (id) =>
    set((state) => {
      const remaining = state.flows.filter((f) => f.id !== id);
      return {
        flows: remaining,
        activeId: state.activeId === id ? (remaining[0]?.id ?? '') : state.activeId,
      };
    }),

}));

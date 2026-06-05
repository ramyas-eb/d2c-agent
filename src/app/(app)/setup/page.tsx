'use client';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Sparkles, Zap, Truck, MessageCircle, CreditCard, Bell, AlertCircle,
  Filter, Plus, Trash2, Pencil, Lightbulb, GitBranch, Check, Save, BookOpen, X,
} from 'lucide-react';
import {
  useWorkflowStore,
  type VisualNode, type EditField, type NodeIconName,
  TRIGGER_OPTIONS, WHATSAPP_TEMPLATES, COURIER_OPTIONS,
} from '@/store/workflows';

// ─── Icon lookup ──────────────────────────────────────────────────────
const ICON_MAP: Record<NodeIconName, React.ElementType> = {
  Zap, Truck, MessageCircle, CreditCard, Bell, AlertCircle, Filter,
};

// ─── AI Parser ────────────────────────────────────────────────────────
function parsePromptToNodes(prompt: string): VisualNode[] {
  const lower = prompt.toLowerCase();
  const nodes: VisualNode[] = [];
  let n = 0;
  const uid = () => `np${n++}-${Date.now()}`;

  // Trigger
  if (lower.match(/balance|overdue|reminder|due date/)) {
    nodes.push({ id: uid(), type: 'trigger', title: 'Balance due (D-2)', detail: 'Fires 2 days before the balance payment deadline', iconName: 'Bell', editFields: [{ key: 'event', label: 'Trigger event', type: 'select', value: 'balance.due', options: TRIGGER_OPTIONS }] });
  } else if (lower.match(/fail|bounce|declin|reject/)) {
    nodes.push({ id: uid(), type: 'trigger', title: 'Payment failed', detail: 'Fires when a Razorpay payment attempt is declined', iconName: 'AlertCircle', editFields: [{ key: 'event', label: 'Trigger event', type: 'select', value: 'payment.failed', options: TRIGGER_OPTIONS }] });
  } else {
    nodes.push({ id: uid(), type: 'trigger', title: 'Payment captured', detail: 'event: payment.captured · Razorpay webhook', iconName: 'Zap', editFields: [{ key: 'event', label: 'Trigger event', type: 'select', value: 'payment.captured', options: TRIGGER_OPTIONS }] });
  }

  // Conditions
  const amountMatch = lower.match(/(?:over|above|more than|greater than|exceeds?|>)\s*[₹rs]?\s*(\d[\d,]*)/);
  if (amountMatch) {
    const amt = amountMatch[1].replace(/,/g, '');
    nodes.push({ id: uid(), type: 'condition', title: `Order value > ₹${parseInt(amt).toLocaleString('en-IN')}`, detail: 'Proceeds only if this condition is met', iconName: 'Filter', editFields: [{ key: 'field', label: 'Field', type: 'select', value: 'amount', options: [{ label: 'Order value', value: 'amount' }, { label: 'Customer type', value: 'customer_type' }] }, { key: 'operator', label: 'Operator', type: 'select', value: '>', options: [{ label: 'Greater than (>)', value: '>' }, { label: 'Less than (<)', value: '<' }, { label: 'Equal to (=)', value: '=' }] }, { key: 'value', label: 'Value (₹)', type: 'number', value: amt }] });
  }
  if (lower.match(/repeat|returning|loyal|old customer|existing customer/)) {
    nodes.push({ id: uid(), type: 'condition', title: 'Customer type = Returning', detail: 'Customer has at least 1 previous paid order', iconName: 'Filter', editFields: [{ key: 'field', label: 'Field', type: 'select', value: 'customer_type', options: [{ label: 'Customer type', value: 'customer_type' }, { label: 'Order value', value: 'amount' }] }, { key: 'value', label: 'Value', type: 'select', value: 'returning', options: [{ label: 'Returning customer', value: 'returning' }, { label: 'New customer', value: 'new' }] }] });
  }

  // Actions
  if (lower.match(/shiprocket|ship|courier|dispatch|fulfil|deliver/)) {
    const isPriority = !!lower.match(/priority|express|fast|urgent|vip|special/);
    nodes.push({ id: uid(), type: 'action', title: `Shiprocket: ${isPriority ? 'Priority' : 'Standard'} order`, detail: `POST /v1/external/orders/create/adhoc · ${isPriority ? 'Express courier' : 'Auto-assign courier'}`, iconName: 'Truck', editFields: [{ key: 'courier', label: 'Courier', type: 'select', value: isPriority ? 'express' : 'auto', options: COURIER_OPTIONS }] });
  }
  if (lower.match(/fail|bounce|retry|payment link|try again/)) {
    nodes.push({ id: uid(), type: 'action', title: 'WhatsApp: Payment Retry Link', detail: 'Sends a fresh Razorpay payment link with a note', iconName: 'MessageCircle', editFields: [{ key: 'template', label: 'Message template', type: 'select', value: 'payment_retry', options: WHATSAPP_TEMPLATES }, { key: 'delay', label: 'Send after (minutes)', type: 'number', value: '30' }] });
  } else if (lower.match(/reminder|balance|due/)) {
    nodes.push({ id: uid(), type: 'action', title: 'WhatsApp: Balance Reminder', detail: 'Template: balance_reminder · includes payment link', iconName: 'Bell', editFields: [{ key: 'template', label: 'Message template', type: 'select', value: 'balance_reminder', options: WHATSAPP_TEMPLATES }, { key: 'delay', label: 'Send after (minutes)', type: 'number', value: '0' }] });
  } else {
    const isVIP = !!lower.match(/vip|special|thank|personaliz/);
    nodes.push({ id: uid(), type: 'action', title: `WhatsApp: ${isVIP ? 'VIP Thank You' : 'Order Confirmation'}`, detail: `Template: ${isVIP ? 'vip_thankyou' : 'order_confirmed'} · auto-triggered`, iconName: 'MessageCircle', editFields: [{ key: 'template', label: 'Message template', type: 'select', value: isVIP ? 'vip_thankyou' : 'order_confirmed', options: WHATSAPP_TEMPLATES }, { key: 'delay', label: 'Send after (minutes)', type: 'number', value: '0' }] });
  }
  if (lower.match(/receipt|invoice|pdf/)) {
    nodes.push({ id: uid(), type: 'action', title: 'Send Receipt PDF', detail: 'Auto-generated PDF · delivered via WhatsApp', iconName: 'CreditCard', editFields: [{ key: 'format', label: 'Delivery', type: 'select', value: 'pdf', options: [{ label: 'PDF via WhatsApp', value: 'pdf' }, { label: 'PDF via Email', value: 'email' }] }] });
  }

  return nodes;
}

// Smart name from prompt
function promptToName(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.match(/balance|due|reminder/)) return 'Balance due reminder';
  if (lower.match(/fail|retry/)) return 'Failed payment retry';
  if (lower.match(/vip|5000|high.value/)) return 'VIP order flow';
  if (lower.match(/ship|shiprocket/)) return 'Post-payment fulfilment';
  const words = prompt.trim().split(/\s+/).slice(0, 4);
  return words[0].charAt(0).toUpperCase() + words[0].slice(1) + (words.length > 1 ? ' ' + words.slice(1).join(' ') : '');
}

function explainFlow(nodes: VisualNode[]): string {
  const trigger = nodes.find((n) => n.type === 'trigger');
  const conditions = nodes.filter((n) => n.type === 'condition');
  const actions = nodes.filter((n) => n.type === 'action');
  const triggerEvent = trigger?.editFields.find((f) => f.key === 'event')?.value;
  const triggerPhrase: Record<string, string> = { 'payment.captured': "a customer's payment goes through on Razorpay", 'payment.failed': "a payment attempt fails on Razorpay", 'balance.due': "a balance payment is 2 days away from its due date", 'order.shipped': "an order is marked as shipped" };
  const when = triggerPhrase[triggerEvent ?? ''] ?? 'the trigger fires';
  const condPhrases = conditions.map((c) => {
    const field = c.editFields.find((f) => f.key === 'field')?.value;
    const op = c.editFields.find((f) => f.key === 'operator')?.value;
    const val = c.editFields.find((f) => f.key === 'value')?.value ?? '0';
    if (field === 'amount') { const word = op === '>' ? 'above' : op === '<' ? 'below' : 'exactly'; return `the order value is ${word} ₹${parseInt(val).toLocaleString('en-IN')}`; }
    if (field === 'customer_type') return val === 'returning' ? 'the customer has ordered before' : 'the customer is a first-time buyer';
    return c.title.toLowerCase();
  });
  const actionPhrases = actions.map((a) => {
    const tpl = a.editFields.find((f) => f.key === 'template')?.value;
    const courier = a.editFields.find((f) => f.key === 'courier')?.value;
    const delay = parseInt(a.editFields.find((f) => f.key === 'delay')?.value ?? '0');
    const after = delay > 0 ? ` (${delay} min later)` : '';
    if (courier) { const n = courier === 'auto' ? 'the cheapest available courier' : courier === 'express' ? 'an express courier' : courier; return `creates a Shiprocket order and assigns ${n}`; }
    const tplMap: Record<string, string> = { order_confirmed: `sends an order confirmation on WhatsApp${after}`, awb_sent: `sends the tracking number on WhatsApp${after}`, receipt: `sends a receipt PDF via WhatsApp${after}`, balance_reminder: `sends a balance due reminder on WhatsApp${after}`, vip_thankyou: `sends a personalised VIP thank-you on WhatsApp${after}`, payment_retry: `sends a fresh payment link on WhatsApp${after}` };
    if (tpl && tplMap[tpl]) return tplMap[tpl];
    if (a.title.includes('Receipt')) return `sends a receipt PDF via WhatsApp${after}`;
    return a.title.toLowerCase();
  });
  const condClause = condPhrases.length > 0 ? `, but only if ${condPhrases.join(' and ')},` : '';
  if (actionPhrases.length === 0) return `Whenever ${when}${condClause} this workflow runs. No actions configured yet.`;
  if (actionPhrases.length === 1) return `Whenever ${when}${condClause} this workflow automatically ${actionPhrases[0]}. No manual work needed.`;
  const last = actionPhrases[actionPhrases.length - 1];
  return `Whenever ${when}${condClause} this workflow automatically ${actionPhrases.slice(0, -1).join(', then ')} — and finally ${last}. No manual work needed.`;
}

// ─── Template library ─────────────────────────────────────────────────
interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'fulfilment' | 'payment' | 'retention' | 'vip';
  nodes: VisualNode[];
}

const TEMPLATE_LIBRARY: WorkflowTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Post-payment fulfilment',
    description: 'Ship via Shiprocket + send WhatsApp confirmation + receipt PDF. The standard flow for every paid order.',
    category: 'fulfilment',
    nodes: [
      { id: 't1n1', type: 'trigger', title: 'Payment captured', detail: 'event: payment.captured · Razorpay webhook', iconName: 'Zap', editFields: [{ key: 'event', label: 'Trigger event', type: 'select', value: 'payment.captured', options: TRIGGER_OPTIONS }] },
      { id: 't1n2', type: 'action', title: 'Shiprocket: Standard order', detail: 'POST /v1/external/orders/create/adhoc · Auto-assign courier', iconName: 'Truck', editFields: [{ key: 'courier', label: 'Courier', type: 'select', value: 'auto', options: COURIER_OPTIONS }] },
      { id: 't1n3', type: 'action', title: 'WhatsApp: Order Confirmation', detail: 'Template: order_confirmed · auto-triggered', iconName: 'MessageCircle', editFields: [{ key: 'template', label: 'Message template', type: 'select', value: 'order_confirmed', options: WHATSAPP_TEMPLATES }, { key: 'delay', label: 'Send after (minutes)', type: 'number', value: '0' }] },
      { id: 't1n4', type: 'action', title: 'Send Receipt PDF', detail: 'Auto-generated PDF · delivered via WhatsApp', iconName: 'CreditCard', editFields: [{ key: 'format', label: 'Delivery', type: 'select', value: 'pdf', options: [{ label: 'PDF via WhatsApp', value: 'pdf' }, { label: 'PDF via Email', value: 'email' }] }] },
    ],
  },
  {
    id: 'tpl-2',
    name: 'Failed payment retry',
    description: 'When a payment fails, wait 30 minutes then send a fresh Razorpay link. Recovers 15–25% of failed payments.',
    category: 'payment',
    nodes: [
      { id: 't2n1', type: 'trigger', title: 'Payment failed', detail: 'Fires when a Razorpay payment attempt is declined', iconName: 'AlertCircle', editFields: [{ key: 'event', label: 'Trigger event', type: 'select', value: 'payment.failed', options: TRIGGER_OPTIONS }] },
      { id: 't2n2', type: 'action', title: 'WhatsApp: Payment Retry Link', detail: 'Sends a fresh Razorpay payment link · 30 min delay', iconName: 'MessageCircle', editFields: [{ key: 'template', label: 'Message template', type: 'select', value: 'payment_retry', options: WHATSAPP_TEMPLATES }, { key: 'delay', label: 'Send after (minutes)', type: 'number', value: '30' }] },
    ],
  },
  {
    id: 'tpl-3',
    name: 'Balance due reminder',
    description: 'Fires 2 days before a partial payment balance is due. Sends WhatsApp reminder with payment link.',
    category: 'payment',
    nodes: [
      { id: 't3n1', type: 'trigger', title: 'Balance due (D-2)', detail: 'Fires 2 days before the balance payment deadline', iconName: 'Bell', editFields: [{ key: 'event', label: 'Trigger event', type: 'select', value: 'balance.due', options: TRIGGER_OPTIONS }] },
      { id: 't3n2', type: 'action', title: 'WhatsApp: Balance Reminder', detail: 'Template: balance_reminder · includes payment link', iconName: 'Bell', editFields: [{ key: 'template', label: 'Message template', type: 'select', value: 'balance_reminder', options: WHATSAPP_TEMPLATES }, { key: 'delay', label: 'Send after (minutes)', type: 'number', value: '0' }] },
    ],
  },
  {
    id: 'tpl-4',
    name: 'VIP high-value flow',
    description: 'For orders over ₹5,000 — upgrade to priority courier and send a personalised VIP thank you.',
    category: 'vip',
    nodes: [
      { id: 't4n1', type: 'trigger', title: 'Payment captured', detail: 'event: payment.captured · Razorpay webhook', iconName: 'Zap', editFields: [{ key: 'event', label: 'Trigger event', type: 'select', value: 'payment.captured', options: TRIGGER_OPTIONS }] },
      { id: 't4n2', type: 'condition', title: 'Order value > ₹5,000', detail: 'Proceeds only if this condition is met', iconName: 'Filter', editFields: [{ key: 'field', label: 'Field', type: 'select', value: 'amount', options: [{ label: 'Order value', value: 'amount' }] }, { key: 'operator', label: 'Operator', type: 'select', value: '>', options: [{ label: 'Greater than (>)', value: '>' }] }, { key: 'value', label: 'Value (₹)', type: 'number', value: '5000' }] },
      { id: 't4n3', type: 'action', title: 'Shiprocket: Priority order', detail: 'POST /v1/external/orders/create/adhoc · Express courier', iconName: 'Truck', editFields: [{ key: 'courier', label: 'Courier', type: 'select', value: 'express', options: COURIER_OPTIONS }] },
      { id: 't4n4', type: 'action', title: 'WhatsApp: VIP Thank You', detail: 'Template: vip_thankyou · auto-triggered', iconName: 'MessageCircle', editFields: [{ key: 'template', label: 'Message template', type: 'select', value: 'vip_thankyou', options: WHATSAPP_TEMPLATES }, { key: 'delay', label: 'Send after (minutes)', type: 'number', value: '0' }] },
    ],
  },
  {
    id: 'tpl-5',
    name: 'Express shipping upsell',
    description: 'After payment, offer express courier for ₹99 extra. Confirm via WhatsApp before shipping.',
    category: 'fulfilment',
    nodes: [
      { id: 't5n1', type: 'trigger', title: 'Payment captured', detail: 'event: payment.captured · Razorpay webhook', iconName: 'Zap', editFields: [{ key: 'event', label: 'Trigger event', type: 'select', value: 'payment.captured', options: TRIGGER_OPTIONS }] },
      { id: 't5n2', type: 'action', title: 'WhatsApp: AWB & Tracking', detail: 'Template: awb_sent · standard courier assigned', iconName: 'MessageCircle', editFields: [{ key: 'template', label: 'Message template', type: 'select', value: 'awb_sent', options: WHATSAPP_TEMPLATES }, { key: 'delay', label: 'Send after (minutes)', type: 'number', value: '5' }] },
    ],
  },
  {
    id: 'tpl-6',
    name: 'Returning customer reward',
    description: 'Detect repeat customers and automatically apply a 5% loyalty discount with a VIP message.',
    category: 'retention',
    nodes: [
      { id: 't6n1', type: 'trigger', title: 'Payment captured', detail: 'event: payment.captured · Razorpay webhook', iconName: 'Zap', editFields: [{ key: 'event', label: 'Trigger event', type: 'select', value: 'payment.captured', options: TRIGGER_OPTIONS }] },
      { id: 't6n2', type: 'condition', title: 'Customer type = Returning', detail: 'Customer has at least 1 previous paid order', iconName: 'Filter', editFields: [{ key: 'field', label: 'Field', type: 'select', value: 'customer_type', options: [{ label: 'Customer type', value: 'customer_type' }] }, { key: 'value', label: 'Value', type: 'select', value: 'returning', options: [{ label: 'Returning customer', value: 'returning' }] }] },
      { id: 't6n3', type: 'action', title: 'WhatsApp: VIP Thank You', detail: 'Personalised loyalty message with 5% off next order', iconName: 'MessageCircle', editFields: [{ key: 'template', label: 'Message template', type: 'select', value: 'vip_thankyou', options: WHATSAPP_TEMPLATES }, { key: 'delay', label: 'Send after (minutes)', type: 'number', value: '0' }] },
    ],
  },
];

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  fulfilment: { label: 'Fulfilment', color: 'bg-blue-100 text-blue-700' },
  payment:    { label: 'Payment',    color: 'bg-amber-100 text-amber-700' },
  retention:  { label: 'Retention', color: 'bg-purple-100 text-purple-700' },
  vip:        { label: 'VIP',        color: 'bg-yellow-100 text-yellow-700' },
};

// ─── Template Library Modal ────────────────────────────────────────────
function TemplateLibrary({ onClose, onUse }: { onClose: () => void; onUse: (tpl: WorkflowTemplate) => void }) {
  const [filter, setFilter] = useState<string>('all');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const shown = filter === 'all' ? TEMPLATE_LIBRARY : TEMPLATE_LIBRARY.filter(t => t.category === filter);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      {/* Modal */}
      <div ref={ref} className="fixed inset-y-0 right-0 z-50 w-[520px] bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-base font-semibold text-gray-900">Template Library</p>
            <p className="text-xs text-gray-500 mt-0.5">One-click import — edit after adding</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-6 py-2.5 border-b border-gray-100 flex-shrink-0">
          {(['all', 'fulfilment', 'payment', 'retention', 'vip'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                filter === cat ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              {cat === 'all' ? 'All' : CATEGORY_LABELS[cat].label}
            </button>
          ))}
        </div>

        {/* Template list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {shown.map(tpl => {
            const cat = CATEGORY_LABELS[tpl.category];
            return (
              <div key={tpl.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-200 hover:bg-blue-50/30 transition-colors group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">{tpl.name}</p>
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', cat.color)}>{cat.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{tpl.description}</p>
                    {/* Node preview chips */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tpl.nodes.map(n => (
                        <span key={n.id} className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full border font-medium',
                          n.type === 'trigger' ? 'bg-green-50 text-green-700 border-green-200' :
                          n.type === 'condition' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        )}>
                          {n.title}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => { onUse(tpl); onClose(); }}
                    className="flex-shrink-0 flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Plus className="w-3 h-3" /> Use
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Canvas constants ──────────────────────────────────────────────
const NW = 210;
const NH = 82;
const GAP = 60;

// ─── Node Card ────────────────────────────────────────────────────────
function NodeCard({ node, flowId }: { node: VisualNode; flowId: string }) {
  const { updateNode, deleteNode } = useWorkflowStore();
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<EditField[]>(node.editFields);
  const Icon = ICON_MAP[node.iconName] ?? Zap;

  useEffect(() => { if (!open) setFields([...node.editFields]); }, [node.editFields, open]);

  const computeTitle = (fs: EditField[]): string => {
    if (node.type === 'condition') {
      const fF = fs.find((x) => x.key === 'field');
      const oF = fs.find((x) => x.key === 'operator');
      const vF = fs.find((x) => x.key === 'value');
      if (fF?.value === 'amount') return `Order value ${oF?.value ?? '>'} ₹${parseInt(vF?.value ?? '0').toLocaleString('en-IN')}`;
      if (fF?.value === 'customer_type') return `Customer type = ${vF?.value === 'returning' ? 'Returning' : 'New'}`;
    }
    if (node.type === 'action') {
      const tpl = fs.find((x) => x.key === 'template');
      const courier = fs.find((x) => x.key === 'courier');
      if (tpl) return `WhatsApp: ${WHATSAPP_TEMPLATES.find((t) => t.value === tpl.value)?.label ?? tpl.value}`;
      if (courier) return `Shiprocket: ${courier.value === 'express' ? 'Priority' : 'Standard'} order`;
    }
    return node.title;
  };

  const s = {
    trigger:   { strip: 'bg-green-50 border-green-100',   iconCls: 'text-green-600',  labelCls: 'text-green-600',  labelText: 'Start when…' },
    condition: { strip: 'bg-amber-50 border-amber-100',   iconCls: 'text-amber-600',  labelCls: 'text-amber-600',  labelText: 'Check if…'   },
    action:    { strip: 'bg-blue-50 border-blue-100',     iconCls: 'text-blue-600',   labelCls: 'text-blue-600',   labelText: 'Do this…'    },
  }[node.type];

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm', open && 'ring-2 ring-blue-400 ring-offset-1 shadow-md')} style={{ width: NW }}>
      <div className={cn('flex items-center justify-between px-3 py-1.5 border-b rounded-t-xl', s.strip)}>
        <div className="flex items-center gap-1.5">
          <Icon className={cn('w-3 h-3', s.iconCls)} />
          <span className={cn('text-xs font-medium', s.labelCls)}>{s.labelText}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setOpen((v) => !v)} className={cn('w-5 h-5 rounded flex items-center justify-center transition-colors', open ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600')}>
            <Pencil className="w-3 h-3" />
          </button>
          {node.type !== 'trigger' && (
            <button onClick={() => deleteNode(flowId, node.id)} className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-sm font-semibold text-gray-900 leading-snug">{node.title}</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-tight line-clamp-2">{node.detail}</p>
      </div>
      {open && (
        <div className="border-t border-gray-100 px-3 py-2.5 space-y-2 bg-gray-50 rounded-b-xl">
          {fields.map((field, i) => (
            <div key={field.key}>
              <label className="text-xs font-medium text-gray-500 block mb-1">{field.label}</label>
              {field.type === 'select' ? (
                <select value={field.value} onChange={(e) => setFields((prev) => prev.map((f, j) => j === i ? { ...f, value: e.target.value } : f))} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 bg-white outline-none focus:ring-1 focus:ring-blue-300">
                  {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input type={field.type} value={field.value} onChange={(e) => setFields((prev) => prev.map((f, j) => j === i ? { ...f, value: e.target.value } : f))} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-blue-300" />
              )}
            </div>
          ))}
          <div className="flex gap-1.5 pt-0.5">
            <button onClick={() => { updateNode(flowId, node.id, fields, computeTitle(fields)); setOpen(false); }} className="flex items-center gap-1 bg-blue-600 text-white text-xs px-2.5 py-1 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              <Check className="w-3 h-3" /> Save
            </button>
            <button onClick={() => { setFields([...node.editFields]); setOpen(false); }} className="text-xs text-gray-500 px-2.5 py-1 rounded-lg hover:bg-gray-200 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Horizontal Canvas ────────────────────────────────────────────────
function HorizontalCanvas({ nodes, flowId, onAddAction }: {
  nodes: VisualNode[];
  flowId: string;
  onAddAction: () => void;
}) {
  const nodeY = 52;
  const midY = nodeY + NH / 2;
  const lx = (i: number) => 32 + i * (NW + GAP);
  const rx = (i: number) => lx(i) + NW;
  const canvasW = Math.max(700, lx(nodes.length) + 80);
  const canvasH = nodeY + NH + 240;

  return (
    <div className="h-full overflow-x-auto overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
      <div style={{ position: 'relative', width: canvasW, height: canvasH }}>
        <svg width={canvasW} height={canvasH} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
          {nodes.map((node, i) => {
            if (i === nodes.length - 1) return null;
            const x1 = rx(i), x2 = lx(i + 1), cp = (x2 - x1) * 0.55;
            return (
              <g key={`c-${node.id}`}>
                <path d={`M ${x1} ${midY} C ${x1 + cp} ${midY} ${x2 - cp} ${midY} ${x2} ${midY}`} stroke="#3b82f6" strokeWidth="1.5" fill="none" opacity="0.55" />
                <circle cx={x1} cy={midY} r="5" fill="#3b82f6" />
                <circle cx={x2} cy={midY} r="5" fill="white" stroke="#3b82f6" strokeWidth="2" />
                <text x={(x1 + x2) / 2} y={midY - 10} textAnchor="middle" fontSize="9" fill="#9ca3af" fontFamily="ui-sans-serif, system-ui, sans-serif" letterSpacing="0.4">THEN</text>
              </g>
            );
          })}
          {nodes.length > 0 && (
            <g>
              <circle cx={rx(nodes.length - 1)} cy={midY} r="5" fill="#d1d5db" />
              <line x1={rx(nodes.length - 1)} y1={midY} x2={rx(nodes.length - 1) + 44} y2={midY} stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4 3" />
            </g>
          )}
        </svg>

        {nodes.map((node, i) => (
          <div key={node.id} style={{ position: 'absolute', left: lx(i), top: nodeY }}>
            <NodeCard node={node} flowId={flowId} />
          </div>
        ))}

        {nodes.length > 0 && (
          <button
            onClick={onAddAction}
            style={{ position: 'absolute', left: rx(nodes.length - 1) + 48, top: midY - 12 }}
            title="Add action"
            className="w-6 h-6 bg-white border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-500 transition-all shadow-sm"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-gray-400">Describe your automation below to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Suggestions ──────────────────────────────────────────────────────
const SUGGESTIONS = [
  'When payment is received, ship via Shiprocket and confirm on WhatsApp',
  'If order is over ₹5000, use priority courier and send VIP thank you',
  '2 days before balance due, send a payment reminder on WhatsApp',
  'When payment fails, send a retry link after 30 minutes',
];

// ─── Page ─────────────────────────────────────────────────────────────
export default function SetupPage() {
  const { flows, activeId, addFlow, addNode, setFlowStatus, renameFlow } = useWorkflowStore();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [saved, setSaved] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const promptRef = useRef<HTMLInputElement>(null);

  const active = flows.find((f) => f.id === activeId) ?? flows[0];

  // Reset title edit when switching flows
  useEffect(() => { setEditingTitle(false); }, [activeId]);

  const generate = () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    const captured = prompt.trim();
    setPrompt('');
    setTimeout(() => {
      const nodes = parsePromptToNodes(captured);
      addFlow(promptToName(captured), captured, nodes);
      setGenerating(false);
      setShowExplain(false);
    }, 1300);
  };

  const handleAddAction = () => {
    if (!active) return;
    addNode(active.id, { id: `n-${Date.now()}`, type: 'action', title: 'WhatsApp: Order Confirmation', detail: 'Template: order_confirmed · auto-triggered', iconName: 'MessageCircle', editFields: [{ key: 'template', label: 'Message template', type: 'select', value: 'order_confirmed', options: WHATSAPP_TEMPLATES }, { key: 'delay', label: 'Send after (minutes)', type: 'number', value: '0' }] });
  };

  const handleAddReceiptSuggestion = () => {
    if (!active) return;
    addNode(active.id, { id: `n-${Date.now()}`, type: 'action', title: 'Send Receipt PDF', detail: 'Auto-generated PDF · delivered via WhatsApp', iconName: 'CreditCard', editFields: [{ key: 'format', label: 'Delivery', type: 'select', value: 'pdf', options: [{ label: 'PDF via WhatsApp', value: 'pdf' }, { label: 'PDF via Email', value: 'email' }] }] });
  };

  const saveFlow = () => {
    if (!active) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLaunch = () => {
    if (!active) return;
    setFlowStatus(active.id, 'live');
    setLaunched(true);
    setTimeout(() => setLaunched(false), 2000);
  };

  const handlePause = () => { if (active) setFlowStatus(active.id, 'paused'); };

  const handleUseTemplate = (tpl: WorkflowTemplate) => {
    // Clone nodes with fresh IDs to avoid conflicts
    const freshNodes = tpl.nodes.map(n => ({ ...n, id: `${n.id}-${Date.now()}` }));
    addFlow(tpl.name, tpl.description, freshNodes);
  };

  const commitTitle = () => {
    const t = titleDraft.trim();
    if (t && active) renameFlow(active.id, t);
    setEditingTitle(false);
  };

  const hasCondition = active?.nodes.some((n) => n.type === 'condition') ?? false;
  const hasReceipt   = active?.nodes.some((n) => n.title.toLowerCase().includes('receipt')) ?? false;

  const statusStyle: Record<string, string> = {
    live:   'bg-green-100 text-green-700',
    draft:  'bg-amber-100 text-amber-600',
    paused: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-5 py-3 bg-white border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <GitBranch className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />

          {/* Editable title */}
          {editingTitle ? (
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
              autoFocus
              className="text-sm font-medium text-gray-900 border-b-2 border-blue-400 outline-none bg-transparent min-w-0 w-48"
            />
          ) : (
            <button
              onClick={() => { if (active) { setTitleDraft(active.name); setEditingTitle(true); } }}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 truncate max-w-[200px] text-left"
              title="Click to rename"
            >
              {active?.name ?? '—'}
            </button>
          )}

          {active && (
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0', statusStyle[active.status])}>
              {active.status.charAt(0).toUpperCase() + active.status.slice(1)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" /> Templates
          </button>
          <button onClick={() => setShowExplain((v) => !v)} className={cn('flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors', showExplain ? 'bg-amber-100 text-amber-700' : 'text-gray-500 hover:bg-gray-100')}>
            <Lightbulb className="w-3.5 h-3.5" /> Explain
          </button>

          {/* Launch / Pause / Resume */}
          {active?.status === 'live' ? (
            <button onClick={handlePause} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
              ⏸ Pause
            </button>
          ) : (
            <button onClick={handleLaunch} className={cn('flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors', launched ? 'bg-green-100 text-green-700' : 'bg-green-600 text-white hover:bg-green-700')}>
              {launched ? <><Check className="w-3.5 h-3.5" /> Live!</> : active?.status === 'paused' ? '▶ Resume' : '🚀 Launch'}
            </button>
          )}

          <button onClick={saveFlow} className={cn('flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors', saved ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700')}>
            {saved ? <><Check className="w-3.5 h-3.5" /> Saved</> : <><Save className="w-3.5 h-3.5" /> Save</>}
          </button>
        </div>
      </div>

      {/* ── AI prompt — at top, above canvas ── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 py-3">
        <div className="max-w-[520px] mx-auto space-y-2">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => { setPrompt(s); promptRef.current?.focus(); }} className="text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition-colors whitespace-nowrap flex-shrink-0">
                {s.length > 40 ? s.slice(0, 40) + '…' : s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <input ref={promptRef} value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') generate(); }} placeholder="Describe your automation in plain English…" className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent" />
            <button onClick={generate} disabled={!prompt.trim() || generating} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
              {generating ? 'Building…' : 'Generate →'}
            </button>
          </div>
        </div>
      </div>

      {/* Explain */}
      {showExplain && active && (
        <div className="flex-shrink-0 mx-5 mt-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">{explainFlow(active.nodes)}</p>
          </div>
        </div>
      )}

      {/* ── Canvas ── */}
      <div className="flex-1 overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)', backgroundSize: '24px 24px', backgroundColor: '#f8f9fa' }}>
        {generating ? (
          <div className="p-8 flex gap-4 animate-pulse">
            {[0, 1, 2].map((i) => <div key={i} className="rounded-xl bg-gray-200 flex-shrink-0" style={{ width: NW, height: NH }} />)}
          </div>
        ) : active ? (
          <HorizontalCanvas nodes={active.nodes} flowId={active.id} onAddAction={handleAddAction} />
        ) : null}
      </div>

      {/* Suggestions strip */}
      {active && (!hasCondition || !hasReceipt) && !generating && (
        <div className="flex-shrink-0 border-t border-gray-100 bg-white px-5 py-2 flex items-center gap-3">
          <Sparkles className="w-3 h-3 text-gray-400 flex-shrink-0" />
          {!hasCondition && (
            <button onClick={() => { setPrompt('Add a condition: only if order value is over 3000'); promptRef.current?.focus(); }} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> No condition set — filter by order value?
            </button>
          )}
          {!hasCondition && !hasReceipt && <span className="text-gray-200 text-xs">·</span>}
          {!hasReceipt && (
            <button onClick={handleAddReceiptSuggestion} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add receipt PDF step?
            </button>
          )}
        </div>
      )}

      {showTemplates && (
        <TemplateLibrary
          onClose={() => setShowTemplates(false)}
          onUse={handleUseTemplate}
        />
      )}

    </div>
  );
}

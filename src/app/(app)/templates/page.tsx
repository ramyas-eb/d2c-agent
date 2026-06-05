'use client';
import { useState } from 'react';
import { MessageCircle, Copy, Check, CheckCircle, Clock, Zap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Template data ────────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: 'order_confirmed',
    name: 'Order Confirmation',
    category: 'TRANSACTIONAL',
    status: 'approved',
    language: 'en',
    trigger: 'Payment captured',
    usedIn: 'Post-payment fulfilment',
    body: `Hi {{1}}! ✅ Your payment of *₹{{2}}* for *{{3}}* (Order #{{4}}) is confirmed.\n\nWe're packing your order now 📦\n\nYou'll receive tracking details shortly.`,
    variables: ['Customer name', 'Amount', 'Product name', 'Order ID'],
    footer: 'Shop Ekaja · Handcrafted ethnic wear',
  },
  {
    id: 'awb_sent',
    name: 'AWB & Tracking',
    category: 'TRANSACTIONAL',
    status: 'approved',
    language: 'en',
    trigger: 'Shiprocket AWB assigned',
    usedIn: 'Post-payment fulfilment',
    body: `🚚 Your order #{{1}} has been picked up by *{{2}}*.\n\nAWB: {{3}}\nTrack: {{4}}\n\nExpected delivery: 2–3 days`,
    variables: ['Order ID', 'Courier name', 'AWB number', 'Tracking URL'],
    footer: 'Shop Ekaja · Handcrafted ethnic wear',
  },
  {
    id: 'receipt',
    name: 'Receipt PDF',
    category: 'TRANSACTIONAL',
    status: 'approved',
    language: 'en',
    trigger: 'Receipt generated',
    usedIn: 'Post-payment fulfilment',
    body: `📄 Here's your receipt for *₹{{1}}*, {{2}}.\n\nOrder: #{{3}}\nDate: {{4}}\n\nThank you for shopping with *Shop Ekaja* 🙏`,
    variables: ['Amount', 'Customer name', 'Order ID', 'Order date'],
    footer: 'Shop Ekaja · Handcrafted ethnic wear',
  },
  {
    id: 'balance_reminder',
    name: 'Balance Reminder',
    category: 'TRANSACTIONAL',
    status: 'approved',
    language: 'en',
    trigger: 'Balance due D-2',
    usedIn: 'Balance due reminder',
    body: `Hi {{1}} 👋 Friendly reminder — your balance payment of *₹{{2}}* for *{{3}}* is due on *{{4}}*.\n\nPay here 👇\n{{5}}\n\nReach out if you need help!`,
    variables: ['Customer name', 'Balance amount', 'Product name', 'Due date', 'Payment link'],
    footer: 'Shop Ekaja · Handcrafted ethnic wear',
  },
  {
    id: 'vip_thankyou',
    name: 'VIP Thank You',
    category: 'MARKETING',
    status: 'approved',
    language: 'en',
    trigger: 'Order value > ₹5,000',
    usedIn: 'High-value VIP flow',
    body: `Dear {{1}} 💫\n\nThank you for your order of *₹{{2}}* — you're one of our most valued customers!\n\nYour *{{3}}* will be shipped via priority courier.\n\nAs a thank you, here's ₹200 off your next order: *VIPEKAJA*`,
    variables: ['Customer name', 'Order amount', 'Product name'],
    footer: 'Shop Ekaja · Handcrafted ethnic wear',
  },
  {
    id: 'payment_retry',
    name: 'Payment Retry Link',
    category: 'TRANSACTIONAL',
    status: 'pending',
    language: 'en',
    trigger: 'Payment failed',
    usedIn: 'Failed payment retry',
    body: `Hi {{1}}, we noticed your payment of *₹{{2}}* didn't go through 😟\n\nNo worries — here's a fresh payment link:\n{{3}}\n\nLink valid for 24 hours. Need help? Just reply!`,
    variables: ['Customer name', 'Amount', 'Payment link'],
    footer: 'Shop Ekaja · Handcrafted ethnic wear',
  },
];

// ─── Usage counts per template ────────────────────────────────────────
const USAGE_COUNTS: Record<string, number> = {
  order_confirmed: 52,
  awb_sent: 48,
  receipt: 48,
  balance_reminder: 23,
  vip_thankyou: 17,
  payment_retry: 9,
};

// ─── Helpers ──────────────────────────────────────────────────────────

/** Render message body with {{N}} replaced by variable name chips */
function renderBody(body: string, variables: string[]) {
  const parts = body.split(/({{(\d+)}})/g);
  const result: React.ReactNode[] = [];
  let i = 0;
  while (i < parts.length) {
    const part = parts[i];
    // Match pattern like {{1}}
    const match = part.match(/^{{(\d+)}}$/);
    if (match) {
      const idx = parseInt(match[1], 10) - 1;
      const varName = variables[idx] ?? `{{${match[1]}}}`;
      result.push(
        <span
          key={i}
          className="bg-blue-100 text-blue-700 text-[10px] px-1 rounded font-medium"
        >
          {varName}
        </span>
      );
    } else if (part !== '') {
      // Render *bold* as bold text
      const boldParts = part.split(/(\*[^*]+\*)/g);
      boldParts.forEach((bp, bi) => {
        if (bp.startsWith('*') && bp.endsWith('*') && bp.length > 2) {
          result.push(<strong key={`${i}-${bi}`}>{bp.slice(1, -1)}</strong>);
        } else if (bp !== '') {
          result.push(<span key={`${i}-${bi}`}>{bp}</span>);
        }
      });
    }
    i++;
  }
  return result;
}

// ─── Phone mockup ─────────────────────────────────────────────────────
function PhoneMockup({ body, variables, footer }: { body: string; variables: string[]; footer: string }) {
  return (
    <div
      className="rounded-xl overflow-hidden border border-gray-200"
      style={{ background: '#ece5dd' }}
    >
      {/* WhatsApp top bar */}
      <div className="bg-[#075e54] px-3 py-2 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-3 h-3 text-white" />
        </div>
        <span className="text-white text-[11px] font-medium">Shop Ekaja</span>
        <span className="ml-auto text-white/60 text-[9px]">verified</span>
      </div>
      {/* Chat area */}
      <div className="px-3 py-3">
        <div className="bg-white rounded-lg shadow-sm p-2.5 max-w-[85%]">
          <p className="text-[11px] text-gray-800 whitespace-pre-wrap leading-relaxed">
            {renderBody(body, variables)}
          </p>
          {footer && (
            <p className="text-[10px] text-gray-400 mt-1.5 pt-1.5 border-t border-gray-100 italic">
              {footer}
            </p>
          )}
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[9px] text-gray-400">now</span>
            <CheckCircle className="w-2.5 h-2.5 text-blue-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Template card ────────────────────────────────────────────────────
function TemplateCard({
  t,
  copied,
  onCopy,
}: {
  t: (typeof TEMPLATES)[0];
  copied: string | null;
  onCopy: (id: string, body: string) => void;
}) {
  const isCopied = copied === t.id;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Card header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug">{t.name}</h3>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Category badge */}
            <span
              className={cn(
                'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                t.category === 'TRANSACTIONAL'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-purple-100 text-purple-700'
              )}
            >
              {t.category}
            </span>
            {/* Status badge */}
            {t.status === 'approved' ? (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                <CheckCircle className="w-2.5 h-2.5" />
                Approved
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                <Clock className="w-2.5 h-2.5" />
                Pending
              </span>
            )}
          </div>
        </div>

        {/* Trigger & workflow */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Zap className="w-3 h-3" />
            {t.trigger}
          </div>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <span className="text-xs text-blue-600 font-medium">Used in: {t.usedIn}</span>
        </div>
      </div>

      {/* Phone mockup */}
      <div className="px-4 py-3">
        <PhoneMockup body={t.body} variables={t.variables} footer={t.footer} />
      </div>

      {/* Variables */}
      <div className="px-4 pb-3">
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Variables</p>
        <div className="flex flex-wrap gap-1">
          {t.variables.map((v, i) => (
            <span
              key={i}
              className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md"
            >
              {`{{${i + 1}}}`} {v}
            </span>
          ))}
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <span className="text-xs text-gray-400">{USAGE_COUNTS[t.id] ?? 0} sent this week</span>
        <button
          onClick={() => onCopy(t.id, t.body)}
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all',
            isCopied
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700'
          )}
        >
          {isCopied ? (
            <>
              <Check className="w-3 h-3" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy template
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────
export default function TemplatesPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const approved = TEMPLATES.filter((t) => t.status === 'approved').length;
  const pending = TEMPLATES.filter((t) => t.status === 'pending').length;

  const handleCopy = (id: string, body: string) => {
    navigator.clipboard.writeText(body);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto overflow-y-auto h-full">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircle className="w-5 h-5 text-green-600" />
          <h1 className="text-xl font-semibold text-gray-900">WhatsApp Templates</h1>
        </div>
        <p className="text-sm text-gray-500">
          {TEMPLATES.length} templates · {approved} approved · {pending} pending
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Templates active', value: approved, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Sent this week', value: 147, icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Open rate', value: '94%', icon: TrendingBadge, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', bg)}>
              <Icon className={cn('w-4 h-4', color)} />
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEMPLATES.map((t) => (
          <TemplateCard key={t.id} t={t} copied={copied} onCopy={handleCopy} />
        ))}
      </div>
    </div>
  );
}

// Inline stat icon for "Open rate" — reuse MessageCircle or a simple bar chart
function TrendingBadge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
      <polyline points="1,12 5,7 9,10 15,4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

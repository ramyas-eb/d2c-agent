'use client';
import { useState } from 'react';
import { Plus, Zap, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Automation {
  id: string;
  trigger: string;
  timing: string;
  message: string;
  enabled: boolean;
}

const DEFAULT_AUTOMATIONS: Automation[] = [
  {
    id: 'order_confirmed',
    trigger: 'Order placed',
    timing: 'Immediately',
    message: "Hi {name}! 🎉 Your order #{id} is confirmed. We'll ship within 24 hours and send you the tracking link. Thank you for shopping with us!",
    enabled: true,
  },
  {
    id: 'payment_reminder',
    trigger: 'Payment link not clicked',
    timing: '2 hrs after sending',
    message: "Hey {name}! 👋 Your payment link is still waiting. Need any help completing your order? Reply here and I'll sort it out.",
    enabled: true,
  },
  {
    id: 'order_shipped',
    trigger: 'Order shipped',
    timing: 'When shipped',
    message: "Great news {name}! 🚚 Your order is on its way. Track it here: {tracking_link}\nEstimated delivery: {eta}",
    enabled: true,
  },
  {
    id: 'post_delivery',
    trigger: 'Order delivered',
    timing: '3 days after delivery',
    message: "Hi {name}! Hope you're loving your order 💛 A quick review would mean the world to us!",
    enabled: false,
  },
  {
    id: 'back_in_stock',
    trigger: 'Item back in stock',
    timing: 'When restocked',
    message: "Good news {name}! {product} is back in stock 🎉 Want to place an order? Reply \"yes\" and I'll send the link.",
    enabled: false,
  },
];

// Replace placeholders with realistic sample values for preview
function previewMessage(template: string): string {
  return template
    .replace(/\{name\}/g, 'Priya')
    .replace(/\{id\}/g, '#4521')
    .replace(/\{tracking_link\}/g, 'shpfy.to/trk4521')
    .replace(/\{eta\}/g, 'Wed, 12 Jun')
    .replace(/\{product\}/g, 'Chanderi Cotton Saree');
}

function AutomationCard({
  auto,
  onToggle,
  onSave,
}: {
  auto: Automation;
  onToggle: () => void;
  onSave: (msg: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(auto.message);

  return (
    <div className={cn(
      'rounded-2xl border transition-all duration-200 flex flex-col',
      auto.enabled ? 'bg-white border-gray-200' : 'bg-gray-50/70 border-gray-100'
    )}>
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-semibold leading-tight', auto.enabled ? 'text-gray-900' : 'text-gray-400')}>
            {auto.trigger}
          </p>
          <p className={cn('text-xs mt-0.5', auto.enabled ? 'text-gray-400' : 'text-gray-300')}>
            {auto.timing}
          </p>
        </div>
        <button
          onClick={onToggle}
          role="switch"
          aria-checked={auto.enabled}
          style={{
            position: 'relative', display: 'inline-block', flexShrink: 0,
            width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
            backgroundColor: auto.enabled ? '#22c55e' : '#d1d5db',
            transition: 'background-color 0.2s',
          }}
        >
          <span style={{
            position: 'absolute', top: 2,
            left: auto.enabled ? 22 : 2,
            width: 20, height: 20, borderRadius: '50%',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            transition: 'left 0.2s',
          }} />
        </button>
      </div>

      {/* ── Message preview (enabled, not editing) ── */}
      {auto.enabled && !editing && (
        <div className="px-4 pb-3 flex-1 flex flex-col">
          <div className="bg-[#dcf8c6] rounded-xl rounded-tl-sm px-3 py-2 flex-1">
            <p className="text-xs text-gray-800 leading-relaxed line-clamp-4">
              {previewMessage(auto.message)}
            </p>
            <p className="text-[10px] text-[#53bdeb] text-right mt-1 select-none">✓✓</p>
          </div>
          <button
            onClick={() => { setDraft(auto.message); setEditing(true); }}
            className="mt-2 text-xs text-blue-500 hover:text-blue-700 transition-colors font-medium text-left"
          >
            Edit →
          </button>
        </div>
      )}

      {/* ── Edit form ── */}
      {editing && (
        <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-3">
          <textarea
            className="w-full border border-blue-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-blue-300 resize-none bg-white leading-relaxed"
            rows={5}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            autoFocus
          />
          <p className="text-[10px] text-gray-400 leading-relaxed">
            {['{name}', '{id}', '{tracking_link}', '{eta}', '{product}'].map(p => (
              <code key={p} className="bg-gray-100 px-1 py-0.5 rounded text-gray-500 mr-1">{p}</code>
            ))}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { onSave(draft); setEditing(false); }}
              className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Save
            </button>
            <button
              onClick={() => { setDraft(auto.message); setEditing(false); }}
              className="text-xs px-2 py-1.5 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type BuildState = 'idle' | 'input' | 'building' | 'preview';

function buildFallback(desc: string): Omit<Automation, 'id'> {
  const lower = desc.toLowerCase();
  const wordNums: Record<string, number> = { one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10 };
  let timing = 'Immediately';
  const numMatch = lower.match(/(\d+)\s*(hr|hour|min|minute|day)/);
  const wordMatch = lower.match(/(one|two|three|four|five|six|seven|eight|nine|ten)\s*(hr|hour|min|minute|day)/);
  if (numMatch) {
    const n = Number(numMatch[1]);
    const u = numMatch[2].startsWith('min') ? 'min' : numMatch[2].startsWith('day') ? 'day' : 'hr';
    timing = `${n} ${u}${n > 1 ? 's' : ''} after`;
  } else if (wordMatch) {
    const n = wordNums[wordMatch[1]];
    const u = wordMatch[2].startsWith('min') ? 'min' : wordMatch[2].startsWith('day') ? 'day' : 'hr';
    timing = `${n} ${u}${n > 1 ? 's' : ''} after`;
  }
  const trigMap: [RegExp, string, string][] = [
    [/payment.*confirm|confirm.*payment|paid/, 'Payment confirmed', `Hi {name}! 🎉 We've received your payment for order {id}. We're on it — you'll get a shipping update soon!`],
    [/ship|dispatch/, 'Order shipped', `Great news {name}! 🚚 Your order {id} has been dispatched. Track it here: {tracking_link}`],
    [/deliver/, 'Order delivered', `Hi {name}! Hope you're loving your order 💛 A quick review would mean the world to us!`],
    [/refund|return/, 'Customer requests refund', `Hi {name}! We've initiated your refund for order {id}. It should reflect in 3–5 business days 🙏`],
    [/abandon|cart/, 'Cart abandoned', `Hey {name}! 👋 You left something in your cart. Still interested? Reply and I'll help you finish the order!`],
    [/review|feedback/, 'Order delivered', `Hi {name}! Hope you're loving your order 💛 A quick review would mean the world to us!`],
    [/birthday/, 'Customer birthday', `Happy Birthday {name}! 🎂 Here's a little gift from us — 10% off your next order. Use code BDAY10!`],
    [/stock|restock/, 'Item back in stock', `Good news {name}! {product} is back in stock 🎉 Want to grab one? Reply "yes" and I'll send the link!`],
  ];
  const match = trigMap.find(([re]) => re.test(lower));
  if (match) return { trigger: match[1], timing, message: match[2], enabled: true };
  return {
    trigger: desc.replace(/^when\s+/i, '').replace(/,.*$/, '').trim().slice(0, 40),
    timing,
    message: `Hi {name}! 👋 Just a quick update on your order {id}. Let us know if you need anything!`,
    enabled: true,
  };
}

export default function ReachPage() {
  const [automations, setAutomations] = useState<Automation[]>(DEFAULT_AUTOMATIONS);
  const [buildState, setBuildState] = useState<BuildState>('idle');
  const [description, setDescription] = useState('');
  const [preview, setPreview] = useState<Omit<Automation, 'id'> | null>(null);
  const [editingPreview, setEditingPreview] = useState(false);

  const toggle = (id: string) =>
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  const save = (id: string, message: string) =>
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, message } : a));

  const handleBuild = async () => {
    if (!description.trim()) return;
    setBuildState('building');
    try {
      const res = await fetch('/api/build-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (data.trigger && data.message) {
        setPreview({ trigger: data.trigger, timing: data.timing ?? 'Immediately', message: data.message, enabled: true });
      } else {
        // fallback: use local heuristics
        setPreview(buildFallback(description));
      }
    } catch {
      setPreview(buildFallback(description));
    }
    setBuildState('preview');
  };

  const handleLaunch = () => {
    if (!preview) return;
    setAutomations(prev => [...prev, { ...preview, id: `custom_${Date.now()}` }]);
    setDescription('');
    setPreview(null);
    setBuildState('idle');
  };

  const handleDiscard = () => {
    setDescription('');
    setPreview(null);
    setBuildState('idle');
  };

  const activeCount = automations.filter(a => a.enabled).length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-8 py-6">

        <div className="mb-5">
          <h1 className="text-lg font-semibold text-gray-900">Reach your Customers</h1>
          <p className="text-sm text-gray-400 mt-1">
            {activeCount} of {automations.length} messages active · Sent automatically via WhatsApp
          </p>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {automations.map(auto => (
            <AutomationCard
              key={auto.id}
              auto={auto}
              onToggle={() => toggle(auto.id)}
              onSave={msg => save(auto.id, msg)}
            />
          ))}
        </div>

        {/* Build a custom automation */}
        <div className="mt-6 pt-5 border-t border-gray-100">

          {buildState === 'idle' && (
            <button
              onClick={() => setBuildState('input')}
              className="flex items-center gap-3 w-full px-4 py-3.5 bg-white border border-gray-200 hover:border-blue-200 hover:bg-blue-50/40 rounded-2xl transition-colors group text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors">
                <Zap className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">Build a custom automation</p>
                <p className="text-xs text-gray-400 mt-0.5">Describe what you want and we'll set it up</p>
              </div>
              <Plus className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0" />
            </button>
          )}

          {buildState === 'input' && (
            <div className="bg-white border border-blue-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">What do you want to automate?</p>
                <button onClick={handleDiscard} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <textarea
                autoFocus
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-blue-300 bg-gray-50 resize-none leading-relaxed"
                placeholder="e.g. When a customer leaves a 5-star review, send them a thank you and a 10% discount code for their next order"
                value={description}
                onChange={e => setDescription(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleBuild(); }}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">Tip: Be as specific as you like — timing, tone, what to say</p>
                <div className="flex gap-2">
                  <button onClick={handleDiscard} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
                  <button
                    onClick={handleBuild}
                    disabled={!description.trim()}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Build →
                  </button>
                </div>
              </div>
            </div>
          )}

          {buildState === 'building' && (
            <div className="bg-white border border-blue-100 rounded-2xl p-6 flex items-center gap-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
              <p className="text-sm text-gray-500">Building your automation…</p>
            </div>
          )}

          {buildState === 'preview' && preview && (
            <div className="bg-white border border-blue-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Here's what we built</p>
                <button onClick={handleDiscard} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preview card */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{preview.trigger}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{preview.timing} · via WhatsApp</p>
                  </div>
                </div>
                {!editingPreview ? (
                  <>
                    <div className="bg-[#dcf8c6] rounded-xl rounded-tl-sm px-4 py-3 max-w-sm">
                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {previewMessage(preview.message)}
                      </p>
                      <p className="text-[10px] text-[#53bdeb] text-right mt-1 select-none">✓✓</p>
                    </div>
                    <button
                      onClick={() => setEditingPreview(true)}
                      className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      Edit message →
                    </button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      autoFocus
                      rows={4}
                      className="w-full border border-blue-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-300 resize-none bg-white"
                      value={preview.message}
                      onChange={e => setPreview(p => p ? { ...p, message: e.target.value } : p)}
                    />
                    <button onClick={() => setEditingPreview(false)} className="text-xs text-blue-500 hover:text-blue-700">Done editing</button>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleLaunch}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Save & Launch
                </button>
                <button
                  onClick={() => setBuildState('input')}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg transition-colors"
                >
                  Describe again
                </button>
                <button onClick={handleDiscard} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                  Discard
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

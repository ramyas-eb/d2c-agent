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
          className={cn(
            'relative w-8 h-4 rounded-full transition-colors flex-shrink-0 mt-0.5',
            auto.enabled ? 'bg-green-500' : 'bg-gray-200'
          )}
          role="switch"
          aria-checked={auto.enabled}
        >
          <span className={cn(
            'absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform',
            auto.enabled ? 'translate-x-4' : 'translate-x-0.5'
          )} />
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

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-blue-300 bg-white';

export default function ReachPage() {
  const [automations, setAutomations] = useState<Automation[]>(DEFAULT_AUTOMATIONS);
  const [building, setBuilding] = useState(false);
  const [newTrigger, setNewTrigger] = useState('');
  const [newTiming, setNewTiming] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const toggle = (id: string) =>
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));

  const save = (id: string, message: string) =>
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, message } : a));

  const addNew = () => {
    if (!newTrigger.trim() || !newMessage.trim()) return;
    setAutomations(prev => [...prev, {
      id: `custom_${Date.now()}`,
      trigger: newTrigger.trim(),
      timing: newTiming.trim() || 'Immediately',
      message: newMessage.trim(),
      enabled: true,
    }]);
    setNewTrigger('');
    setNewTiming('');
    setNewMessage('');
    setBuilding(false);
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
          {!building ? (
            <button
              onClick={() => setBuilding(true)}
              className="flex items-center gap-3 w-full px-4 py-3.5 bg-white border border-gray-200 hover:border-blue-200 hover:bg-blue-50/40 rounded-2xl transition-colors group text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors">
                <Zap className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">Build a custom automation</p>
                <p className="text-xs text-gray-400 mt-0.5">Create your own trigger and message</p>
              </div>
              <Plus className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0" />
            </button>
          ) : (
            <div className="bg-white border border-blue-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">New automation</p>
                <button onClick={() => setBuilding(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">When does this trigger?</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. Customer asks for a refund"
                    value={newTrigger}
                    onChange={e => setNewTrigger(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">When to send</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. Immediately, 1 hr after"
                    value={newTiming}
                    onChange={e => setNewTiming(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Message</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  placeholder="Hi {name}! Your message here..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Use {['{name}', '{id}', '{product}'].map(p => (
                    <code key={p} className="bg-gray-100 px-1 rounded mr-1">{p}</code>
                  ))}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addNew}
                  disabled={!newTrigger.trim() || !newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add automation
                </button>
                <button
                  onClick={() => setBuilding(false)}
                  className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

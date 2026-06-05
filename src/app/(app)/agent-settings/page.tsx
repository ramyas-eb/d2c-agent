'use client';
import { useState, useCallback } from 'react';
import {
  Bot,
  Settings,
  MessageCircle,
  Package,
  Truck,
  Plus,
  X,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useAgentSettingsStore, AgentSettings, AgentFaq } from '@/store/agent-settings';

// ─── Tone options ─────────────────────────────────────────────────────────────
const TONE_OPTIONS = [
  { value: 'warm, friendly, and helpful', label: 'Warm & Friendly (recommended)' },
  { value: 'professional and concise', label: 'Professional & Concise' },
  { value: 'enthusiastic and energetic', label: 'Enthusiastic' },
  { value: 'formal and respectful', label: 'Formal' },
];

// ─── Generate system prompt preview ──────────────────────────────────────────
function generateSystemPrompt(settings: AgentSettings): string {
  const lines: string[] = [];

  lines.push(`You are the customer support AI agent for ${settings.shopName || '[Your Shop Name]'}.`);
  lines.push(`Your tone is ${settings.tone}.`);
  lines.push('');
  lines.push('## What you help customers with:');
  lines.push('- Order status and tracking');
  lines.push('- Product information and availability');
  lines.push('- Payment and billing queries');
  lines.push('- Returns and exchanges');
  lines.push('');
  lines.push('## Shop Policies:');

  if (settings.shippingDays) {
    lines.push(`- Standard delivery: ${settings.shippingDays} business days`);
  } else {
    lines.push('- Standard delivery: [not configured]');
  }

  lines.push(`- Cash on Delivery: ${settings.codAvailable ? 'Available' : 'Not available'}`);

  if (settings.returnPolicy) {
    lines.push(`- Return policy: ${settings.returnPolicy}`);
  }

  if (settings.discount) {
    lines.push(`- Discount rule: ${settings.discount}`);
  }

  lines.push('');
  lines.push('## Product Catalog:');
  lines.push('[pulled from your product catalog at runtime]');

  if (settings.faqs.length > 0) {
    lines.push('');
    lines.push('## Frequently Asked Questions:');
    settings.faqs.forEach((faq: AgentFaq) => {
      lines.push(`Q: ${faq.q}`);
      lines.push(`A: ${faq.a}`);
      lines.push('');
    });
  }

  lines.push('');
  lines.push('Always be accurate. If you don\'t know something, say so and offer to connect the customer with a human.');

  return lines.join('\n');
}

// ─── Saved flash ──────────────────────────────────────────────────────────────
function useSavedFlash() {
  const [saved, setSaved] = useState(false);
  const flash = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, []);
  return { saved, flash };
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  );
}

// ─── Section title ────────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-gray-500" />
      <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-blue-300 bg-white';

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AgentSettingsPage() {
  const { settings, updateSettings, addFaq, removeFaq } = useAgentSettingsStore();
  const { saved, flash } = useSavedFlash();

  // FAQ form state
  const [faqQ, setFaqQ] = useState('');
  const [faqA, setFaqA] = useState('');

  function handleChange<K extends keyof typeof settings>(key: K, value: typeof settings[K]) {
    updateSettings({ [key]: value });
    flash();
  }

  function handleAddFaq() {
    const q = faqQ.trim();
    const a = faqA.trim();
    if (!q || !a) return;
    addFaq({ q, a });
    setFaqQ('');
    setFaqA('');
    flash();
  }

  return (
    <div className="max-w-2xl mx-auto p-6 overflow-y-auto h-full space-y-6">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Bot className="w-5 h-5 text-gray-700" />
          <h1 className="text-xl font-semibold text-gray-900">Configure AI Agent</h1>
          {saved && (
            <span className="ml-auto flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3" />
              Saved
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">Changes take effect immediately on the next customer message.</p>
      </div>

      {/* ── Section 1 — Shop Identity ── */}
      <Card>
        <SectionTitle icon={Settings} title="Shop Identity" />
        <div className="space-y-4">
          <Field label="Shop name">
            <input
              className={inputCls}
              value={settings.shopName}
              placeholder="e.g. Ekaja Fashions"
              onChange={(e) => handleChange('shopName', e.target.value)}
            />
          </Field>

          <Field label="Tone">
            <div className="relative">
              <select
                className={`${inputCls} appearance-none pr-8`}
                value={settings.tone}
                onChange={(e) => handleChange('tone', e.target.value)}
              >
                {TONE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </Field>
        </div>
      </Card>

      {/* ── Section 2 — Policies ── */}
      <Card>
        <SectionTitle icon={Truck} title="Policies" />
        <div className="space-y-4">
          <Field label="Standard delivery (days)">
            <input
              className={inputCls}
              value={settings.shippingDays}
              placeholder="3–5"
              onChange={(e) => handleChange('shippingDays', e.target.value)}
            />
          </Field>

          <Field label="Return policy">
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              value={settings.returnPolicy}
              placeholder="e.g. 7-day returns, items must be unused and in original packaging"
              onChange={(e) => handleChange('returnPolicy', e.target.value)}
            />
          </Field>

          <Field label="Discount rule">
            <input
              className={inputCls}
              value={settings.discount}
              placeholder="e.g. 5% for repeat customers"
              onChange={(e) => handleChange('discount', e.target.value)}
            />
          </Field>

          {/* COD toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Cash on Delivery available</p>
              <p className="text-xs text-gray-400 mt-0.5">Agent will inform customers about COD option</p>
            </div>
            <button
              onClick={() => handleChange('codAvailable', !settings.codAvailable)}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                settings.codAvailable ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              aria-label="Toggle COD"
              role="switch"
              aria-checked={settings.codAvailable}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  settings.codAvailable ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* ── Section 3 — FAQs ── */}
      <Card>
        <SectionTitle icon={MessageCircle} title="Custom FAQs" />
        <p className="text-xs text-gray-400 -mt-2 mb-4">
          The agent will use these to answer common questions accurately.
        </p>

        {/* Existing FAQs */}
        {settings.faqs.length === 0 ? (
          <p className="text-sm text-gray-400 py-3 text-center">
            No custom FAQs yet — add your first one below
          </p>
        ) : (
          <div className="space-y-3 mb-4">
            {settings.faqs.map((faq) => (
              <div
                key={faq.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-700 truncate">Q: {faq.q}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">A: {faq.a}</p>
                </div>
                <button
                  onClick={() => { removeFaq(faq.id); flash(); }}
                  className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors mt-0.5"
                  aria-label="Remove FAQ"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add FAQ form */}
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <Field label="Question">
            <input
              className={inputCls}
              value={faqQ}
              placeholder="e.g. Do you ship internationally?"
              onChange={(e) => setFaqQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && faqA.trim()) handleAddFaq(); }}
            />
          </Field>
          <Field label="Answer">
            <input
              className={inputCls}
              value={faqA}
              placeholder="e.g. Currently we ship within India only."
              onChange={(e) => setFaqA(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && faqQ.trim()) handleAddFaq(); }}
            />
          </Field>
          <button
            onClick={handleAddFaq}
            disabled={!faqQ.trim() || !faqA.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add FAQ
          </button>
        </div>
      </Card>

      {/* ── Section 4 — Preview ── */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
        <SectionTitle icon={Package} title="System Prompt Preview" />
        <pre className="font-mono text-xs text-gray-600 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap overflow-auto max-h-64">
          {generateSystemPrompt(settings)}
        </pre>
      </div>
    </div>
  );
}

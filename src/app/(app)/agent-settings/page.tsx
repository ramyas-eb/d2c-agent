'use client';
import { useState, useCallback } from 'react';
import { Check, Plus, X, ChevronDown } from 'lucide-react';
import { useAgentSettingsStore } from '@/store/agent-settings';

const TONE_OPTIONS = [
  { value: 'warm, friendly, and helpful',  label: 'Warm & Friendly' },
  { value: 'professional and concise',     label: 'Professional & Concise' },
  { value: 'enthusiastic and energetic',   label: 'Enthusiastic' },
  { value: 'formal and respectful',        label: 'Formal' },
];

function useSavedFlash() {
  const [saved, setSaved] = useState(false);
  const flash = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, []);
  return { saved, flash };
}

const inputCls =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-blue-300 bg-white';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{children}</p>;
}

export default function ConfigureAgentPage() {
  const { settings, updateSettings, addFaq, removeFaq } = useAgentSettingsStore();
  const { saved, flash } = useSavedFlash();
  const [faqQ, setFaqQ] = useState('');
  const [faqA, setFaqA] = useState('');

  function handleChange<K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) {
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
    <div className="h-full overflow-y-auto">
      <div className="px-8 py-6 space-y-6">

        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Configure your Agent</h1>
          {saved && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>

        {/* About your shop */}
        <div>
          <SectionLabel>About your shop</SectionLabel>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Shop name">
                <input className={inputCls} value={settings.shopName} placeholder="e.g. Shop Ekaja"
                  onChange={e => handleChange('shopName', e.target.value)} />
              </Field>
              <Field label="Standard delivery">
                <input className={inputCls} value={settings.shippingDays} placeholder="e.g. 3–5 business days"
                  onChange={e => handleChange('shippingDays', e.target.value)} />
              </Field>
              <Field label="Return policy">
                <textarea className={`${inputCls} resize-none`} rows={2} value={settings.returnPolicy}
                  placeholder="e.g. 7-day returns, unused items only"
                  onChange={e => handleChange('returnPolicy', e.target.value)} />
              </Field>
              <Field label="Discount rule">
                <input className={inputCls} value={settings.discount} placeholder="e.g. 5% for repeat customers"
                  onChange={e => handleChange('discount', e.target.value)} />
              </Field>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-700">Cash on Delivery</p>
                <p className="text-xs text-gray-400 mt-0.5">Agent will offer COD as a payment option</p>
              </div>
              <button
                onClick={() => handleChange('codAvailable', !settings.codAvailable)}
                className={`relative w-10 h-[22px] rounded-full transition-colors ${settings.codAvailable ? 'bg-blue-600' : 'bg-gray-200'}`}
                role="switch" aria-checked={settings.codAvailable}
              >
                <span className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${settings.codAvailable ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* How it talks */}
        <div>
          <SectionLabel>How it talks</SectionLabel>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <Field label="Tone">
              <div className="relative">
                <select className={`${inputCls} appearance-none pr-8`} value={settings.tone}
                  onChange={e => handleChange('tone', e.target.value)}>
                  {TONE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </Field>
          </div>
        </div>

        {/* What your agent knows */}
        <div>
          <SectionLabel>What your agent knows</SectionLabel>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs text-gray-400 mb-4">
              Add questions customers often ask — the agent answers these accurately.
            </p>
            {settings.faqs.length === 0 ? (
              <p className="text-sm text-gray-300 py-2 text-center">No FAQs yet</p>
            ) : (
              <div className="space-y-2 mb-4">
                {settings.faqs.map(faq => (
                  <div key={faq.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700">Q: {faq.q}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">A: {faq.a}</p>
                    </div>
                    <button onClick={() => { removeFaq(faq.id); flash(); }}
                      className="text-gray-300 hover:text-red-400 transition-colors mt-0.5 flex-shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <Field label="Question">
                <input className={inputCls} value={faqQ} placeholder="e.g. Do you ship internationally?"
                  onChange={e => setFaqQ(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && faqA.trim()) handleAddFaq(); }} />
              </Field>
              <Field label="Answer">
                <input className={inputCls} value={faqA} placeholder="e.g. We ship within India only."
                  onChange={e => setFaqA(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && faqQ.trim()) handleAddFaq(); }} />
              </Field>
              <button
                onClick={handleAddFaq}
                disabled={!faqQ.trim() || !faqA.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

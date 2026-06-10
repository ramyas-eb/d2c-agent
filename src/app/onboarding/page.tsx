'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Zap, Store, Camera, MessageCircle, Bot, Package,
  Rocket, ChevronRight, ChevronLeft, Plus, Trash2,
  CheckCircle, Copy, Check, ExternalLink, Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DraftProduct {
  name: string;
  price: string;
  description: string;
  inStock: boolean;
  variants: { label: string; options: string }[];  // options as comma-separated string while editing
}

interface OnboardingData {
  tagline: string;
  whatsappNumber: string;
  instagramHandle: string;
  tone: string;
  returnPolicy: string;
  shippingDays: string;
  codAvailable: boolean;
  discount: string;
  products: DraftProduct[];
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Your shop', icon: Store },
  { label: 'Channels', icon: MessageCircle },
  { label: 'Agent', icon: Bot },
  { label: 'Products', icon: Package },
  { label: 'Go live', icon: Rocket },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center">
            <div className={cn(
              'flex flex-col items-center gap-1',
            )}>
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                done ? 'bg-indigo-600 border-indigo-600' : active ? 'bg-white border-indigo-600' : 'bg-white border-gray-200',
              )}>
                {done
                  ? <CheckCircle className="w-4 h-4 text-white" />
                  : <Icon className={cn('w-3.5 h-3.5', active ? 'text-indigo-600' : 'text-gray-300')} />
                }
              </div>
              <span className={cn(
                'text-[10px] font-medium hidden sm:block',
                active ? 'text-indigo-600' : done ? 'text-gray-600' : 'text-gray-300',
              )}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'w-8 sm:w-12 h-0.5 mb-4 mx-1',
                i < current ? 'bg-indigo-600' : 'bg-gray-200',
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Shop story ───────────────────────────────────────────────────────

function StepShop({ data, onChange }: { data: OnboardingData; onChange: (d: Partial<OnboardingData>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Tell your shop's story</h2>
        <p className="text-sm text-gray-500 mt-1">This shows up on your catalog page and helps customers trust you.</p>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tagline</label>
        <input
          type="text"
          placeholder="e.g. Handcrafted Indian ethnic wear since 2018"
          value={data.tagline}
          onChange={e => onChange({ tagline: e.target.value })}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>
    </div>
  );
}

// ─── Step 2: Channels ─────────────────────────────────────────────────────────

function StepChannels({ data, onChange }: { data: OnboardingData; onChange: (d: Partial<OnboardingData>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Connect your channels</h2>
        <p className="text-sm text-gray-500 mt-1">Where do customers reach you? Add at least one.</p>
      </div>

      {/* WhatsApp */}
      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-[#25D366] flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">WhatsApp</p>
            <p className="text-xs text-gray-500">Customers DM you on WhatsApp</p>
          </div>
        </div>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="tel"
            placeholder="91XXXXXXXXXX (with country code)"
            value={data.whatsappNumber}
            onChange={e => onChange({ whatsappNumber: e.target.value.replace(/[^\d+]/g, '') })}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 font-mono"
          />
        </div>
      </div>

      {/* Instagram */}
      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }}>
            <Camera className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Instagram</p>
            <p className="text-xs text-gray-500">Customers order via Instagram DMs</p>
          </div>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">@</span>
          <input
            type="text"
            placeholder="yourhandle"
            value={data.instagramHandle}
            onChange={e => onChange({ instagramHandle: e.target.value.replace('@', '') })}
            className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Agent personality ────────────────────────────────────────────────

const TONES = [
  { value: 'warm, friendly, and helpful', label: 'Warm & friendly', emoji: '😊' },
  { value: 'professional and efficient', label: 'Professional', emoji: '💼' },
  { value: 'fun, casual, and energetic', label: 'Fun & casual', emoji: '🎉' },
  { value: 'formal and courteous', label: 'Formal', emoji: '🎩' },
];

function StepAgent({ data, onChange }: { data: OnboardingData; onChange: (d: Partial<OnboardingData>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Set your AI agent's personality</h2>
        <p className="text-sm text-gray-500 mt-1">Your agent chats with customers 24/7 — make it sound like you.</p>
      </div>

      {/* Tone */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-2">Tone</label>
        <div className="grid grid-cols-2 gap-2">
          {TONES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange({ tone: t.value })}
              className={cn(
                'flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all text-left',
                data.tone === t.value
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
              )}
            >
              <span className="text-base">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Return policy */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Return policy</label>
        <input
          type="text"
          placeholder="e.g. 7-day returns for unused items"
          value={data.returnPolicy}
          onChange={e => onChange({ returnPolicy: e.target.value })}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Shipping + COD row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Shipping days</label>
          <input
            type="text"
            placeholder="e.g. 3-5"
            value={data.shippingDays}
            onChange={e => onChange({ shippingDays: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Cash on delivery</label>
          <button
            type="button"
            onClick={() => onChange({ codAvailable: !data.codAvailable })}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all',
              data.codAvailable
                ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                : 'bg-white border-gray-200 text-gray-500',
            )}
          >
            {data.codAvailable ? '✓ Available' : 'Not available'}
          </button>
        </div>
      </div>

      {/* Discount */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Discount offer</label>
        <input
          type="text"
          placeholder="e.g. 5% for repeat customers"
          value={data.discount}
          onChange={e => onChange({ discount: e.target.value })}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>
    </div>
  );
}

// ─── Step 4: Products ─────────────────────────────────────────────────────────

function ProductRow({
  product, index, onChange, onRemove,
}: {
  product: DraftProduct;
  index: number;
  onChange: (p: DraftProduct) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={`Product ${index + 1} name`}
              value={product.name}
              onChange={e => onChange({ ...product, name: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <input
              type="number"
              placeholder="Price ₹"
              value={product.price}
              onChange={e => onChange({ ...product, price: e.target.value })}
              className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <input
            type="text"
            placeholder="Short description"
            value={product.description}
            onChange={e => onChange({ ...product, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />

          {/* Variants toggle */}
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
          >
            {expanded ? 'Hide variants' : `+ Add size/colour variants ${product.variants.length > 0 ? `(${product.variants.length})` : ''}`}
          </button>

          {expanded && (
            <div className="space-y-2 pt-1">
              {product.variants.map((v, vi) => (
                <div key={vi} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Label (e.g. Size)"
                    value={v.label}
                    onChange={e => {
                      const vars = [...product.variants];
                      vars[vi] = { ...vars[vi], label: e.target.value };
                      onChange({ ...product, variants: vars });
                    }}
                    className="w-28 px-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Options (S, M, L)"
                    value={v.options}
                    onChange={e => {
                      const vars = [...product.variants];
                      vars[vi] = { ...vars[vi], options: e.target.value };
                      onChange({ ...product, variants: vars });
                    }}
                    className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const vars = product.variants.filter((_, i) => i !== vi);
                      onChange({ ...product, variants: vars });
                    }}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => onChange({ ...product, variants: [...product.variants, { label: '', options: '' }] })}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600"
              >
                <Plus className="w-3 h-3" /> Add variant group
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 p-1 mt-0.5 flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

const EMPTY_PRODUCT: DraftProduct = { name: '', price: '', description: '', inStock: true, variants: [] };

function StepProducts({ data, onChange }: { data: OnboardingData; onChange: (d: Partial<OnboardingData>) => void }) {
  const products = data.products;

  const update = (index: number, p: DraftProduct) => {
    const updated = [...products];
    updated[index] = p;
    onChange({ products: updated });
  };

  const remove = (index: number) => {
    onChange({ products: products.filter((_, i) => i !== index) });
  };

  const add = () => {
    if (products.length >= 10) return;
    onChange({ products: [...products, { ...EMPTY_PRODUCT }] });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Add your products</h2>
        <p className="text-sm text-gray-500 mt-1">These will appear in your catalog. You can always add more later.</p>
      </div>

      {products.length === 0 && (
        <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
          <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No products yet</p>
          <p className="text-xs text-gray-400">Add your first product below</p>
        </div>
      )}

      <div className="space-y-3">
        {products.map((p, i) => (
          <ProductRow
            key={i}
            product={p}
            index={i}
            onChange={updated => update(i, updated)}
            onRemove={() => remove(i)}
          />
        ))}
      </div>

      {products.length < 10 && (
        <button
          type="button"
          onClick={add}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add a product
        </button>
      )}
    </div>
  );
}

// ─── Step 5: Go live ──────────────────────────────────────────────────────────

function StepGoLive({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const catalogUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/catalog/${slug}`;

  const copy = async () => {
    await navigator.clipboard.writeText(catalogUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-5">
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 mb-3">
          <Rocket className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Your shop is live! 🎉</h2>
        <p className="text-sm text-gray-500 mt-1">Share your catalog link and start getting orders</p>
      </div>

      {/* Catalog URL */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-indigo-700 mb-2">Your catalog link</p>
        <div className="flex items-center gap-2">
          <p className="flex-1 text-sm font-mono text-indigo-900 break-all">{catalogUrl}</p>
          <button
            onClick={copy}
            className="flex-shrink-0 flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Preview link */}
      <a
        href={`/catalog/${slug}`}
        target="_blank"
        rel="noreferrer"
        className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        Preview catalog
      </a>

      {/* What's next */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-700 mb-2">What's next?</p>
        {[
          'Share catalog link in Instagram bio',
          'Add catalog link to WhatsApp business profile',
          'Post products on Instagram Stories with link',
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') ?? '';

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    tagline: '',
    whatsappNumber: '',
    instagramHandle: '',
    tone: 'warm, friendly, and helpful',
    returnPolicy: '7-day returns accepted for unused items',
    shippingDays: '3-5',
    codAvailable: false,
    discount: '5% for repeat customers',
    products: [{ ...EMPTY_PRODUCT }],
  });

  const patch = (partial: Partial<OnboardingData>) => {
    setData(d => ({ ...d, ...partial }));
  };

  // Redirect if no slug
  useEffect(() => {
    if (!slug) router.replace('/signup');
  }, [slug, router]);

  const isLastStep = step === STEPS.length - 1;
  const isProductStep = step === STEPS.length - 2; // step 4

  const handleNext = async () => {
    setError('');

    if (isProductStep) {
      // Save everything before showing go-live
      setSaving(true);
      try {
        const products = data.products
          .filter(p => p.name.trim())
          .map(p => ({
            name: p.name.trim(),
            price: parseFloat(p.price) || 0,
            description: p.description,
            inStock: p.inStock,
            variants: p.variants
              .filter(v => v.label.trim())
              .map(v => ({
                label: v.label.trim(),
                options: v.options.split(',').map(s => s.trim()).filter(Boolean),
              })),
          }));

        const res = await fetch(`/api/merchant/${slug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, products, onboardingDone: true }),
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error || 'Save failed');
          return;
        }
        setDone(true);
        setStep(s => s + 1);
      } catch {
        setError('Failed to save. Please try again.');
      } finally {
        setSaving(false);
      }
    } else if (isLastStep) {
      router.push('/dashboard');
    } else {
      setStep(s => s + 1);
    }
  };

  const stepProps = { data, onChange: patch };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-6 pt-4">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-gray-700">D2C Agent</span>
        </div>

        <StepBar current={step} />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {step === 0 && <StepShop {...stepProps} />}
          {step === 1 && <StepChannels {...stepProps} />}
          {step === 2 && <StepAgent {...stepProps} />}
          {step === 3 && <StepProducts {...stepProps} />}
          {step === 4 && <StepGoLive slug={slug} />}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-100 rounded-lg p-3">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            {step > 0 && !done ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleNext}
              disabled={saving}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors',
                isLastStep
                  ? 'bg-gray-900 hover:bg-gray-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white',
                saving && 'opacity-50 cursor-wait',
              )}
            >
              {saving ? 'Saving…' : isLastStep ? 'Go to dashboard' : 'Continue'}
              {!saving && !isLastStep && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Skip */}
        {step < STEPS.length - 1 && !done && (
          <p className="text-center text-xs text-gray-400 mt-3">
            <button onClick={() => setStep(STEPS.length - 1)} className="hover:underline">
              Skip setup for now
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-indigo-50 flex items-center justify-center"><div className="text-sm text-gray-500">Loading…</div></div>}>
      <OnboardingWizard />
    </Suspense>
  );
}

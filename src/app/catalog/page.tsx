'use client';
import { useState } from 'react';
import { initialProducts, Product } from '@/store/products';
import { ProductVariant } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { CheckCircle, MessageCircle, Camera, ShoppingBag, Zap, Link } from 'lucide-react';

const SHOP = {
  name: 'Shop Ekaja',
  tagline: 'Handcrafted Indian ethnic wear',
  whatsappNumber: '919600064666',
  instagramHandle: 'ramyaaa811',
};

const ACCENTS = [
  { bar: 'bg-indigo-400' },
  { bar: 'bg-rose-400' },
  { bar: 'bg-amber-400' },
  { bar: 'bg-teal-400' },
  { bar: 'bg-orange-400' },
];

function buildMessage(p: Product, selected: Record<string, string>) {
  const variantParts = Object.entries(selected)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
  const variantStr = variantParts ? ` (${variantParts})` : '';
  return `Hi ${SHOP.name}! 👋 I want to order *${p.name}*${variantStr} – ${formatCurrency(p.price)}. Can you send me the payment link? 🙏`;
}

function VariantPicker({ variant, selected, onSelect }: { variant: ProductVariant; selected: string; onSelect: (v: string) => void }) {
  return (
    <div className="mb-2">
      <p className="text-xs font-semibold text-gray-500 mb-1.5">{variant.label}</p>
      <div className="flex flex-wrap gap-1.5">
        {variant.options.map(opt => (
          <button
            key={opt}
            onClick={() => onSelect(opt === selected ? '' : opt)}
            className={cn(
              'text-xs px-2.5 py-1 rounded-full border font-medium transition-colors',
              selected === opt
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const accent = ACCENTS[index % ACCENTS.length];
  const [igCopied, setIgCopied] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({});

  const allSelected = (product.variants ?? []).every(v => selected[v.label]);
  const hasVariants = (product.variants ?? []).length > 0;

  function setVariant(label: string, value: string) {
    setSelected(prev => ({ ...prev, [label]: value }));
  }

  const message = buildMessage(product, selected);
  const waHref = `https://wa.me/${SHOP.whatsappNumber}?text=${encodeURIComponent(message)}`;

  async function handleInstagram() {
    await navigator.clipboard.writeText(message);
    setIgCopied(true);
    setTimeout(() => setIgCopied(false), 4000);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `instagram://user?username=${SHOP.instagramHandle}`;
    } else {
      window.open(`https://www.instagram.com/${SHOP.instagramHandle}/`, '_blank');
    }
  }

  const ctaDisabled = hasVariants && !allSelected;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`h-1 w-full ${accent.bar}`} />
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 leading-tight">{product.name}</h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{product.sku}</p>
          </div>
          {product.inStock ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex-shrink-0">
              <CheckCircle className="w-2.5 h-2.5" /> In Stock
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">Out of Stock</span>
          )}
        </div>

        {/* Price */}
        <p className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(product.price)}</p>

        {/* Description */}
        <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{product.description}</p>

        {/* Variants */}
        {product.inStock && (product.variants ?? []).length > 0 && (
          <div className="mb-4 pt-3 border-t border-gray-50">
            {product.variants!.map(v => (
              <VariantPicker
                key={v.label}
                variant={v}
                selected={selected[v.label] ?? ''}
                onSelect={val => setVariant(v.label, val)}
              />
            ))}
            {ctaDisabled && (
              <p className="text-[11px] text-amber-600 mt-1">
                Select {(product.variants ?? []).filter(v => !selected[v.label]).map(v => v.label).join(' & ')} to order
              </p>
            )}
          </div>
        )}

        {/* CTAs */}
        {product.inStock ? (
          <div className="flex flex-col gap-2">
            <a
              href={ctaDisabled ? undefined : waHref}
              onClick={ctaDisabled ? e => e.preventDefault() : undefined}
              target="_blank"
              rel="noreferrer"
              className={cn(
                'flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl transition-colors',
                ctaDisabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#25D366] hover:bg-[#1ebe5d] text-white'
              )}
            >
              <MessageCircle className="w-4 h-4" />
              Order via WhatsApp
            </a>
            <div>
              <button
                onClick={ctaDisabled ? undefined : handleInstagram}
                disabled={ctaDisabled}
                className={cn(
                  'w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl transition-colors text-white',
                  ctaDisabled && 'opacity-40 cursor-not-allowed'
                )}
                style={ctaDisabled ? { background: '#ccc' } : { background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
              >
                <Camera className="w-4 h-4" />
                {igCopied ? '✓ Copied! Tap Message → Paste' : 'Order via Instagram DM'}
              </button>
              {igCopied && (
                <p className="text-[11px] text-center text-pink-500 mt-1.5 font-medium animate-pulse">
                  Message copied — tap Message on the profile and paste 👆
                </p>
              )}
              {!igCopied && (
                <p className="text-[10px] text-center text-gray-400 mt-1">Opens profile → tap Message → paste order</p>
              )}
            </div>
          </div>
        ) : (
          <button disabled className="w-full text-sm text-gray-400 bg-gray-100 py-2.5 rounded-xl font-medium cursor-not-allowed">
            Currently Unavailable
          </button>
        )}
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <div className="min-h-screen" style={{ background: '#faf9f7' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-4 text-white" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
        <div className="max-w-sm mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">{SHOP.name}</h1>
            <p className="text-xs text-white/70">{SHOP.tagline}</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-sm mx-auto flex items-center justify-between gap-2 text-center">
          {[
            { icon: ShoppingBag, label: 'Pick a product' },
            { icon: MessageCircle, label: 'Send us a DM' },
            { icon: Zap, label: 'Get payment link' },
            { icon: Link, label: 'Pay & done ✓' },
          ].map(({ icon: Icon, label }, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <p className="text-[10px] text-gray-500 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Products */}
      <div className="max-w-sm mx-auto px-4 py-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {initialProducts.filter(p => p.inStock).length} products available
        </p>
        {initialProducts.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>

      {/* Footer */}
      <div className="max-w-sm mx-auto px-4 py-6 text-center">
        <p className="text-xs text-gray-400">Secure payments by <span className="font-semibold text-[#2C85E9]">Razorpay</span></p>
        <p className="text-[10px] text-gray-300 mt-1">DM us on WhatsApp or Instagram to place your order</p>
      </div>
    </div>
  );
}

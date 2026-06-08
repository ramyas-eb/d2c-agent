'use client';
import { useState } from 'react';
import { initialProducts, Product } from '@/store/products';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, MessageCircle, Camera, ShoppingBag, Zap, Link } from 'lucide-react';

// ── Shop config (matches settings store defaults) ─────────────────────
const SHOP = {
  name: 'Shop Ekaja',
  tagline: 'Handcrafted Indian ethnic wear',
  whatsappNumber: '919600064666', // E.164 without +
  instagramHandle: 'ramyaaa811',
};

// ── Per-product accent colour ─────────────────────────────────────────
const ACCENTS = [
  { bar: 'bg-indigo-400', badge: 'bg-indigo-50 text-indigo-700' },
  { bar: 'bg-rose-400',   badge: 'bg-rose-50 text-rose-700' },
  { bar: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700' },
  { bar: 'bg-teal-400',   badge: 'bg-teal-50 text-teal-700' },
  { bar: 'bg-orange-400', badge: 'bg-orange-50 text-orange-700' },
];

function buildMessage(p: Product) {
  return `Hi ${SHOP.name}! 👋 I want to order *${p.name}* (${p.sku}) – ${formatCurrency(p.price)}. Can you send me the payment link? 🙏`;
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const accent = ACCENTS[index % ACCENTS.length];
  const [igCopied, setIgCopied] = useState(false);

  const waHref = `https://wa.me/${SHOP.whatsappNumber}?text=${encodeURIComponent(buildMessage(product))}`;

  async function handleInstagram() {
    await navigator.clipboard.writeText(buildMessage(product));
    setIgCopied(true);
    setTimeout(() => setIgCopied(false), 3000);
    // Open Instagram DM inbox — works on mobile app, falls back to web
    const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isIos || isAndroid) {
      window.location.href = `instagram://user?username=${SHOP.instagramHandle}`;
    } else {
      window.open(`https://www.instagram.com/${SHOP.instagramHandle}/`, '_blank');
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Accent bar */}
      <div className={`h-1 w-full ${accent.bar}`} />

      <div className="p-4">
        {/* Header row */}
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
            <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
              Out of Stock
            </span>
          )}
        </div>

        {/* Price */}
        <p className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(product.price)}</p>

        {/* Description */}
        <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{product.description}</p>

        {/* CTAs */}
        {product.inStock ? (
          <div className="flex flex-col gap-2">
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Order via WhatsApp
            </a>
            <button
              onClick={handleInstagram}
              className="flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl transition-colors text-white"
              style={{ background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
            >
              <Camera className="w-4 h-4" />
              {igCopied ? '✓ Message copied! Paste in DM' : 'Order via Instagram DM'}
            </button>
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

      {/* ── Sticky header ── */}
      <div
        className="sticky top-0 z-10 px-4 py-4 text-white"
        style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
      >
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

      {/* ── How it works strip ── */}
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

      {/* ── Product list ── */}
      <div className="max-w-sm mx-auto px-4 py-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {initialProducts.filter(p => p.inStock).length} products available
        </p>

        {initialProducts.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>

      {/* ── Footer ── */}
      <div className="max-w-sm mx-auto px-4 py-6 text-center">
        <p className="text-xs text-gray-400">
          Secure payments by{' '}
          <span className="font-semibold text-[#2C85E9]">Razorpay</span>
        </p>
        <p className="text-[10px] text-gray-300 mt-1">
          DM us on WhatsApp or Instagram to place your order
        </p>
      </div>
    </div>
  );
}

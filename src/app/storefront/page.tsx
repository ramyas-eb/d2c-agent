'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { initialProducts, type Product } from '@/store/products';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal,
  X, ChevronRight, ShoppingBag, Zap, ArrowLeft,
  CheckCircle, ExternalLink, Package,
} from 'lucide-react';

// ─── Shop config ──────────────────────────────────────────────────────────────

const SHOP = {
  name: 'Shop Ekaja',
  handle: 'shopekaja',
  tagline: 'Handcrafted Indian ethnic wear',
  whatsappNumber: '919600064666',
  instagramHandle: 'ramyaaa811',
};

const AGENT_SETTINGS = {
  shopName: SHOP.name,
  tone: 'warm, friendly, and helpful',
  returnPolicy: '7-day returns for unused items',
  shippingDays: '3-5',
  codAvailable: false,
  discount: '5% for repeat customers',
};

// ─── Post metadata ────────────────────────────────────────────────────────────

interface PostMeta {
  product: Product;
  caption: string;
  hashtags: string[];
  likes: number;
  comments: number;
  posted: string;
  gradient: string;
  accentText: string;
}

const POSTS: PostMeta[] = [
  {
    product: initialProducts[0],
    caption: 'New drop! ✨ Our hand-embroidered silk saree is finally restocked. Each piece takes 3 days to make — pure zari, no shortcuts.',
    hashtags: ['#silksaree', '#ethnicwear', '#handembroidered', '#shopekaja', '#indianfashion'],
    likes: 1247,
    comments: 83,
    posted: '2h',
    gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
    accentText: 'text-emerald-100',
  },
  {
    product: initialProducts[1],
    caption: 'Bridal season is here 👰 Our Banarasi Dupatta Set — crafted in Varanasi, delivered to your door. Limited stock this season.',
    hashtags: ['#banarasi', '#bridal', '#lehenga', '#weddingwear', '#shopekaja'],
    likes: 2103,
    comments: 147,
    posted: '1d',
    gradient: 'from-indigo-500 via-purple-600 to-violet-700',
    accentText: 'text-indigo-100',
  },
  {
    product: initialProducts[2],
    caption: 'Daily wear doesn\'t have to be boring 🌿 Chanderi cotton — lightweight, breathable, and absolutely gorgeous. Perfect for the office.',
    hashtags: ['#chanderi', '#cottonSaree', '#officewear', '#lightweightsaree', '#shopekaja'],
    likes: 689,
    comments: 42,
    posted: '3d',
    gradient: 'from-orange-300 via-amber-400 to-yellow-500',
    accentText: 'text-orange-100',
  },
  {
    product: initialProducts[3],
    caption: 'Festival season alert 🪔 Our bestselling Lehenga Choli just got new colours — Coral Pink, Deep Maroon, and Teal Blue. Which one is you?',
    hashtags: ['#lehenga', '#festivalwear', '#navratri', '#ethnicfashion', '#shopekaja'],
    likes: 3841,
    comments: 296,
    posted: '5d',
    gradient: 'from-pink-400 via-rose-500 to-red-500',
    accentText: 'text-pink-100',
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
}

interface PaymentCard {
  url: string;
  amount: number;
}

interface CODCard {
  orderId: string;
  amount: number;
}

// ─── Stories bar ─────────────────────────────────────────────────────────────

const STORY_GRADIENTS = [
  'from-pink-400 to-rose-500',
  'from-indigo-400 to-purple-500',
  'from-amber-300 to-orange-400',
  'from-teal-400 to-emerald-500',
  'from-blue-400 to-cyan-500',
];

function StoriesBar() {
  const STORY_LABELS = ['Sarees', 'Bridal', 'Cotton', 'Festive', 'New In'];
  return (
    <div className="flex gap-4 px-4 py-3 overflow-x-auto scrollbar-hide bg-white border-b border-gray-100">
      {/* Your story */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center ring-2 ring-white ring-offset-1">
          <ShoppingBag className="w-6 h-6 text-white" />
        </div>
        <span className="text-[10px] text-gray-600 font-medium">Your story</span>
      </div>
      {STORY_LABELS.map((label, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${STORY_GRADIENTS[i]} ring-2 ring-pink-400 ring-offset-1 flex items-center justify-center`}>
            <span className="text-lg">{['🥻', '👰', '🌿', '🪔', '✨'][i]}</span>
          </div>
          <span className="text-[10px] text-gray-600 truncate w-14 text-center">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({
  post,
  onOrder,
}: {
  post: PostMeta;
  onOrder: (product: Product) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const likeCount = post.likes + (liked ? 1 : 0);

  return (
    <div className="bg-white border-b border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-none">{SHOP.handle}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Sponsored · {post.posted}</p>
          </div>
        </div>
        <button className="text-gray-500 p-1">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Image — gradient with product info */}
      <div className={`relative w-full aspect-square bg-gradient-to-br ${post.gradient} flex flex-col items-center justify-center p-6`}>
        {/* Watermark */}
        <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
          <Zap className="w-3 h-3 text-white" />
          <span className="text-[10px] font-semibold text-white">D2C Agent</span>
        </div>

        {/* Product info */}
        <div className="text-center">
          <p className={`text-4xl mb-3 ${post.accentText}`}>
            {['🥻', '👘', '🌿', '💃'][POSTS.indexOf(post)]}
          </p>
          <h3 className="text-white font-bold text-xl leading-tight text-shadow drop-shadow-lg">
            {post.product.name}
          </h3>
          <p className={`text-2xl font-black mt-2 drop-shadow-lg ${post.accentText}`}>
            {formatCurrency(post.product.price)}
          </p>
          {post.product.variants && post.product.variants.length > 0 && (
            <p className="text-white/80 text-xs mt-2">
              {post.product.variants.map(v => v.label).join(' · ')} available
            </p>
          )}
        </div>

        {/* CTA button inside image */}
        <button
          onClick={() => onOrder(post.product)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-gray-900 font-semibold text-sm px-6 py-2.5 rounded-full shadow-lg hover:bg-gray-100 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <MessageCircle className="w-4 h-4" />
          DM to order
        </button>
      </div>

      {/* Engagement bar */}
      <div className="px-3 pt-2.5 pb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLiked(v => !v)}
              className={cn('transition-transform active:scale-125', liked ? 'text-red-500' : 'text-gray-700')}
            >
              <Heart className={cn('w-6 h-6', liked && 'fill-red-500')} />
            </button>
            <button
              onClick={() => onOrder(post.product)}
              className="text-gray-700 hover:text-indigo-600 transition-colors"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
            <button className="text-gray-700">
              <Send className="w-6 h-6" />
            </button>
          </div>
          <button
            onClick={() => setSaved(v => !v)}
            className={cn(saved ? 'text-gray-900' : 'text-gray-700')}
          >
            <Bookmark className={cn('w-6 h-6', saved && 'fill-gray-900')} />
          </button>
        </div>

        {/* Like count */}
        <p className="text-sm font-semibold text-gray-900 mt-1.5">
          {likeCount.toLocaleString('en-IN')} likes
        </p>

        {/* Caption */}
        <p className="text-sm text-gray-900 mt-1 leading-relaxed">
          <span className="font-semibold">{SHOP.handle}</span>{' '}
          {post.caption}
        </p>

        {/* Hashtags */}
        <p className="text-sm text-indigo-600 mt-0.5 leading-relaxed">
          {post.hashtags.join(' ')}
        </p>

        {/* Comments count */}
        {post.comments > 0 && (
          <button className="text-sm text-gray-400 mt-1">
            View all {post.comments} comments
          </button>
        )}
      </div>

      {/* Order CTA strip */}
      <button
        onClick={() => onOrder(post.product)}
        className="w-full flex items-center justify-between px-3 py-3 bg-indigo-50 hover:bg-indigo-100 transition-colors border-t border-indigo-100 mt-1"
      >
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-semibold text-indigo-700">Order {post.product.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-indigo-600">{formatCurrency(post.product.price)}</span>
          <ChevronRight className="w-4 h-4 text-indigo-400" />
        </div>
      </button>
    </div>
  );
}

// ─── DM panel ─────────────────────────────────────────────────────────────────

function DMPanel({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentCard, setPaymentCard] = useState<PaymentCard | null>(null);
  const [codCard, setCODCard] = useState<CODCard | null>(null);
  const [convId] = useState(() => `STOREFRONT-${Date.now()}`);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Fire opening message from agent when panel opens
  const sendToAgent = useCallback(async (userContent: string, history: ChatMessage[]) => {
    setLoading(true);
    try {
      const allMessages = [...history, { role: 'user' as const, content: userContent }];

      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role === 'user' ? 'customer' : 'agent', content: m.content })),
          products: initialProducts,
          agentSettings: AGENT_SETTINGS,
        }),
      });

      const data = await res.json();
      const fallbackContent = `Hi! 👋 I'm the Shop Ekaja assistant.\n\nTo order ${product.name} (${formatCurrency(product.price)}), reach us directly:\n\n📱 WhatsApp → wa.me/${SHOP.whatsappNumber}\n📸 Instagram → @${SHOP.instagramHandle}\n\nWe'll confirm your order in minutes! 🙏`;
      const agentReply: ChatMessage = {
        role: 'agent',
        content: data.fallback ? fallbackContent : (data.message ?? fallbackContent),
      };
      const newMessages = [...allMessages, agentReply];
      setMessages(newMessages);

      // Handle payment link
      if (data.send_payment_link && data.amount > 0) {
        setTimeout(async () => {
          try {
            const plRes = await fetch('/api/payment-link', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ convId, customerName: 'Customer', amount: data.amount }),
            });
            const pl = await plRes.json();
            if (pl.url) setPaymentCard({ url: pl.url, amount: data.amount });
            else setPaymentCard({ url: '#', amount: data.amount });
          } catch {
            setPaymentCard({ url: '#', amount: data.amount });
          }
        }, 400);
      }

      // Handle COD
      if (data.send_cod_order && data.amount > 0) {
        setTimeout(async () => {
          try {
            const codRes = await fetch('/api/cod-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                convId, customerName: 'Customer', amount: data.amount,
                product: product.name, deliveryAddress: data.delivery_address,
              }),
            });
            const codData = await codRes.json();
            setCODCard({ orderId: codData.orderId ?? 'ORD-COD-' + Date.now(), amount: data.amount });
          } catch {
            setCODCard({ orderId: 'ORD-COD-' + Date.now(), amount: data.amount });
          }
        }, 400);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'agent', content: 'Sorry, something went wrong. Please try again! 🙏' }]);
    } finally {
      setLoading(false);
    }
  }, [convId, product.name]);

  // Send opening message on mount
  useEffect(() => {
    const opening = `Hi! I saw your post for ${product.name} 👀 I'm interested in buying it!`;
    sendToAgent(opening, []);
    setMessages([{ role: 'user', content: opening }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const current = [...messages, { role: 'user' as const, content: text }];
    setMessages(current);
    await sendToAgent(text, messages);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-3 border-b border-gray-100 bg-white flex-shrink-0">
        <button onClick={onClose} className="p-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <ShoppingBag className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-none">{SHOP.handle}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{product.name} · {formatCurrency(product.price)}</p>
        </div>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Product context chip */}
      <div className="px-3 py-2 bg-indigo-50 border-b border-indigo-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
          <p className="text-xs text-indigo-700">
            <span className="font-semibold">{product.name}</span>
            {product.variants && product.variants.length > 0 && (
              <span className="text-indigo-500"> · {product.variants.map(v => v.label).join(', ')} options available</span>
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'agent' && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                <Zap className="w-3 h-3 text-white" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-900 rounded-bl-sm',
              )}
            >
              {/* Render newlines and strip **bold** markers */}
              {msg.content.replace(/\*\*(.*?)\*\*/g, '$1').split('\n').map((line, li) => (
                <span key={li}>{line}{li < msg.content.split('\n').length - 1 && <br />}</span>
              ))}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Payment card */}
        {paymentCard && (
          <div className="mx-auto max-w-xs">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-900">Payment link ready!</p>
              <p className="text-xs text-gray-500 mt-0.5 mb-3">
                {formatCurrency(paymentCard.amount)} · Razorpay secured
              </p>
              <a
                href={paymentCard.url}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                Pay now <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* COD card */}
        {codCard && (
          <div className="mx-auto max-w-xs">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 text-center">
              <Package className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-900">COD Order Confirmed! 🎉</p>
              <p className="text-xs text-gray-500 mt-0.5">Order #{codCard.orderId}</p>
              <p className="text-xs font-semibold text-orange-700 mt-2 bg-orange-100 rounded-lg py-1.5 px-3">
                Pay {formatCurrency(codCard.amount)} on delivery
              </p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-white px-3 py-3 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Message…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={loading}
            className="flex-1 bg-transparent text-sm outline-none text-gray-900 placeholder-gray-400"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0',
            input.trim() && !loading
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-200 text-gray-400',
          )}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StorefrontPage() {
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  return (
    <div className="min-h-screen bg-white max-w-sm mx-auto relative">
      {/* Instagram-style top bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
            {SHOP.handle}
          </span>
        </div>
        <a
          href="/catalog"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-full transition-colors"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          Full catalog
        </a>
      </div>

      {/* Profile section */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 ring-2 ring-indigo-200">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-gray-900">{SHOP.handle}</p>
              <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-1.5 py-0.5 rounded-full">Shop</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{SHOP.tagline}</p>
            <div className="flex gap-4 mt-2">
              {[['4', 'posts'], ['1.2k', 'followers'], ['312', 'following']].map(([n, l]) => (
                <div key={l} className="text-center">
                  <p className="text-sm font-bold text-gray-900">{n}</p>
                  <p className="text-[10px] text-gray-500">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2 leading-relaxed">
          Handcrafted ethnic wear · Direct from artisans 🤝<br />
          DM to order · Free shipping India-wide
        </p>
        <div className="flex gap-2 mt-3">
          <button className="flex-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-900 py-1.5 rounded-lg transition-colors">
            Follow
          </button>
          <button
            onClick={() => setActiveProduct(initialProducts[0])}
            className="flex-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded-lg transition-colors"
          >
            Message
          </button>
        </div>
      </div>

      {/* Stories */}
      <StoriesBar />

      {/* Feed */}
      <div className="divide-y divide-gray-100 pb-20">
        {POSTS.filter(p => p.product.inStock).map((post, i) => (
          <PostCard key={i} post={post} onOrder={setActiveProduct} />
        ))}
      </div>

      {/* Footer note */}
      <div className="text-center py-8 px-4">
        <p className="text-xs text-gray-400">
          Powered by <span className="font-semibold text-indigo-600">D2C Agent</span> · AI-assisted ordering
        </p>
        <a href="/catalog" className="text-xs text-indigo-500 hover:underline mt-1 block">
          View full catalog →
        </a>
      </div>

      {/* DM panel overlay */}
      {activeProduct && (
        <DMPanel product={activeProduct} onClose={() => setActiveProduct(null)} />
      )}
    </div>
  );
}

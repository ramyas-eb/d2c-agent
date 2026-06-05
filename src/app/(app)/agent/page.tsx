'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useOrderStore } from '@/store/orders';
import { useProductStore } from '@/store/products';
import { useAgentSettingsStore } from '@/store/agent-settings';
import { DmConversation, DmMessage } from '@/types';
import { formatTime, cn } from '@/lib/utils';
import {
  Camera, MessageCircle, Send, Zap, Link, CheckCircle,
  Truck, User, Bot, ChevronRight
} from 'lucide-react';

const AGENT_RESPONSES: Record<string, string[]> = {
  price: [
    "The price is ₹4,800 with free shipping across India 🚚 Shall I send you a payment link right away?",
  ],
  available: [
    "Yes, in stock and ready to ship! 🎉 Want me to send you a payment link to place your order?",
  ],
  negotiate: [
    "As a valued customer, I can offer ₹4,560 (5% off) — best I can do! 🙏 Shall I send the payment link for that?",
    "Repeat customers are special to us! I've applied a small loyalty discount — ₹4,608. Want me to send the link?",
  ],
  // confirm has no text response — payment link is sent directly (no duplicate message)
  bulk: [
    "For bulk (10+ pieces) we offer special pricing. How many do you need? I'll prepare a custom quote.",
  ],
  size: [
    "We have S to XXL in stock. Which size? I can send the payment link right away once you confirm! 👍",
  ],
  claimed_paid: [
    "Got it! 🙏 I'm checking your payment status via Razorpay — you'll receive a WhatsApp confirmation automatically once it clears. Usually takes under a minute!",
    "Thanks! Our system will verify the payment automatically through Razorpay. I'll send your order confirmation and AWB as soon as it's confirmed 📦",
  ],
  default: [
    "Thanks for reaching out! Happy to help — what would you like to know about this piece?",
  ],
};

// Returns { category, autoSendLink }
function classifyMessage(text: string): { category: string; autoSendLink: boolean } {
  const lower = text.toLowerCase();

  // Customer claiming they paid — do NOT mark as paid, verify via webhook only
  const claimedPaidPattern = /\b(i paid|i've paid|already paid|payment done|done the payment|made the payment|completed payment|transferred|sent the money|payment sent|paid already)\b/;
  if (claimedPaidPattern.test(lower)) return { category: 'claimed_paid', autoSendLink: false };

  // Explicit yes / buy intent → send payment link directly (no lead-in message)
  const yesPattern = /\b(yes|yeah|yep|sure|ok|okay|proceed|go ahead|place order|send link|send it|let's do it|i'll take it|confirm|sounds good|perfect|great|want to buy|want to order|i'll buy|i'll order|buy it|order it|take it)\b/;
  if (yesPattern.test(lower)) return { category: 'confirm', autoSendLink: true };

  // Price negotiation: numbers, "repeat customer", "loyal", "can you do", "any discount"
  const negotiatePattern = /\b(repeat|loyal|reguler|regular|old customer|discount|cheaper|less|negotiate|bargain|can you do|any offer|any deal|\d{3,5})\b/;
  if (negotiatePattern.test(lower)) return { category: 'negotiate', autoSendLink: false };

  if (lower.includes('price') || lower.includes('cost') || lower.includes('₹') || lower.includes('how much')) return { category: 'price', autoSendLink: false };
  if (lower.includes('available') || lower.includes('stock') || lower.includes('in stock')) return { category: 'available', autoSendLink: false };
  if (lower.includes('bulk') || lower.includes('wholesale') || lower.includes('multiple') || lower.includes('pieces')) return { category: 'bulk', autoSendLink: false };
  if (lower.includes('size') || lower.includes('medium') || lower.includes('large') || lower.includes('small')) return { category: 'size', autoSendLink: false };
  return { category: 'default', autoSendLink: false };
}

function MessageBubble({ msg }: { msg: DmMessage }) {
  const isCustomer = msg.role === 'customer';
  const isMerchant = msg.role === 'merchant';
  const isAgent = msg.role === 'agent';

  return (
    <div className={cn('flex gap-2 max-w-xs', isCustomer ? 'flex-row-reverse ml-auto' : 'flex-row')}>
      <div className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-auto',
        isCustomer ? 'bg-gray-200' : isAgent ? 'bg-blue-100' : 'bg-orange-100'
      )}>
        {isCustomer
          ? <User className="w-3.5 h-3.5 text-gray-500" />
          : isAgent
            ? <Bot className="w-3.5 h-3.5 text-blue-500" />
            : <User className="w-3.5 h-3.5 text-orange-500" />}
      </div>
      <div>
        {!isCustomer && (
          <p className="text-xs text-gray-400 mb-1 ml-1">
            {isAgent ? '🤖 Agent' : '👤 You (merchant)'}
          </p>
        )}
        <div className={cn(
          'px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
          isCustomer
            ? 'bg-gray-100 text-gray-800 rounded-tr-sm'
            : isAgent
              ? 'bg-blue-600 text-white rounded-tl-sm'
              : 'bg-orange-100 text-orange-800 rounded-tl-sm'
        )}>
          {msg.content}
        </div>
        <p className={cn('text-xs text-gray-400 mt-1', isCustomer ? 'text-right' : 'text-left ml-1')}>
          {formatTime(msg.timestamp)}
        </p>
      </div>
    </div>
  );
}

function ConversationPane({ conv }: { conv: DmConversation }) {
  const { addConversationMessage, sendPaymentLinkFromConv, simulatePaymentFromConv } = useOrderStore();
  const products = useProductStore(s => s.products);
  const agentSettings = useAgentSettingsStore(s => s.settings);
  const router = useRouter();
  const [input, setInput] = useState('');
  const [agentTyping, setAgentTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conv.messages, agentTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    addConversationMessage(conv.id, 'customer', text);
    setAgentTyping(true);

    // Build message history for Claude (last 10 messages for context)
    const history = [...conv.messages.slice(-10), { role: 'customer', content: text }];

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, convStage: conv.stage, products, agentSettings }),
      });
      const data = await res.json();

      setAgentTyping(false);

      if (data.fallback) {
        // Claude unavailable — fall back to regex
        useFallback(text, conv.id, conv.stage);
        return;
      }

      if (data.message) {
        addConversationMessage(conv.id, 'agent', data.message);
      }

      if (data.send_payment_link) {
        setTimeout(() => sendPaymentLinkFromConv(conv.id), 400);
      }
    } catch {
      setAgentTyping(false);
      useFallback(text, conv.id, conv.stage);
    }
  };

  const useFallback = (text: string, convId: string, stage: string) => {
    const { category, autoSendLink } = classifyMessage(text);
    const responses = AGENT_RESPONSES[category] || AGENT_RESPONSES.default;
    const response = responses[Math.floor(Math.random() * responses.length)];
    if (category !== 'confirm') addConversationMessage(convId, 'agent', response);
    if (autoSendLink && stage !== 'link_sent' && stage !== 'paid') {
      setTimeout(() => sendPaymentLinkFromConv(convId), 400);
    }
  };

  const stageColors: Record<string, string> = {
    inquiry: 'bg-gray-100 text-gray-600',
    negotiation: 'bg-amber-100 text-amber-600',
    link_sent: 'bg-blue-100 text-blue-600',
    paid: 'bg-green-100 text-green-600',
    shipped: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Conv header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center',
          conv.source === 'instagram' ? 'bg-pink-100' : 'bg-green-100'
        )}>
          {conv.source === 'instagram'
            ? <Camera className="w-4 h-4 text-pink-500" />
            : <MessageCircle className="w-4 h-4 text-green-500" />}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{conv.customerName}</p>
          <p className="text-xs text-gray-400">{conv.customerHandle}</p>
        </div>
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', stageColors[conv.stage])}>
          {conv.stage.replace('_', ' ')}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {conv.messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {agentTyping && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="bg-blue-50 px-3 py-2 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      {conv.stage !== 'paid' && conv.stage !== 'shipped' && (
        <div className="px-4 py-2 border-t border-gray-100 flex gap-2">
          {conv.stage === 'inquiry' || conv.stage === 'negotiation' ? (
            <button
              onClick={() => sendPaymentLinkFromConv(conv.id)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              <Link className="w-3 h-3" /> Send Payment Link
            </button>
          ) : null}
          {conv.stage === 'link_sent' && (
            <button
              onClick={() => { simulatePaymentFromConv(conv.id); router.push('/dashboard'); }}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              <CheckCircle className="w-3 h-3" /> Simulate Payment
            </button>
          )}
        </div>
      )}
      {conv.stage === 'paid' && (
        <div className="px-4 py-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Payment confirmed · WhatsApp sent · Shiprocket triggered · Receipt sent</span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
          <input
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
            placeholder="Type as customer…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-7 h-7 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg flex items-center justify-center transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1 text-center">
          Typing as customer — agent replies automatically
        </p>
      </div>
    </div>
  );
}

export default function AgentPage() {
  const { conversations, loadConversations } = useOrderStore();
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const selected = conversations.find((c) => c.id === selectedId);

  useEffect(() => {
    loadConversations().then(() => {
      // Select first conversation once loaded
      setSelectedId((prev) => prev ?? useOrderStore.getState().conversations[0]?.id);
    });
  }, []);

  return (
    <div className="p-6 h-full max-w-5xl mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900">DM Agent</h1>
        <p className="text-sm text-gray-500 mt-0.5">Camera DMs and WhatsApp chats — agent handles inquiry, sends payment link, triggers post-payment chain.</p>
      </div>

      {/* How it works */}
      <div className="mb-4 flex items-center gap-2 text-xs text-gray-500 overflow-x-auto pb-1">
        {[
          { icon: MessageCircle, label: 'DM comes in', color: 'text-pink-500' },
          { label: '→' },
          { icon: Bot, label: 'Agent classifies + replies', color: 'text-blue-500' },
          { label: '→' },
          { icon: Link, label: 'Payment link sent', color: 'text-blue-500' },
          { label: '→' },
          { icon: CheckCircle, label: 'Payment confirmed', color: 'text-green-500' },
          { label: '→' },
          { icon: Truck, label: 'Shiprocket triggered', color: 'text-blue-500' },
          { label: '→' },
          { icon: MessageCircle, label: 'AWB sent to customer', color: 'text-green-500' },
        ].map((step, i) => (
          step.label === '→'
            ? <ChevronRight key={i} className="w-3 h-3 text-gray-300 flex-shrink-0" />
            : (
              <div key={i} className={cn('flex items-center gap-1 flex-shrink-0', step.color)}>
                {step.icon && <step.icon className="w-3 h-3" />}
                <span>{step.label}</span>
              </div>
            )
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden" style={{ height: '560px' }}>
        <div className="flex h-full">
          {/* Conversation list */}
          <div className="w-52 border-r border-gray-100 flex flex-col">
            <div className="px-3 py-3 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Conversations</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => {
                const lastMsg = conv.messages[conv.messages.length - 1];
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={cn(
                      'w-full text-left px-3 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors',
                      selectedId === conv.id && 'bg-blue-50 border-l-2 border-l-blue-500'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {conv.source === 'instagram'
                        ? <Camera className="w-3 h-3 text-pink-500" />
                        : <MessageCircle className="w-3 h-3 text-green-500" />}
                      <p className="text-xs font-medium text-gray-800 truncate">{conv.customerName}</p>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{lastMsg?.content}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat pane */}
          <div className="flex-1 flex flex-col">
            {selected
              ? <ConversationPane conv={selected} />
              : (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                  Select a conversation
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

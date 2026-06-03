'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircle, Circle, Camera, MessageCircle, Truck, Zap,
  ArrowRight, ArrowLeft, ExternalLink, Copy, Check,
  Webhook, Bot, Bell, Package, CreditCard, ChevronRight
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────
type ConnectStatus = 'idle' | 'connecting' | 'connected' | 'error';

// ─── Step 1: Connect Channels ─────────────────────────────────────────
function ConnectChannels({ onDone }: { onDone: () => void }) {
  const [igStatus, setIgStatus] = useState<ConnectStatus>('idle');
  const [waStatus, setWaStatus] = useState<ConnectStatus>('idle');

  const simulate = (setter: (s: ConnectStatus) => void) => {
    setter('connecting');
    setTimeout(() => setter('connected'), 1600);
  };

  const canContinue = igStatus === 'connected' || waStatus === 'connected';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Connect your sales channels</h2>
        <p className="text-sm text-gray-500 mt-1">Where do your customers DM you? Connect at least one.</p>
      </div>

      {/* Instagram */}
      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Instagram DMs</p>
                <p className="text-xs text-gray-500 mt-0.5">Reply to product inquiry DMs automatically</p>
              </div>
              {igStatus === 'connected' ? (
                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-medium">
                  <CheckCircle className="w-3 h-3" /> Connected
                </span>
              ) : (
                <button
                  onClick={() => simulate(setIgStatus)}
                  disabled={igStatus === 'connecting'}
                  className="text-xs bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  {igStatus === 'connecting' ? 'Connecting…' : 'Connect via Meta'}
                </button>
              )}
            </div>
            {igStatus === 'connected' && (
              <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2 flex items-center gap-2">
                <Camera className="w-3 h-3 text-pink-400 flex-shrink-0" />
                <span>@shop.ekaja · 4,821 followers · DM permission granted</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp */}
      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">WhatsApp Business</p>
                <p className="text-xs text-gray-500 mt-0.5">Send order confirmations, AWB & receipts</p>
              </div>
              {waStatus === 'connected' ? (
                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-medium">
                  <CheckCircle className="w-3 h-3" /> Connected
                </span>
              ) : (
                <button
                  onClick={() => simulate(setWaStatus)}
                  disabled={waStatus === 'connecting'}
                  className="text-xs bg-[#25D366] hover:bg-[#1da853] disabled:bg-green-300 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  {waStatus === 'connecting' ? 'Connecting…' : 'Connect via Meta'}
                </button>
              )}
            </div>
            {waStatus === 'connected' && (
              <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2 flex items-center gap-2">
                <MessageCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                <span>+91 98765 43210 · Business verified · Templates approved</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onDone}
          disabled={!canContinue}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Connect Shiprocket ───────────────────────────────────────
function ConnectShiprocket({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const [status, setStatus] = useState<ConnectStatus>('idle');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleConnect = () => {
    if (!email) return;
    setStatus('connecting');
    setTimeout(() => setStatus('connected'), 1800);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Connect Shiprocket</h2>
        <p className="text-sm text-gray-500 mt-1">Orders will be auto-created on Shiprocket the moment payment is confirmed.</p>
      </div>

      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Shiprocket</p>
            <p className="text-xs text-gray-500 mt-0.5">Auto-create order, assign AWB, get tracking URL</p>
          </div>
        </div>

        {status === 'connected' ? (
          <div className="mt-3 text-xs text-green-700 bg-green-50 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>Connected · Auto-assign courier enabled · Pickup from Delhi NCR</span>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Shiprocket Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleConnect}
              disabled={!email || status === 'connecting'}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {status === 'connecting' ? 'Connecting…' : 'Connect Shiprocket'}
            </button>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-xs font-medium text-blue-700 mb-2">What happens automatically after payment?</p>
        <div className="space-y-1.5">
          {[
            'Razorpay webhook fires instantly',
            'Customer details extracted from payment notes',
            'Shiprocket order created via API',
            'Courier auto-assigned, AWB generated',
            'Tracking URL sent to customer on WhatsApp',
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-blue-600">
              <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-500 font-bold" style={{ fontSize: 9 }}>
                {i + 1}
              </div>
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onDone}
          disabled={status !== 'connected'}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Message Templates ────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'order_confirmed',
    trigger: 'Payment received',
    icon: CheckCircle,
    iconColor: 'text-green-500',
    bg: 'bg-green-50',
    preview: (name: string, amount: string, product: string, orderId: string) =>
      `Hi ${name}! ✅ Your payment of ₹${amount} for *${product}* (Order #${orderId}) is confirmed.\n\nWe're packing your order now 📦`,
  },
  {
    id: 'awb_sent',
    trigger: 'AWB assigned',
    icon: Truck,
    iconColor: 'text-blue-500',
    bg: 'bg-blue-50',
    preview: (name: string, _amount: string, _product: string, orderId: string) =>
      `🚚 Your order #${orderId} has been picked up by *Delhivery*.\n\nTrack: https://shiprocket.co/tracking/SR123456789\n\nExpected delivery: 2–3 days`,
  },
  {
    id: 'receipt',
    trigger: 'Receipt ready',
    icon: CreditCard,
    iconColor: 'text-purple-500',
    bg: 'bg-purple-50',
    preview: (name: string, amount: string) =>
      `📄 Here's your receipt for ₹${amount}. Thank you for shopping with *${name}* 🙏\n\n[View Receipt PDF]`,
  },
  {
    id: 'balance_reminder',
    trigger: 'Balance due (D-2)',
    icon: Bell,
    iconColor: 'text-orange-500',
    bg: 'bg-orange-50',
    preview: (name: string, amount: string) =>
      `Hi ${name}, friendly reminder that ₹${amount} balance payment is due in 2 days.\n\nPay here: https://rzp.io/l/balance-demo\n\nQuestions? Reply here 🙏`,
  },
];

function MessageTemplates({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const [selected, setSelected] = useState<string>('order_confirmed');
  const selectedTpl = TEMPLATES.find(t => t.id === selected)!;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">WhatsApp message templates</h2>
        <p className="text-sm text-gray-500 mt-1">These messages are sent automatically. All templates are pre-approved by Meta.</p>
      </div>

      <div className="flex gap-4">
        {/* Template list */}
        <div className="space-y-2" style={{ width: 200 }}>
          {TEMPLATES.map((tpl) => {
            const Icon = tpl.icon;
            return (
              <button
                key={tpl.id}
                onClick={() => setSelected(tpl.id)}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-xl border transition-colors flex items-center gap-2.5',
                  selected === tpl.id
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                )}
              >
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', tpl.bg)}>
                  <Icon className={cn('w-3.5 h-3.5', tpl.iconColor)} />
                </div>
                <div>
                  <p className={cn('text-xs font-medium', selected === tpl.id ? 'text-blue-700' : 'text-gray-700')}>
                    {tpl.trigger}
                  </p>
                </div>
                {selected === tpl.id && <ChevronRight className="w-3.5 h-3.5 text-blue-400 ml-auto" />}
              </button>
            );
          })}
        </div>

        {/* Preview */}
        <div className="flex-1">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center', selectedTpl.bg)}>
                  <selectedTpl.icon className={cn('w-3.5 h-3.5', selectedTpl.iconColor)} />
                </div>
                <span className="text-xs font-medium text-gray-700">Trigger: {selectedTpl.trigger}</span>
              </div>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Meta approved</span>
            </div>
            <div className="p-4" style={{ background: '#ece5dd', minHeight: 120 }}>
              <div className="bg-white rounded-xl px-3 py-2.5 max-w-xs shadow-sm">
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedTpl.preview('Sneha', '4,800', 'Silk Kurta Set (M)', 'ORD-001')}
                </p>
                <p className="text-[9px] text-gray-400 text-right mt-1">11:42 AM ✓✓</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">Variables auto-filled from order data</p>
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onDone}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Webhook + Test ───────────────────────────────────────────
function WebhookSetup({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const [copied, setCopied] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const webhookUrl = 'https://razorpay.com/d2c-agent/webhook/pay_xxxx';

  const copyUrl = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runTest = () => {
    setTestStatus('running');
    setTimeout(() => setTestStatus('done'), 2400);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Webhook & live test</h2>
        <p className="text-sm text-gray-500 mt-1">Razorpay auto-configures the webhook — no setup needed on your end.</p>
      </div>

      {/* Webhook URL (auto-configured) */}
      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Webhook className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-medium text-gray-700">Razorpay Webhook (auto-configured)</p>
          </div>
          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Active</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
          <code className="flex-1 text-xs text-gray-600 font-mono truncate">{webhookUrl}</code>
          <button
            onClick={copyUrl}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">This webhook fires on <code className="bg-gray-100 px-1 rounded text-xs">payment.captured</code> events and triggers your automation chain.</p>
      </div>

      {/* Flow summary */}
      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Your automation flow</p>
        <div className="space-y-2">
          {[
            { icon: CreditCard, label: 'Customer pays via Razorpay link', color: 'text-blue-500', bg: 'bg-blue-50' },
            { icon: Webhook, label: 'Webhook fires → agent triggered', color: 'text-purple-500', bg: 'bg-purple-50' },
            { icon: Truck, label: 'Shiprocket order auto-created + AWB assigned', color: 'text-orange-500', bg: 'bg-orange-50' },
            { icon: MessageCircle, label: 'WhatsApp: confirmation + AWB + receipt', color: 'text-green-500', bg: 'bg-green-50' },
            { icon: Package, label: 'Order marked "Processing" in dashboard', color: 'text-gray-500', bg: 'bg-gray-100' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', item.bg)}>
                <item.icon className={cn('w-3.5 h-3.5', item.color)} />
              </div>
              <p className="text-xs text-gray-600">{item.label}</p>
              {i < 4 && <div className="w-px h-3 bg-gray-200 ml-3.5 -mt-4 absolute" style={{ display: 'none' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Live test */}
      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Test your setup</p>
            <p className="text-xs text-gray-500 mt-0.5">Fire a test payment event to verify the full chain</p>
          </div>
          <button
            onClick={runTest}
            disabled={testStatus !== 'idle'}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            {testStatus === 'idle' ? 'Run test' : testStatus === 'running' ? 'Running…' : 'Passed ✓'}
          </button>
        </div>
        {testStatus === 'done' && (
          <div className="space-y-1.5">
            {[
              'Webhook received ✓',
              'Shiprocket order created (test mode) ✓',
              'AWB assigned: SR9876543210 ✓',
              'WhatsApp message queued (not sent in test mode) ✓',
            ].map((line, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle className="w-3 h-3 flex-shrink-0" />
                {line}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onDone}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          <CheckCircle className="w-4 h-4" /> Finish setup
        </button>
      </div>
    </div>
  );
}

// ─── Done ─────────────────────────────────────────────────────────────
function SetupDone() {
  return (
    <div className="text-center py-8 space-y-4">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <CheckCircle className="w-8 h-8 text-green-500" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-900">You're all set!</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
          Your D2C Agent is live. Every payment now triggers the full automation chain — Shiprocket, WhatsApp, and receipts — with zero manual work.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto mt-2">
        {[
          { icon: Bot, label: 'DM Agent active', color: 'text-blue-500', bg: 'bg-blue-50' },
          { icon: Truck, label: 'Shiprocket connected', color: 'text-orange-500', bg: 'bg-orange-50' },
          { icon: MessageCircle, label: 'WhatsApp ready', color: 'text-green-500', bg: 'bg-green-50' },
          { icon: Webhook, label: 'Webhook live', color: 'text-purple-500', bg: 'bg-purple-50' },
        ].map(({ icon: Icon, label, color, bg }) => (
          <div key={label} className={cn('flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-100', bg)}>
            <Icon className={cn('w-4 h-4', color)} />
            <span className="text-xs font-medium text-gray-700">{label}</span>
          </div>
        ))}
      </div>
      <a
        href="/dashboard"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-3 rounded-xl transition-colors mt-2"
      >
        Go to Orders dashboard <ArrowRight className="w-4 h-4" />
      </a>
    </div>
  );
}

// ─── Step progress bar ────────────────────────────────────────────────
const STEPS = [
  { label: 'Connect channels', icon: Camera },
  { label: 'Shiprocket', icon: Truck },
  { label: 'Messages', icon: MessageCircle },
  { label: 'Go live', icon: Zap },
];

// ─── Page ─────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else setDone(true);
  };
  const back = () => setStep(s => Math.max(0, s - 1));

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">D2C Agent Setup</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Set up your automation</h1>
        <p className="text-sm text-gray-500 mt-0.5">Connect your tools once. Agent handles everything from DM to delivery.</p>
      </div>

      {!done && (
        /* Step indicator */
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                    isDone ? 'bg-green-500' :
                    isActive ? 'bg-blue-600' :
                    'bg-gray-200'
                  )}>
                    {isDone
                      ? <Check className="w-4 h-4 text-white" />
                      : <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-gray-400')} />
                    }
                  </div>
                  <span className={cn(
                    'text-xs font-medium',
                    isActive ? 'text-blue-600' : isDone ? 'text-green-600' : 'text-gray-400'
                  )}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    'h-px mb-5 transition-colors',
                    i < step ? 'bg-green-400' : 'bg-gray-200'
                  )} style={{ width: 60 }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Step content */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
        {done ? (
          <SetupDone />
        ) : step === 0 ? (
          <ConnectChannels onDone={next} />
        ) : step === 1 ? (
          <ConnectShiprocket onDone={next} onBack={back} />
        ) : step === 2 ? (
          <MessageTemplates onDone={next} onBack={back} />
        ) : (
          <WebhookSetup onDone={next} onBack={back} />
        )}
      </div>
    </div>
  );
}

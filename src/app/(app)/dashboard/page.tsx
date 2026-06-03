'use client';
import { useState, useEffect } from 'react';
import { useOrderStore, WebhookStep, CustomerWhatsAppMessage } from '@/store/orders';
import { Order } from '@/types';
import { formatCurrency, formatDate, formatTime, cn } from '@/lib/utils';
import {
  Package, CheckCircle, Truck, Clock, AlertCircle, Camera, MessageCircle,
  ChevronDown, ChevronUp, Zap, CreditCard, Loader2, CheckCheck, Check,
  Webhook, User, FlaskConical, ChevronRight, X
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending_payment: { label: 'Awaiting Payment', color: 'bg-amber-100 text-amber-700', icon: Clock },
  payment_received: { label: 'Payment Received', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-700', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-green-100 text-green-700', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-gray-100 text-gray-600', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600', icon: AlertCircle },
};

// ─── Webhook Pipeline ───────────────────────────────────────────────
function StepIcon({ status }: { status: WebhookStep['status'] }) {
  if (status === 'done') return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
  if (status === 'running') return <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />;
  if (status === 'error') return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
  return <div className="w-2 h-2 rounded-full bg-gray-300 mx-[1px]" />;
}

function WebhookPipeline({ steps }: { steps: WebhookStep[] }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        <Webhook className="w-3.5 h-3.5 text-gray-400" />
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Automation Pipeline</p>
      </div>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-start gap-2.5">
            {/* connector line */}
            <div className="flex flex-col items-center flex-shrink-0" style={{ width: 20 }}>
              <div className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                step.status === 'done' ? 'bg-green-50' :
                step.status === 'running' ? 'bg-blue-50' :
                'bg-gray-50'
              )}>
                <StepIcon status={step.status} />
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  'w-px flex-1 mt-0.5',
                  step.status === 'done' ? 'bg-green-200' : 'bg-gray-200'
                )} style={{ height: 14 }} />
              )}
            </div>
            <div className="pb-1 min-w-0">
              <p className={cn(
                'text-xs font-medium leading-tight',
                step.status === 'done' ? 'text-gray-700' :
                step.status === 'running' ? 'text-blue-600' :
                'text-gray-400'
              )}>
                {step.label}
                {step.ts && <span className="font-normal text-gray-400 ml-1">· {step.ts}</span>}
              </p>
              <p className={cn(
                'text-xs mt-0.5 leading-tight',
                step.status === 'done' ? 'text-gray-400' :
                step.status === 'running' ? 'text-blue-400' :
                'text-gray-300'
              )}>
                {step.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Customer WhatsApp Phone ─────────────────────────────────────────
function MessageStatusIcon({ status }: { status?: CustomerWhatsAppMessage['status'] }) {
  if (status === 'read') return <CheckCheck className="w-3 h-3 text-blue-400 inline ml-1" />;
  if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-gray-400 inline ml-1" />;
  if (status === 'sent') return <Check className="w-3 h-3 text-gray-400 inline ml-1" />;
  return null;
}

function CustomerPhone({ messages, customerName }: { messages: CustomerWhatsAppMessage[]; customerName: string }) {
  return (
    <div className="flex flex-col" style={{ width: 200 }}>
      <div className="flex items-center gap-1.5 mb-2">
        <MessageCircle className="w-3.5 h-3.5 text-gray-400" />
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Customer View</p>
      </div>
      {/* Phone shell */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm" style={{ width: 200 }}>
        {/* WhatsApp header */}
        <div className="bg-[#075e54] px-3 py-2 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">Shop Ekaja</p>
            <p className="text-white/70 text-[10px]">Business Account</p>
          </div>
        </div>

        {/* Chat area */}
        <div
          className="px-2 py-2 space-y-1.5 overflow-y-auto"
          style={{ background: '#ece5dd', minHeight: 140, maxHeight: 220 }}
        >
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-20">
              <p className="text-xs text-gray-400 text-center">Messages will appear here after payment</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex', msg.type === 'outgoing' ? 'justify-end' : 'justify-start')}
              >
                <div className={cn(
                  'rounded-lg px-2 py-1.5 max-w-[85%] shadow-sm',
                  msg.type === 'outgoing' ? 'bg-[#dcf8c6]' : 'bg-white'
                )}>
                  <p className="text-[10px] text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <div className="flex items-center justify-end gap-0.5 mt-0.5">
                    <span className="text-[9px] text-gray-400">{formatTime(msg.timestamp)}</span>
                    {msg.type === 'outgoing' && <MessageStatusIcon status={msg.status} />}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input bar (decorative) */}
        <div className="bg-[#f0f0f0] px-2 py-1.5 flex items-center gap-1.5">
          <div className="flex-1 bg-white rounded-full px-2 py-1">
            <p className="text-[10px] text-gray-300">Message</p>
          </div>
          <div className="w-6 h-6 rounded-full bg-[#075e54] flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-3 h-3 text-white" />
          </div>
        </div>
      </div>
      <p className="text-[10px] text-gray-400 text-center mt-1.5">{customerName.split(' ')[0]}'s phone</p>
    </div>
  );
}

// ─── Order Row ───────────────────────────────────────────────────────
function OrderRow({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const { simulatePayment, webhookChain, customerMessages } = useOrderStore();
  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

  const steps = webhookChain[order.id];
  const msgs = customerMessages[order.id] || [];
  const pipelineStarted = !!steps;
  const allDone = steps?.every(s => s.status === 'done');

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      {/* Main row */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Source badge */}
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          order.source === 'instagram' ? 'bg-pink-100' : 'bg-green-100'
        )}>
          {order.source === 'instagram'
            ? <Camera className="w-4 h-4 text-pink-500" />
            : <MessageCircle className="w-4 h-4 text-green-500" />}
        </div>

        {/* Order info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{order.customerName}</span>
            <span className="text-xs text-gray-400">{order.id}</span>
            {order.partial && !order.partial.balancePaid && (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                Partial — ₹{order.partial.balanceDue.toLocaleString('en-IN')} due
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">{order.product}</p>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-semibold text-gray-900">{formatCurrency(order.amount)}</p>
          <p className="text-xs text-gray-400">{formatTime(order.createdAt)}</p>
        </div>

        {/* Status */}
        <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0', status.color)}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </div>

        {/* Automation badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {order.whatsappConfirmationSent && (
            <span title="WhatsApp sent" className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
              <MessageCircle className="w-3 h-3 text-green-500" />
            </span>
          )}
          {order.shipment && (
            <span title="Shiprocket triggered" className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
              <Truck className="w-3 h-3 text-blue-500" />
            </span>
          )}
          {order.receiptSent && (
            <span title="Receipt sent" className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
              <CreditCard className="w-3 h-3 text-purple-500" />
            </span>
          )}
        </div>

        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
          <div className="flex gap-6">

            {/* ── Col 1: Customer + Order info ── */}
            <div className="flex-shrink-0 space-y-3" style={{ width: 180 }}>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Customer</p>
                <p className="text-sm text-gray-700">{order.customerName}</p>
                <p className="text-xs text-gray-500">{order.customerPhone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Order</p>
                <p className="text-sm text-gray-700">{order.product}</p>
                {order.notes && <p className="text-xs text-gray-500 mt-1 italic">{order.notes}</p>}
              </div>
              {order.shipment && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Shipment</p>
                  <p className="text-xs text-gray-700 font-mono">{order.shipment.awb}</p>
                  <p className="text-xs text-gray-500">{order.shipment.courier}</p>
                  <a href={order.shipment.trackingUrl} target="_blank" rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline">Track →</a>
                </div>
              )}
              {order.partial && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Partial Payment</p>
                  <div className="bg-white rounded-lg p-2 border border-orange-100 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Advance</span>
                      <span className="font-medium text-green-600">{formatCurrency(order.partial.advancePaid)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Balance</span>
                      <span className="font-medium text-orange-600">{formatCurrency(order.partial.balanceDue)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Due</span>
                      <span className="text-gray-700">{formatDate(order.partial.balanceDueDate)}</span>
                    </div>
                    {!order.partial.balancePaid && (
                      <button className="w-full mt-1.5 text-xs bg-orange-500 hover:bg-orange-600 text-white py-1.5 rounded-md font-medium transition-colors">
                        Send Reminder
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Col 2: Webhook pipeline (or trigger button) ── */}
            <div className="flex-1 min-w-0">
              {!pipelineStarted && order.status === 'pending_payment' ? (
                <div className="flex flex-col items-center justify-center h-full py-6 gap-2">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-xs font-medium text-gray-600">Awaiting payment from customer</p>
                  <p className="text-xs text-gray-400">Payment link sent via WhatsApp</p>
                  <p className="text-xs text-gray-300 mt-1">Pipeline runs automatically on payment.captured</p>
                </div>
              ) : pipelineStarted ? (
                <WebhookPipeline steps={steps} />
              ) : (
                /* Non-pending orders: show what ran */
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Webhook className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Automation Log</p>
                  </div>
                  <div className="space-y-2">
                    {order.paidAt && (
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-gray-700">Payment confirmed</p>
                          <p className="text-xs text-gray-400">{formatTime(order.paidAt)} · {order.paymentId}</p>
                        </div>
                      </div>
                    )}
                    {order.whatsappConfirmationSent && (
                      <div className="flex items-start gap-2">
                        <MessageCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-gray-700">WhatsApp confirmation sent</p>
                          <p className="text-xs text-gray-400">Auto-triggered by workflow</p>
                        </div>
                      </div>
                    )}
                    {order.shipment && (
                      <div className="flex items-start gap-2">
                        <Truck className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-gray-700">Shiprocket · {order.shipment.courier}</p>
                          <p className="text-xs text-gray-400">AWB: {order.shipment.awb}</p>
                        </div>
                      </div>
                    )}
                    {order.receiptSent && (
                      <div className="flex items-start gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-gray-700">Receipt PDF sent via WhatsApp</p>
                          <p className="text-xs text-gray-400">Auto-triggered by workflow</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Col 3: Customer's WhatsApp phone ── */}
            {(pipelineStarted || msgs.length > 0) && (
              <div className="flex-shrink-0">
                <CustomerPhone messages={msgs} customerName={order.customerName} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sandbox Banner ──────────────────────────────────────────────────
function SandboxBanner({ orders, onSimulate }: { orders: Order[]; onSimulate: (id: string) => void }) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const pending = orders.filter(o => o.status === 'pending_payment');

  if (dismissed || pending.length === 0) return null;

  return (
    <div className="mb-5 border border-dashed border-amber-300 bg-amber-50 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-6 h-6 rounded-md bg-amber-200 flex items-center justify-center flex-shrink-0">
          <FlaskConical className="w-3.5 h-3.5 text-amber-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-amber-800">Sandbox mode — demo only</p>
          <p className="text-xs text-amber-600 mt-0.5">In production, Razorpay fires the webhook automatically. No merchant action needed.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 font-medium transition-colors"
          >
            Simulate a payment
            <ChevronRight className={cn('w-3.5 h-3.5 transition-transform', expanded && 'rotate-90')} />
          </button>
          <button onClick={() => setDismissed(true)} className="text-amber-400 hover:text-amber-600 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-dashed border-amber-200 px-4 py-3 space-y-2">
          <p className="text-xs text-amber-600 mb-2">Pick an order below to fire a test <code className="bg-amber-100 px-1 rounded text-xs">payment.captured</code> event and watch the full automation chain run:</p>
          {pending.map(order => (
            <div key={order.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100">
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-800">{order.customerName} <span className="text-gray-400 font-normal">{order.id}</span></p>
                <p className="text-xs text-gray-500 truncate">{order.product} · {formatCurrency(order.amount)}</p>
              </div>
              <button
                onClick={() => { onSimulate(order.id); setExpanded(false); }}
                className="flex items-center gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0 ml-3"
              >
                <Zap className="w-3 h-3" /> Fire webhook
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { orders, simulatePayment, loadOrders } = useOrderStore();
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => { loadOrders(); }, []);

  const counts = {
    all: orders.length,
    pending_payment: orders.filter(o => o.status === 'pending_payment').length,
    payment_received: orders.filter(o => o.status === 'payment_received').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const todayGMV = orders
    .filter(o => o.paidAt && new Date(o.paidAt).toDateString() === new Date().toDateString())
    .reduce((s, o) => s + o.amount, 0);

  const pendingCount = orders.filter(o => o.status === 'pending_payment').length;
  const automatedToday = orders.filter(o => o.whatsappConfirmationSent && o.paidAt && new Date(o.paidAt).toDateString() === new Date().toDateString()).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-0.5">Today, {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Sandbox banner */}
      <SandboxBanner orders={orders} onSimulate={simulatePayment} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Today's GMV</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(todayGMV)}</p>
          <p className="text-xs text-green-600 mt-1">via Razorpay</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Pending Payment</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
          <p className="text-xs text-gray-400 mt-1">links awaiting payment</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Auto-confirmed today</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{automatedToday}</p>
          <p className="text-xs text-gray-400 mt-1">WhatsApp sent · 0 manual</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 mb-4 w-fit">
        {(['all', 'pending_payment', 'payment_received', 'shipped'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              filter === s ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            {s === 'all' ? 'All' : statusConfig[s]?.label}
            <span className={cn('ml-1.5 text-xs', filter === s ? 'text-blue-200' : 'text-gray-400')}>
              {counts[s as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {/* Orders */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No orders in this category</div>
        ) : (
          filtered.map(order => <OrderRow key={order.id} order={order} />)
        )}
      </div>
    </div>
  );
}

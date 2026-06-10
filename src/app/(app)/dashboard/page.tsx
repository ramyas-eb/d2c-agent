'use client';
import { useState, useEffect } from 'react';
import { useOrderStore, WebhookStep, CustomerWhatsAppMessage } from '@/store/orders';
import { Order, OrderStatus } from '@/types';
import { formatCurrency, formatDate, formatTime, cn } from '@/lib/utils';
import {
  Package, CheckCircle, Truck, Clock, AlertCircle, Camera, MessageCircle,
  ChevronDown, ChevronUp, Zap, CreditCard, Loader2, CheckCheck, Check,
  Webhook, User, FlaskConical, ChevronRight, X, ExternalLink, Copy, Phone, Edit2,
  Search, Download, RefreshCw, FileText, TrendingUp, ArrowUpRight, Inbox,
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

// ─── Automation Timeline ─────────────────────────────────────────────
interface TimelineStep {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  time: string | null;
  sub: string | null;
}

function AutomationTimeline({ order }: { order: Order }) {
  const steps: TimelineStep[] = [];

  if (order.paidAt) {
    steps.push({
      icon: <CheckCircle className="w-3 h-3 text-green-500" />,
      iconBg: 'bg-green-50',
      title: 'Payment confirmed',
      time: formatTime(order.paidAt),
      sub: order.paymentId ?? null,
    });
  }

  if (order.whatsappConfirmationSent) {
    steps.push({
      icon: <MessageCircle className="w-3 h-3 text-green-500" />,
      iconBg: 'bg-green-50',
      title: 'WhatsApp confirmation sent',
      time: null,
      sub: 'Auto-triggered by workflow',
    });
  }

  if (order.shipment) {
    steps.push({
      icon: <Truck className="w-3 h-3 text-blue-500" />,
      iconBg: 'bg-blue-50',
      title: `Shiprocket · ${order.shipment.courier}`,
      time: order.shipment.triggeredAt ? formatTime(order.shipment.triggeredAt) : null,
      sub: `AWB: ${order.shipment.awb}`,
    });
  }

  if (order.receiptSent) {
    steps.push({
      icon: <CreditCard className="w-3 h-3 text-purple-500" />,
      iconBg: 'bg-purple-50',
      title: 'Receipt PDF sent via WhatsApp',
      time: null,
      sub: 'Auto-triggered by workflow',
    });
  }

  if (steps.length === 0) {
    return <p className="text-sm text-gray-400 italic">No automation triggered yet</p>;
  }

  return (
    <div>
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-2.5">
          {/* icon + vertical connector */}
          <div className="flex flex-col items-center flex-shrink-0" style={{ width: 20 }}>
            <div className={`w-5 h-5 rounded-full ${step.iconBg} flex items-center justify-center flex-shrink-0`}>
              {step.icon}
            </div>
            {i < steps.length - 1 && (
              <div className="w-px bg-gray-200 mt-0.5" style={{ height: 22 }} />
            )}
          </div>
          {/* content */}
          <div className="pb-3 min-w-0">
            <p className="text-xs font-medium text-gray-700 leading-tight">{step.title}</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">
              {step.time && step.sub
                ? `${step.time} · ${step.sub}`
                : step.time || step.sub || ''}
            </p>
          </div>
        </div>
      ))}
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

// ─── Order Detail Modal ──────────────────────────────────────────────
const ALL_STATUSES: OrderStatus[] = [
  'pending_payment', 'payment_received', 'processing', 'shipped', 'delivered', 'cancelled',
];

function OrderDetailModal({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const { loadOrders } = useOrderStore();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [resendFeedback, setResendFeedback] = useState(false);
  const [copyLinkFeedback, setCopyLinkFeedback] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => { setNoteDraft(order?.notes ?? ''); }, [order?.id]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    });
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    setStatusLoading(true);
    setEditingStatus(false);
    try {
      await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      await loadOrders();
    } catch {
      // silent
    } finally {
      setStatusLoading(false);
    }
  };

  const handleResendReceipt = async () => {
    if (!order) return;
    try {
      await fetch(`/api/orders/${order.id}/resend-receipt`, { method: 'POST' });
    } catch {
      // silent
    }
    setResendFeedback(true);
    setTimeout(() => setResendFeedback(false), 1500);
  };

  const handleCopyLink = () => {
    if (!order) return;
    const link = window.location.origin + '/dashboard?order=' + order.id;
    navigator.clipboard.writeText(link).then(() => {
      setCopyLinkFeedback(true);
      setTimeout(() => setCopyLinkFeedback(false), 1500);
    });
  };

  const isOpen = !!order;
  const status = order ? statusConfig[order.status] : null;
  const StatusIcon = status?.icon;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-[480px] bg-white shadow-2xl flex flex-col',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {order && (
          <>
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-gray-900 leading-tight">{order.customerName}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{order.id}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {status && StatusIcon && (
                    <span className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', status.color)}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  )}
                  <button
                    onClick={onClose}
                    className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Section 1: Order Info */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Order Info</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Product</p>
                    <p className="text-sm text-gray-800">{order.product}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="text-sm font-semibold text-gray-800">{formatCurrency(order.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Payment mode</p>
                      <span className={cn(
                        'inline-block text-xs px-2 py-0.5 rounded-full font-semibold capitalize',
                        order.paymentMode === 'cod'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-700'
                      )}>
                        {order.paymentMode === 'cod' ? '📦 Cash on Delivery' : order.paymentMode}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-gray-500">Created at</p>
                      <p className="text-sm text-gray-800">{formatDate(order.createdAt)} {formatTime(order.createdAt)}</p>
                    </div>
                    {order.paidAt && (
                      <div>
                        <p className="text-xs text-gray-500">Paid at</p>
                        <p className="text-sm text-gray-800">{formatDate(order.paidAt)} {formatTime(order.paidAt)}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Source</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {order.source === 'instagram'
                        ? <Camera className="w-3.5 h-3.5 text-pink-500" />
                        : <MessageCircle className="w-3.5 h-3.5 text-green-500" />}
                      <p className="text-sm text-gray-800 capitalize">{order.source}</p>
                    </div>
                  </div>
                  {order.notes && (
                    <div>
                      <p className="text-xs text-gray-500">Notes</p>
                      <p className="text-sm text-gray-800 italic">{order.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Customer */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Customer</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm text-gray-800">{order.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-sm text-gray-800">{order.customerPhone}</p>
                      <button
                        onClick={() => copyToClipboard(order.customerPhone, 'phone')}
                        className="text-gray-400 hover:text-gray-600 transition-colors relative"
                        title="Copy phone"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedField === 'phone' && (
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-0.5 rounded whitespace-nowrap">
                            Copied!
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">WhatsApp</p>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                      <p className="text-sm text-gray-800">{order.customerWhatsapp}</p>
                      <button
                        onClick={() => copyToClipboard(order.customerWhatsapp, 'whatsapp')}
                        className="text-gray-400 hover:text-gray-600 transition-colors relative"
                        title="Copy WhatsApp"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedField === 'whatsapp' && (
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-0.5 rounded whitespace-nowrap">
                            Copied!
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Automation Log */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Automation Log</p>
                <AutomationTimeline order={order} />
              </div>

              {/* Section 4: Shipment (conditional) */}
              {order.shipment && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Shipment</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-xs text-gray-500">AWB</p>
                        <p className="text-sm text-gray-800 font-mono">{order.shipment.awb}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Courier</p>
                        <p className="text-sm text-gray-800">{order.shipment.courier}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <p className="text-sm text-gray-800 capitalize">{order.shipment.status.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    <a
                      href={order.shipment.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                    >
                      Track on Shiprocket
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Section 5: Partial Payment (conditional) */}
              {order.partial && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Partial Payment</p>
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-100 space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">Advance paid</p>
                      <p className="text-sm font-medium text-green-600">{formatCurrency(order.partial.advancePaid)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">Balance due</p>
                      <p className="text-sm font-medium text-orange-600">{formatCurrency(order.partial.balanceDue)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">Due date</p>
                      <p className="text-sm text-gray-800">{formatDate(order.partial.balanceDueDate)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">Balance paid</p>
                      <p className={cn('text-sm font-medium', order.partial.balancePaid ? 'text-green-600' : 'text-orange-600')}>
                        {order.partial.balancePaid ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Section: Merchant Notes */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Internal Notes</p>
                <textarea
                  value={noteDraft}
                  onChange={e => setNoteDraft(e.target.value)}
                  placeholder="Add a private note about this order…"
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-1 focus:ring-blue-300 resize-none"
                />
                {noteDraft !== (order?.notes ?? '') && (
                  <button
                    onClick={async () => {
                      if (!order) return;
                      setSavingNote(true);
                      await fetch(`/api/orders/${order.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ notes: noteDraft }),
                      }).catch(console.warn);
                      setSavingNote(false);
                      setNoteSaved(true);
                      await loadOrders();
                      setTimeout(() => setNoteSaved(false), 2000);
                    }}
                    disabled={savingNote}
                    className="mt-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    {savingNote ? 'Saving…' : noteSaved ? '✓ Saved' : 'Save Note'}
                  </button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-6 py-4 flex items-center gap-2 flex-shrink-0">
              {/* Edit Status */}
              <div className="relative">
                <button
                  onClick={() => setEditingStatus(v => !v)}
                  disabled={statusLoading}
                  className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg font-medium transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  {statusLoading ? 'Saving…' : 'Edit Status'}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {editingStatus && (
                  <div className="absolute bottom-full mb-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10 min-w-[180px]">
                    {ALL_STATUSES.map(s => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={cn(
                          'w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors flex items-center gap-2',
                          order.status === s && 'bg-blue-50 text-blue-700 font-medium'
                        )}
                      >
                        {statusConfig[s] && (() => {
                          const Ic = statusConfig[s].icon;
                          return <Ic className="w-3 h-3 flex-shrink-0" />;
                        })()}
                        {statusConfig[s]?.label ?? s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Resend Receipt */}
              <button
                onClick={handleResendReceipt}
                className="flex items-center gap-1.5 text-xs border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg font-medium transition-colors"
              >
                <CreditCard className="w-3 h-3" />
                {resendFeedback ? 'Sent!' : 'Resend Receipt'}
              </button>

              {/* Download Receipt */}
              <button
                onClick={() => window.open(`/api/orders/${order.id}/receipt`, '_blank')}
                className="flex items-center gap-1.5 text-xs border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg font-medium transition-colors"
              >
                <FileText className="w-3 h-3" />
                Download Receipt
              </button>

              {/* Copy Order Link */}
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 text-xs border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg font-medium transition-colors ml-auto"
              >
                <Copy className="w-3 h-3" />
                {copyLinkFeedback ? 'Copied!' : 'Copy Order Link'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Order Row ───────────────────────────────────────────────────────
function OrderRow({ order, onViewDetail, selected, onSelect }: {
  order: Order;
  onViewDetail: (order: Order) => void;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { simulatePayment, webhookChain, customerMessages } = useOrderStore();
  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

  const steps = webhookChain[order.id];
  const msgs = customerMessages[order.id] || [];
  const pipelineStarted = !!steps;
  const allDone = steps?.every(s => s.status === 'done');

  return (
    <div className={cn('border rounded-xl bg-white overflow-hidden', selected ? 'border-blue-300 bg-blue-50' : 'border-gray-200')}>
      {/* Main row */}
      <div
        className={cn('flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors', selected ? 'hover:bg-blue-100' : 'hover:bg-gray-50')}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(order.id)}
          onClick={e => e.stopPropagation()}
          className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 cursor-pointer flex-shrink-0"
        />

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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900">{order.customerName}</span>
            {order.paymentMode === 'cod' && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                COD
              </span>
            )}
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

        <button
          onClick={(e) => { e.stopPropagation(); onViewDetail(order); }}
          className="text-xs text-blue-600 hover:underline flex-shrink-0"
        >
          Details →
        </button>
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
                  <AutomationTimeline order={order} />
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

// ─── Sparkline ────────────────────────────────────────────────────────
function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <div className="h-10" />;
  const max = Math.max(...values, 1);
  const W = 200, H = 40;
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * W,
    y: H - (v / max) * (H - 6) - 3,
  }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cx = (pts[i - 1].x + pts[i].x) / 2;
    d += ` C ${cx} ${pts[i - 1].y} ${cx} ${pts[i].y} ${pts[i].x} ${pts[i].y}`;
  }
  const fill = `${d} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-10">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#sg)" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Summary Tab ──────────────────────────────────────────────────────
function SummaryTab({ orders }: { orders: Order[] }) {
  const today = new Date();

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(today.getDate() - (6 - i));
    return orders
      .filter(o => o.paidAt && new Date(o.paidAt).toDateString() === d.toDateString())
      .reduce((s, o) => s + o.amount, 0);
  });

  const dayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(today.getDate() - (6 - i));
    return i === 6 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' });
  });

  const weekRevenue = last7.reduce((s, v) => s + v, 0);
  const todayRevenue = last7[6];
  const todayOrders = orders.filter(o => o.paidAt && new Date(o.paidAt).toDateString() === today.toDateString()).length;
  const toShip = orders.filter(o => o.status === 'payment_received' || o.status === 'processing').length;
  const shipped = orders.filter(o => o.status === 'shipped' || o.status === 'delivered').length;

  const productMap: Record<string, { count: number; revenue: number }> = {};
  orders.forEach(o => {
    if (!productMap[o.product]) productMap[o.product] = { count: 0, revenue: 0 };
    productMap[o.product].count++;
    productMap[o.product].revenue += o.amount;
  });
  const topProducts = Object.entries(productMap).sort((a, b) => b[1].count - a[1].count).slice(0, 3);

  return (
    <div className="space-y-5">
      {/* Revenue hero + sparkline */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">This week</p>
            <p className="text-4xl font-bold text-gray-900 mt-1 leading-none">{formatCurrency(weekRevenue)}</p>
            <p className="text-sm text-gray-500 mt-1.5">
              Today: <span className="font-semibold text-gray-800">{formatCurrency(todayRevenue)}</span>
              {todayOrders > 0 && <span className="text-gray-400 ml-1.5">· {todayOrders} {todayOrders === 1 ? 'order' : 'orders'}</span>}
            </p>
          </div>
          <div className="text-indigo-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 text-indigo-500">
          <Sparkline values={last7} />
        </div>
        <div className="flex justify-between mt-1">
          {dayLabels.map((l, i) => (
            <span key={i} className={cn('text-[10px]', i === 6 ? 'text-indigo-600 font-semibold' : 'text-gray-400')}>{l}</span>
          ))}
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Today\'s revenue', value: formatCurrency(todayRevenue), sub: `${todayOrders} orders paid`, color: 'text-gray-900' },
          { label: 'To ship', value: String(toShip), sub: 'paid, awaiting shipment', color: toShip > 0 ? 'text-amber-600' : 'text-gray-900' },
          { label: 'Shipped', value: String(shipped), sub: 'all time', color: 'text-gray-900' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={cn('text-2xl font-bold mt-1', color)}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Top products */}
      {topProducts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Top products</p>
          <div className="space-y-3">
            {topProducts.map(([name, data], i) => (
              <div key={name} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-300 w-4">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                  <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full"
                      style={{ width: `${(data.count / (topProducts[0][1].count || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-gray-700">{formatCurrency(data.revenue)}</p>
                  <p className="text-[10px] text-gray-400">{data.count} sold</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Needs Action Tab ─────────────────────────────────────────────────
function ActionCard({ order, actionLabel, actionColor, onAction }: {
  order: Order;
  actionLabel: string;
  actionColor: string;
  onAction: () => void;
}) {
  const ms = Date.now() - new Date(order.createdAt).getTime();
  const h = Math.floor(ms / 3600000);
  const age = h < 1 ? 'just now' : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-4">
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
        order.source === 'instagram' ? 'bg-pink-100' : 'bg-green-100'
      )}>
        {order.source === 'instagram'
          ? <Camera className="w-4 h-4 text-pink-500" />
          : <MessageCircle className="w-4 h-4 text-green-500" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900">{order.customerName}</p>
          {order.paymentMode === 'cod' && (
            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-semibold">COD</span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {order.product} · {formatCurrency(order.amount)}
          <span className="text-gray-300 mx-1.5">·</span>
          <span className="text-gray-400">{age}</span>
        </p>
      </div>

      <button
        onClick={onAction}
        className={cn('text-xs text-white font-semibold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0', actionColor)}
      >
        {actionLabel}
      </button>
    </div>
  );
}

function NeedsActionTab({ orders, onViewDetail }: {
  orders: Order[];
  onViewDetail: (o: Order) => void;
}) {
  const packShip = orders.filter(o =>
    (o.status === 'payment_received' || o.status === 'processing') && !o.shipment
  );
  const followUp = orders.filter(o => o.status === 'pending_payment');

  if (packShip.length === 0 && followUp.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-3">🎉</p>
        <p className="text-base font-semibold text-gray-900">All caught up!</p>
        <p className="text-sm text-gray-400 mt-1">Nothing needs your attention right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {packShip.length > 0 && (
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-gray-900">Pack & Ship</p>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{packShip.length}</span>
            <p className="text-xs text-gray-400">Paid — needs shipment today</p>
          </div>
          <div className="space-y-2">
            {packShip.map(o => (
              <ActionCard key={o.id} order={o} actionLabel="Ship now →" actionColor="bg-indigo-600 hover:bg-indigo-700" onAction={() => onViewDetail(o)} />
            ))}
          </div>
        </div>
      )}

      {followUp.length > 0 && (
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-gray-900">Follow up</p>
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">{followUp.length}</span>
            <p className="text-xs text-gray-400">Payment link sent, not paid yet</p>
          </div>
          <div className="space-y-2">
            {followUp.map(o => (
              <ActionCard key={o.id} order={o} actionLabel="Remind →" actionColor="bg-orange-500 hover:bg-orange-600" onAction={() => onViewDetail(o)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { orders, simulatePayment, loadOrders } = useOrderStore();
  const [tab, setTab] = useState<'summary' | 'needs-action' | 'orders'>('summary');
  const [filter, setFilter] = useState<string>('all');
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  // Feature 1: Search
  const [search, setSearch] = useState('');

  // Feature 2: Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Feature 3: Auto-refresh
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setLastRefreshed(new Date());
    setRefreshing(false);
  };

  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, []);

  const counts = {
    all: orders.length,
    pending_payment: orders.filter(o => o.status === 'pending_payment').length,
    payment_received: orders.filter(o => o.status === 'payment_received').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const searchLower = search.toLowerCase();
  const displayedOrders = search
    ? filtered.filter(o =>
        o.customerName.toLowerCase().includes(searchLower) ||
        o.id.toLowerCase().includes(searchLower) ||
        o.product.toLowerCase().includes(searchLower)
      )
    : filtered;

  // Bulk helpers
  const toggleSelect = (id: string) => setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const selectAll = () => setSelectedIds(new Set(displayedOrders.map(o => o.id)));
  const clearAll = () => setSelectedIds(new Set());

  const needsActionCount =
    orders.filter(o => (o.status === 'payment_received' || o.status === 'processing') && !o.shipment).length +
    orders.filter(o => o.status === 'pending_payment').length;

  return (
    <>
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
          <span>{refreshing ? 'Refreshing…' : `Updated ${Math.floor((Date.now() - lastRefreshed.getTime()) / 1000)}s ago`}</span>
        </button>
      </div>

      {/* Top-level tabs */}
      <div className="flex items-center border-b border-gray-200 mb-6 gap-1">
        {([
          { id: 'summary' as const, label: 'Summary', icon: TrendingUp },
          { id: 'needs-action' as const, label: 'Needs Action', icon: Inbox, badge: needsActionCount },
          { id: 'orders' as const, label: 'All Orders', icon: Package, badge: orders.length },
        ]).map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {badge !== undefined && badge > 0 && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full font-semibold',
                tab === id
                  ? id === 'needs-action' ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'
                  : id === 'needs-action' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500',
              )}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'summary' && <SummaryTab orders={orders} />}

      {tab === 'needs-action' && (
        <NeedsActionTab orders={orders} onViewDetail={setDetailOrder} />
      )}

      {tab === 'orders' && (
        <>
          <SandboxBanner orders={orders} onSimulate={simulatePayment} />

          {/* Filter tabs */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={displayedOrders.length > 0 && selectedIds.size === displayedOrders.length}
              onChange={() => selectedIds.size === displayedOrders.length ? clearAll() : selectAll()}
              className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 mr-2 cursor-pointer"
            />
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit">
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
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, order ID, or product…"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 bg-white"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="mb-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center gap-3">
              <span className="text-xs font-semibold text-blue-800">{selectedIds.size} selected</span>
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={clearAll} className="text-xs text-gray-500 hover:text-gray-700">Deselect all</button>
                <button onClick={selectAll} className="text-xs text-blue-600 hover:text-blue-800">Select all ({displayedOrders.length})</button>
                <div className="w-px h-3 bg-gray-300" />
                <button
                  onClick={() => { selectedIds.forEach(id => { fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'shipped' }) }).catch(console.warn); }); clearAll(); }}
                  className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                >
                  <Truck className="w-3 h-3" /> Mark shipped
                </button>
                <button
                  onClick={() => {
                    const rows = [['Order ID', 'Customer', 'Product', 'Amount', 'Status', 'Date']];
                    [...selectedIds].forEach(id => { const o = orders.find(x => x.id === id); if (o) rows.push([o.id, o.customerName, o.product, o.amount.toString(), o.status, o.createdAt]); });
                    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'orders-export.csv'; a.click();
                    URL.revokeObjectURL(a.href); clearAll();
                  }}
                  className="text-xs bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Export CSV
                </button>
              </div>
            </div>
          )}

          {/* Order list */}
          <div className="space-y-3">
            {displayedOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No orders found</div>
            ) : (
              displayedOrders.map(order => (
                <OrderRow
                  key={order.id}
                  order={order}
                  onViewDetail={setDetailOrder}
                  selected={selectedIds.has(order.id)}
                  onSelect={toggleSelect}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
    <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />
    </>
  );
}

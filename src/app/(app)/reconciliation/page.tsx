'use client';
import { useState } from 'react';
import { useOrderStore } from '@/store/orders';
import { mockReconciliation } from '@/lib/mock-data';
import { formatCurrency, cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, TrendingUp, CreditCard, Info, Send } from 'lucide-react';

const modeColors: Record<string, string> = {
  upi: 'bg-blue-100 text-blue-600',
  card: 'bg-purple-100 text-purple-600',
  netbanking: 'bg-teal-100 text-teal-600',
  cod: 'bg-gray-100 text-gray-600',
  partial: 'bg-orange-100 text-orange-600',
};

export default function ReconciliationPage() {
  const { orders } = useOrderStore();
  const entries = mockReconciliation;
  const [sending, setSending] = useState<Record<string, 'idle' | 'loading' | 'sent'>>({});

  const exportCSV = () => {
    const rows = [
      ['Order ID', 'Customer', 'Amount', 'Settled', 'Payment Mode', 'Status', 'Flag'],
      ...entries.map(e => [
        e.orderId,
        e.customerName,
        e.amount.toString(),
        (e.razorpaySettlement ?? e.amount).toString(),
        e.paymentMode.toUpperCase(),
        e.matched ? 'Matched' : 'Review needed',
        e.flag ?? '',
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reconciliation-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendReminder = async (orderId: string, customerName: string, customerPhone: string, amount: number) => {
    setSending((s) => ({ ...s, [orderId]: 'loading' }));
    try {
      const res = await fetch('/api/payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          customerName,
          customerPhone,
          description: `Balance due for order ${orderId} — Shop Ekaja`,
        }),
      });
      if (res.ok) {
        const { url } = await res.json();
        window.open(url, '_blank');
      }
    } catch { /* silently fall through */ }
    setSending((s) => ({ ...s, [orderId]: 'sent' }));
  };

  const totalCollected = entries.filter(e => e.matched).reduce((s, e) => s + (e.razorpaySettlement ?? e.amount), 0);
  const unmatched = entries.filter(e => !e.matched);
  const gatewayFees = entries.filter(e => e.matched).reduce((s, e) => s + (e.amount - (e.razorpaySettlement ?? e.amount)), 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Reconciliation</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Today · {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <p className="text-xs text-gray-500">Razorpay settled</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCollected)}</p>
          <p className="text-xs text-gray-400 mt-1">{entries.filter(e => e.matched).length} orders matched</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-gray-500">Unmatched payments</p>
          </div>
          <p className="text-2xl font-bold text-amber-600">{unmatched.length}</p>
          <p className="text-xs text-gray-400 mt-1">
            {formatCurrency(unmatched.reduce((s, e) => s + e.amount, 0))} outside Razorpay
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-purple-500" />
            <p className="text-xs text-gray-500">Gateway fees deducted</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(gatewayFees)}</p>
          <p className="text-xs text-gray-400 mt-1">Razorpay processing charges</p>
        </div>
      </div>

      {/* Unmatched banner */}
      {unmatched.length > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {unmatched.length} payment{unmatched.length > 1 ? 's' : ''} not via Razorpay
            </p>
            <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
              {formatCurrency(unmatched.reduce((s, e) => s + e.amount, 0))} received directly via UPI — this is GMV outside Razorpay's settlement. These need manual matching.
              The workflow engine would capture these automatically if payment links were used.
            </p>
          </div>
        </div>
      )}

      {/* Reconciliation table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Today's Transactions</p>
          <button onClick={exportCSV} className="text-xs text-blue-600 hover:underline">Export CSV</button>
        </div>
        <div className="divide-y divide-gray-100">
          {entries.map((entry) => (
            <div key={entry.orderId} className={cn(
              'flex items-center gap-4 px-5 py-3.5',
              !entry.matched && 'bg-amber-50'
            )}>
              {/* Match icon */}
              <div className="flex-shrink-0">
                {entry.matched
                  ? <CheckCircle className="w-4 h-4 text-green-500" />
                  : <AlertCircle className="w-4 h-4 text-amber-500" />}
              </div>

              {/* Order info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800">{entry.customerName}</p>
                  <span className="text-xs text-gray-400">{entry.orderId}</span>
                </div>
                {entry.flag && (
                  <p className={cn(
                    'text-xs mt-0.5 flex items-center gap-1',
                    entry.matched ? 'text-gray-400' : 'text-amber-600'
                  )}>
                    <Info className="w-3 h-3" />
                    {entry.flag}
                  </p>
                )}
              </div>

              {/* Payment mode */}
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0', modeColors[entry.paymentMode])}>
                {entry.paymentMode.toUpperCase()}
              </span>

              {/* Amount */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(entry.amount)}</p>
                {entry.razorpaySettlement && entry.razorpaySettlement !== entry.amount && (
                  <p className="text-xs text-gray-400">Settled: {formatCurrency(entry.razorpaySettlement)}</p>
                )}
              </div>

              {/* Status */}
              <div className="flex-shrink-0 w-20 text-right">
                {entry.matched
                  ? <span className="text-xs text-green-600 font-medium">Matched</span>
                  : <span className="text-xs text-amber-600 font-medium">Review needed</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Partial payments section */}
      <div className="mt-6 bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-700">Open Balances</p>
          <p className="text-xs text-gray-400 mt-0.5">Partial payments with outstanding balance</p>
        </div>
        <div className="divide-y divide-gray-100">
          {orders.filter(o => o.partial && !o.partial.balancePaid).map(order => (
            <div key={order.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800">{order.customerName}</p>
                  <span className="text-xs text-gray-400">{order.id}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{order.product}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Advance paid</p>
                <p className="text-sm font-medium text-green-600">{formatCurrency(order.partial!.advancePaid)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Balance due</p>
                <p className="text-sm font-semibold text-orange-600">{formatCurrency(order.partial!.balanceDue)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-400">Due by</p>
                <p className="text-xs text-gray-700">
                  {new Date(order.partial!.balanceDueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </p>
              </div>
              <button
                onClick={() => sendReminder(order.id, order.customerName, order.customerWhatsapp, order.partial!.balanceDue)}
                disabled={sending[order.id] === 'loading' || sending[order.id] === 'sent'}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0 flex items-center gap-1.5',
                  sending[order.id] === 'sent'
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : sending[order.id] === 'loading'
                      ? 'bg-orange-300 text-white cursor-wait'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                )}
              >
                <Send className="w-3 h-3" />
                {sending[order.id] === 'sent' ? 'Link sent!' : sending[order.id] === 'loading' ? 'Sending…' : 'Send Reminder'}
              </button>
            </div>
          ))}
          {orders.filter(o => o.partial && !o.partial.balancePaid).length === 0 && (
            <div className="px-5 py-6 text-center text-sm text-gray-400">
              No open balances — all partial payments cleared
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { NextRequest } from 'next/server';

// Import mock orders as fallback
import { mockOrders } from '@/lib/mock-data';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Try DB first, fall back to mock
  let order: { id: string; customerName: string; customerPhone: string; product: string; amount: number; status: string; paymentId?: string | null; paidAt?: Date | string | null; createdAt: Date | string; paymentMode: string; notes?: string | null; awb?: string | null; courier?: string | null } | null = null;
  try {
    const { db } = await import('@/lib/db');
    order = await db.order.findUnique({ where: { id } });
  } catch {}

  if (!order) {
    order = mockOrders.find(o => o.id === id) ?? mockOrders[0];
  }

  const formatDate = (d: string | Date | null | undefined) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  const receiptNumber = `RCP-${id}-${new Date().getFullYear()}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Receipt ${receiptNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fa; display: flex; justify-content: center; padding: 40px 20px; min-height: 100vh; }
  .receipt { background: white; width: 520px; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 32px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 32px; color: white; }
  .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .brand-icon { width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .brand-name { font-size: 18px; font-weight: 700; }
  .brand-tagline { font-size: 12px; opacity: 0.7; }
  .receipt-label { font-size: 12px; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .receipt-number { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
  .body { padding: 28px 32px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 12px; }
  .row { display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
  .row:last-child { border-bottom: none; }
  .row-label { font-size: 13px; color: #6b7280; }
  .row-value { font-size: 13px; font-weight: 500; color: #111827; text-align: right; max-width: 60%; }
  .total-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; margin: 20px 0; }
  .total-label { font-size: 14px; font-weight: 600; color: #0369a1; }
  .total-amount { font-size: 24px; font-weight: 800; color: #0369a1; }
  .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .status-paid { background: #dcfce7; color: #16a34a; }
  .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 32px; text-align: center; }
  .footer p { font-size: 12px; color: #9ca3af; margin-bottom: 4px; }
  .footer strong { color: #6b7280; }
  .divider { height: 1px; background: #f3f4f6; margin: 4px 0; }
  @media print {
    body { background: white; padding: 0; }
    .receipt { box-shadow: none; border-radius: 0; width: 100%; }
    @page { margin: 0; }
  }
</style>
</head>
<body>
<div class="receipt">
  <div class="header">
    <div class="brand">
      <div class="brand-icon">⚡</div>
      <div>
        <div class="brand-name">Shop Ekaja</div>
        <div class="brand-tagline">Handcrafted Indian ethnic wear</div>
      </div>
    </div>
    <div class="receipt-label">Tax Invoice / Receipt</div>
    <div class="receipt-number">${receiptNumber}</div>
  </div>

  <div class="body">
    <div class="section">
      <div class="section-title">Bill To</div>
      <div class="row">
        <span class="row-label">Customer Name</span>
        <span class="row-value">${order.customerName}</span>
      </div>
      <div class="row">
        <span class="row-label">Phone</span>
        <span class="row-value">${order.customerPhone}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Order Details</div>
      <div class="row">
        <span class="row-label">Order ID</span>
        <span class="row-value" style="font-family: monospace">${order.id}</span>
      </div>
      <div class="row">
        <span class="row-label">Product</span>
        <span class="row-value">${order.product}</span>
      </div>
      <div class="row">
        <span class="row-label">Payment Mode</span>
        <span class="row-value" style="text-transform: uppercase">${order.paymentMode}</span>
      </div>
      ${order.paymentId ? `
      <div class="row">
        <span class="row-label">Payment ID</span>
        <span class="row-value" style="font-family: monospace; font-size: 11px">${order.paymentId}</span>
      </div>` : ''}
      <div class="row">
        <span class="row-label">Order Date</span>
        <span class="row-value">${formatDate(order.createdAt)}</span>
      </div>
      <div class="row">
        <span class="row-label">Paid On</span>
        <span class="row-value">${formatDate(order.paidAt)}</span>
      </div>
      <div class="row">
        <span class="row-label">Status</span>
        <span class="row-value"><span class="status-badge status-paid">✓ Paid</span></span>
      </div>
    </div>

    <div class="total-box">
      <span class="total-label">Total Amount Paid</span>
      <span class="total-amount">${formatCurrency(order.amount)}</span>
    </div>

    ${order.notes ? `
    <div class="section">
      <div class="section-title">Notes</div>
      <p style="font-size: 13px; color: #374151; font-style: italic; padding: 8px 0;">${order.notes}</p>
    </div>` : ''}
  </div>

  <div class="footer">
    <p><strong>Shop Ekaja</strong> · GST: 27AABCU9603R1ZX</p>
    <p>Thank you for your order! For queries: support@shopekaja.in</p>
    <p style="margin-top: 8px; font-size: 10px; color: #d1d5db">Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
  </div>
</div>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

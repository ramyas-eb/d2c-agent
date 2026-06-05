import { mockOrders } from '@/lib/mock-data';

export async function GET() {
  let orders = mockOrders;
  try {
    const { db } = await import('@/lib/db');
    const dbOrders = await db.order.findMany({ orderBy: { createdAt: 'desc' } });
    if (dbOrders.length > 0) orders = dbOrders as unknown as typeof mockOrders;
  } catch {}

  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const gmv = todayOrders.filter(o => o.paidAt).reduce((s, o) => s + o.amount, 0);
  const pending = orders.filter(o => o.status === 'pending_payment').length;
  const automated = todayOrders.filter(o => o.whatsappConfirmationSent).length;

  return Response.json({
    date: new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    totalOrders: todayOrders.length,
    gmv,
    pendingPayments: pending,
    automatedConfirmations: automated,
    topProduct: todayOrders[0]?.product ?? 'No orders today',
  });
}

'use client';
import { TrendingUp, ShoppingBag, Users, CreditCard, ArrowRight } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

// ─── Mock data ────────────────────────────────────────────────────────

const DAILY_GMV = [
  { day: 'Mon', gmv: 42800 },
  { day: 'Tue', gmv: 61500 },
  { day: 'Wed', gmv: 38200 },
  { day: 'Thu', gmv: 75400 },
  { day: 'Fri', gmv: 89100 },
  { day: 'Sat', gmv: 112300 },
  { day: 'Sun', gmv: 96700 },
];

const TOP_PRODUCTS = [
  { name: 'Anarkali Suit – Coral Pink', units: 48, revenue: 143952 },
  { name: 'Banarasi Silk Saree – Royal Blue', units: 31, revenue: 185969 },
  { name: 'Lehenga Set – Emerald Green', units: 27, revenue: 215973 },
  { name: 'Cotton Kurti – Printed Floral', units: 62, revenue: 74338 },
  { name: 'Palazzo Set – Mustard Yellow', units: 19, revenue: 56981 },
];

const PAYMENT_METHODS = [
  { label: 'UPI', pct: 68, color: 'bg-blue-500' },
  { label: 'Card', pct: 22, color: 'bg-violet-500' },
  { label: 'COD', pct: 10, color: 'bg-amber-400' },
];

const FUNNEL = [
  { label: 'DMs Received', value: 1_240, sub: '100%' },
  { label: 'Payment Link Sent', value: 634, sub: '51%' },
  { label: 'Paid', value: 286, sub: '23%' },
];

const STATS = [
  {
    label: 'Total GMV',
    value: formatCurrency(516_000),
    change: '+18% vs last week',
    positive: true,
    icon: TrendingUp,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    label: 'Orders',
    value: '286',
    change: '+12% vs last week',
    positive: true,
    icon: ShoppingBag,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    label: 'Conversion Rate',
    value: '23.1%',
    change: 'DM → Paid',
    positive: null,
    icon: Users,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    label: 'Avg Order Value',
    value: formatCurrency(1_804),
    change: '-3% vs last week',
    positive: false,
    icon: CreditCard,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
];

// ─── Components ───────────────────────────────────────────────────────

function StatCard({ label, value, change, positive, icon: Icon, iconBg, iconColor }: typeof STATS[number]) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
        <Icon className={cn('w-5 h-5', iconColor)} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5 tracking-tight">{value}</p>
        <p className={cn('text-xs mt-1', positive === true ? 'text-emerald-600' : positive === false ? 'text-red-500' : 'text-gray-400')}>
          {change}
        </p>
      </div>
    </div>
  );
}

function BarChart() {
  const max = Math.max(...DAILY_GMV.map((d) => d.gmv));
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">GMV by Day</h2>
      <div className="flex items-end gap-3 h-40">
        {DAILY_GMV.map(({ day, gmv }) => {
          const heightPct = Math.round((gmv / max) * 100);
          return (
            <div key={day} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <span className="text-[10px] text-gray-400 font-medium">{formatCurrency(gmv).replace('₹', '₹')}</span>
              <div className="w-full flex items-end" style={{ height: '96px' }}>
                <div
                  className="w-full bg-blue-500 rounded-t-md hover:bg-blue-600 transition-colors"
                  style={{ height: `${heightPct}%` }}
                  title={`${day}: ${formatCurrency(gmv)}`}
                />
              </div>
              <span className="text-xs text-gray-500">{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopProductsTable() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Products</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="pb-2.5 text-xs font-semibold text-gray-400 pr-4">Product</th>
              <th className="pb-2.5 text-xs font-semibold text-gray-400 text-right pr-4">Units Sold</th>
              <th className="pb-2.5 text-xs font-semibold text-gray-400 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {TOP_PRODUCTS.map((p, i) => (
              <tr key={p.name} className="hover:bg-gray-50 transition-colors">
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-500 flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-gray-800 font-medium text-xs truncate max-w-[200px]">{p.name}</span>
                  </div>
                </td>
                <td className="py-2.5 pr-4 text-right text-xs text-gray-600">{p.units}</td>
                <td className="py-2.5 text-right text-xs font-semibold text-gray-900">{formatCurrency(p.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentMethodsBreakdown() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Payment Methods</h2>
      <div className="space-y-3.5">
        {PAYMENT_METHODS.map(({ label, pct, color }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-700">{label}</span>
              <span className="text-xs font-semibold text-gray-900">{pct}%</span>
            </div>
            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', color)}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConversionFunnel() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Conversion Funnel</h2>
      <div className="flex items-center gap-2 flex-wrap">
        {FUNNEL.map(({ label, value, sub }, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={cn(
              'flex-shrink-0 rounded-xl border px-4 py-3 text-center min-w-[110px]',
              i === 0 ? 'border-blue-200 bg-blue-50' : i === 1 ? 'border-violet-200 bg-violet-50' : 'border-emerald-200 bg-emerald-50'
            )}>
              <p className={cn('text-xl font-bold', i === 0 ? 'text-blue-700' : i === 1 ? 'text-violet-700' : 'text-emerald-700')}>
                {value.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] font-medium text-gray-500 mt-0.5">{label}</p>
              <p className={cn('text-[10px] font-semibold mt-0.5', i === 0 ? 'text-blue-500' : i === 1 ? 'text-violet-500' : 'text-emerald-500')}>
                {sub}
              </p>
            </div>
            {i < FUNNEL.length - 1 && (
              <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="pt-8 md:pt-0">
          <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Last 7 days</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* Bar chart */}
        <BarChart />

        {/* Two-column row: top products + payment methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TopProductsTable />
          <PaymentMethodsBreakdown />
        </div>

        {/* Funnel */}
        <ConversionFunnel />
      </div>
    </div>
  );
}

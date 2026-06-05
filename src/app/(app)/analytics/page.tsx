'use client';
import { useState } from 'react';
import { TrendingUp, ShoppingBag, Users, CreditCard, Camera, MessageCircle, ArrowRight, Repeat2, UserPlus, Star } from 'lucide-react';
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

// Per-channel funnel
const FUNNELS = {
  instagram: [
    { label: 'DMs Received', value: 780, pct: '100%', color: 'pink' },
    { label: 'Link Sent', value: 382, pct: '49%', color: 'pink' },
    { label: 'Paid', value: 165, pct: '21%', color: 'pink' },
  ],
  whatsapp: [
    { label: 'DMs Received', value: 460, pct: '100%', color: 'green' },
    { label: 'Link Sent', value: 252, pct: '55%', color: 'green' },
    { label: 'Paid', value: 121, pct: '26%', color: 'green' },
  ],
};

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
    change: 'DM → Paid (all channels)',
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
              <th className="pb-2.5 text-xs font-semibold text-gray-400 text-right pr-4">Units</th>
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
                    <span className="text-gray-800 font-medium text-xs truncate max-w-[180px]">{p.name}</span>
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
              <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── New vs Returning ────────────────────────────────────────────────

function CustomerInsights() {
  const total = 286;
  const returning = 186;
  const newCust = total - returning;
  const repeatRate = Math.round((returning / total) * 100);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Customer Breakdown</h2>
      <div className="grid grid-cols-3 gap-4">
        {/* New */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <UserPlus className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{newCust}</p>
            <p className="text-xs font-medium text-gray-500 mt-0.5">New Customers</p>
            <p className="text-xs text-gray-400">{Math.round((newCust / total) * 100)}% of orders</p>
          </div>
        </div>
        {/* Returning */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Repeat2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{returning}</p>
            <p className="text-xs font-medium text-gray-500 mt-0.5">Returning</p>
            <p className="text-xs text-gray-400">{repeatRate}% repeat rate</p>
          </div>
        </div>
        {/* Avg orders */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">2.8×</p>
            <p className="text-xs font-medium text-gray-500 mt-0.5">Avg orders</p>
            <p className="text-xs text-gray-400">per returning customer</p>
          </div>
        </div>
      </div>

      {/* Bar */}
      <div className="mt-4">
        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
          <div className="h-full bg-blue-500 rounded-l-full transition-all" style={{ width: `${Math.round((newCust / total) * 100)}%` }} />
          <div className="h-full bg-emerald-500 rounded-r-full transition-all flex-1" />
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs text-gray-500">New</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-gray-500">Returning</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Per-channel funnel ───────────────────────────────────────────────

type FunnelChannel = 'instagram' | 'whatsapp';

const channelConfig = {
  instagram: {
    label: 'Instagram',
    icon: Camera,
    iconBg: 'bg-gradient-to-br from-pink-400 to-purple-500',
    stepColors: ['border-pink-200 bg-pink-50', 'border-pink-200 bg-pink-50', 'border-pink-200 bg-pink-50'],
    valueColors: ['text-pink-700', 'text-pink-700', 'text-pink-700'],
    pctColors: ['text-pink-400', 'text-pink-400', 'text-pink-400'],
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: MessageCircle,
    iconBg: 'bg-green-500',
    stepColors: ['border-green-200 bg-green-50', 'border-green-200 bg-green-50', 'border-green-200 bg-green-50'],
    valueColors: ['text-green-700', 'text-green-700', 'text-green-700'],
    pctColors: ['text-green-500', 'text-green-500', 'text-green-500'],
  },
};

function ChannelFunnel({ channel }: { channel: FunnelChannel }) {
  const cfg = channelConfig[channel];
  const steps = FUNNELS[channel];
  const Icon = cfg.icon;

  return (
    <div className="flex-1 min-w-0">
      {/* Channel header */}
      <div className="flex items-center gap-2 mb-4">
        <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0', cfg.iconBg)}>
          <Icon className="w-3 h-3 text-white" />
        </div>
        <span className="text-sm font-semibold text-gray-800">{cfg.label}</span>
        <span className="text-xs text-gray-400 ml-auto">
          {Math.round((steps[2].value / steps[0].value) * 100)}% DM→Paid
        </span>
      </div>

      {/* Funnel steps */}
      <div className="flex items-center gap-2">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-2 flex-1 min-w-0">
            <div className={cn(
              'flex-1 rounded-xl border px-3 py-3 text-center min-w-0',
              cfg.stepColors[i]
            )}>
              <p className={cn('text-lg font-bold leading-tight', cfg.valueColors[i])}>
                {step.value.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] font-medium text-gray-500 mt-0.5 leading-tight">{step.label}</p>
              <p className={cn('text-[10px] font-bold mt-0.5', cfg.pctColors[i])}>{step.pct}</p>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Drop-off bar */}
      <div className="mt-3">
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full', channel === 'instagram' ? 'bg-pink-400' : 'bg-green-400')}
            style={{ width: `${Math.round((steps[2].value / steps[0].value) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ConversionFunnelSection() {
  const [activeChannel, setActiveChannel] = useState<FunnelChannel | 'both'>('both');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Conversion Funnel by Channel</h2>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['both', 'instagram', 'whatsapp'] as const).map((ch) => (
            <button
              key={ch}
              onClick={() => setActiveChannel(ch)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize',
                activeChannel === ch ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {ch === 'both' ? 'Both' : ch === 'instagram' ? '📸 IG' : '💬 WA'}
            </button>
          ))}
        </div>
      </div>

      <div className={cn('flex gap-6', activeChannel !== 'both' && 'max-w-sm')}>
        {(activeChannel === 'both' || activeChannel === 'instagram') && (
          <ChannelFunnel channel="instagram" />
        )}
        {activeChannel === 'both' && (
          <div className="w-px bg-gray-100 flex-shrink-0" />
        )}
        {(activeChannel === 'both' || activeChannel === 'whatsapp') && (
          <ChannelFunnel channel="whatsapp" />
        )}
      </div>

      {/* Combined insight */}
      {activeChannel === 'both' && (
        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-6 text-xs text-gray-500">
          <span>Combined: <strong className="text-gray-800">1,240 DMs</strong> → <strong className="text-gray-800">286 paid</strong></span>
          <span className="text-gray-300">·</span>
          <span>WhatsApp converts <strong className="text-emerald-600">5% better</strong> than Instagram</span>
          <span className="text-gray-300">·</span>
          <span>Instagram drives <strong className="text-pink-600">58% of volume</strong></span>
        </div>
      )}
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

        {/* Customer insights */}
        <CustomerInsights />

        {/* Two-column row: top products + payment methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TopProductsTable />
          <PaymentMethodsBreakdown />
        </div>

        {/* Per-channel funnel */}
        <ConversionFunnelSection />
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  Zap,
  Truck,
  MessageCircle,
  Bot,
  Database,
  Mail,
  CheckCircle,
  XCircle,
  Save,
  Send,
  RefreshCw,
} from 'lucide-react';
import { useSettingsStore } from '@/store/settings';

// ─── Field component ───────────────────────────────────────────────────
const Field = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-blue-300"
    />
  </div>
);

// ─── Integration status types ──────────────────────────────────────────
interface IntegrationStatus {
  razorpay: boolean;
  razorpayMode: 'live' | 'test';
  shiprocket: boolean;
  whatsapp: boolean;
  anthropic: boolean;
  turso: boolean;
}

interface SummaryData {
  date: string;
  totalOrders: number;
  gmv: number;
  pendingPayments: number;
  automatedConfirmations: number;
  topProduct: string;
}

// ─── Integration card ──────────────────────────────────────────────────
function IntegrationCard({
  icon: Icon,
  name,
  connected,
  description,
  badge,
}: {
  icon: React.ElementType;
  name: string;
  connected: boolean;
  description: string;
  badge?: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-xl">
      <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800">{name}</span>
          {badge && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                badge === 'LIVE'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5 leading-snug">{description}</p>
      </div>
      <div className="flex-shrink-0 mt-0.5">
        {connected ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <XCircle className="w-4 h-4 text-red-400" />
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const store = useSettingsStore();
  const [saved, setSaved] = useState(false);
  const [integrations, setIntegrations] = useState<IntegrationStatus | null>(null);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Fetch integration status on mount
  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((data: IntegrationStatus) => setIntegrations(data))
      .catch(() => setIntegrations(null))
      .finally(() => setLoadingIntegrations(false));
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSendTestSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch('/api/summary');
      const data: SummaryData = await res.json();
      setSummary(data);
    } catch {
      // silently fail
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-5 h-5 text-gray-700" />
            <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
          </div>
          <p className="text-sm text-gray-500">Manage your shop details and integrations</p>
        </div>

        {/* Section 1 — Shop Details */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-4 h-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-800">Shop Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Shop Name"
              value={store.shopName}
              onChange={(v) => store.update({ shopName: v })}
            />
            <Field
              label="Tagline"
              value={store.tagline}
              onChange={(v) => store.update({ tagline: v })}
            />
            <Field
              label="Owner Name"
              value={store.ownerName}
              onChange={(v) => store.update({ ownerName: v })}
            />
            <Field
              label="Email"
              value={store.email}
              onChange={(v) => store.update({ email: v })}
            />
            <Field
              label="Phone"
              value={store.phone}
              onChange={(v) => store.update({ phone: v })}
            />
            <Field
              label="Address"
              value={store.address}
              onChange={(v) => store.update({ address: v })}
            />
            <div className="md:col-span-2">
              <Field
                label="GST Number"
                value={store.gstNumber}
                onChange={(v) => store.update({ gstNumber: v })}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              {saved ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section 2 — Integrations */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-800">Integrations</h2>
          </div>

          {loadingIntegrations ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Checking integrations…
            </div>
          ) : integrations ? (
            <div className="grid grid-cols-1 gap-3">
              <IntegrationCard
                icon={Zap}
                name="Razorpay"
                connected={integrations.razorpay}
                description={
                  integrations.razorpay
                    ? 'Credentials configured'
                    : 'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET'
                }
                badge={integrations.razorpay ? integrations.razorpayMode.toUpperCase() : undefined}
              />
              <IntegrationCard
                icon={Truck}
                name="Shiprocket"
                connected={integrations.shiprocket}
                description={
                  integrations.shiprocket
                    ? 'Credentials configured'
                    : 'Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD'
                }
              />
              <IntegrationCard
                icon={MessageCircle}
                name="WhatsApp"
                connected={integrations.whatsapp}
                description={
                  integrations.whatsapp
                    ? 'Token configured — Meta approval needed'
                    : 'Set WHATSAPP_API_TOKEN and WHATSAPP_PHONE_ID'
                }
              />
              <IntegrationCard
                icon={Bot}
                name="Claude AI"
                connected={integrations.anthropic}
                description={
                  integrations.anthropic
                    ? 'API key set — add credits to activate'
                    : 'Set ANTHROPIC_API_KEY'
                }
              />
              <IntegrationCard
                icon={Database}
                name="Database"
                connected={integrations.turso}
                description={
                  integrations.turso ? 'Turso connected' : 'Using local SQLite'
                }
              />
            </div>
          ) : (
            <p className="text-sm text-red-500">Failed to load integration status.</p>
          )}
        </div>

        {/* Section 3 — Daily Summary */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-4 h-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-800">Daily Summary</h2>
          </div>

          <div className="space-y-4">
            {/* Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Send daily summary email</p>
                <p className="text-xs text-gray-400 mt-0.5">Receive a daily digest of orders and revenue</p>
              </div>
              <button
                onClick={() => store.update({ summaryEnabled: !store.summaryEnabled })}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  store.summaryEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                aria-label="Toggle daily summary"
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    store.summaryEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Email input */}
            <Field
              label="Summary email address"
              value={store.summaryEmail}
              onChange={(v) => store.update({ summaryEmail: v })}
            />

            {/* Send test button */}
            <button
              onClick={handleSendTestSummary}
              disabled={loadingSummary}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {loadingSummary ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send Test Summary
            </button>

            {/* Summary preview */}
            {summary && (
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Today's Summary — {summary.date}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-400">Orders today</p>
                    <p className="text-xl font-bold text-gray-900">{summary.totalOrders}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-400">GMV collected</p>
                    <p className="text-xl font-bold text-green-600">
                      ₹{summary.gmv.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-400">Pending payments</p>
                    <p className="text-xl font-bold text-amber-600">{summary.pendingPayments}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-400">Auto-confirmed</p>
                    <p className="text-xl font-bold text-blue-600">{summary.automatedConfirmations}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">Top product: {summary.topProduct}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'merchant' | 'admin';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('merchant');

  // Merchant fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Admin field
  const [adminPassword, setAdminPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMerchantLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/merchant-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword }),
      });
      if (res.ok) {
        router.push('/dashboard');
      } else {
        setError('Incorrect password');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 mb-3">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your D2C Agent</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {([
              { id: 'merchant' as Tab, label: 'My Shop' },
              { id: 'admin' as Tab, label: 'Admin' },
            ]).map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setError(''); }}
                className={cn(
                  'flex-1 py-3 text-sm font-semibold transition-colors',
                  tab === t.id
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                    : 'text-gray-400 hover:text-gray-600',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Merchant login */}
            {tab === 'merchant' && (
              <form onSubmit={handleMerchantLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      required
                      autoFocus
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Your password"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      required
                      className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>

                <p className="text-center text-xs text-gray-400">
                  Don&apos;t have a shop?{' '}
                  <a href="/signup" className="text-indigo-600 font-medium hover:underline">Create one free →</a>
                </p>
              </form>
            )}

            {/* Admin login */}
            {tab === 'admin' && (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  Admin access for the Shop Ekaja demo account.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Access password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      placeholder="Password"
                      value={adminPassword}
                      onChange={e => { setAdminPassword(e.target.value); setError(''); }}
                      required
                      autoFocus
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-900 hover:bg-gray-700 disabled:bg-gray-400 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  {loading ? 'Signing in…' : 'Sign in as admin'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Store, Link2, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    shopName: '',
    slug: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [slugEdited, setSlugEdited] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-generate slug from shop name
  useEffect(() => {
    if (!slugEdited && form.shopName) {
      setForm(f => ({ ...f, slug: slugify(f.shopName) }));
    }
  }, [form.shopName, slugEdited]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (field === 'slug') setSlugEdited(true);
    setForm(f => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: form.shopName,
          slug: form.slug,
          email: form.email,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Signup failed');
        return;
      }
      // Redirect to onboarding with slug
      router.push(`/onboarding?slug=${data.slug}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const catalogPreview = form.slug ? `yourdomain.com/catalog/${form.slug || '…'}` : 'yourdomain.com/catalog/your-shop';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 mb-3">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your shop</h1>
          <p className="text-sm text-gray-500 mt-1">Start selling on WhatsApp & Instagram in minutes</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Shop name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Shop name</label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. Meera's Boutique"
                  value={form.shopName}
                  onChange={set('shopName')}
                  required
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Shop URL
                <span className="ml-1 font-normal text-gray-400">(customers will see this)</span>
              </label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="meeras-boutique"
                  value={form.slug}
                  onChange={set('slug')}
                  required
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-mono"
                />
              </div>
              {form.slug && (
                <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  {catalogPreview}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={set('email')}
                  required
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={set('password')}
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

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Same password again"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  required
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              {loading ? 'Creating shop…' : (
                <>
                  Create your shop
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            Already have an account?{' '}
            <a href="/login" className="text-indigo-600 font-medium hover:underline">Sign in</a>
          </p>
        </div>

        {/* Social proof */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Free forever for your first shop · No credit card required
        </p>
      </div>
    </div>
  );
}

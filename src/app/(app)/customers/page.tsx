'use client';
import { useState, useEffect, useMemo } from 'react';
import { useOrderStore } from '@/store/orders';
import { Order, DmConversation } from '@/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import {
  Search, User, Camera, MessageCircle, ChevronDown, ChevronUp, ShoppingBag,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerProfile {
  key: string;
  name: string;
  phone: string;
  source: 'instagram' | 'whatsapp' | 'mixed';
  orders: Order[];
  totalSpent: number;
  lastOrderDate: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function buildCustomerProfiles(
  orders: Order[],
  conversations: DmConversation[],
): CustomerProfile[] {
  const map = new Map<string, CustomerProfile>();

  for (const order of orders) {
    const key = order.customerPhone;
    if (!map.has(key)) {
      map.set(key, {
        key,
        name: order.customerName,
        phone: order.customerPhone,
        source: order.source,
        orders: [],
        totalSpent: 0,
        lastOrderDate: order.createdAt,
      });
    }
    const profile = map.get(key)!;
    profile.orders.push(order);
    if (order.paidAt) profile.totalSpent += order.amount;
    if (order.createdAt > profile.lastOrderDate) {
      profile.lastOrderDate = order.createdAt;
    }
    // Mix source if different
    if (profile.source !== order.source && profile.source !== 'mixed') {
      profile.source = 'mixed';
    }
  }

  // Merge conversation-only customers (no orders yet)
  for (const conv of conversations) {
    const key = conv.customerHandle;
    if (!map.has(key)) {
      map.set(key, {
        key,
        name: conv.customerName,
        phone: conv.customerHandle,
        source: conv.source,
        orders: [],
        totalSpent: 0,
        lastOrderDate:
          conv.messages.length > 0
            ? conv.messages[conv.messages.length - 1].timestamp
            : new Date().toISOString(),
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime(),
  );
}

// ─── Order status badge ───────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  pending_payment: 'bg-amber-100 text-amber-700',
  payment_received: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-green-100 text-green-700',
  delivered: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
};
const statusLabels: Record<string, string> = {
  pending_payment: 'Awaiting Payment',
  payment_received: 'Payment Received',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

// ─── SourceIcon ───────────────────────────────────────────────────────────────

function SourceIcon({ source, size = 'sm' }: { source: CustomerProfile['source']; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  if (source === 'instagram') return <Camera className={cn(cls, 'text-pink-500')} />;
  if (source === 'whatsapp') return <MessageCircle className={cn(cls, 'text-green-500')} />;
  return (
    <div className="flex gap-0.5">
      <Camera className={cn(cls, 'text-pink-500')} />
      <MessageCircle className={cn(cls, 'text-green-500')} />
    </div>
  );
}

function sourceBg(source: CustomerProfile['source']): string {
  if (source === 'instagram') return 'bg-pink-100';
  if (source === 'whatsapp') return 'bg-green-100';
  return 'bg-purple-100';
}

// ─── Customer Row ─────────────────────────────────────────────────────────────

function CustomerRow({ customer }: { customer: CustomerProfile }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      {/* Summary row */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Avatar */}
        <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-white',
          customer.source === 'instagram' ? 'bg-pink-500' :
          customer.source === 'whatsapp' ? 'bg-green-600' : 'bg-blue-600',
        )}>
          {getInitials(customer.name)}
        </div>

        {/* Name + phone */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{customer.name}</span>
            <div className={cn('w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0', sourceBg(customer.source))}>
              <SourceIcon source={customer.source} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{customer.phone}</p>
        </div>

        {/* Orders count */}
        <div className="text-center flex-shrink-0 w-20">
          <div className="flex items-center justify-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-sm font-semibold text-gray-800">{customer.orders.length}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">order{customer.orders.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Total spent */}
        <div className="text-right flex-shrink-0 w-28">
          <p className="text-sm font-semibold text-gray-900">{formatCurrency(customer.totalSpent)}</p>
          <p className="text-xs text-gray-400 mt-0.5">lifetime</p>
        </div>

        {/* Last order date */}
        <div className="text-right flex-shrink-0 w-28">
          <p className="text-sm text-gray-700">{formatDate(customer.lastOrderDate)}</p>
          <p className="text-xs text-gray-400 mt-0.5">last order</p>
        </div>

        {/* Chevron */}
        {expanded
          ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </div>

      {/* Expanded order history */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Order History</p>

          {customer.orders.length === 0 ? (
            <div className="flex items-center gap-2 py-4 text-gray-400">
              <ShoppingBag className="w-4 h-4" />
              <span className="text-sm">No orders yet — conversation only</span>
            </div>
          ) : (
            <div className="space-y-2">
              {customer.orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg px-4 py-3"
                >
                  {/* Source */}
                  <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                    order.source === 'instagram' ? 'bg-pink-100' : 'bg-green-100'
                  )}>
                    {order.source === 'instagram'
                      ? <Camera className="w-3.5 h-3.5 text-pink-500" />
                      : <MessageCircle className="w-3.5 h-3.5 text-green-500" />}
                  </div>

                  {/* Product + order id */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 font-medium truncate">{order.product}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{order.id} · {formatDate(order.createdAt)}</p>
                  </div>

                  {/* Amount */}
                  <p className="text-sm font-semibold text-gray-900 flex-shrink-0">{formatCurrency(order.amount)}</p>

                  {/* Status */}
                  <span className={cn(
                    'text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0',
                    statusColors[order.status] ?? 'bg-gray-100 text-gray-600',
                  )}>
                    {statusLabels[order.status] ?? order.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const { orders, conversations, loadOrders, loadConversations } = useOrderStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadOrders();
    loadConversations();
  }, []);

  const customers = useMemo(
    () => buildCustomerProfiles(orders, conversations),
    [orders, conversations],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q),
    );
  }, [customers, search]);

  const totalRevenue = useMemo(
    () => customers.reduce((s, c) => s + c.totalSpent, 0),
    [customers],
  );
  const repeatCount = useMemo(
    () => customers.filter((c) => c.orders.length > 1).length,
    [customers],
  );

  return (
    <div className="p-6 max-w-5xl mx-auto overflow-y-auto h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500 mt-0.5">All buyers and leads across Instagram & WhatsApp</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Customers</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{customers.length}</p>
          <p className="text-xs text-gray-400 mt-1">unique buyers & leads</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Lifetime Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-green-600 mt-1">paid orders only</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Repeat Customers</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{repeatCount}</p>
          <p className="text-xs text-gray-400 mt-1">2+ orders placed</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all placeholder:text-gray-400"
        />
      </div>

      {/* Table header */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-4 px-5 py-2 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <div className="w-9 flex-shrink-0" />
          <div className="flex-1">Customer</div>
          <div className="w-20 text-center">Orders</div>
          <div className="w-28 text-right">Total Spent</div>
          <div className="w-28 text-right">Last Order</div>
          <div className="w-4 flex-shrink-0" />
        </div>
      )}

      {/* Customer list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium">
              {search ? 'No customers match your search' : 'No customers yet'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-blue-600 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          filtered.map((customer) => (
            <CustomerRow key={customer.key} customer={customer} />
          ))
        )}
      </div>
    </div>
  );
}

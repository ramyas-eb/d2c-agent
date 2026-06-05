'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Zap, MessageSquare, MessageCircle, BarChart3, Settings, Rocket, Pencil, Plus, Circle, Trash2, Pause, Play, ChevronDown, Menu, X, TrendingUp, Users, Package, Bell, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkflowStore, type SavedFlow } from '@/store/workflows';
import { useNotificationStore, type AppNotification } from '@/store/notifications';

// ─── Relative time helper ──────────────────────────────────────────────
function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return 'Yesterday';
}

// ─── Notification bell + panel ────────────────────────────────────────
const NOTIF_DOT: Record<string, string> = {
  payment: 'bg-green-400',
  shipment: 'bg-blue-400',
  message: 'bg-purple-400',
  alert: 'bg-red-400',
  balance: 'bg-orange-400',
};

function NotifBell() {
  const { notifications, markRead, markAllRead } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
      >
        <Bell className="w-4 h-4" />
        Notifications
        {unread > 0 && (
          <span className="ml-auto bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-80 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">Notifications</span>
              {unread > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">{unread}</span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">All caught up! 🎉</div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={cn(
                    'w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors',
                    !n.read && 'bg-blue-50/60'
                  )}
                >
                  <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', NOTIF_DOT[n.type])} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 leading-tight">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-snug">{n.body}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{relTime(n.time)}</p>
                  </div>
                  {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Context menu ─────────────────────────────────────────────────────
interface CtxPos { x: number; y: number; flowId: string }

function ContextMenu({ pos, onClose }: { pos: CtxPos; onClose: () => void }) {
  const { flows, setActiveId, renameFlow, setFlowStatus, deleteFlow } = useWorkflowStore();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const flow = flows.find((f) => f.id === pos.flowId);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', esc); };
  }, [onClose]);

  if (!flow) return null;

  const item = (icon: React.ReactNode, label: string, onClick: () => void, danger = false) => (
    <button
      onClick={() => { onClick(); onClose(); }}
      className={cn('w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors text-left', danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700')}
    >
      {icon} {label}
    </button>
  );

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 100 }}
      className="bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px] overflow-hidden"
    >
      {item(<Pencil className="w-3 h-3" />, 'Edit', () => { setActiveId(flow.id); router.push('/setup'); })}
      {item(<Pencil className="w-3 h-3" />, 'Rename', () => {
        const name = window.prompt('Rename workflow', flow.name);
        if (name?.trim()) renameFlow(flow.id, name.trim());
      })}
      <div className="my-1 border-t border-gray-100" />
      {flow.status === 'live'
        ? item(<Pause className="w-3 h-3" />, 'Pause', () => setFlowStatus(flow.id, 'paused'))
        : item(<Play className="w-3 h-3" />, flow.status === 'draft' ? 'Launch' : 'Resume', () => setFlowStatus(flow.id, 'live'))}
      <div className="my-1 border-t border-gray-100" />
      {item(<Trash2 className="w-3 h-3" />, 'Delete', () => deleteFlow(flow.id), true)}
    </div>
  );
}

// ─── Flow nav item ────────────────────────────────────────────────────
function FlowNavItem({ flow, onCtx }: { flow: SavedFlow; onCtx: (e: React.MouseEvent, id: string) => void }) {
  const { activeId, setActiveId, renameFlow } = useWorkflowStore();
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(flow.name);
  const isActive = activeId === flow.id;

  const activate = () => { setActiveId(flow.id); router.push('/setup'); };
  const commit = () => { const t = draft.trim(); if (t) renameFlow(flow.id, t); else setDraft(flow.name); setRenaming(false); };

  return (
    <div
      className={cn('group flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors cursor-pointer', isActive ? 'bg-blue-50' : 'hover:bg-gray-100')}
      onContextMenu={(e) => { e.preventDefault(); onCtx(e, flow.id); }}
    >
      {renaming ? (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(flow.name); setRenaming(false); } }}
          autoFocus
          onClick={(e) => e.stopPropagation()}
          className="flex-1 text-xs text-gray-800 bg-white border border-blue-300 rounded px-1.5 py-0.5 outline-none min-w-0"
        />
      ) : (
        <button onClick={activate} className="flex-1 text-left min-w-0">
          <span className={cn('text-xs block truncate', isActive ? 'text-blue-700 font-medium' : 'text-gray-600')}>
            {flow.name}
          </span>
        </button>
      )}
      {!renaming && (
        <button
          onClick={(e) => { e.stopPropagation(); setDraft(flow.name); setRenaming(true); }}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-opacity"
          title="Rename"
        >
          <Pencil className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}

// ─── Workflow sub-nav ─────────────────────────────────────────────────
function WorkflowSubNav({ onCtx }: { onCtx: (e: React.MouseEvent, id: string) => void }) {
  const { flows, addFlow, setActiveId } = useWorkflowStore();
  const router = useRouter();

  const live   = flows.filter((f) => f.status === 'live');
  const drafts = flows.filter((f) => f.status === 'draft');
  const paused = flows.filter((f) => f.status === 'paused');

  const handleNew = () => { addFlow('New workflow', '', []); router.push('/setup'); };

  const Section = ({ label, items, dot }: { label: string; items: SavedFlow[]; dot: string }) =>
    items.length === 0 ? null : (
      <div>
        <div className="flex items-center gap-1.5 px-2 pt-2 pb-0.5">
          <Circle className={cn('w-1.5 h-1.5 flex-shrink-0', dot)} fill="currentColor" />
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
          <span className="text-[10px] text-gray-300 ml-auto">{items.length}</span>
        </div>
        {items.map((f) => <FlowNavItem key={f.id} flow={f} onCtx={onCtx} />)}
      </div>
    );

  return (
    <div className="ml-4 border-l border-gray-100 pl-1.5 mt-0.5 pb-1">
      <Section label="Live"   items={live}   dot="text-green-500" />
      <Section label="Draft"  items={drafts} dot="text-amber-400" />
      <Section label="Paused" items={paused} dot="text-gray-400"  />
      <button onClick={handleNew} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-2 py-1.5 mt-1 w-full rounded-md transition-colors">
        <Plus className="w-3 h-3" /> New workflow
      </button>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSetup = pathname === '/setup' || pathname.startsWith('/setup/');
  const [collapsed, setCollapsed] = useState(false);
  const [ctxPos, setCtxPos] = useState<CtxPos | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const openCtx = (e: React.MouseEvent, flowId: string) => {
    e.preventDefault();
    setCtxPos({ x: e.clientX, y: e.clientY, flowId });
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const showSubNav = isSetup && !collapsed;

  const NavLink = ({ href, icon: Icon, label, accent }: { href: string; icon: React.ElementType; label: string; accent?: boolean }) => {
    const active = pathname === href || pathname.startsWith(href + '/');
    return (
      <Link href={href} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors', active ? 'bg-blue-50 text-blue-700' : accent ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')}>
        <Icon className="w-4 h-4" />
        {label}
      </Link>
    );
  };

  const sidebarContent = (
    <>
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Shop Ekaja</p>
            <p className="text-xs text-gray-400">D2C Agent</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        <NavLink href="/dashboard"      icon={LayoutDashboard} label="Orders" />
        <NavLink href="/agent"          icon={MessageSquare}   label="DM Agent" />
        <NavLink href="/agent-settings" icon={Bot}             label="Agent Config" />
        <NavLink href="/templates"      icon={MessageCircle}   label="WA Templates" />
        <NavLink href="/customers"      icon={Users}           label="Customers" />
        <NavLink href="/products"       icon={Package}         label="Products" />
        <NavLink href="/analytics"      icon={TrendingUp}      label="Analytics" />

        {/* Workflows — double-click to collapse */}
        <div
          onDoubleClick={() => setCollapsed((v) => !v)}
          title="Double-click to collapse"
        >
          <Link
            href="/setup"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isSetup ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <Zap className="w-4 h-4" />
            Workflows
            {isSetup && (
              <ChevronDown className={cn('w-3 h-3 ml-auto transition-transform duration-200', collapsed && '-rotate-90')} />
            )}
          </Link>
        </div>
        {showSubNav && <WorkflowSubNav onCtx={openCtx} />}

        <NavLink href="/reconciliation" icon={BarChart3} label="Reconciliation" />
        <NavLink href="/onboarding"     icon={Rocket}    label="Setup wizard" accent />
      </nav>

      <div className="px-3 pb-1">
        <NotifBell />
      </div>

      <div className="px-3 py-3 border-t border-gray-100 space-y-0.5">
        <NavLink href="/settings" icon={Settings} label="Settings" />
        <div className="flex items-center gap-2 px-3 py-1 text-xs text-gray-300">
          <span>Razorpay No-Code · Beta</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 p-2 rounded-lg bg-white border border-gray-200 shadow-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — desktop: always visible; mobile: overlay */}
      <aside
        className={cn(
          'w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0',
          // Desktop
          'md:relative md:translate-x-0 md:z-auto',
          // Mobile
          'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-hidden">{children}</main>

      {/* Context menu */}
      {ctxPos && <ContextMenu pos={ctxPos} onClose={() => setCtxPos(null)} />}
    </div>
  );
}

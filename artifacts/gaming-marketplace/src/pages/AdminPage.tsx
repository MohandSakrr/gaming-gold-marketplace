import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard, Users, Store, Package, Gamepad2, ShoppingCart, Scale,
  CreditCard, Wallet, Percent, ShieldAlert, Star, MessageSquare, LifeBuoy,
  Megaphone, FileText, Bell, UserCog, ScrollText, BarChart3, Settings,
  Search, Loader2, Ban, Check, ShieldCheck, LogOut, X, Menu, ChevronDown, Crown,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:3000";

type ModuleKey =
  | "dashboard" | "users" | "sellers" | "listings" | "catalog" | "orders"
  | "disputes" | "payments" | "wallet" | "fees" | "fraud" | "reviews"
  | "chat" | "support" | "promos" | "cms" | "notifications" | "staff"
  | "audit" | "reports" | "settings";

// Staff roles, from most to least powerful
type Role = "super_admin" | "admin" | "moderator" | "support" | "finance";
const ALL: Role[] = ["super_admin", "admin", "moderator", "support", "finance"];

const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  moderator: "Moderator",
  support: "Support",
  finance: "Finance",
};

type Mod = { key: ModuleKey; label: string; icon: typeof Users; live?: boolean; roles: Role[] };
type Group = { title: string; icon: typeof Users; items: Mod[] };

// Modules organized into collapsible categories, each tagged with the roles
// allowed to see it. super_admin implicitly sees everything.
const GROUPS: Group[] = [
  {
    title: "Overview", icon: LayoutDashboard, items: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, live: true, roles: ALL },
    ],
  },
  {
    title: "Commerce", icon: ShoppingCart, items: [
      { key: "orders", label: "Orders", icon: ShoppingCart, live: true, roles: ["super_admin", "admin", "support"] },
      { key: "listings", label: "Listings / Offers", icon: Package, live: true, roles: ["super_admin", "admin", "moderator"] },
      { key: "catalog", label: "Games & Catalog", icon: Gamepad2, roles: ["super_admin", "admin"] },
      { key: "disputes", label: "Disputes", icon: Scale, roles: ["super_admin", "admin", "support"] },
    ],
  },
  {
    title: "People", icon: Users, items: [
      { key: "users", label: "Users", icon: Users, live: true, roles: ["super_admin", "admin", "support"] },
      { key: "sellers", label: "Sellers & KYC", icon: Store, roles: ["super_admin", "admin"] },
      { key: "staff", label: "Staff & Roles", icon: UserCog, roles: ["super_admin"] },
    ],
  },
  {
    title: "Finance", icon: Wallet, items: [
      { key: "payments", label: "Payments", icon: CreditCard, roles: ["super_admin", "admin", "finance"] },
      { key: "wallet", label: "Wallet & Payouts", icon: Wallet, roles: ["super_admin", "admin", "finance"] },
      { key: "fees", label: "Fees & Commission", icon: Percent, roles: ["super_admin", "admin", "finance"] },
    ],
  },
  {
    title: "Trust & Safety", icon: ShieldAlert, items: [
      { key: "fraud", label: "Fraud & Risk", icon: ShieldAlert, roles: ["super_admin", "admin"] },
      { key: "reviews", label: "Reviews", icon: Star, roles: ["super_admin", "admin", "moderator"] },
      { key: "chat", label: "Chat Moderation", icon: MessageSquare, roles: ["super_admin", "admin", "moderator", "support"] },
      { key: "support", label: "Support Tickets", icon: LifeBuoy, roles: ["super_admin", "admin", "support"] },
    ],
  },
  {
    title: "Growth", icon: Megaphone, items: [
      { key: "promos", label: "Promotions", icon: Megaphone, roles: ["super_admin", "admin"] },
      { key: "cms", label: "Content (CMS)", icon: FileText, roles: ["super_admin", "admin"] },
      { key: "notifications", label: "Notifications", icon: Bell, roles: ["super_admin", "admin"] },
    ],
  },
  {
    title: "System", icon: Settings, items: [
      { key: "reports", label: "Reports & Exports", icon: BarChart3, roles: ["super_admin", "admin", "finance"] },
      { key: "audit", label: "Audit & Security", icon: ScrollText, roles: ["super_admin"] },
      { key: "settings", label: "System Settings", icon: Settings, roles: ["super_admin"] },
    ],
  },
];

const STAFF_ROLES: Role[] = ["super_admin", "admin", "moderator", "support", "finance"];

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Stats = { users: number; sellers: number; banned: number; listings: number; activeListings: number; orders: number; openOrders: number; disputes: number; revenueCents: number };
type AdminUser = { id: string; email: string; username: string; role: string; verified: boolean; banned: boolean; balanceCents: number; salesCount: number; createdAt: string; lastLoginAt: string | null };

export default function AdminPage() {
  const { user, token, logout } = useAuth();
  const [, navigate] = useLocation();
  const [active, setActive] = useState<ModuleKey>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const role = (user?.role ?? "") as Role;
  const isStaff = STAFF_ROLES.includes(role);
  const isSuper = role === "super_admin";

  // Access guard — only staff may view this page
  useEffect(() => {
    if (user === null) navigate("/login");
    else if (user && !STAFF_ROLES.includes(user.role as Role)) navigate("/");
  }, [user, navigate]);

  const api = useCallback(async (path: string, init?: RequestInit) => {
    const res = await fetch(`${API_URL}/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  }, [token]);

  if (!user || !isStaff) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a12", color: "#fff" }}><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  // Only groups/items this role can access
  const visibleGroups = GROUPS
    .map(g => ({ ...g, items: g.items.filter(m => isSuper || m.roles.includes(role)) }))
    .filter(g => g.items.length > 0);

  const allItems = visibleGroups.flatMap(g => g.items);
  const activeModule = allItems.find(m => m.key === active) ?? allItems[0];

  return (
    <div className="min-h-screen flex" style={{ background: "#0a0a12", color: "#fff" }}>
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ background: "#0e0e1a", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between px-5 h-16 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8">
              <svg viewBox="0 0 100 100" className="w-full h-full" style={{ fill: "#D5AD68" }}>
                <polygon points="50 5 95 27.5 95 72.5 50 95 5 72.5 5 27.5" />
                <polygon points="50 20 80 37 80 63 50 80 20 63 20 37" style={{ fill: "#0e0e1a" }} />
                <polygon points="50 35 65 45 65 55 50 65 35 55 35 45" style={{ fill: "#D5AD68" }} />
              </svg>
            </div>
            <span className="font-heading font-bold text-lg">Ra<span style={{ color: "#D5AD68" }}>Admin</span></span>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
        </div>

        {/* Role badge */}
        <div className="px-5 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: isSuper ? "rgba(213,173,104,0.14)" : "rgba(255,255,255,0.04)", border: isSuper ? "1px solid rgba(213,173,104,0.4)" : "1px solid rgba(255,255,255,0.08)" }}>
            {isSuper ? <Crown className="w-4 h-4 shrink-0" style={{ color: "#D5AD68" }} /> : <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: "rgba(255,255,255,0.6)" }} />}
            <div className="min-w-0">
              <p className="text-[12px] font-bold truncate" style={{ color: isSuper ? "#D5AD68" : "#fff" }}>{ROLE_LABELS[role] ?? role}</p>
              <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{user.username ?? user.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: "thin" }}>
          {visibleGroups.map(g => {
            const isCollapsed = collapsed[g.title];
            return (
              <div key={g.title} className="mb-0.5">
                <button onClick={() => setCollapsed(c => ({ ...c, [g.title]: !c[g.title] }))}
                  className="w-full flex items-center gap-2 px-5 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors"
                  style={{ color: "rgba(255,255,255,0.4)" }}>
                  <span>{g.title}</span>
                  <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                </button>
                {!isCollapsed && g.items.map(m => {
                  const on = active === m.key;
                  const Icon = m.icon;
                  return (
                    <button key={m.key} onClick={() => { setActive(m.key); setSidebarOpen(false); }}
                      className="w-full flex items-center gap-3 px-5 py-2 text-[13px] font-medium transition-colors"
                      style={{ background: on ? "rgba(213,173,104,0.12)" : "transparent", color: on ? "#D5AD68" : "rgba(255,255,255,0.65)", borderLeft: on ? "2px solid #D5AD68" : "2px solid transparent" }}>
                      <Icon className="w-[17px] h-[17px] shrink-0" />
                      <span className="truncate">{m.label}</span>
                      {m.live && <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#22c55e" }} />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 px-4 md:px-6 h-16 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#0c0c16" }}>
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5" /></button>
          <h1 className="text-[17px] font-bold">{activeModule?.label}</h1>
          <div className="ml-auto flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-[13px] px-3 py-1.5 rounded-lg" style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>View site</button>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold" style={{ background: "rgba(213,173,104,0.18)", border: "1px solid rgba(213,173,104,0.5)", color: "#D5AD68" }}>
              {(user.username ?? user.email).slice(0, 2).toUpperCase()}
            </div>
            <button onClick={logout} title="Log out" style={{ color: "rgba(255,255,255,0.5)" }}><LogOut className="w-4 h-4" /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {active === "dashboard" && <Dashboard api={api} />}
          {active === "users" && <UsersModule api={api} canManageRoles={isSuper} />}
          {(active === "listings" || active === "orders") && <SimpleTable api={api} kind={active} />}
          {activeModule && !activeModule.live && <Placeholder label={activeModule.label} />}
        </main>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl p-4" style={{ background: "#111120", border: "1px solid rgba(255,255,255,0.08)" }}>{children}</div>;
}

function Dashboard({ api }: { api: (p: string, i?: RequestInit) => Promise<any> }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => { api("/admin/stats").then(setStats).catch(() => setErr(true)); }, [api]);

  if (err) return <p className="text-[14px]" style={{ color: "#ef4444" }}>Couldn't load stats — is the API running and are you the admin?</p>;
  if (!stats) return <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#D5AD68" }} />;

  const cards = [
    { label: "Total Revenue", value: money(stats.revenueCents), accent: "#22c55e" },
    { label: "Total Users", value: stats.users },
    { label: "Sellers", value: stats.sellers },
    { label: "Listings", value: `${stats.activeListings}/${stats.listings}` },
    { label: "Total Orders", value: stats.orders },
    { label: "Open Orders", value: stats.openOrders, accent: "#D5AD68" },
    { label: "Open Disputes", value: stats.disputes, accent: stats.disputes ? "#ef4444" : undefined },
    { label: "Banned Users", value: stats.banned },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(c => (
        <Card key={c.label}>
          <p className="text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{c.label}</p>
          <p className="text-[26px] font-bold font-heading" style={{ color: c.accent ?? "#fff" }}>{c.value}</p>
        </Card>
      ))}
    </div>
  );
}

const ROLE_PICK: { action: string; label: string }[] = [
  { action: "make_user", label: "User" },
  { action: "make_seller", label: "Seller" },
  { action: "make_moderator", label: "Moderator" },
  { action: "make_support", label: "Support" },
  { action: "make_finance", label: "Finance" },
  { action: "make_admin", label: "Admin" },
  { action: "make_super_admin", label: "Super Admin" },
];

function UsersModule({ api, canManageRoles }: { api: (p: string, i?: RequestInit) => Promise<any>; canManageRoles: boolean }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [roleMenu, setRoleMenu] = useState<string | null>(null);

  const load = useCallback((query = "") => {
    setLoading(true);
    api(`/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`)
      .then(d => setUsers(d.users)).catch(() => setUsers([])).finally(() => setLoading(false));
  }, [api]);
  useEffect(() => { load(); }, [load]);

  const act = async (id: string, action: string) => {
    setBusy(id + action);
    try { await api(`/admin/users/${id}`, { method: "POST", body: JSON.stringify({ action }) }); load(q); }
    catch { /* ignore */ } finally { setBusy(null); }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && load(q)}
            placeholder="Search email or username..."
            className="w-full h-10 pl-9 pr-3 rounded-lg text-sm text-white outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }} />
        </div>
        <button onClick={() => load(q)} className="h-10 px-4 rounded-lg text-[13px] font-semibold" style={{ background: "#D5AD68", color: "#1a1100" }}>Search</button>
      </div>

      {loading ? <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#D5AD68" }} /> : (
        <div className="rounded-xl overflow-hidden overflow-x-auto" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <table className="w-full text-[13px]" style={{ minWidth: "760px" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.5)" }}>
                {["User", "Role", "Status", "Balance", "Sales", "Actions"].map(h => <th key={h} className="text-left font-semibold px-4 py-3">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{u.username}</p>
                    <p style={{ color: "rgba(255,255,255,0.45)" }}>{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const isStaffRole = ["super_admin", "admin", "moderator", "support", "finance"].includes(u.role);
                      return <span className="px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap" style={{ background: isStaffRole ? "rgba(213,173,104,0.15)" : "rgba(255,255,255,0.07)", color: isStaffRole ? "#D5AD68" : "rgba(255,255,255,0.7)" }}>{(ROLE_LABELS as Record<string, string>)[u.role] ?? u.role}</span>;
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    {u.banned ? <span style={{ color: "#ef4444" }}>Banned</span> : u.verified ? <span style={{ color: "#22c55e" }}>Verified</span> : <span style={{ color: "#eab308" }}>Unverified</span>}
                  </td>
                  <td className="px-4 py-3">{money(u.balanceCents)}</td>
                  <td className="px-4 py-3">{u.salesCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {u.banned
                        ? <IconBtn title="Unban" color="#22c55e" busy={busy === u.id + "unban"} onClick={() => act(u.id, "unban")}><Check className="w-3.5 h-3.5" /></IconBtn>
                        : <IconBtn title="Ban" color="#ef4444" busy={busy === u.id + "ban"} onClick={() => act(u.id, "ban")}><Ban className="w-3.5 h-3.5" /></IconBtn>}
                      {!u.verified && <IconBtn title="Verify" color="#22c55e" busy={busy === u.id + "verify"} onClick={() => act(u.id, "verify")}><ShieldCheck className="w-3.5 h-3.5" /></IconBtn>}
                      {canManageRoles && (
                        <div className="relative">
                          <IconBtn title="Change role" color="#D5AD68" onClick={() => setRoleMenu(roleMenu === u.id ? null : u.id)}>Role</IconBtn>
                          {roleMenu === u.id && (
                            <div className="absolute right-0 top-full mt-1 rounded-lg overflow-hidden z-20" style={{ minWidth: "140px", background: "#1a1a26", border: "1px solid rgba(213,173,104,0.3)", boxShadow: "0 12px 32px rgba(0,0,0,0.6)" }}>
                              {ROLE_PICK.map(r => (
                                <button key={r.action} onClick={() => { setRoleMenu(null); if (r.action === "make_super_admin" ? confirm(`Make ${u.email} a SUPER ADMIN (full access)?`) : true) act(u.id, r.action); }}
                                  className="w-full text-left px-3 py-2 text-[12px] font-medium transition-colors"
                                  style={{ color: u.role === r.action.replace("make_", "") ? "#D5AD68" : "rgba(255,255,255,0.75)", background: u.role === r.action.replace("make_", "") ? "rgba(213,173,104,0.1)" : "transparent" }}>
                                  {r.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center" style={{ color: "rgba(255,255,255,0.4)" }}>No users found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, title, color, busy, onClick }: { children: React.ReactNode; title: string; color: string; busy?: boolean; onClick: () => void }) {
  return (
    <button title={title} onClick={onClick} disabled={busy}
      className="h-7 px-2 rounded-md flex items-center gap-1 text-[11px] font-semibold transition-all"
      style={{ border: `1px solid ${color}55`, color, background: "transparent" }}>
      {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : children}
    </button>
  );
}

function SimpleTable({ api, kind }: { api: (p: string, i?: RequestInit) => Promise<any>; kind: "listings" | "orders" }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api(`/admin/${kind}`).then(d => setRows(d[kind])).catch(() => setRows([])).finally(() => setLoading(false)); }, [api, kind]);
  if (loading) return <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#D5AD68" }} />;
  if (rows.length === 0) return <Card><p className="text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>No {kind} yet. They'll appear here once sellers start listing and buyers start ordering.</p></Card>;
  const cols = Object.keys(rows[0]).slice(0, 6);
  return (
    <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
      <table className="w-full text-[12px]" style={{ minWidth: "700px" }}>
        <thead><tr style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.5)" }}>{cols.map(c => <th key={c} className="text-left font-semibold px-3 py-2.5">{c}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>{cols.map(c => <td key={c} className="px-3 py-2.5 truncate" style={{ maxWidth: "180px" }}>{String(r[c])}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <Card>
      <div className="py-10 text-center">
        <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(213,173,104,0.12)", border: "1px solid rgba(213,173,104,0.3)" }}>
          <Settings className="w-6 h-6" style={{ color: "#D5AD68" }} />
        </div>
        <h3 className="text-[16px] font-bold mb-1">{label}</h3>
        <p className="text-[13px] max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
          This module is scaffolded and ready to be built out. The secure admin shell, navigation, and access control are all in place — this section will be wired to real data next.
        </p>
      </div>
    </Card>
  );
}

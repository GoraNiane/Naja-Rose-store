import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Users,
  LogOut,
  Layers,
  TrendingUp,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    path: '/admin/dashboard',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    aliases: ['/admin', '/admin/dashboard'],
  },
  {
    path: '/admin/sales',
    label: 'Ventes & Recettes',
    icon: TrendingUp,
  },
  {
    path: '/admin/orders',
    label: 'Commandes',
    icon: ShoppingCart,
  },
  {
    path: '/admin/invoices',
    label: 'Factures Clients',
    icon: FileText,
  },
  {
    path: '/admin/products',
    label: 'Catalogue Produits',
    icon: Package,
  },
  {
    path: '/admin/stock',
    label: 'Stock & Inventaire',
    icon: Layers,
  },
  {
    path: '/admin/customers',
    label: 'Clients & LTV',
    icon: Users,
    aliases: ['/admin/customers', '/admin/users'],
  },
];

export function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isNavActive = (item: (typeof NAV_ITEMS)[0]) => {
    if (item.aliases) {
      return item.aliases.some((alias) =>
        alias === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(alias)
      );
    }
    return location.pathname.startsWith(item.path);
  };

  const getPageTitle = () => {
    const active = NAV_ITEMS.find((n) => isNavActive(n));
    return active ? active.label : 'Administration';
  };

  return (
    <div className="min-h-screen flex bg-[#FAF9F7] text-[#171717] font-sans">
      {/* Desktop Luxury Dark Sidebar */}
      <aside className="w-64 bg-[#191516] text-white flex-col justify-between hidden lg:flex border-r border-[#2A2325] shrink-0 sticky top-0 h-screen z-30">
        <div className="p-6 space-y-8">
          {/* Brand Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#D8A7A7]/20 border border-[#D8A7A7]/40 flex items-center justify-center text-[#D8A7A7] font-serif font-bold text-sm">
                N
              </div>
              <div>
                <h1
                  className="font-serif italic text-base text-white tracking-wide leading-none"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Naja Rose Store
                </h1>
              </div>
            </div>
            <p className="text-[10px] font-semibold text-[#A69295] tracking-[0.2em] uppercase pl-9">
              ADMINISTRATION
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs font-medium">
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl transition-all duration-200 group relative ${
                    active
                      ? 'bg-[#2E2325] text-white font-semibold shadow-inner'
                      : 'text-[#A69295] hover:text-white hover:bg-[#231C1D]'
                  }`}
                >
                  {/* Active Indicator Bar */}
                  {active && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#D8A7A7]" />
                  )}
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      active ? 'text-[#D8A7A7]' : 'text-[#8E797C] group-hover:text-[#D8A7A7]'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User & Logout Profile */}
        <div className="p-5 border-t border-[#2A2325] bg-[#141011] space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#2E2325] border border-[#D8A7A7]/30 flex items-center justify-center text-xs font-bold text-[#D8A7A7] shrink-0">
              N
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">Directrice Naja Rose</p>
              <p className="text-[10px] text-[#A69295] truncate">Compte administrateur</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#231C1D] hover:bg-[#2E2325] text-[#A69295] hover:text-white text-[11px] font-medium transition-colors border border-[#2A2325]"
            >
              <ExternalLink className="w-3 h-3 text-[#D8A7A7]" />
              <span>Boutique</span>
            </Link>
            <button
              onClick={() => {
                logout();
                navigate('/admin/login');
              }}
              className="p-2 rounded-xl bg-[#231C1D] hover:bg-rose-950/50 text-[#A69295] hover:text-rose-300 text-xs transition-colors border border-[#2A2325]"
              title="Déconnexion"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-72 bg-[#191516] text-white z-50 flex flex-col justify-between p-6 transform transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="font-serif italic text-base text-white"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Naja Rose Store
              </h1>
              <p className="text-[10px] font-semibold text-[#A69295] tracking-[0.2em] uppercase">
                ADMINISTRATION
              </p>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-xl bg-[#231C1D] text-[#A69295] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1.5 text-xs font-medium">
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all ${
                    active
                      ? 'bg-[#2E2325] text-white font-semibold'
                      : 'text-[#A69295] hover:text-white hover:bg-[#231C1D]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-[#D8A7A7]' : 'text-[#8E797C]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-[#2A2325] space-y-3">
          <div className="text-xs">
            <p className="font-semibold text-white">Directrice Naja Rose</p>
            <p className="text-[11px] text-[#A69295] truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-950/40 text-rose-300 text-xs font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Main Admin Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Minimalist Top Header */}
        <header className="h-16 bg-white border-b border-[#E9E2DF] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#171717] hover:bg-[#FAF9F7] border border-[#E9E2DF]"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <p className="text-[10px] font-semibold text-[#77706D] tracking-widest uppercase">
                NAJA ROSE STORE / ADMINISTRATION
              </p>
              <h2 className="text-sm font-bold text-[#171717] hidden sm:block">
                {getPageTitle()}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#171717] hover:text-[#8B3A4A] py-1.5 px-3.5 rounded-full border border-[#E9E2DF] hover:border-[#D8A7A7] bg-white transition-colors shadow-2xs"
            >
              <span>Voir la boutique</span>
              <ExternalLink className="w-3 h-3 text-[#D8A7A7]" />
            </Link>
          </div>
        </header>

        {/* Admin Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, LayoutGrid, ShoppingCart, MessageCircle } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';

interface BottomNavProps {
  onOpenCart?: () => void;
}

export function BottomNav({ onOpenCart }: BottomNavProps) {
  const location = useLocation();
  const { itemCount } = useCartStore();

  const navItems = [
    {
      label: 'Accueil',
      path: '/',
      icon: Home,
      exact: true,
    },
    {
      label: 'Boutique',
      path: '/shop',
      icon: ShoppingBag,
      exact: false,
    },
    {
      label: 'Catégories',
      path: '/categories',
      icon: LayoutGrid,
      exact: false,
    },
    {
      label: 'Panier',
      path: '/cart',
      icon: ShoppingCart,
      isCart: true,
      badge: itemCount,
    },
    {
      label: 'WhatsApp',
      path: 'https://wa.me/221773817191?text=Bonjour%20Naja%20Rose%20Store%2C%20j%27aimerais%20avoir%20des%20informations%20sur%20vos%20articles.',
      icon: MessageCircle,
      isExternal: true,
    },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#F4E2E0] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)]">
      <nav className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.path
            : item.path && !item.isExternal
            ? location.pathname.startsWith(item.path)
            : false;

          const Icon = item.icon;

          if (item.isExternal) {
            return (
              <a
                key={item.label}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center flex-1 py-1 text-[#644D52] hover:text-[#25D366] transition-colors relative"
              >
                <div className="relative p-1">
                  <Icon className="w-5 h-5 text-[#25D366]" />
                  <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                </div>
                <span className="text-[10px] font-medium tracking-tight mt-0.5">{item.label}</span>
              </a>
            );
          }

          if (item.isCart && onOpenCart) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={onOpenCart}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${
                  isActive ? 'text-[#8B3A4A]' : 'text-[#644D52] hover:text-[#8B3A4A]'
                }`}
              >
                <div className="relative p-1">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#E7A8B4] text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${
                isActive ? 'text-[#8B3A4A]' : 'text-[#644D52] hover:text-[#8B3A4A]'
              }`}
            >
              <div className="relative p-1">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#8B3A4A]" />
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'font-bold text-[#8B3A4A]' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

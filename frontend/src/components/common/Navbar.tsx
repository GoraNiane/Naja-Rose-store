import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Menu,
  X,
} from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { BrandLogo } from './BrandLogo';
import { AnnouncementBar } from './AnnouncementBar';

export function Navbar({ onOpenCart }: { onOpenCart: () => void }) {
  const { itemCount } = useCartStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { name: 'Accueil', path: '/' },
    { name: 'Boutique', path: '/shop' },
    { name: 'Catégories', path: '/categories' },
    { name: 'À propos', path: '/#about' },
    { name: 'Contact', path: '/#contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F4E2E0] shadow-sm transition-all">
      {/* Top Dynamic Scrolling Announcement Bar */}
      <AnnouncementBar />


      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-22">
          {/* Mobile Left Hamburger Menu Button */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#2C1E21] hover:text-[#8B3A4A] rounded-full hover:bg-[#FAF5F4] transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>

          {/* Brand Logo (Centered on mobile, Left on desktop) */}
          <div className="flex-shrink-0 flex items-center justify-center">
            <BrandLogo size="md" />
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive =
                link.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.path);

              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`relative text-sm font-medium transition-colors py-2 ${
                    isActive
                      ? 'text-[#2C1E21] font-semibold'
                      : 'text-[#644D52] hover:text-[#8B3A4A]'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#8B3A4A] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Section: Search + Bookmark + Cart */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Desktop Search Input */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex items-center relative w-48 lg:w-60"
            >
              <input
                type="text"
                placeholder="Rechercher un article..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FAF5F4] border border-[#F4E2E0] rounded-full pl-4 pr-9 py-1.5 text-xs text-[#2C1E21] placeholder-[#A0888E] focus:bg-white focus:outline-none focus:border-[#8B3A4A] focus:ring-1 focus:ring-[#8B3A4A] transition-all"
              />
              <button
                type="submit"
                aria-label="Rechercher"
                className="absolute right-3 text-[#A0888E] hover:text-[#8B3A4A] transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Mobile Search Toggle */}
            <Link
              to="/shop"
              aria-label="Recherche"
              className="md:hidden p-2 text-[#2C1E21] hover:text-[#8B3A4A] hover:bg-[#FAF5F4] rounded-full transition-colors"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Cart Button with pink badge count (From Screenshot) */}
            <button
              onClick={onOpenCart}
              aria-label="Panier d'achats"
              className="relative p-2 text-[#2C1E21] hover:text-[#8B3A4A] hover:bg-[#FAF5F4] rounded-full transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute top-1 right-0 w-4 h-4 rounded-full bg-[#E7A8B4] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {itemCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#F4E2E0] bg-white px-4 pt-4 pb-6 space-y-4 shadow-xl">
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF5F4] border border-[#F4E2E0] rounded-full pl-4 pr-9 py-2.5 text-xs text-[#2C1E21] focus:outline-none focus:border-[#8B3A4A]"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0888E]"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-[#2C1E21] hover:text-[#8B3A4A] py-2 px-3 rounded-lg hover:bg-[#FAF5F4]"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  Truck,
  Shield,
  Headphones,
} from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { BrandLogo } from './BrandLogo';

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
      {/* Top Announcement Bar (Faithfully matched from reference) */}
      <div className="bg-[#FAF5F4] border-b border-[#F4E2E0] text-[#644D52] text-[11px] sm:text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left info */}
          <div className="flex items-center gap-1.5 font-medium">
            <Truck className="w-3.5 h-3.5 text-[#8B3A4A]" />
            <span>Livraison rapide partout au Sénégal</span>
          </div>

          {/* Center info */}
          <div className="hidden md:flex items-center gap-2 font-medium">
            <Shield className="w-3.5 h-3.5 text-[#8B3A4A]" />
            <span>Paiement Wave & Orange Money</span>
            <span className="text-[#DE9990]">|</span>
            <Headphones className="w-3.5 h-3.5 text-[#8B3A4A]" />
            <span>Service client à votre écoute</span>
          </div>

          {/* Right Social Icons */}
          <div className="flex items-center gap-3 text-[#644D52]">
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="hover:text-[#8B3A4A] transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.88-4.49V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-.89-.07z"/>
              </svg>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hover:text-[#8B3A4A] transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="hover:text-[#8B3A4A] transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.592 9 4.615V8z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

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

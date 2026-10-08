import { APP_CONFIG } from '../../lib/constants';
import { Phone, Mail, MapPin, Heart, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';

export function Footer() {
  return (
    <footer className="bg-[#2C1E21] text-[#E8D5D8] border-t border-[#3F2B30]">
      {/* Reassurance Banner */}
      <div className="border-b border-[#3F2B30] bg-[#24171A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="w-12 h-12 rounded-2xl bg-[#382B2F] text-[#E7A8B4] flex items-center justify-center flex-shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Livraison Rapide au Sénégal</h4>
                <p className="text-xs text-[#A0888E]">Partout à Dakar sous 24h & dans les régions</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="w-12 h-12 rounded-2xl bg-[#382B2F] text-[#E7A8B4] flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Paiement 100% Sécurisé</h4>
                <p className="text-xs text-[#A0888E]">Wave, Orange Money ou Paiement à la livraison</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="w-12 h-12 rounded-2xl bg-[#382B2F] text-[#E7A8B4] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Elegance Style Garanties</h4>
                <p className="text-xs text-[#A0888E]">Des vêtements qui révèlent votre beauté</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Col */}
          <div className="space-y-4">
            <BrandLogo size="md" isLight={true} />
            <p className="text-xs text-[#A0888E] leading-relaxed pt-2">
              Des vêtements qui révèlent la meilleure version de vous. Robes élégantes, ensembles chics, tops raffinés et vestes de prestige à Dakar.
            </p>
            <div className="pt-2 text-xs text-[#E7A8B4] flex items-center gap-2">
              <span>🇸🇳 Conçu avec passion à Dakar</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Collections
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A0888E]">
              <li>
                <Link to="/shop?category=robes" className="hover:text-[#E7A8B4] transition-colors">
                  Robes Élégantes
                </Link>
              </li>
              <li>
                <Link to="/shop?category=ensembles" className="hover:text-[#E7A8B4] transition-colors">
                  Ensembles & Tailleurs
                </Link>
              </li>
              <li>
                <Link to="/shop?category=tops-t-shirts" className="hover:text-[#E7A8B4] transition-colors">
                  Tops & Chemises
                </Link>
              </li>
              <li>
                <Link to="/shop?category=vestes-manteaux" className="hover:text-[#E7A8B4] transition-colors">
                  Vestes & Manteaux
                </Link>
              </li>
              <li>
                <Link to="/shop?category=pantalons" className="hover:text-[#E7A8B4] transition-colors">
                  Pantalons & Jupes
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Service Client
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A0888E]">
              <li>
                <Link to="/orders" className="hover:text-[#E7A8B4] transition-colors">
                  Suivi de Commande
                </Link>
              </li>
              <li>
                <Link to="/#delivery" className="hover:text-[#E7A8B4] transition-colors">
                  Frais & Délais de Livraison
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-[#E7A8B4] transition-colors">
                  Guide des Tailles
                </Link>
              </li>
              <li>
                <Link to="/#contact" className="hover:text-[#E7A8B4] transition-colors">
                  Assistance Clientèle
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Nous Contacter
            </h4>
            <ul className="space-y-3 text-xs text-[#A0888E]">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#E7A8B4] mt-0.5 flex-shrink-0" />
                <span>{APP_CONFIG.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#E7A8B4] flex-shrink-0" />
                <a href={`tel:${APP_CONFIG.phone}`} className="hover:text-white">
                  {APP_CONFIG.phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#E7A8B4] flex-shrink-0" />
                <a href={`mailto:${APP_CONFIG.email}`} className="hover:text-white">
                  {APP_CONFIG.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#3F2B30] flex flex-col sm:flex-row items-center justify-between text-xs text-[#A0888E] gap-4">
          <p>© {new Date().getFullYear()} Naja Rose Store Sénégal. Elegance Style Garanties.</p>
          <p className="flex items-center gap-1">
            Fait avec <Heart className="w-3.5 h-3.5 text-[#E7A8B4] fill-[#E7A8B4]" /> à Dakar
          </p>
        </div>
      </div>
    </footer>
  );
}

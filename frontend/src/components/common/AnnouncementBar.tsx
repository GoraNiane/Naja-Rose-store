import React from 'react';
import { Truck, ShieldCheck, Sparkles, Phone, MapPin, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AnnouncementItem {
  icon: React.ReactNode;
  text: string;
  badge?: string;
  link?: string;
  isExternal?: boolean;
}

export function AnnouncementBar() {
  const items: AnnouncementItem[] = [
    {
      icon: <Truck className="w-3.5 h-3.5 text-[#E7A8B4]" />,
      text: 'Livraison express partout à Dakar (24h) et dans toutes les régions du Sénégal',
      badge: 'LIVRAISON RAPIDE',
      link: '/shop',
    },
    {
      icon: <ShieldCheck className="w-3.5 h-3.5 text-[#E7A8B4]" />,
      text: 'Paiements 100% sécurisés via Wave & Orange Money',
      badge: 'PAIEMENT SÉCURISÉ',
      link: '/shop',
    },
    {
      icon: <Sparkles className="w-3.5 h-3.5 text-[#E7A8B4]" />,
      text: 'Nouvelle Collection : Robes en Soie, Ensembles chics & Prêt-à-porter',
      badge: 'NOUVEAUTÉS 2026',
      link: '/shop',
    },
    {
      icon: <Phone className="w-3.5 h-3.5 text-[#E7A8B4]" />,
      text: 'Service Client & Commandes WhatsApp : +221 77 381 71 91',
      badge: 'WHATSAPP 7J/7',
      link: 'https://wa.me/221773817191?text=Bonjour%20Naja%20Rose%20Store%2C%20je%20souhaite%20des%20renseignements',
      isExternal: true,
    },
    {
      icon: <MapPin className="w-3.5 h-3.5 text-[#E7A8B4]" />,
      text: 'Boutique & Showroom physique à Dakar, Sénégal',
      badge: 'SHOWROOM',
      link: '/#contact',
    },
    {
      icon: <Heart className="w-3.5 h-3.5 text-[#E7A8B4]" />,
      text: 'Naja Rose Store — Des vêtements qui révèlent la meilleure version de vous',
      badge: 'ÉLÉGANCE GARANTIE',
      link: '/#about',
    },
  ];

  return (
    <div className="bg-[#2C1E21] text-[#FAF2F0] border-b border-[#3F2B30] overflow-hidden select-none py-2 text-[11px] sm:text-xs tracking-wide relative group">
      <div className="relative flex items-center overflow-hidden">
        {/* Left and Right subtle gradient shadow overlays for smooth edge fading */}
        <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-[#2C1E21] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-[#2C1E21] to-transparent z-10 pointer-events-none" />

        {/* Scrolling ticker track duplicated for seamless infinite loop */}
        <div className="animate-marquee flex items-center shrink-0 hover:[animation-play-state:paused]">
          {[...items, ...items].map((item, index) => {
            const Content = (
              <div className="inline-flex items-center gap-2 px-6 sm:px-8 border-r border-[#4A373C]/60 whitespace-nowrap group-item transition-opacity hover:opacity-90">
                {item.badge && (
                  <span className="bg-[#8B3A4A] text-white text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    {item.badge}
                  </span>
                )}
                {item.icon}
                <span className="font-medium text-[#FAF2F0] hover:text-[#E7A8B4] transition-colors">
                  {item.text}
                </span>
                <span className="text-[#8B3A4A] font-bold text-xs ml-3">•</span>
              </div>
            );

            if (item.isExternal && item.link) {
              return (
                <a
                  key={index}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  {Content}
                </a>
              );
            }

            if (item.link) {
              return (
                <Link key={index} to={item.link} className="cursor-pointer">
                  {Content}
                </Link>
              );
            }

            return <div key={index}>{Content}</div>;
          })}
        </div>
      </div>
    </div>
  );
}


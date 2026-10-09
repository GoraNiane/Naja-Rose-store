import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { CartDrawer } from '../components/common/CartDrawer';
import { FloatingChat } from '../components/common/FloatingChat';
import { BottomNav } from '../components/common/BottomNav';
import { PwaInstallBanner } from '../components/common/PwaInstallBanner';

export function MainLayout() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBF9] relative">
      <Navbar onOpenCart={() => setCartOpen(true)} />
      <main className="flex-1 pb-16 lg:pb-0">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <FloatingChat />
      <BottomNav onOpenCart={() => setCartOpen(true)} />
      <PwaInstallBanner />
    </div>
  );
}



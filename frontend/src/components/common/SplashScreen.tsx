import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export interface SplashScreenProps {
  duration?: number;
  onFinish?: () => void;
  brandName?: string;
  badgeText?: string;
  theme?: 'light' | 'dark';
  showOncePerSession?: boolean;
}

export function SplashScreen({
  duration = 1200,
  onFinish,
  brandName = 'Naja Rose Store',
  badgeText = 'ELEGANCE STYLE GARANTIES',
  theme = 'light',
  showOncePerSession = true,
}: SplashScreenProps) {
  const navigate = useNavigate();
  const clicksRef = useRef<number>(0);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isVisible, setIsVisible] = useState(() => {
    if (showOncePerSession && typeof window !== 'undefined') {
      return !sessionStorage.getItem('naja_splash_seen');
    }
    return true;
  });

  const dismissSplash = () => {
    setIsVisible(false);
    if (showOncePerSession && typeof window !== 'undefined') {
      sessionStorage.setItem('naja_splash_seen', 'true');
    }
    if (onFinish) {
      onFinish();
    }
  };

  const handleSplashLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    clicksRef.current += 1;
    const currentClicks = clicksRef.current;

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    if (currentClicks >= 4) {
      clicksRef.current = 0;
      dismissSplash();
      navigate('/admin/login');
      return;
    }

    clickTimeoutRef.current = setTimeout(() => {
      clicksRef.current = 0;
    }, 1500);
  };

  // Main timer to smoothly fade out splash screen after loading completes
  useEffect(() => {
    if (!isVisible) {
      if (onFinish) onFinish();
      return;
    }

    const timer = setTimeout(() => {
      dismissSplash();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, isVisible, onFinish]);

  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="naja-splash-screen"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.35, ease: 'easeOut' },
          }}
          className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none overflow-hidden ${
            isDark ? 'bg-[#141011]' : 'bg-[#FAF9F7]'
          }`}
          style={{
            background: isDark
              ? 'radial-gradient(ellipse at 50% 45%, #261E20 0%, #181314 55%, #0F0C0D 100%)'
              : 'radial-gradient(ellipse at 50% 45%, #FFFFFF 0%, #FAF5F4 45%, #F5ECE9 80%, #ECE0DC 100%)',
          }}
        >
          {/* Skip Button in Top Right */}
          <button
            onClick={dismissSplash}
            className="absolute top-5 right-5 text-[11px] font-medium tracking-wider uppercase text-[#8E797C] hover:text-[#2C1E21] px-3 py-1 rounded-full bg-black/5 hover:bg-black/10 transition-colors z-20 cursor-pointer"
          >
            Passer ✕
          </button>

          {/* Central Logo & Brand Header */}
          <div
            onClick={handleSplashLogoClick}
            className="relative z-10 flex flex-col items-center text-center px-6 cursor-pointer select-none touch-manipulation transform-gpu"
            title="Naja Rose Store"
          >
            {/* Monogram Crest Emblem */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="mb-4"
            >
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border shadow-xs ${
                  isDark
                    ? 'bg-[#2E2325] border-[#D8A7A7]/40 text-[#D8A7A7]'
                    : 'bg-[#FFFFFF] border-[#E8CFCF] text-[#8B3A4A]'
                }`}
              >
                <span
                  className="font-serif italic font-bold text-2xl sm:text-3xl"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  N
                </span>
              </div>
            </motion.div>

            {/* Brand Title */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
              className="space-y-2"
            >
              <h1
                className={`font-serif italic font-normal tracking-tight text-3xl sm:text-5xl md:text-6xl leading-none ${
                  isDark ? 'text-white' : 'text-[#2C1E21]'
                }`}
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {brandName}
              </h1>

              {/* Subtitle Capsule Badge */}
              <div className="pt-1">
                <span
                  className={`inline-block text-[9px] sm:text-[10px] tracking-[0.24em] font-medium px-4 py-1 rounded-full shadow-2xs ${
                    isDark
                      ? 'bg-white/10 text-white border border-white/15'
                      : 'bg-[#382B2F] text-[#FAF9F7]'
                  }`}
                >
                  {badgeText}
                </span>
              </div>
            </motion.div>

            {/* Loading Bar */}
            <div className="mt-8 sm:mt-10 relative w-44 sm:w-56">
              <div
                className={`w-full h-1 rounded-full overflow-hidden relative border ${
                  isDark ? 'bg-[#231C1D] border-[#3E3033]' : 'bg-[#EAE0DC]/70 border-[#E4D3CE]/60'
                }`}
              >
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{
                    duration: (duration - 200) / 1000,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="h-full rounded-full bg-gradient-to-r from-[#8B3A4A] via-[#C06C7E] to-[#D8A7A7]"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


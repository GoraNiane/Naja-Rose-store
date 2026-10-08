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
  duration = 3000,
  onFinish,
  brandName = 'Naja Rose Store',
  badgeText = 'ELEGANCE STYLE GARANTIES',
  theme = 'light',
  showOncePerSession = false,
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

  const handleSplashLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    clicksRef.current += 1;
    const currentClicks = clicksRef.current;

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    if (currentClicks >= 5) {
      clicksRef.current = 0;
      setIsVisible(false);
      if (onFinish) {
        onFinish();
      }
      navigate('/admin/login');
      return;
    }

    clickTimeoutRef.current = setTimeout(() => {
      clicksRef.current = 0;
    }, 2000);
  };

  // Main timer to smoothly fade out splash screen after loading completes
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      if (showOncePerSession && typeof window !== 'undefined') {
        sessionStorage.setItem('naja_splash_seen', 'true');
      }
      if (onFinish) {
        onFinish();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, isVisible, onFinish, showOncePerSession]);

  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="naja-splash-screen"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.035,
            y: -8,
            filter: 'blur(8px)',
            transition: { duration: 0.85, ease: [0.65, 0, 0.35, 1] },
          }}
          className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none overflow-hidden ${isDark ? 'bg-[#141011]' : 'bg-[#FAF9F7]'
            }`}
          style={{
            background: isDark
              ? 'radial-gradient(ellipse at 50% 45%, #261E20 0%, #181314 55%, #0F0C0D 100%)'
              : 'radial-gradient(ellipse at 50% 45%, #FFFFFF 0%, #FAF5F4 45%, #F5ECE9 80%, #ECE0DC 100%)',
          }}
        >
          {/* Subtle Radiant Breathing Aura Behind Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{
              opacity: [0.25, 0.6, 0.35],
              scale: [0.85, 1.18, 0.95],
            }}
            transition={{
              duration: 2.8,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            className="absolute w-80 h-80 sm:w-[30rem] sm:h-[30rem] rounded-full pointer-events-none"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(216,167,167,0.22) 0%, rgba(216,167,167,0) 70%)'
                : 'radial-gradient(circle, rgba(232,207,207,0.7) 0%, rgba(245,220,216,0.35) 45%, rgba(247,238,238,0) 70%)',
              filter: 'blur(55px)',
            }}
          />

          {/* Central Logo & Brand Header */}
          <div
            onClick={handleSplashLogoClick}
            className="relative z-10 flex flex-col items-center text-center px-6 cursor-pointer select-none touch-manipulation active:scale-[0.98] transition-transform"
            title="Naja Rose Store"
          >
            {/* Monogram Crest Emblem */}
            <motion.div
              initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="mb-4"
            >
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border shadow-xs ${isDark
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

            {/* Brand Title (Sharp Blur-to-Focus Zoom Animation) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, filter: 'blur(14px)', y: 8 }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }}
              transition={{ duration: 1.15, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-2"
            >
              <h1
                className={`font-serif italic font-normal tracking-tight text-3xl sm:text-5xl md:text-6xl leading-none ${isDark ? 'text-white' : 'text-[#2C1E21]'
                  }`}
                style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif" }}
              >
                {brandName}
              </h1>

              {/* Subtitle Capsule Badge */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.45, ease: 'easeOut' }}
                className="pt-1"
              >
                <span
                  className={`inline-block text-[9px] sm:text-[10px] tracking-[0.24em] font-medium px-4 py-1 rounded-full shadow-2xs ${isDark
                    ? 'bg-white/10 text-white border border-white/15'
                    : 'bg-[#382B2F] text-[#FAF9F7]'
                    }`}
                >
                  {badgeText}
                </span>
              </motion.div>
            </motion.div>

            {/* Ultra-Modern & Dynamic Loading Bar (No Percentage Text) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.55, ease: 'easeOut' }}
              className="mt-12 sm:mt-14 relative w-48 sm:w-64"
            >
              {/* Subtle Ambient Under-Glow */}
              <div
                className="absolute inset-0 -top-1 -bottom-1 rounded-full opacity-60 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(216,167,167,0.7) 0%, rgba(216,167,167,0) 80%)',
                  filter: 'blur(6px)',
                }}
              />

              {/* Slim Minimalist Track */}
              <div
                className={`w-full h-1 sm:h-[4px] rounded-full overflow-hidden relative shadow-inner border ${isDark
                  ? 'bg-[#231C1D] border-[#3E3033]'
                  : 'bg-[#EAE0DC]/70 border-[#E4D3CE]/60'
                  }`}
              >
                {/* Dynamic Fluid Eased Progress Bar */}
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{
                    duration: (duration - 400) / 1000,
                    ease: [0.22, 1, 0.36, 1], // Natural swift acceleration into smooth luxury deceleration
                  }}
                  className="h-full rounded-full bg-gradient-to-r from-[#8B3A4A] via-[#C06C7E] to-[#D8A7A7] relative"
                  style={{
                    boxShadow: '0 0 10px rgba(216, 167, 167, 0.8), 0 0 2px rgba(139, 58, 74, 0.6)',
                  }}
                >
                  {/* High-End Leading Light Beam (Sparkle Glint) */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_8px_#ffffff,0_0_14px_#D8A7A7] pointer-events-none" />

                  {/* Continuous Shimmer Light Scan */}
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full h-full"
                  />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

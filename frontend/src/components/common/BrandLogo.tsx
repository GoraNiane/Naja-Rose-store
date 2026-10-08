import { motion } from 'framer-motion';
import { useHiddenAdminAccess } from '../../hooks/useHiddenAdminAccess';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  isLight?: boolean;
}

export function BrandLogo({ className = '', size = 'md', isLight = false }: BrandLogoProps) {
  const { handleClick, handleTouchEnd, isTriggering } = useHiddenAdminAccess({
    requiredClicks: 5,
    timeout: 2000,
    targetUrl: '/admin/login',
    singleClickNavigateTo: '/',
    animationDuration: 350,
  });

  const titleSizes = {
    sm: 'text-xl',
    md: 'text-2xl sm:text-3xl',
    lg: 'text-3xl sm:text-4xl lg:text-5xl',
  };

  const badgeSizes = {
    sm: 'text-[8px] px-2 py-0.5',
    md: 'text-[9px] sm:text-[10px] px-2.5 sm:px-3 py-0.5',
    lg: 'text-[11px] sm:text-[12px] px-3.5 py-1',
  };

  return (
    <motion.div
      onClick={handleClick}
      onTouchEnd={handleTouchEnd}
      animate={
        isTriggering
          ? {
              scale: [1, 1.04, 0.98, 1],
              opacity: [1, 0.9, 1],
            }
          : { scale: 1, opacity: 1 }
      }
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className={`inline-flex flex-col items-center group cursor-pointer select-none touch-manipulation transition-transform active:scale-[0.98] ${className}`}
      title="Naja Rose Store"
    >
      <span
        className={`font-serif italic font-normal tracking-tight ${titleSizes[size]} ${
          isLight ? 'text-white' : 'text-[#2C1E21]'
        } group-hover:text-[#8B3A4A] transition-colors leading-none`}
        style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif" }}
      >
        Naja Rose Store
      </span>
      <div className="mt-1">
        <span
          className={`inline-block ${badgeSizes[size]} font-medium rounded-full tracking-wide shadow-xs uppercase ${
            isLight
              ? 'bg-white/20 text-white backdrop-blur-xs'
              : 'bg-[#382B2F] text-white'
          }`}
        >
          Elegance Style Garanties
        </span>
      </div>
    </motion.div>
  );
}


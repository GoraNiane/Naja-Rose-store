import React from 'react';
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';

export type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'zoom' | 'scale' | 'none';

interface ScrollRevealProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  direction?: RevealDirection;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  threshold?: number;
  once?: boolean;
}

const LUXURY_EASE = [0.21, 0.47, 0.32, 0.98] as const;

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  distance = 35,
  className = '',
  threshold = 0.15,
  once = true,
  ...props
}: ScrollRevealProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up':
        return { opacity: 0, y: distance, scale: 0.98 };
      case 'down':
        return { opacity: 0, y: -distance, scale: 0.98 };
      case 'left':
        return { opacity: 0, x: distance, scale: 0.98 };
      case 'right':
        return { opacity: 0, x: -distance, scale: 0.98 };
      case 'zoom':
        return { opacity: 0, scale: 0.92 };
      case 'scale':
        return { opacity: 0, scale: 0.88, y: 20 };
      case 'none':
        return { opacity: 0 };
      default:
        return { opacity: 0, y: distance };
    }
  };

  return (
    <motion.div
      initial={getInitialPosition()}
      whileInView={{
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
      }}
      viewport={{ once, amount: threshold, margin: '0px 0px -30px 0px' }}
      transition={{
        duration,
        delay,
        ease: LUXURY_EASE,
      }}
      className={`transform-gpu ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Stagger Container for Grids & Lists
export function StaggerContainer({
  children,
  staggerDelay = 0.08,
  delayChildren = 0.05,
  className = '',
  once = true,
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  delayChildren?: number;
  className?: string;
  once?: boolean;
}) {
  const containerVariants: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.1 }}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Child element for StaggerContainer
export function StaggerItem({
  children,
  className = '',
  direction = 'up',
  distance = 30,
}: {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'zoom' | 'scale';
  distance?: number;
}) {
  const variants: Variants = {
    hidden:
      direction === 'zoom'
        ? { opacity: 0, scale: 0.9 }
        : direction === 'scale'
        ? { opacity: 0, scale: 0.88, y: 25 }
        : direction === 'down'
        ? { opacity: 0, y: -distance }
        : { opacity: 0, y: distance, scale: 0.97 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.55,
        ease: LUXURY_EASE,
      },
    },
  };

  return (
    <motion.div variants={variants} className={`transform-gpu ${className}`}>
      {children}
    </motion.div>
  );
}

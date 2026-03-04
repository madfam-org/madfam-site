'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/components/ui';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'hover-lift' | 'hover-glow' | 'hover-tilt';
  delay?: number;
}

export function AnimatedCard({
  children,
  className = '',
  variant = 'default',
  delay = 0,
}: AnimatedCardProps) {
  const baseClasses = cn(
    'bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg',
    'transition-all duration-300',
    className
  );

  if (variant === 'hover-tilt') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        whileHover={{ scale: 1.02 }}
        className={baseClasses}
        style={{ transformStyle: 'preserve-3d' }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          className="relative"
          whileHover={{ rotateY: 5, rotateX: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {children}
        </motion.div>
      </motion.div>
    );
  }

  if (variant === 'hover-glow') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className={`${baseClasses} relative overflow-hidden`}
      >
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-sun/20 to-lavender/20 opacity-0"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }

  if (variant === 'hover-lift') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        whileHover={{ y: -10, scale: 1.02 }}
        className={`${baseClasses} cursor-pointer`}
      >
        {children}
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={baseClasses}
    >
      {children}
    </motion.div>
  );
}

// 3D Card with mouse tracking
export function Card3D({ children, className = '' }: { children: ReactNode; className?: string }) {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg',
        'transition-transform duration-200 ease-out',
        'hover:shadow-2xl',
        className
      )}
      style={{ transformStyle: 'preserve-3d' }}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div style={{ transform: 'translateZ(50px)' }}>{children}</div>
    </motion.div>
  );
}

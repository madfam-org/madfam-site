'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/components/ui';

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  href?: string;
  disabled?: boolean;
}

export function AnimatedButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  href,
  disabled = false,
}: AnimatedButtonProps) {
  const baseClasses = cn(
    'relative inline-flex items-center justify-center font-medium rounded-lg transition-all',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    {
      // Variants
      'bg-obsidian text-white hover:bg-obsidian/90 focus:ring-obsidian': variant === 'primary',
      'bg-sun text-obsidian hover:bg-sun/90 focus:ring-sun': variant === 'secondary',
      'bg-transparent text-obsidian dark:text-pearl hover:bg-obsidian/5 dark:hover:bg-pearl/5':
        variant === 'ghost',
      // Sizes
      'px-3 py-2 text-sm': size === 'sm',
      'px-6 py-3 text-base': size === 'md',
      'px-8 py-4 text-lg': size === 'lg',
      // Disabled
      'opacity-50 cursor-not-allowed': disabled,
    },
    className
  );

  const Component = href ? 'a' : 'button';

  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
    >
      <Component href={href} onClick={onClick} disabled={disabled} className={baseClasses}>
        <motion.span
          className="relative z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.span>

        {/* Hover effect overlay */}
        <motion.div
          className="absolute inset-0 rounded-lg bg-white/10"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      </Component>
    </motion.div>
  );
}

// Magnetic button that follows cursor
interface MagneticButtonProps extends AnimatedButtonProps {
  magnetStrength?: number;
}

export function MagneticButton({ magnetStrength = 0.3, ...props }: MagneticButtonProps) {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    button.style.transform = `translate(${x * magnetStrength}px, ${y * magnetStrength}px)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'translate(0, 0)';
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="inline-block"
      style={{ transition: 'transform 0.2s ease-out' }}
    >
      <AnimatedButton {...props} />
    </motion.div>
  );
}

// Button with ripple effect
export function RippleButton(props: AnimatedButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.add('ripple');

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);

    if (props.onClick) {
      props.onClick();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg" onClick={handleClick}>
      <AnimatedButton {...props} />
      <style>{`
        :global(.ripple) {
          position: absolute;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.3);
          transform: scale(0);
          animation: ripple-animation 0.6s ease-out;
          pointer-events: none;
        }

        @keyframes ripple-animation {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

import React from 'react';
import { cn } from '@/lib/utils';

interface LiquidGlassProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'message' | 'input' | 'button';
  glow?: boolean;
  animate?: boolean;
}

export const LiquidGlass: React.FC<LiquidGlassProps> = ({
  children,
  className,
  variant = 'default',
  glow = false,
  animate = false
}) => {
  const baseClasses = 'relative overflow-hidden backdrop-blur-[20px]';
  
  const variantStyles = {
    default: 'bg-white/[0.03] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
    message: 'bg-white/[0.05] border border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]',
    input: 'bg-white/[0.03] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]',
    button: 'bg-white/[0.08] border border-white/[0.1] shadow-[0_4px_16px_rgba(0,0,0,0.3)]'
  };

  return (
    <div 
      className={cn(
        baseClasses,
        variantStyles[variant],
        animate && 'liquid-animate',
        glow && 'glass-shimmer',
        className
      )}
    >
      {/* Liquid gradient overlay */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 111, 97, 0.8) 0%, rgba(255, 185, 0, 0.6) 25%, rgba(139, 69, 19, 0.4) 50%, rgba(255, 111, 97, 0.8) 75%, rgba(255, 185, 0, 0.6) 100%)',
          backgroundSize: animate ? '200% 200%' : '100% 100%'
        }}
      />
      
      {/* Top highlight */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default LiquidGlass;
import React, { useState, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { buttonVariants } from '../../../utils/animationVariants';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  className?: string;
}

interface Ripple {
  x: number;
  y: number;
  id: number;
}

const BaseButton = styled.button<{
  $variant: string;
  $size: string;
  $fullWidth: boolean;
  $disabled: boolean;
}>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ $size, theme }) => {
    switch ($size) {
      case 'sm':
        return `${theme.spacing.sm} ${theme.spacing.md}`;
      case 'lg':
        return `${theme.spacing.lg} ${theme.spacing.xl}`;
      default:
        return `${theme.spacing.md} ${theme.spacing.lg}`;
    }
  }};
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
  font-family: ${({ theme }) => theme.typography.fonts.heading};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  font-size: ${({ $size, theme }) => {
    switch ($size) {
      case 'sm':
        return theme.typography.sizes.small;
      case 'lg':
        return '1.2rem';
      default:
        return theme.typography.sizes.body;
    }
  }};
  text-transform: uppercase;
  letter-spacing: 1.5px;
  border: 2px solid;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  overflow: hidden;
  transition: all ${({ theme }) => theme.transitions.normal}
    ${({ theme }) => theme.transitions.easing.smooth};
  will-change: transform;

  ${({ $variant, theme, $disabled }) => {
    if ($disabled) {
      return `
        opacity: 0.6;
        background: ${theme.colors.background.secondary};
        border-color: ${theme.colors.accent.border};
        color: ${theme.colors.text.muted};
      `;
    }

    switch ($variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, #404040 0%, #1a1a1a 100%);
          border-color: #606060;
          color: ${theme.colors.text.primary};
          box-shadow: ${theme.shadows.md};
          
          &:hover {
            background: linear-gradient(135deg, #505050 0%, #2a2a2a 100%);
            border-color: ${theme.colors.accent.primary};
            box-shadow: ${theme.shadows.lg}, ${theme.shadows.glow};
          }
        `;
      case 'secondary':
        return `
          background: transparent;
          border-color: ${theme.colors.accent.primary};
          color: ${theme.colors.text.primary};
          
          &:hover {
            background: rgba(154, 154, 154, 0.1);
            border-color: ${theme.colors.accent.primary};
            box-shadow: ${theme.shadows.glow};
          }
        `;
      case 'ghost':
        return `
          background: transparent;
          border-color: transparent;
          color: ${theme.colors.text.primary};
          
          &:hover {
            background: rgba(154, 154, 154, 0.1);
          }
        `;
      case 'danger':
        return `
          background: transparent;
          border-color: ${theme.colors.status.error};
          color: ${theme.colors.status.error};
          
          &:hover {
            background: rgba(248, 113, 113, 0.1);
            box-shadow: 0 0 20px rgba(248, 113, 113, 0.3);
          }
        `;
      default:
        return '';
    }
  }}

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent.focusRing};
    outline-offset: 2px;
  }
`;

const RippleBase = styled.span`
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0);
  pointer-events: none;
`;

const RippleEffect = motion(RippleBase);

const LoadingSpinnerBase = styled.div`
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: currentColor;
  border-radius: 50%;
`;

const LoadingSpinner = motion(LoadingSpinnerBase);

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  onClick,
  children,
  type = 'button',
  fullWidth = false,
  className,
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // Create ripple effect
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newRipple: Ripple = {
        x,
        y,
        id: rippleIdRef.current++,
      };

      setRipples((prev) => [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 600);
    }

    onClick?.(e);
  };

  const MotionButton = motion(BaseButton);

  return (
    <MotionButton
      ref={buttonRef}
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      $disabled={disabled || loading}
      disabled={disabled || loading}
      type={type}
      onClick={handleClick}
      className={className}
      variants={buttonVariants}
      initial="rest"
      whileHover={disabled || loading ? 'rest' : 'hover'}
      whileTap={disabled || loading ? 'rest' : 'tap'}
      transition={{ duration: 0.2 }}
    >
      {loading ? (
        <LoadingSpinner
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </>
      )}

      <AnimatePresence>
        {ripples.map((ripple) => (
          <RippleEffect
            key={ripple.id}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 20,
              height: 20,
              marginLeft: -10,
              marginTop: -10,
            }}
          />
        ))}
      </AnimatePresence>
    </MotionButton>
  );
};


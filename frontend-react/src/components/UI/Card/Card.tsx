import React, { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';

interface CardProps {
  variant?: 'default' | 'elevated' | 'interactive' | 'glass';
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  hover?: boolean;
}

const CardBase = styled.div<{ $variant: string; $hover: boolean }>`
  background: ${({ $variant, theme }) => {
    switch ($variant) {
      case 'glass':
        return theme.colors.background.card;
      default:
        return theme.colors.background.card;
    }
  }};
  backdrop-filter: ${({ $variant }) => ($variant === 'glass' ? 'blur(10px)' : 'none')};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: ${({ theme }) => theme.spacing.xl};
  border: 1px solid ${({ theme }) => theme.colors.accent.border};
  box-shadow: ${({ $variant, theme }) => {
    switch ($variant) {
      case 'elevated':
        return theme.shadows.lg;
      case 'interactive':
        return theme.shadows.md;
      default:
        return theme.shadows.sm;
    }
  }};
  transition: all ${({ theme }) => theme.transitions.normal} ${({ theme }) => theme.transitions.easing.smooth};
  cursor: ${({ $hover, onClick }) => ($hover || onClick ? 'pointer' : 'default')};
  will-change: transform;
  
  ${({ $hover, $variant, theme, onClick }) => {
    if (($hover || onClick) && $variant === 'interactive') {
      return `
        &:hover {
          transform: translateY(-4px);
          box-shadow: ${theme.shadows.lg}, ${theme.shadows.glow};
          border-color: ${theme.colors.accent.primary};
        }
      `;
    }
    return '';
  }}
`;

export const Card: React.FC<CardProps> = React.memo(({
  variant = 'default',
  children,
  onClick,
  className,
  hover = false,
}) => {
  // Use regular div instead of motion for form cards to prevent re-animation on every render
  if (variant === 'default' || variant === 'elevated') {
    return (
      <CardBase
        $variant={variant}
        $hover={hover}
        onClick={onClick}
        className={className}
      >
        {children}
      </CardBase>
    );
  }

  // Only use motion for interactive cards that need hover animations
  const MotionCard = motion(CardBase);

  return (
    <MotionCard
      $variant={variant}
      $hover={hover}
      onClick={onClick}
      className={className}
      whileHover={variant === 'interactive' || hover ? 'hover' : undefined}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionCard>
  );
});


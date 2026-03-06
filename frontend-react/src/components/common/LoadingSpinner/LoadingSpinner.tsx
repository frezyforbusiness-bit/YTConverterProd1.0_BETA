import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useTheme } from '../../../context/ThemeContext';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const SpinnerBase = styled.div<{ $size: string; $color: string }>`
  width: ${({ $size }) => {
    switch ($size) {
      case 'sm':
        return '20px';
      case 'lg':
        return '48px';
      default:
        return '32px';
    }
  }};
  height: ${({ $size }) => {
    switch ($size) {
      case 'sm':
        return '20px';
      case 'lg':
        return '48px';
      default:
        return '32px';
    }
  }};
  border: 3px solid ${({ $color }) => `${$color}33`};
  border-top-color: ${({ $color }) => $color};
  border-radius: 50%;
`;

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color,
}) => {
  const { theme } = useTheme();
  const spinnerColor = color || theme.colors.accent.primary;
  const Spinner = motion(SpinnerBase);

  return (
    <Spinner
      $size={size}
      $color={spinnerColor}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
      aria-label="Loading"
      role="status"
    />
  );
};


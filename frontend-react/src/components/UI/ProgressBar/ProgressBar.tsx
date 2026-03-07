import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useTheme } from '../../../context/ThemeContext';

interface ProgressBarProps {
  progress: number; // 0-100
  status?: 'default' | 'success' | 'error' | 'warning';
  showPercentage?: boolean;
  label?: string;
  pulsing?: boolean;
  shimmer?: boolean;
  className?: string;
}

const ProgressContainer = styled.div`
  width: 100%;
`;

const ProgressInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  min-height: 28px;
`;

const ProgressLabel = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  font-family: ${({ theme }) => theme.typography.fonts.body};
  flex: 1;
  min-width: 0;
`;

const ProgressPercent = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  font-family: ${({ theme }) => theme.typography.fonts.heading};
  background: ${({ theme }) => theme.colors.background.secondary};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid ${({ theme }) => theme.colors.accent.border};
  letter-spacing: 1px;
  flex-shrink: 0;
  min-width: 44px;
  text-align: center;
`;

const ProgressBarWrapper = styled.div<{ $status: string }>`
  width: 100%;
  height: 30px;
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.8);
  border: 1px solid ${({ theme }) => theme.colors.accent.border};
`;

const ProgressFillBase = styled.div<{ $status: string; $pulsing: boolean }>`
  height: 100%;
  background: ${({ $status, theme }) => {
    switch ($status) {
      case 'success':
        return `linear-gradient(90deg, ${theme.colors.status.success} 0%, #5eea8f 100%)`;
      case 'error':
        return `linear-gradient(90deg, ${theme.colors.status.error} 0%, #fa8a8a 100%)`;
      case 'warning':
        return `linear-gradient(90deg, ${theme.colors.status.warning} 0%, #ffe066 100%)`;
      default:
        return 'linear-gradient(90deg, #606060 0%, #808080 50%, #a0a0a0 100%)';
    }
  }};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  position: relative;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
  
  ${({ $pulsing }) =>
    $pulsing
      ? `
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.4),
        transparent
      );
      animation: shimmer 2s infinite;
    }
  `
      : ''}
`;

const ProgressFill = motion(ProgressFillBase);

const ShimmerOverlayBase = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  background-size: 200% 100%;
`;

const ShimmerOverlay = motion(ShimmerOverlayBase);

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  status = 'default',
  showPercentage = true,
  label,
  pulsing = false,
  shimmer = false,
  className,
}) => {
  const { theme } = useTheme();
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <ProgressContainer className={className}>
      {(label || showPercentage) && (
        <ProgressInfo>
          {label && <ProgressLabel>{label}</ProgressLabel>}
          {showPercentage && (
            <ProgressPercent>{Math.round(clampedProgress)}%</ProgressPercent>
          )}
        </ProgressInfo>
      )}
      <ProgressBarWrapper $status={status}>
        <ProgressFill
          $status={status}
          $pulsing={pulsing}
          initial={false}
          animate={{ width: `${clampedProgress}%` }}
          transition={{
            duration: 0.25,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          {shimmer && (
            <ShimmerOverlay
              animate={{
                backgroundPosition: ['0% 0%', '200% 0%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          )}
        </ProgressFill>
        {pulsing && (
          <motion.div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: theme.borderRadius.full,
            }}
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(154, 154, 154, 0.4)',
                '0 0 0 8px rgba(154, 154, 154, 0)',
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}
      </ProgressBarWrapper>
    </ProgressContainer>
  );
};


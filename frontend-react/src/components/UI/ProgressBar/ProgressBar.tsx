import React from 'react';
import styled, { keyframes, css } from 'styled-components';

const shimmerMove = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

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
`;

const ProgressLabel = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  font-family: ${({ theme }) => theme.typography.fonts.body};
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

const ProgressFill = styled.div<{
  $status: string;
  $width: number;
  $shimmer: boolean;
}>`
  height: 100%;
  width: ${({ $width }) => $width}%;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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

  ${({ $shimmer }) =>
    $shimmer
      ? css`
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
      animation: ${shimmerMove} 2s infinite;
    }
  `
      : ''}
`;

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  status = 'default',
  showPercentage = true,
  label,
  pulsing = false,
  shimmer = false,
  className,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const showShimmer = shimmer || pulsing;

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
          $width={clampedProgress}
          $shimmer={showShimmer}
        />
      </ProgressBarWrapper>
    </ProgressContainer>
  );
};

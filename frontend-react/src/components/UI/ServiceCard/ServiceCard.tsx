import React, { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Card } from '../Card';
import { Button } from '../Button';

interface ServiceCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  gradientBorder?: boolean;
  index?: number;
  badge?: string;
}

const ServiceCardContainerBase = styled.div`
  height: 100%;
`;

const ServiceCardContainer = motion(ServiceCardContainerBase);

const CardWrapper = styled.div<{ $gradientBorder: boolean }>`
  height: 100%;
  position: relative;
  
  ${({ $gradientBorder, theme }) =>
    $gradientBorder &&
    `
    &::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      border-radius: ${theme.borderRadius.large};
      background: linear-gradient(135deg, ${theme.colors.accent.primary}, ${theme.colors.accent.secondary});
      opacity: 0;
      transition: opacity ${theme.transitions.normal} ${theme.transitions.easing.smooth};
      z-index: -1;
    }
    
    &:hover::before {
      opacity: 1;
    }
  `}
`;

const StyledCard = styled(Card)`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Badge = styled.span`
  padding: 4px 10px;
  border-radius: 999px;
  font-size: ${({ theme }) => theme.typography.sizes.small};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: 1px;
  text-transform: uppercase;
  background: ${({ theme }) => theme.colors.accent.primary}22;
  color: ${({ theme }) => theme.colors.accent.primary};
  border: 1px solid ${({ theme }) => theme.colors.accent.primary}55;
`;

const IconContainerBase = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.accent.primary};
  font-size: 32px;
`;

const IconContainer = motion(IconContainerBase);

const Title = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.heading};
  font-size: ${({ theme }) => theme.typography.sizes.h3};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-transform: uppercase;
  letter-spacing: 1.5px;
`;

const Description = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  line-height: 1.6;
  flex-grow: 1;
`;

const CTAButton = styled(Button)`
  margin-top: auto;
`;

const getCardVariants = (index: number) => ({
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.1,
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
});

const iconVariants = {
  rest: {
    scale: 1,
    rotate: 0,
  },
  hover: {
    scale: 1.1,
    rotate: [0, -10, 10, -10, 0],
    transition: {
      duration: 0.5,
      ease: [0.68, -0.55, 0.265, 1.55] as [number, number, number, number],
    },
  },
};

export const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  icon,
  onClick,
  gradientBorder = false,
  index = 0,
  badge,
}) => {
  return (
    <ServiceCardContainer
      variants={getCardVariants(index)}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <CardWrapper $gradientBorder={gradientBorder}>
        <StyledCard variant="interactive" hover onClick={onClick}>
          <IconContainer variants={iconVariants} initial="rest" whileHover="hover">
            {icon}
          </IconContainer>
          <HeaderRow>
            <Title>{title}</Title>
            {badge && <Badge>{badge}</Badge>}
          </HeaderRow>
          <Description>{description}</Description>
          <CTAButton variant="secondary" size="md" fullWidth>
            Get Started
          </CTAButton>
        </StyledCard>
      </CardWrapper>
    </ServiceCardContainer>
  );
};


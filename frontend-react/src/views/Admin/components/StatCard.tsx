import React, { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Card } from '../../../components/UI/Card';

const StatCardBase = styled(Card)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.xl};
`;

const StatCard = motion(StatCardBase);

const Icon = styled.div`
  font-size: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
`;

const Content = styled.div`
  flex: 1;
`;

const Label = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Value = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.heading};
  font-size: ${({ theme }) => theme.typography.sizes.h2};
  font-weight: ${({ theme }) => theme.typography.weights.black};
  color: ${({ theme }) => theme.colors.text.primary};
`;

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  index?: number;
}

export const StatCardComponent: React.FC<StatCardProps> = ({ icon, label, value, index = 0 }) => {
  return (
    <StatCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      whileHover={{ y: -4, scale: 1.02 }}
    >
      <Icon>{icon}</Icon>
      <Content>
        <Label>{label}</Label>
        <Value>{value}</Value>
      </Content>
    </StatCard>
  );
};


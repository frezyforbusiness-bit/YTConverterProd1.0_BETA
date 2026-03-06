import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import styled from 'styled-components';
import { Card } from '../../../components/UI/Card';
import type { StatsByDate } from '../../../services/admin.service';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ChartContainer = styled(Card)`
  padding: ${({ theme }) => theme.spacing.xl};
`;

const ChartTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.heading};
  font-size: ${({ theme }) => theme.typography.sizes.h3};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-transform: uppercase;
  letter-spacing: 1.5px;
`;

const ChartControls = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const PeriodButton = styled.button<{ $active: boolean }>`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border: 2px solid ${({ $active, theme }) => ($active ? theme.colors.accent.primary : theme.colors.accent.border)};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ $active }) => ($active ? 'rgba(154, 154, 154, 0.1)' : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.text.primary : theme.colors.text.secondary)};
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal} ${({ theme }) => theme.transitions.easing.smooth};
  text-transform: uppercase;
  letter-spacing: 1px;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.accent.primary};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

interface TimeChartProps {
  stats: StatsByDate;
  selectedDays: number;
  onDaysChange: (days: number) => void;
}

export const TimeChart: React.FC<TimeChartProps> = ({ stats, selectedDays, onDaysChange }) => {
  const chartData = {
    labels: stats.dates || [],
    datasets: [
      {
        label: 'Total',
        data: stats.totals || [],
        borderColor: 'rgba(128, 128, 128, 1)',
        backgroundColor: 'rgba(128, 128, 128, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Successful',
        data: stats.successful || [],
        borderColor: 'rgba(107, 255, 107, 1)',
        backgroundColor: 'rgba(107, 255, 107, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Failed',
        data: stats.failed || [],
        borderColor: 'rgba(255, 107, 107, 1)',
        backgroundColor: 'rgba(255, 107, 107, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: '#e0e0e0',
          font: {
            family: 'Rajdhani',
            size: 14,
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#a0a0a0',
          font: {
            family: 'Rajdhani',
          },
        },
        grid: {
          color: 'rgba(100, 100, 100, 0.2)',
        },
      },
      y: {
        ticks: {
          color: '#a0a0a0',
          font: {
            family: 'Rajdhani',
          },
        },
        grid: {
          color: 'rgba(100, 100, 100, 0.2)',
        },
      },
    },
  };

  return (
    <ChartContainer>
      <ChartTitle>Conversions Over Time</ChartTitle>
      <ChartControls>
        <PeriodButton $active={selectedDays === 7} onClick={() => onDaysChange(7)}>
          7 Days
        </PeriodButton>
        <PeriodButton $active={selectedDays === 30} onClick={() => onDaysChange(30)}>
          30 Days
        </PeriodButton>
      </ChartControls>
      <div style={{ height: '300px' }}>
        <Line data={chartData} options={chartOptions} />
      </div>
    </ChartContainer>
  );
};


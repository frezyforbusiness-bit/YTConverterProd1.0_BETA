import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import styled from 'styled-components';
import { Card } from '../../../components/UI/Card';

ChartJS.register(ArcElement, Tooltip, Legend);

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

interface FormatChartProps {
  formatData: Record<string, number>;
}

export const FormatChart: React.FC<FormatChartProps> = ({ formatData }) => {
  const labels = Object.keys(formatData);
  const data = Object.values(formatData);

  const chartData = {
    labels: labels.map(f => f.toUpperCase()),
    datasets: [
      {
        data: data,
        backgroundColor: [
          'rgba(128, 128, 128, 0.8)',
          'rgba(160, 160, 160, 0.8)',
          'rgba(192, 192, 192, 0.8)',
          'rgba(224, 224, 224, 0.8)',
          'rgba(200, 200, 200, 0.8)',
          'rgba(150, 150, 150, 0.8)',
        ],
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#e0e0e0',
          font: {
            family: 'Rajdhani',
            size: 14,
          },
        },
      },
    },
  };

  return (
    <ChartContainer>
      <ChartTitle>Conversions by Format</ChartTitle>
      <div style={{ height: '300px' }}>
        <Pie data={chartData} options={chartOptions} />
      </div>
    </ChartContainer>
  );
};


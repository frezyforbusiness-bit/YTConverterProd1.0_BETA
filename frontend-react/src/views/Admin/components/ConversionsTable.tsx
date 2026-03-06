import React from 'react';
import styled from 'styled-components';
import { Card } from '../../../components/UI/Card';
import type { Conversion } from '../../../services/admin.service';

const TableContainer = styled(Card)`
  overflow: hidden;
`;

const TableTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.heading};
  font-size: ${({ theme }) => theme.typography.sizes.h3};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-transform: uppercase;
  letter-spacing: 1.5px;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  padding: ${({ theme }) => theme.spacing.md};
  text-align: left;
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.accent.border};
`;

const Td = styled.td`
  padding: ${({ theme }) => theme.spacing.md};
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  color: ${({ theme }) => theme.colors.text.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.accent.border};
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  text-transform: uppercase;
  background: ${({ $status }) => {
    switch ($status) {
      case 'done':
        return `rgba(74, 222, 128, 0.2)`;
      case 'error':
        return `rgba(248, 113, 113, 0.2)`;
      default:
        return `rgba(154, 154, 154, 0.2)`;
    }
  }};
  color: ${({ $status, theme }) => {
    switch ($status) {
      case 'done':
        return theme.colors.status.success;
      case 'error':
        return theme.colors.status.error;
      default:
        return theme.colors.text.secondary;
    }
  }};
`;

interface ConversionsTableProps {
  conversions: Conversion[];
}

export const ConversionsTable: React.FC<ConversionsTableProps> = ({ conversions }) => {
  if (conversions.length === 0) {
    return (
      <TableContainer>
        <TableTitle>Recent Conversions</TableTitle>
        <div style={{ padding: '20px', textAlign: 'center', color: '#909090' }}>
          No conversions yet
        </div>
      </TableContainer>
    );
  }

  return (
    <TableContainer>
      <TableTitle>Recent Conversions</TableTitle>
      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Video Title</Th>
              <Th>Format</Th>
              <Th>Status</Th>
              <Th>BPM</Th>
              <Th>Key</Th>
            </tr>
          </thead>
          <tbody>
            {conversions.map((conv) => {
              const date = new Date(conv.created_at);
              const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const title = conv.video_title || 'Unknown';
              const titleShort = title.length > 40 ? title.substring(0, 40) + '...' : title;

              return (
                <tr key={conv.id}>
                  <Td>{dateStr}</Td>
                  <Td title={title}>{titleShort}</Td>
                  <Td>{conv.format.toUpperCase()}</Td>
                  <Td>
                    <StatusBadge $status={conv.status}>{conv.status}</StatusBadge>
                  </Td>
                  <Td>{conv.bpm || '-'}</Td>
                  <Td>{conv.key || '-'}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </TableWrapper>
    </TableContainer>
  );
};


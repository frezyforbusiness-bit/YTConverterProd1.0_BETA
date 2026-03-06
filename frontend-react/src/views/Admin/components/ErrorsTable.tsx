import React from 'react';
import styled from 'styled-components';
import { Card } from '../../../components/UI/Card';
import type { AdminError } from '../../../services/admin.service';

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

interface ErrorsTableProps {
  errors: AdminError[];
}

export const ErrorsTable: React.FC<ErrorsTableProps> = ({ errors }) => {
  if (errors.length === 0) {
    return (
      <TableContainer>
        <TableTitle>Recent Errors</TableTitle>
        <div style={{ padding: '20px', textAlign: 'center', color: '#909090' }}>
          No errors yet
        </div>
      </TableContainer>
    );
  }

  return (
    <TableContainer>
      <TableTitle>Recent Errors</TableTitle>
      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Error Type</Th>
              <Th>Message</Th>
              <Th>URL</Th>
            </tr>
          </thead>
          <tbody>
            {errors.map((err) => {
              const date = new Date(err.created_at);
              const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const message = err.error_message || 'No message';
              const messageShort = message.length > 50 ? message.substring(0, 50) + '...' : message;
              const urlShort = err.youtube_url ? (err.youtube_url.length > 30 ? err.youtube_url.substring(0, 30) + '...' : err.youtube_url) : '-';

              return (
                <tr key={err.id}>
                  <Td>{dateStr}</Td>
                  <Td>{err.error_type || 'Unknown'}</Td>
                  <Td title={message}>{messageShort}</Td>
                  <Td title={err.youtube_url || ''}>{urlShort}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </TableWrapper>
    </TableContainer>
  );
};


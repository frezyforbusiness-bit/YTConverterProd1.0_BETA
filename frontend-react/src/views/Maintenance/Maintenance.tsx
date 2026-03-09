import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const MaintenanceContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.background.gradient};
`;

const ContentCard = styled.div`
  max-width: 600px;
  width: 100%;
  text-align: center;
  background: ${({ theme }) => theme.colors.background.card};
  padding: ${({ theme }) => theme.spacing['3xl']};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  border: 1px solid ${({ theme }) => theme.colors.accent.border};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  overflow: hidden;
  word-wrap: break-word;
`;

const Icon = styled.div`
  font-size: 80px;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  animation: float 3s ease-in-out infinite;
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-20px);
    }
  }
`;

const Title = styled.h1`
  font-family: ${({ theme }) => theme.typography.fonts.heading};
  font-size: ${({ theme }) => theme.typography.sizes.h1};
  font-weight: ${({ theme }) => theme.typography.weights.black};
  background: ${({ theme }) => theme.colors.text.gradient};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-transform: uppercase;
  letter-spacing: 2px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
`;

const Subtitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.sizes.h3};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Description = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.8;
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
`;

const VersionBadge = styled.div`
  display: inline-block;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  background: linear-gradient(135deg, rgba(154, 154, 154, 0.2) 0%, rgba(112, 112, 112, 0.1) 100%);
  border: 1px solid ${({ theme }) => theme.colors.accent.border};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-family: ${({ theme }) => theme.typography.fonts.heading};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: ${({ theme }) => theme.colors.accent.primary};
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const WaveformContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  height: 60px;
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const WaveBar = styled.div<{ $delay: number }>`
  width: 4px;
  background: linear-gradient(180deg, ${({ theme }) => theme.colors.accent.primary} 0%, ${({ theme }) => theme.colors.accent.secondary} 100%);
  border-radius: 2px;
  animation: wave 1.5s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay * 0.1}s;
  
  @keyframes wave {
    0%, 100% {
      height: 20px;
    }
    50% {
      height: 60px;
    }
  }
`;

export const Maintenance: React.FC = () => {
  return (
    <MaintenanceContainer>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <ContentCard>
          <Icon>🔧</Icon>
          <VersionBadge>Version 2.0</VersionBadge>
          <Title>In Lavorazione</Title>
          <Subtitle>Stiamo migliorando il servizio</Subtitle>
          <Description>
            Producer Tools sta subendo importanti aggiornamenti per la versione 2.0.
            Stiamo lavorando per offrirti un'esperienza ancora migliore con nuove funzionalità
            e miglioramenti significativi.
            <br /><br />
            Torna presto per scoprire tutte le novità! 🎵
          </Description>
          <WaveformContainer>
            {Array.from({ length: 12 }).map((_, i) => (
              <WaveBar key={i} $delay={i} />
            ))}
          </WaveformContainer>
        </ContentCard>
      </motion.div>
    </MaintenanceContainer>
  );
};


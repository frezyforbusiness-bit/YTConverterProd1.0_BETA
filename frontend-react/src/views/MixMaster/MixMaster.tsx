import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { PageTransition } from '../../components/common/PageTransition';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';

const MixMasterContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
  overflow: visible;
`;

const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const HeaderTitleBase = styled.h1`
  font-family: ${({ theme }) => theme.typography.fonts.heading};
  font-size: ${({ theme }) => theme.typography.sizes.h1};
  font-weight: ${({ theme }) => theme.typography.weights.black};
  background: ${({ theme }) => theme.colors.text.gradient};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-transform: uppercase;
  letter-spacing: 3px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-align: center;
  white-space: nowrap;
  animation: float 3s ease-in-out infinite;

  @media (max-width: 1024px) {
    font-size: ${({ theme }) => theme.typography.sizes.h2};
  }

  @media (max-width: 768px) {
    white-space: normal;
  }
`;

const HeaderTitle = motion(HeaderTitleBase);

const HeaderSubtitleBase = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: ${({ theme }) => theme.typography.weights.regular};
  max-width: 600px;
  margin: 0 auto ${({ theme }) => theme.spacing.md};
  text-align: center;
`;

const HeaderSubtitle = motion(HeaderSubtitleBase);

const CtaCard = styled(Card)`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['3xl']};
`;

const CtaText = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  line-height: 1.6;
`;

const GoButton = styled(Button)`
  min-width: 200px;
`;

const AnalysisInfo = styled.div`
  margin-top: ${({ theme }) => theme.spacing['2xl']};
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

const InfoCard = styled.div`
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: ${({ theme }) => `${theme.spacing.lg} ${theme.spacing.xl}`};
  box-shadow: 0 16px 38px rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.16);
`;

const InfoTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing.xs};
`;

const InfoText = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.7;
  margin: 0;
`;

export const MixMaster: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <MixMasterContainer>
        <Header>
          <HeaderTitle
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            🎵 Producer Tools
          </HeaderTitle>
          <HeaderSubtitle
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Mix &amp; Master Analyzer – upload an audio file or paste a YouTube URL, then run an analysis to understand
            loudness, dynamics and tonal balance of your track.
          </HeaderSubtitle>
        </Header>

        <CtaCard>
          <CtaText>
            Upload your track or paste a YouTube link, answer a few quick questions (mix or master, genre, beat or full
            song), and get a tailored analysis report.
          </CtaText>
          <GoButton variant="primary" size="lg" onClick={() => navigate('/mixmaster/analyzer')}>
            Go to Analyzer →
          </GoButton>
        </CtaCard>

        <AnalysisInfo>
          <InfoCard>
            <InfoTitle>Loudness &amp; dynamics</InfoTitle>
            <InfoText>
              Understand how loud your track really is in LUFS and how much dynamic range you are leaving. Perfect for
              comparing rough mixes to reference masters.
            </InfoText>
          </InfoCard>
          <InfoCard>
            <InfoTitle>Tonal balance</InfoTitle>
            <InfoText>
              Spot if your low end, mids or highs are out of control. Use the analyzer to quickly see whether your mix
              is too dark, too bright or right in the pocket.
            </InfoText>
          </InfoCard>
          <InfoCard>
            <InfoTitle>Reference ready</InfoTitle>
            <InfoText>
              Upload released tracks from your favorite artists and compare them to your own mix to guide EQ, compression
              and limiting decisions.
            </InfoText>
          </InfoCard>
        </AnalysisInfo>
      </MixMasterContainer>
    </PageTransition>
  );
};

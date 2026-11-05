import { PageTitle, PageSubtitle } from '../../components/UI/PageHeading';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { PageTransition } from '../../components/common/PageTransition';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';

const MixMasterContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px 24px 48px;
  overflow: visible;
  @media (max-width: 640px) { padding: 16px 16px 32px; }
`;

const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const HeaderTitle = PageTitle;

const HeaderSubtitle = PageSubtitle;

const CtaCard = styled(Card)`
  text-align: left;
  padding: 48px 32px;
  @media (max-width: 640px) { padding: 24px 16px; }
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
  box-shadow: none;
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
            Hear the whole picture.
          </HeaderTitle>
          <HeaderSubtitle
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            A fresh perspective on your mix. Explore loudness, dynamics and tonal balance before your next release.
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

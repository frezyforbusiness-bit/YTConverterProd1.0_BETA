import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { PageTransition } from '../../components/common/PageTransition';
import { Card } from '../../components/UI/Card';
import { Input } from '../../components/UI/Input';
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

const TabContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.accent.border};
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  background: transparent;
  border: none;
  border-bottom: 2px solid
    ${({ $active, theme }) => ($active ? theme.colors.accent.primary : 'transparent')};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.text.primary : theme.colors.text.secondary};
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal} ${({ theme }) => theme.transitions.easing.smooth};
  
  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const DragDropArea = styled.div`
  border: 2px dashed ${({ theme }) => theme.colors.accent.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: ${({ theme }) => theme.spacing['3xl']};
  text-align: center;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal} ${({ theme }) => theme.transitions.easing.smooth};
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.accent.primary};
    background: rgba(154, 154, 154, 0.05);
  }
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
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'upload' | 'youtube'>('upload');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  return (
    <PageTransition>
      <MixMasterContainer>
        <Header>
          <HeaderTitle
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Producer Tools
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

        <Card>
          <TabContainer>
            <Tab $active={activeTab === 'upload'} onClick={() => setActiveTab('upload')}>
              Upload File
            </Tab>
            <Tab $active={activeTab === 'youtube'} onClick={() => setActiveTab('youtube')}>
              YouTube URL
            </Tab>
          </TabContainer>

          {activeTab === 'upload' ? (
            <DragDropArea>
              <p style={{ fontSize: theme.typography.sizes.h3, marginBottom: theme.spacing.md }}>
                📁 Drag &amp; Drop Audio File
              </p>
              <p style={{ color: theme.colors.text.secondary, marginBottom: theme.spacing.lg }}>
                Or click to browse (MP3, WAV, FLAC, M4A, OGG). Ideal for bounced mixes, masters and reference tracks.
              </p>
              <Button variant="secondary">Choose File</Button>
            </DragDropArea>
          ) : (
            <div>
              <Input
                label="YouTube URL"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                fullWidth
              />
              <div style={{ marginTop: theme.spacing.lg }}>
                <Button variant="primary" size="lg" fullWidth>
                  Analyze Track
                </Button>
              </div>
            </div>
          )}
        </Card>

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


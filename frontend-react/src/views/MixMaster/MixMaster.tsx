import React, { useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { PageTransition } from '../../components/common/PageTransition';
import { Card } from '../../components/UI/Card';
import { Input } from '../../components/UI/Input';
import { Button } from '../../components/UI/Button';

const MixMasterContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const HeaderTitle = styled.h1`
  font-family: ${({ theme }) => theme.typography.fonts.heading};
  font-size: ${({ theme }) => theme.typography.sizes.h2};
  font-weight: ${({ theme }) => theme.typography.weights.black};
  background: ${({ theme }) => theme.colors.text.gradient};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const HeaderSubtitle = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

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

export const MixMaster: React.FC = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'upload' | 'youtube'>('upload');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  return (
    <PageTransition>
      <MixMasterContainer>
        <Header>
          <HeaderTitle>Producer Tools</HeaderTitle>
          <HeaderSubtitle>
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
                📁 Drag & Drop Audio File
              </p>
              <p style={{ color: theme.colors.text.secondary, marginBottom: theme.spacing.lg }}>
                or click to browse (MP3, WAV, FLAC, M4A, OGG)
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
      </MixMasterContainer>
    </PageTransition>
  );
};


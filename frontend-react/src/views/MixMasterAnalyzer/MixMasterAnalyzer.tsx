import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { PageTransition } from '../../components/common/PageTransition';
import { Card } from '../../components/UI/Card';
import { Input } from '../../components/UI/Input';
import { Button } from '../../components/UI/Button';
import { ProgressBar } from '../../components/UI/ProgressBar';
import { analyzerService, type AnalysisResult } from '../../services/analyzer.service';

const ACCEPT_AUDIO = 'audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg';

const AnalyzerContainer = styled.div`
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

const HiddenFileInput = styled.input`
  display: none;
`;

const DragDropArea = styled.div<{ $isDragging?: boolean }>`
  border: 2px dashed ${({ theme, $isDragging }) => ($isDragging ? theme.colors.accent.primary : theme.colors.accent.border)};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: ${({ theme }) => theme.spacing['3xl']};
  text-align: center;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal} ${({ theme }) => theme.transitions.easing.smooth};
  background: ${({ $isDragging }) => ($isDragging ? 'rgba(154, 154, 154, 0.08)' : 'transparent')};

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent.primary};
    background: rgba(154, 154, 154, 0.05);
  }
`;

const SelectedFile = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: ${({ theme }) => theme.colors.status.success};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const QuestionGroup = styled.div`
  margin-top: ${({ theme }) => theme.spacing['2xl']};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const QuestionBlock = styled.div`
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: ${({ theme }) => `${theme.spacing.lg} ${theme.spacing.xl}`};
  border: 1px solid ${({ theme }) => theme.colors.accent.border};
`;

const QuestionLabel = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
  text-align: center;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const BigChoiceRow = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-top: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`;

const BigChoiceButton = styled.button<{ $active?: boolean }>`
  min-width: 220px;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.xl}`};
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.colors.accent.primary : theme.colors.accent.border)};
  background: ${({ theme, $active }) =>
    $active ? 'rgba(148, 163, 184, 0.12)' : theme.colors.background.card};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  transition: all ${({ theme }) => theme.transitions.fast} ${({ theme }) => theme.transitions.easing.smooth};

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent.primary};
    transform: translateY(-1px);
  }
`;

const Chip = styled.button<{ $active?: boolean }>`
  border-radius: 999px;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.colors.accent.primary : theme.colors.accent.border)};
  background: ${({ theme, $active }) =>
    $active ? 'rgba(148, 163, 184, 0.08)' : theme.colors.background.card};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast} ${({ theme }) => theme.transitions.easing.smooth};

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent.primary};
  }
`;

const AnalyzeRow = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
  text-align: center;
`;

const ResultSection = styled.section`
  margin-top: ${({ theme }) => theme.spacing['2xl']};
`;

const ResultTrackName = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.sizes.h3};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ReportCard = styled(Card)`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.xl};
`;

const ReportCardTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing.xs};
`;

const ReportCardSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const MetricItem = styled.div`
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.accent.border};
`;

const MetricLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: ${({ theme }) => theme.colors.text.muted};
  display: block;
  margin-bottom: 4px;
`;

const MetricValue = styled.span<{ $issue?: boolean }>`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  color: ${({ theme, $issue }) => ($issue ? theme.colors.status.error : theme.colors.text.primary)};
`;

const TonalProfileBar = styled.div`
  height: 24px;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: linear-gradient(90deg, #22c55e 0%, #22c55e 70%, rgba(34, 197, 94, 0.3) 100%);
  margin-top: ${({ theme }) => theme.spacing.sm};
  position: relative;
`;

const TonalLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: 4px;
`;

const SuggestedChangeItem = styled.div<{ $isIssue?: boolean }>`
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  border-left: 4px solid
    ${({ theme, $isIssue }) => ($isIssue ? theme.colors.status.error : theme.colors.accent.primary)};
`;

const SuggestedChangeTitle = styled.div`
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 4px;
`;

const SuggestedChangeDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  line-height: 1.5;
`;

const BackLink = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.accent.primary};
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  cursor: pointer;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  padding: 0;

  &:hover {
    text-decoration: underline;
  }
`;

export const MixMasterAnalyzer: React.FC = () => {
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'youtube'>('upload');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mixType, setMixType] = useState<'mix' | 'master' | null>(null);
  const [genre, setGenre] = useState<string | null>(null);
  const [contentType, setContentType] = useState<'beat' | 'song' | null>(null);
  const question1Ref = useRef<HTMLDivElement>(null);
  const question2Ref = useRef<HTMLDivElement>(null);
  const question3Ref = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (!selectedFile) return;
    question1Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [selectedFile]);

  useEffect(() => {
    if (mixType == null) return;
    question2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [mixType]);

  useEffect(() => {
    if (genre == null) return;
    question3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [genre]);

  useEffect(() => {
    if (!analyzing) return;
    let cancelled = false;
    setProgress(0);
    let current = 0;
    const id = setInterval(() => {
      current = Math.min(95, current + Math.random() * 8 + 4);
      setProgress(current);
    }, 200);

    const run = async () => {
      if (!selectedFile) return;
      try {
        const response = await analyzerService.analyzeTrack({
          file: selectedFile,
          mixType,
          genre,
          contentType,
        });
        if (cancelled) return;
        setProgress(100);
        setResult(response);
      } catch (error: any) {
        if (cancelled) return;
        console.error('Analyzer error', error);
        setResult(null);
      } finally {
        if (!cancelled) {
          setAnalyzing(false);
        }
        clearInterval(id);
      }
    };

    void run();

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [analyzing, selectedFile, mixType, genre, contentType]);

  const allAnswered = mixType != null && genre != null && contentType != null;
  const handleAnalyze = useCallback(() => {
    if (!allAnswered || analyzing) return;
    setResult(null);
    setAnalyzing(true);
  }, [allAnswered, analyzing]);

  const handleAnalyzeAnother = useCallback(() => {
    setResult(null);
    setProgress(0);
  }, []);

  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [result]);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMixType(null);
      setGenre(null);
      setContentType(null);
    }
    e.target.value = '';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setSelectedFile(file);
      setMixType(null);
      setGenre(null);
      setContentType(null);
    }
  }, []);

  return (
    <PageTransition>
      <AnalyzerContainer>
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
            Mix &amp; Master Analyzer – upload an audio file or paste a YouTube URL, then answer a few questions and run
            the analysis.
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
            <>
              <HiddenFileInput
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_AUDIO}
                onChange={handleFileChange}
              />
              <DragDropArea
                $isDragging={isDragging}
                onClick={openFilePicker}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <p style={{ fontSize: theme.typography.sizes.h3, marginBottom: theme.spacing.md }}>
                  📁 Drag &amp; Drop Audio File
                </p>
                <p style={{ color: theme.colors.text.secondary, marginBottom: theme.spacing.lg }}>
                  Or click to browse (MP3, WAV, FLAC, M4A, OGG). Ideal for bounced mixes, masters and reference tracks.
                </p>
                <Button type="button" variant="secondary" onClick={(e) => { e.stopPropagation(); openFilePicker(); }}>
                  Choose File
                </Button>
                {selectedFile && (
                  <SelectedFile>✓ Selected: {selectedFile.name}</SelectedFile>
                )}
              </DragDropArea>
              {selectedFile && (
                <QuestionGroup>
                  <QuestionBlock ref={question1Ref}>
                    <QuestionLabel>Is your track mastered?</QuestionLabel>
                    <BigChoiceRow>
                      <BigChoiceButton
                        type="button"
                        $active={mixType === 'master'}
                        onClick={() => setMixType('master')}
                      >
                        ✓ Yes, it&apos;s mastered
                      </BigChoiceButton>
                      <BigChoiceButton
                        type="button"
                        $active={mixType === 'mix'}
                        onClick={() => setMixType('mix')}
                      >
                        ✕ No, it&apos;s still a mix
                      </BigChoiceButton>
                    </BigChoiceRow>
                  </QuestionBlock>

                  {mixType != null && (
                    <QuestionBlock ref={question2Ref}>
                      <QuestionLabel>Genre</QuestionLabel>
                      <ChipRow>
                        <Chip type="button" $active={genre === 'trap'} onClick={() => setGenre('trap')}>
                          Trap / Drill
                        </Chip>
                        <Chip type="button" $active={genre === 'club'} onClick={() => setGenre('club')}>
                          House / Techno
                        </Chip>
                        <Chip type="button" $active={genre === 'pop'} onClick={() => setGenre('pop')}>
                          Pop / R&amp;B
                        </Chip>
                        <Chip type="button" $active={genre === 'other'} onClick={() => setGenre('other')}>
                          Other
                        </Chip>
                      </ChipRow>
                    </QuestionBlock>
                  )}

                  {genre != null && (
                    <QuestionBlock ref={question3Ref}>
                      <QuestionLabel>What&apos;s inside?</QuestionLabel>
                      <ChipRow>
                        <Chip type="button" $active={contentType === 'beat'} onClick={() => setContentType('beat')}>
                          Instrumental / Beat only
                        </Chip>
                        <Chip type="button" $active={contentType === 'song'} onClick={() => setContentType('song')}>
                          Full song with vocals
                        </Chip>
                      </ChipRow>
                    </QuestionBlock>
                  )}

                  {allAnswered && !result && (
                    <AnalyzeRow>
                      {analyzing ? (
                        <ProgressBar
                          progress={progress}
                          label="Analyzing your track..."
                          pulsing
                          shimmer
                        />
                      ) : (
                        <Button
                          type="button"
                          variant="primary"
                          size="lg"
                          onClick={handleAnalyze}
                        >
                          Analyze
                        </Button>
                      )}
                    </AnalyzeRow>
                  )}
                </QuestionGroup>
              )}
            </>
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

        {result && (
          <ResultSection ref={resultRef}>
            <BackLink type="button" onClick={handleAnalyzeAnother}>
              ← Analyze another track
            </BackLink>
            <ResultTrackName>🎵 {result.trackName}</ResultTrackName>

            <ReportCard>
              <ReportCardTitle>Check</ReportCardTitle>
              <ReportCardSubtitle>Detailed analysis of your track&apos;s technical quality.</ReportCardSubtitle>
              <MetricGrid>
                <MetricItem>
                  <MetricLabel>Sample Rate</MetricLabel>
                  <MetricValue>{result.sampleRate}</MetricValue>
                </MetricItem>
                <MetricItem>
                  <MetricLabel>Bit Depth</MetricLabel>
                  <MetricValue>{result.bitDepth}</MetricValue>
                </MetricItem>
                <MetricItem>
                  <MetricLabel>Clipping</MetricLabel>
                  <MetricValue $issue={result.clipping}>{result.clipping ? 'Yes' : 'No'}</MetricValue>
                </MetricItem>
                <MetricItem>
                  <MetricLabel>Mono Compatibility</MetricLabel>
                  <MetricValue>{result.monoCompatibility ? 'Yes' : 'No'}</MetricValue>
                </MetricItem>
                <MetricItem>
                  <MetricLabel>Integrated Loudness</MetricLabel>
                  <MetricValue>{result.integratedLoudness} LUFS</MetricValue>
                </MetricItem>
                <MetricItem>
                  <MetricLabel>True Peak</MetricLabel>
                  <MetricValue>{result.truePeak} dB</MetricValue>
                </MetricItem>
                <MetricItem>
                  <MetricLabel>Phase Issues</MetricLabel>
                  <MetricValue>{result.phaseIssues ? 'Yes' : 'No'}</MetricValue>
                </MetricItem>
                <MetricItem>
                  <MetricLabel>Stereo Field</MetricLabel>
                  <MetricValue>{result.stereoField}</MetricValue>
                </MetricItem>
              </MetricGrid>
            </ReportCard>

            <ReportCard>
              <ReportCardTitle>Tonal Profile</ReportCardTitle>
              <ReportCardSubtitle>Frequency balance (20 Hz – 20 kHz)</ReportCardSubtitle>
              <TonalLabel>Optimal</TonalLabel>
              <TonalProfileBar />
            </ReportCard>

            <ReportCard>
              <ReportCardTitle>Suggested Changes</ReportCardTitle>
              <ReportCardSubtitle>
                Remember, these are suggestions based on our analysis and not the final say. Always listen critically and
                trust your ears.
              </ReportCardSubtitle>
              {result.suggestedChanges.map((change, i) => (
                <SuggestedChangeItem key={i} $isIssue={change.isIssue}>
                  <SuggestedChangeTitle>{change.title}</SuggestedChangeTitle>
                  <SuggestedChangeDesc>{change.description}</SuggestedChangeDesc>
                </SuggestedChangeItem>
              ))}
            </ReportCard>
          </ResultSection>
        )}
      </AnalyzerContainer>
    </PageTransition>
  );
};

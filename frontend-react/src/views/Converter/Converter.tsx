import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { PageTransition } from '../../components/common/PageTransition';
import { Card } from '../../components/UI/Card';
import { Input } from '../../components/UI/Input';
import { Button } from '../../components/UI/Button';
import { ProgressBar } from '../../components/UI/ProgressBar';
import { converterService, type TaskStatus } from '../../services/converter.service';
import { usePolling } from '../../hooks/usePolling';

const ConverterContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
  overflow: visible;
`;

const HeroTitleBase = styled.h1`
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
  animation: float 3s ease-in-out infinite;
  text-align: center;
  white-space: nowrap;

  @media (max-width: 1024px) {
    font-size: ${({ theme }) => theme.typography.sizes.h2};
  }

  @media (max-width: 768px) {
    white-space: normal;
  }
`;

const HeroTitle = motion(HeroTitleBase);

const HeroSubtitleBase = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: ${({ theme }) => theme.typography.weights.regular};
  max-width: 600px;
  margin: 0 auto ${({ theme }) => theme.spacing.md};
  text-align: center;
`;

const HeroSubtitle = motion(HeroSubtitleBase);

const AnalysisModeSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  border: 1px solid ${({ theme }) => theme.colors.accent.border};
  background: ${({ theme }) => theme.colors.background.secondary};
`;

const ModeToggleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const ModeToggleButton = styled.button<{ $active?: boolean }>`
  flex: 1 1 160px;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.colors.accent.primary : theme.colors.accent.border)};
  background: ${({ theme, $active }) =>
    $active ? 'rgba(148, 163, 184, 0.12)' : theme.colors.background.card};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  cursor: pointer;
  text-align: left;
  transition: all ${({ theme }) => theme.transitions.fast} ${({ theme }) => theme.transitions.easing.smooth};

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent.primary};
    transform: translateY(-1px);
  }
`;

const ConverterCard = styled(Card)`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const FormGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Select = styled.select`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  border: 2px solid ${({ theme }) => theme.colors.accent.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  font-family: ${({ theme }) => theme.typography.fonts.body};
  background: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.primary};
  transition: all ${({ theme }) => theme.transitions.normal} ${({ theme }) => theme.transitions.easing.smooth};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accent.primary};
    background: ${({ theme }) => theme.colors.background.card};
    box-shadow: 0 0 0 4px ${({ theme }) => theme.colors.accent.focusRing};
  }
`;

const InfoBox = styled.div`
  background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%);
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  border-left: 5px solid ${({ theme }) => theme.colors.accent.primary};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: ${({ theme }) => theme.typography.fonts.body};
`;

const StyledLabel = styled.label`
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const MessageBase = styled.div<{ $type: 'success' | 'error' }>`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  margin-top: ${({ theme }) => theme.spacing.lg};
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  background: ${({ $type }) =>
    $type === 'success'
      ? `linear-gradient(135deg, rgba(74, 222, 128, 0.1) 0%, rgba(74, 222, 128, 0.05) 100%)`
      : `linear-gradient(135deg, rgba(248, 113, 113, 0.1) 0%, rgba(248, 113, 113, 0.05) 100%)`};
  color: ${({ $type, theme }) =>
    $type === 'success' ? theme.colors.status.success : theme.colors.status.error};
  border-left: 5px solid
    ${({ $type, theme }) => ($type === 'success' ? theme.colors.status.success : theme.colors.status.error)};
`;

const Message = motion(MessageBase);

const ProgressWrapper = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const ConversionInfo = styled.div`
  margin-top: ${({ theme }) => theme.spacing['2xl']};
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.7;

  h3 {
    font-family: ${({ theme }) => theme.typography.fonts.accent};
    font-size: ${({ theme }) => theme.typography.sizes.body};
    text-transform: uppercase;
    letter-spacing: 1px;
    color: ${({ theme }) => theme.colors.text.primary};
    margin: 0 0 ${({ theme }) => theme.spacing.sm};
  }

  ol,
  ul {
    list-style: none;
    padding: 0;
    margin: 0 0 ${({ theme }) => theme.spacing.md};
  }

  li {
    background: ${({ theme }) => theme.colors.background.secondary};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
    margin-bottom: ${({ theme }) => theme.spacing.xs};
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: baseline;
    gap: ${({ theme }) => theme.spacing.sm};
  }

  li span.label {
    display: inline-block;
    min-width: 70px;
    font-weight: ${({ theme }) => theme.typography.weights.semibold};
    color: ${({ theme }) => theme.colors.text.primary};
  }

  li span.badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid ${({ theme }) => theme.colors.accent.primary};
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-left: auto;
    color: ${({ theme }) => theme.colors.accent.primary};
  }
`;

export const Converter: React.FC = React.memo(() => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [format, setFormat] = useState('mp3');
  const [analyzeBpmKey, setAnalyzeBpmKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<TaskStatus | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setYoutubeUrl(e.target.value);
  }, []);

  const handleConvert = useCallback(async () => {
    if (!youtubeUrl.trim()) {
      setMessage({ type: 'error', text: 'Please enter a YouTube or Spotify URL' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      setStatus(null);
      const response = await converterService.startConversion({
        youtube_url: youtubeUrl,
        format,
        analyze_bpm_key: analyzeBpmKey,
      });
      setTaskId(response.task_id);
    } catch (error: any) {
      setLoading(false);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to start conversion',
      });
    }
  }, [youtubeUrl, format, analyzeBpmKey]);

  usePolling({
    enabled: !!taskId && status?.status !== 'done' && status?.status !== 'error',
    interval: 500,
    onPoll: async () => {
      if (!taskId) return;
      try {
        const currentStatus = await converterService.getStatus(taskId);
        setStatus(currentStatus);

        if (currentStatus.status === 'done') {
          setLoading(false);
          try {
            const blob = await converterService.downloadFile(taskId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = currentStatus.file_path?.split('/').pop() || `audio.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setMessage({ type: 'success', text: `Downloaded! Your ${format.toUpperCase()} file is ready! 🎵` });
            setTaskId(null);
            setStatus(null);
            setTimeout(() => {
              setMessage(null);
              setYoutubeUrl('');
            }, 3000);
          } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Download failed' });
          }
        } else if (currentStatus.status === 'error') {
          setLoading(false);
          setMessage({ type: 'error', text: currentStatus.error || 'Conversion failed' });
          setTaskId(null);
          setStatus(null);
        }
      } catch (error: any) {
        console.error('Polling error:', error);
      }
    },
  });

  return (
    <PageTransition>
      <ConverterContainer>
        <HeroTitle
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          🎵 Producer Tools
        </HeroTitle>
        <HeroSubtitle
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Audio Converter – turn any YouTube or Spotify track into a clean audio file in the format you need. Enable BPM
          &amp; key analysis when you want truly DJ‑ready files.
        </HeroSubtitle>

        <ConverterCard>
          <FormGroup>
            <Input
              label="Source URL"
              type="url"
              placeholder="YouTube or Spotify track URL"
              value={youtubeUrl}
              onChange={handleUrlChange}
              disabled={loading}
              fullWidth
            />
          </FormGroup>

          <FormGroup>
            <StyledLabel>
              Audio Format
            </StyledLabel>
            <Select value={format} onChange={(e) => setFormat(e.target.value)} disabled={loading}>
              <option value="mp3">MP3</option>
              <option value="wav">WAV (Recommended for Production)</option>
              <option value="flac">FLAC (Lossless)</option>
              <option value="ogg">OGG</option>
              <option value="m4a">M4A/AAC</option>
              <option value="opus">Opus</option>
            </Select>
          </FormGroup>

          <AnalysisModeSection>
            <StyledLabel>Select the mode you prefer</StyledLabel>
            <ModeToggleRow>
              <ModeToggleButton
                type="button"
                $active={!analyzeBpmKey}
                onClick={() => !loading && setAnalyzeBpmKey(false)}
              >
                ⚡ Fast Convert
                <br />
                <span>Best when you just need a quick audio file.</span>
              </ModeToggleButton>
              <ModeToggleButton
                type="button"
                $active={analyzeBpmKey}
                onClick={() => !loading && setAnalyzeBpmKey(true)}
              >
                🎹 Convert & Analyze
                <br />
                <span>Includes automatic BPM & key detection for DJs/producers.</span>
              </ModeToggleButton>
            </ModeToggleRow>
          </AnalysisModeSection>

          <InfoBox>
            <strong>Supported links</strong>
            : You can paste a single YouTube video URL or a single Spotify track URL. Playlists are
            not supported yet. The converter always tries to pick an audio/lyrics version on
            YouTube, not the official videoclip.
          </InfoBox>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onClick={handleConvert}
            disabled={loading || !youtubeUrl.trim()}
          >
            {analyzeBpmKey ? '🚀 Convert & Analyze' : '🚀 Convert'}
          </Button>

          {status && (
            <ProgressWrapper>
              <ProgressBar
                progress={status.progress}
                label={status.message || 'Processing...'}
                pulsing={status.status === 'processing'}
                shimmer={status.status === 'processing'}
              />
            </ProgressWrapper>
          )}

          <AnimatePresence>
            {message && (
              <Message
                $type={message.type}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {message.text}
              </Message>
            )}
          </AnimatePresence>
        </ConverterCard>
        <ConversionInfo>
          <h3>Built for music producers</h3>
          <ol>
            <li>
              <span className="label">1.</span>
              <span>Paste a YouTube or Spotify track URL above.</span>
            </li>
            <li>
              <span className="label">2.</span>
              <span>Choose your preferred audio format and (optionally) enable BPM &amp; key detection.</span>
            </li>
            <li>
              <span className="label">3.</span>
              <span>Hit convert – the system will process the audio and start the download automatically.</span>
            </li>
          </ol>

          <h3>Professional audio formats</h3>
          <ul>
            <li>
              <span className="label">MP3</span>
              <span>Universal compatibility, good for sharing and quick exports.</span>
            </li>
            <li>
              <span className="label">WAV</span>
              <span>Uncompressed, studio quality. Best choice for production and further processing.</span>
            </li>
            <li>
              <span className="label">FLAC</span>
              <span>Lossless compression, perfect quality with smaller file size than WAV.</span>
            </li>
            <li>
              <span className="label">OGG</span>
              <span>Open‑source format with efficient compression and solid quality.</span>
            </li>
            <li>
              <span className="label">M4A/AAC</span>
              <span>Apple standard, great quality for streaming and mobile playback.</span>
            </li>
            <li>
              <span className="label">Opus</span>
              <span>Modern codec for very small files with surprisingly high quality.</span>
            </li>
          </ul>

          <h3>Features</h3>
          <ul>
            <li>
              <span className="label">Automatic BPM</span>
              <span>Get the tempo instantly when analysis is enabled.</span>
            </li>
            <li>
              <span className="label">Key detection</span>
              <span>Know the musical key (Major/Minor) for cleaner mashups and harmonic mixes.</span>
            </li>
            <li>
              <span className="label">Smart naming</span>
              <span>Files can be auto‑named as TrackName‑BPM‑Key.ext when analysis is active.</span>
            </li>
            <li>
              <span className="label">Audio focus</span>
              <span>The converter prefers audio/lyrics uploads on YouTube, avoiding videoclip versions when possible.</span>
            </li>
            <li>
              <span className="label">Single tracks</span>
              <span>Playlists are not supported yet – convert one track at a time for maximum stability.</span>
            </li>
          </ul>
        </ConversionInfo>
      </ConverterContainer>
    </PageTransition>
  );
});


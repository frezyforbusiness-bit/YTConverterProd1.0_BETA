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

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  cursor: pointer;
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const CheckboxInput = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
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
    margin-bottom: ${({ theme }) => theme.spacing.sm};
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0 0 ${({ theme }) => theme.spacing.md};
  }

  li::before {
    content: '– ';
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
          Audio Converter – paste a YouTube or Spotify track, pick the format and hit convert. Use BPM &amp; key
          analysis when you need DJ‑ready files.
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

          <InfoBox>
            <CheckboxRow>
              <CheckboxLabel>
                <CheckboxInput
                  type="checkbox"
                  checked={analyzeBpmKey}
                  onChange={(e) => setAnalyzeBpmKey(e.target.checked)}
                  disabled={loading}
                />
                <span>Analyze BPM &amp; Key (recommended for DJs/producers)</span>
              </CheckboxLabel>
            </CheckboxRow>
            {analyzeBpmKey ? (
              <>
                🎹 Automatic BPM &amp; Key Detection enabled. Files will be named:
                {' '}
                <strong>TrackName-BPM-Key.ext</strong>
              </>
            ) : (
              <>
                ⚡ Fast mode: BPM &amp; Key analysis disabled. Files will be named:
                {' '}
                <strong>TrackName.ext</strong>
              </>
            )}
            <br />
            <br />
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
          <h3>Available formats</h3>
          <ul>
            <li>MP3 – good balance between size and compatibility.</li>
            <li>WAV – uncompressed, recommended for production and further processing.</li>
            <li>FLAC – lossless compression, smaller than WAV but same quality.</li>
            <li>M4A/AAC – optimized for streaming and mobile playback.</li>
            <li>OGG / Opus – modern codecs for very small files at good quality.</li>
          </ul>
          <h3>Conversion notes</h3>
          <ul>
            <li>Source audio is taken from YouTube or Spotify track metadata and converted server‑side.</li>
            <li>The system always tries to pick audio/lyrics versions, avoiding official videoclips when possible.</li>
            <li>Analysis (BPM &amp; key) slightly increases processing time but is ideal for DJ‑ready files.</li>
            <li>Playlists are not supported yet: convert one track at a time for best stability.</li>
          </ul>
        </ConversionInfo>
      </ConverterContainer>
    </PageTransition>
  );
});


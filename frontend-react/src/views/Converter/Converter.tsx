import { StudioArtwork } from '../../components/UI/StudioArtwork';
import { Link } from 'react-router-dom';
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
  max-width: 1280px;
  margin: 0 auto;
  padding: 48px 32px 48px;
  overflow: visible;
  @media (max-width: 640px) { padding: 16px 16px 32px; }
`;

const Workspace = styled.div`
  display: grid; grid-template-columns: 1fr 1.1fr; gap: 80px; align-items: start;
  @media(max-width: 1000px) { gap: 40px; }
  @media(max-width: 900px) { grid-template-columns: 1fr; gap: 28px; }
`;
const Intro = styled.section`
  padding-top: 20px;
  h1 { font-family: ${({ theme }) => theme.typography.fonts.heading}; font-size: clamp(3.5rem, 6.1vw, 5.7rem); line-height: 1.02; letter-spacing: -.065em; font-weight: 500; margin: 28px 0; animation: studio-reveal .95s cubic-bezier(.16, 1, .3, 1) both; }
  h1 em { color: var(--color-accent); font-family: "Newsreader Variable", Georgia, serif; font-weight: 400; letter-spacing: -.055em; }
  p { max-width: 340px; color: var(--color-text-secondary); line-height: 1.7; animation: studio-reveal .9s cubic-bezier(.16, 1, .3, 1) .12s both; }
  @media(max-width: 900px) { padding-top: 0; h1 { margin: 16px 0; } }
  @media(max-width: 640px) { h1 { font-size: 3rem; } p { font-size: .875rem; line-height: 1.6; } }
`;
const Eyebrow = styled.div`
  font: 11px 'Courier New', monospace; letter-spacing: .1em; text-transform: uppercase;
  display: flex; align-items: center; gap: 10px;
  &::before { content: ''; width: 7px; height: 7px; background: var(--color-accent); border-radius: 50%; }
`;
const PanelHeading = styled.div`
  display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border);
  margin-bottom: 28px; padding-bottom: 20px;
  h2 { font-size: 20px; letter-spacing: -.04em; }
  span { font: 10px monospace; color: var(--color-text-muted); }
  @media(max-width: 640px) { margin-bottom: 20px; padding-bottom: 16px; }
`;
const FormatStrip = styled.div`
  border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); padding: 22px 0;
  margin-top: 36px; display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap;
  span { font: 10px monospace; text-transform: uppercase; letter-spacing: .08em; color: var(--color-text-secondary); }
  strong { font-size: 18px; letter-spacing: -.03em; }
  @media(max-width: 640px) { display: grid; grid-template-columns: repeat(3, 1fr); span { grid-column: 1 / -1; } }
`;
const NextTool = styled(Link)`
  display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: 40px;
  text-decoration: none; border: 1px solid var(--color-border); padding: 28px;
  small { font: 11px monospace; color: var(--color-text-secondary); } h2 { font-size: clamp(1.5rem, 3vw, 2rem); margin-top: 8px; letter-spacing: -.04em; }
  transition: background .3s ease;
  > span { color: var(--color-accent); transition: transform .5s cubic-bezier(.16, 1, .3, 1); }
  @media (hover: hover) { &:hover { background: var(--color-bg-secondary); } &:hover > span { transform: translate(4px, -4px); } }
`;

const AnalysisModeSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  padding: 0;
`;

const ModeToggleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
  @media(max-width: 640px) { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; button { min-width: 0; padding: 12px; font-size: .8125rem; } }
`;

const ModeToggleButton = styled.button<{ $active?: boolean }>`
  flex: 1 1 170px;
  min-height: 76px;
  span { display: block; margin-top: 4px; font-size: .8125rem; color: ${({ theme }) => theme.colors.text.secondary}; }
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.colors.accent.primary : theme.colors.accent.border)};
  background: ${({ theme, $active }) =>
    $active ? 'var(--color-accent-soft)' : theme.colors.background.card};
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
  animation: studio-panel .95s cubic-bezier(.16, 1, .3, 1) .15s both;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  @media (max-width: 640px) { padding: 20px; input, select { padding: 12px; min-height: 48px; } }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Select = styled.select`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  border: 1px solid ${({ theme }) => theme.colors.accent.border};
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

const InfoBox = styled.details`
  margin-bottom: 20px;
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: .8125rem;
  summary { cursor: pointer; padding: 8px 0; }
  p { padding-top: 8px; line-height: 1.6; }
`;

const StyledLabel = styled.label`
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-transform: none;
  letter-spacing: 0;
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
  details { border-top: 1px solid ${({ theme }) => theme.colors.accent.border}; }
  summary { padding: 16px 0; cursor: pointer; color: ${({ theme }) => theme.colors.text.primary}; font-weight: 600; }

  h3 {
    font-family: ${({ theme }) => theme.typography.fonts.accent};
    font-size: ${({ theme }) => theme.typography.sizes.body};
    text-transform: none;
    letter-spacing: 0;
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
    background: transparent;
    border-bottom: 1px solid ${({ theme }) => theme.colors.accent.border};
    border-radius: 0;
    padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
    margin-bottom: ${({ theme }) => theme.spacing.xs};
    box-shadow: none;
    display: flex;
    align-items: baseline;
    gap: ${({ theme }) => theme.spacing.sm};
  }

  li span.label {
    display: inline-block;
    min-width: 96px;
    flex: 0 0 96px;
    font-weight: ${({ theme }) => theme.typography.weights.semibold};
    color: ${({ theme }) => theme.colors.text.primary};
  }

  li span.badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid ${({ theme }) => theme.colors.accent.primary};
    font-size: 0.7rem;
    text-transform: none;
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
        <Workspace>
        <Intro>
          <Eyebrow>Tools for the music-minded</Eyebrow>
          <h1>Good music.<br />Less <em>friction.</em></h1>
          <p>Convert your audio. Find its tempo and key. Stay in the flow.</p>
          <StudioArtwork />
        </Intro>
        <ConverterCard>
          <PanelHeading><h2>Audio converter</h2><span>TOOL / 01</span></PanelHeading>
          <FormGroup>
            <Input
              label="01 — Your source"
              type="url"
              placeholder="Paste a YouTube or Spotify link"
              value={youtubeUrl}
              onChange={handleUrlChange}
              disabled={loading}
              fullWidth
            />
          </FormGroup>

          <FormGroup>
            <StyledLabel htmlFor="audio-format">
              02 — Output format
            </StyledLabel>
            <Select id="audio-format" value={format} onChange={(e) => setFormat(e.target.value)} disabled={loading}>
              <option value="mp3">MP3</option>
              <option value="wav">WAV (Recommended for Production)</option>
              <option value="flac">FLAC (Lossless)</option>
              <option value="ogg">OGG</option>
              <option value="m4a">M4A/AAC</option>
              <option value="opus">Opus</option>
            </Select>
          </FormGroup>

          <AnalysisModeSection>
            <StyledLabel as="div" id="conversion-mode-label">03 — Processing</StyledLabel>
            <ModeToggleRow role="group" aria-labelledby="conversion-mode-label">
              <ModeToggleButton
                type="button"
                $active={!analyzeBpmKey}
                aria-pressed={!analyzeBpmKey}
                disabled={loading}
                onClick={() => !loading && setAnalyzeBpmKey(false)}
              >
                Fast convert
                <span>Audio only.</span>
              </ModeToggleButton>
              <ModeToggleButton
                type="button"
                $active={analyzeBpmKey}
                aria-pressed={analyzeBpmKey}
                disabled={loading}
                onClick={() => !loading && setAnalyzeBpmKey(true)}
              >
                Convert & analyze
                <span>Audio, BPM & key.</span>
              </ModeToggleButton>
            </ModeToggleRow>
          </AnalysisModeSection>

          <InfoBox>
            <summary>YouTube &amp; Spotify · Single tracks only</summary>
            <p>Playlists are not supported yet. Spotify links are matched to an audio or lyrics version on YouTube; the converter prefers these over official videoclips.</p>
          </InfoBox>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onClick={handleConvert}
            disabled={loading || !youtubeUrl.trim()}
          >
            {analyzeBpmKey ? 'Convert & analyze →' : 'Convert audio →'}
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
        </Workspace>
        <FormatStrip><span>Export formats</span><strong>MP3</strong><strong>WAV</strong><strong>FLAC</strong><strong>OGG</strong><strong>AAC</strong><strong>Opus</strong></FormatStrip>
        <NextTool to="/mixmaster/analyzer"><div><small>TOOL / 02 — MIX &amp; MASTER ANALYZER</small><h2>Get to know your sound.</h2></div><span aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 19 19 5M5 5h14v14" /></svg></span></NextTool>
        <ConversionInfo>
          <details>
          <summary>Audio format guide</summary>
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

          </details>
          <details>
          <summary>What’s included</summary>
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
          </details>
        </ConversionInfo>
      </ConverterContainer>
    </PageTransition>
  );
});


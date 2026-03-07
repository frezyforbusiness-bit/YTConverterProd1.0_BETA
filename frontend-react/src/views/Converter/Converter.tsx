import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { PageTransition } from '../../components/common/PageTransition';
import { Card } from '../../components/UI/Card';
import { Input } from '../../components/UI/Input';
import { Button } from '../../components/UI/Button';
import { ProgressBar } from '../../components/UI/ProgressBar';
import { converterService, type TaskStatus } from '../../services/converter.service';
import { usePolling } from '../../hooks/usePolling';

function statusChanged(prev: TaskStatus | null, next: TaskStatus): boolean {
  if (!prev) return true;
  return (
    prev.status !== next.status ||
    prev.progress !== next.progress ||
    (prev.message ?? '') !== (next.message ?? '')
  );
}

const ConverterContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const ConverterCard = styled(Card)`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  contain: layout;
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
  min-height: 72px;
  contain: layout;
`;

export const Converter: React.FC = () => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [format, setFormat] = useState('mp3');
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<TaskStatus | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const lastStatusRef = useRef<TaskStatus | null>(null);

  const handleConvert = useCallback(async () => {
    if (!youtubeUrl.trim()) {
      setMessage({ type: 'error', text: 'Please enter a YouTube URL' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      setStatus(null);
      lastStatusRef.current = null;
      const response = await converterService.startConversion({
        youtube_url: youtubeUrl,
        format,
      });
      setTaskId(response.task_id);
    } catch (error: any) {
      setLoading(false);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to start conversion',
      });
    }
  }, [youtubeUrl, format]);

  usePolling({
    enabled: !!taskId && status?.status !== 'done' && status?.status !== 'error',
    interval: 2000,
    onPoll: async () => {
      if (!taskId) return;
      try {
        const currentStatus = await converterService.getStatus(taskId);
        if (statusChanged(lastStatusRef.current, currentStatus)) {
          lastStatusRef.current = currentStatus;
          setStatus(currentStatus);
        }

        if (currentStatus.status === 'done') {
          setLoading(false);
          // Download file
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
            lastStatusRef.current = null;
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
          lastStatusRef.current = null;
        }
      } catch (error: any) {
        console.error('Polling error:', error);
      }
    },
  });

  return (
    <PageTransition>
      <ConverterContainer>
        <ConverterCard>
          <FormGroup>
            <Input
              label="YouTube URL"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
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
            🎹 Automatic BPM & Key Detection - Perfect for music producers! Files will be named:
            TrackName-BPM-Key.ext
          </InfoBox>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onClick={handleConvert}
            disabled={loading || !youtubeUrl.trim()}
          >
            🚀 Convert & Analyze
          </Button>

          {(loading || status) && (
            <ProgressWrapper>
              {status ? (
                <ProgressBar
                  progress={status.progress}
                  label={status.message || 'Processing...'}
                  pulsing={false}
                  shimmer={false}
                />
              ) : (
                <ProgressBar progress={0} label="Starting..." showPercentage={true} />
              )}
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
      </ConverterContainer>
    </PageTransition>
  );
};


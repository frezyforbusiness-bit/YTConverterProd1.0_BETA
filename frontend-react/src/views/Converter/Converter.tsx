import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { PageTransition } from '../../components/common/PageTransition';
import { Card } from '../../components/UI/Card';
import { Input } from '../../components/UI/Input';
import { Button } from '../../components/UI/Button';
import { ProgressBar } from '../../components/UI/ProgressBar';
import { converterService, type TaskStatus, type PlaylistTaskEntry } from '../../services/converter.service';
import { usePolling } from '../../hooks/usePolling';

const ConverterContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
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

const PlaylistList = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const PlaylistItemCard = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.accent.border};
`;

const PlaylistItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  gap: ${({ theme }) => theme.spacing.md};
`;

const PlaylistItemTitle = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const PlaylistItemSubtitle = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const SmallButton = styled(Button)`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  font-size: ${({ theme }) => theme.typography.sizes.small};
`;

export const Converter: React.FC = React.memo(() => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [format, setFormat] = useState('mp3');
  const [analyzeBpmKey, setAnalyzeBpmKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<TaskStatus | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [playlistTasks, setPlaylistTasks] = useState<
    (PlaylistTaskEntry & { status?: TaskStatus; downloaded?: boolean })[]
  >([]);

  const isSpotifyPlaylist = useCallback((url: string) => {
    const lower = url.toLowerCase();
    return lower.includes('open.spotify.com/playlist/') || lower.startsWith('spotify:playlist:');
  }, []);

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
      setPlaylistTasks([]);

      if (isSpotifyPlaylist(youtubeUrl)) {
        // Playlist flow (Spotify playlists only, for now)
        const response = await converterService.startPlaylistConversion({
          youtube_url: youtubeUrl,
          format,
          analyze_bpm_key: analyzeBpmKey,
        });
        const entries = response.playlist.started_tasks;
        if (!entries || entries.length === 0) {
          setLoading(false);
          setMessage({
            type: 'error',
            text: 'No tracks could be started from this playlist.',
          });
          return;
        }
        setPlaylistTasks(entries.map((e) => ({ ...e, downloaded: false })));
        setLoading(false);
        setMessage({
          type: 'success',
          text: `Started conversion for ${entries.length} track(s) from the playlist.`,
        });
      } else {
        // Single track/video flow
        const response = await converterService.startConversion({
          youtube_url: youtubeUrl,
          format,
          analyze_bpm_key: analyzeBpmKey,
        });
        setTaskId(response.task_id);
      }
    } catch (error: any) {
      setLoading(false);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to start conversion',
      });
    }
  }, [youtubeUrl, format, analyzeBpmKey, isSpotifyPlaylist]);

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

  // Polling for playlist tasks
  usePolling({
    enabled: playlistTasks.length > 0,
    interval: 1000,
    onPoll: async () => {
      if (!playlistTasks.length) return;
      try {
        const updated = [...playlistTasks];
        for (let i = 0; i < updated.length; i += 1) {
          const item = updated[i];
          if (item.status && (item.status.status === 'done' || item.status.status === 'error')) {
            continue;
          }
          const st = await converterService.getStatus(item.task_id);
          updated[i] = { ...item, status: st };
        }
        setPlaylistTasks(updated);
      } catch (error) {
        console.error('Playlist polling error:', error);
      }
    },
  });

  const handleDownloadTrack = useCallback(
    async (task: PlaylistTaskEntry & { status?: TaskStatus; downloaded?: boolean }) => {
      if (!task.status || task.status.status !== 'done' || task.downloaded) return;
      try {
        const blob = await converterService.downloadFile(task.task_id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const defaultName = `${task.track_name || 'Track'}.${format}`;
        a.download = task.status.file_path?.split('/').pop() || defaultName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setPlaylistTasks((prev) =>
          prev.map((p) => (p.task_id === task.task_id ? { ...p, downloaded: true } : p)),
        );
      } catch (error: any) {
        setMessage({
          type: 'error',
          text: error.message || 'Download failed for this track',
        });
      }
    },
    [format],
  );

  return (
    <PageTransition>
      <ConverterContainer>
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
            : You can paste a single YouTube video URL, a single Spotify track URL, or a Spotify
            playlist URL (the first N tracks will be converted in batch). The converter always
            tries to pick an audio/lyrics version on YouTube, not the official videoclip.
          </InfoBox>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onClick={handleConvert}
            disabled={loading || !youtubeUrl.trim()}
          >
            {isSpotifyPlaylist(youtubeUrl)
              ? '🚀 Convert Playlist'
              : analyzeBpmKey
                ? '🚀 Convert & Analyze'
                : '🚀 Convert'}
          </Button>

          {status && !playlistTasks.length && (
            <ProgressWrapper>
              <ProgressBar
                progress={status.progress}
                label={status.message || 'Processing...'}
                pulsing={status.status === 'processing'}
                shimmer={status.status === 'processing'}
              />
            </ProgressWrapper>
          )}

          {!!playlistTasks.length && (
            <PlaylistList>
              {playlistTasks.map((t) => (
                <PlaylistItemCard key={t.task_id}>
                  <PlaylistItemHeader>
                    <div>
                      <PlaylistItemTitle>{t.track_name}</PlaylistItemTitle>
                      <PlaylistItemSubtitle>{t.artists}</PlaylistItemSubtitle>
                    </div>
                    <SmallButton
                      variant="secondary"
                      size="sm"
                      disabled={!t.status || t.status.status !== 'done' || t.downloaded}
                      onClick={() => handleDownloadTrack(t)}
                    >
                      {t.downloaded
                        ? 'Downloaded'
                        : t.status?.status === 'done'
                          ? 'Download'
                          : t.status?.status === 'error'
                            ? 'Error'
                            : 'Processing...'}
                    </SmallButton>
                  </PlaylistItemHeader>
                  {t.status && (
                    <ProgressBar
                      progress={t.status.progress}
                      label={t.status.message || 'Processing...'}
                      pulsing={t.status.status === 'processing'}
                      shimmer={t.status.status === 'processing'}
                    />
                  )}
                </PlaylistItemCard>
              ))}
            </PlaylistList>
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
});


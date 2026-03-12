import { apiClient } from './api';

export interface ConvertRequest {
  youtube_url: string;
  format: string;
  analyze_bpm_key?: boolean;
}

export interface ConvertResponse {
  task_id: string;
}

export interface TaskStatus {
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
  message?: string;
  file_path?: string;
  error?: string;
  bpm?: number;
  key?: string;
}

export interface PlaylistTaskEntry {
  task_id: string;
  track_name: string;
  artists: string;
  youtube_url: string;
}

export interface PlaylistConvertResponse {
  playlist: {
    source_url: string;
    total_tracks: number;
    started_tasks: PlaylistTaskEntry[];
  };
}

export const converterService = {
  async startConversion(data: ConvertRequest): Promise<ConvertResponse> {
    return apiClient.post<ConvertResponse>('/convert', data);
  },

  async startPlaylistConversion(data: ConvertRequest): Promise<PlaylistConvertResponse> {
    return apiClient.post<PlaylistConvertResponse>('/convert/playlist', data);
  },

  async getStatus(taskId: string): Promise<TaskStatus> {
    return apiClient.get<TaskStatus>(`/status/${taskId}`);
  },

  async downloadFile(taskId: string): Promise<Blob> {
    return apiClient.download(`/download/${taskId}`);
  },
};


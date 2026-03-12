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

export const converterService = {
  async startConversion(data: ConvertRequest): Promise<ConvertResponse> {
    return apiClient.post<ConvertResponse>('/convert', data);
  },

  async getStatus(taskId: string): Promise<TaskStatus> {
    return apiClient.get<TaskStatus>(`/status/${taskId}`);
  },

  async downloadFile(taskId: string): Promise<Blob> {
    return apiClient.download(`/download/${taskId}`);
  },
};


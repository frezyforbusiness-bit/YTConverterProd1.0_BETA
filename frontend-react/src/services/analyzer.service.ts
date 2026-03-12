export interface AnalysisResult {
  trackName: string;
  sampleRate: string;
  bitDepth: string;
  clipping: boolean;
  monoCompatibility: boolean;
  integratedLoudness: number;
  truePeak: number;
  phaseIssues: boolean;
  stereoField: string;
  suggestedChanges: { title: string; description: string; isIssue: boolean }[];
}

export const analyzerService = {
  async analyzeTrack(params: {
    file: File;
    mixType: 'mix' | 'master' | null;
    genre: string | null;
    contentType: 'beat' | 'song' | null;
  }): Promise<AnalysisResult> {
    const formData = new FormData();
    formData.append('file', params.file);
    if (params.mixType) formData.append('mix_type', params.mixType);
    if (params.genre) formData.append('genre', params.genre);
    if (params.contentType) formData.append('content_type', params.contentType);

    // Replicate api base URL logic from api.ts
    const env = (import.meta as unknown as { env?: { VITE_API_URL?: string; PROD?: boolean } }).env || {};
    let apiBase = '';
    if (env.VITE_API_URL) {
      apiBase = env.VITE_API_URL;
    } else if (!env.PROD) {
      apiBase = 'http://localhost:5000';
    }

    const response = await fetch(`${apiBase}/api/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `HTTP error ${response.status}`);
    }

    return response.json();
  },
};


/**
 * AuraShorts OS - Backend API Client
 * Connects Frontend Dashboard directly to FastAPI Orchestration Engine.
 * Ref: docs/API_SPEC.md & UI_UX_SPEC.md
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  } | null;
  request_id?: string;
  timestamp?: string;
}

export interface BackendHealthData {
  status: string;
  service: string;
  version: string;
  database: string;
  engine: string;
  timestamp: string;
}

export interface ApiTaskItem {
  id: string;
  task_name: string;
  task_type: string;
  status: string;
  priority: number;
  dependencies: string[];
  current_attempt: number;
  duration_ms?: number;
  output_payload?: any;
}

export interface ApiPlanDetail {
  plan_id: string;
  plan_type: string;
  status: string;
  progress_percent: number;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  tasks: ApiTaskItem[];
  context_metadata: Record<string, any>;
  created_at?: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    const data: ApiResponse<T> = await res.json();
    if (!res.ok && !data.error) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      data: null as any,
      error: {
        code: 'NETWORK_OR_SERVER_UNREACHABLE',
        message: err.message || 'Không thể kết nối tới backend server.',
      },
    };
  }
}

export const OrchestratorApi = {
  async getHealth(): Promise<ApiResponse<BackendHealthData>> {
    return request<BackendHealthData>('/health');
  },

  async getPlan(planId: string): Promise<ApiResponse<ApiPlanDetail>> {
    return request<ApiPlanDetail>(`/orchestrator/plans/${planId}`);
  },

  async listPlans(): Promise<ApiResponse<any[]>> {
    return request<any[]>('/orchestrator/plans');
  },

  async createPlan(payload: {
    source_url: string;
    target_duration_seconds?: number;
    niche?: string;
    aspect_ratio?: string;
    auto_start?: boolean;
    scenes?: any[];
    force_fresh?: boolean;
  }): Promise<ApiResponse<ApiPlanDetail>> {
    return request<ApiPlanDetail>('/orchestrator/plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async pausePlan(planId: string): Promise<ApiResponse<any>> {
    return request<any>(`/orchestrator/plans/${planId}/pause`, {
      method: 'POST',
    });
  },

  async resumePlan(planId: string): Promise<ApiResponse<any>> {
    return request<any>(`/orchestrator/plans/${planId}/resume`, {
      method: 'POST',
    });
  },

  async cancelPlan(planId: string): Promise<ApiResponse<any>> {
    return request<any>(`/orchestrator/plans/${planId}/cancel`, {
      method: 'POST',
    });
  },

  async retryTask(taskId: string): Promise<ApiResponse<any>> {
    return request<any>(`/orchestrator/tasks/${taskId}/retry`, {
      method: 'POST',
    });
  },

  async getTaskCheckpoints(taskId: string): Promise<ApiResponse<any[]>> {
    return request<any[]>(`/orchestrator/tasks/${taskId}/checkpoints`);
  },

  async getTaskLogs(taskId: string): Promise<ApiResponse<any[]>> {
    return request<any[]>(`/orchestrator/tasks/${taskId}/logs`);
  },

  // AI Providers Endpoints
  async getProviders(): Promise<ApiResponse<any[]>> {
    return request<any[]>('/providers');
  },

  async addCustomProvider(payload: {
    name: string;
    base_url: string;
    api_key?: string;
    priority?: number;
  }): Promise<ApiResponse<any>> {
    return request<any>('/providers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateProvider(id: string, payload: {
    api_key?: string;
    priority?: number;
    status?: string;
  }): Promise<ApiResponse<any>> {
    return request<any>(`/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteProvider(id: string): Promise<ApiResponse<any>> {
    return request<any>(`/providers/${id}`, {
      method: 'DELETE',
    });
  },

  async testProvider(id: string): Promise<ApiResponse<{
    provider_id: string;
    connected: boolean;
    status: string;
    latency_ms: number;
    message: string;
  }>> {
    return request<any>(`/providers/${id}/test`, {
      method: 'POST',
    });
  },

  async discoverProviderModels(id: string): Promise<ApiResponse<{
    provider_id: string;
    models_count: number;
    models: any[];
  }>> {
    return request<any>(`/providers/${id}/discover`, {
      method: 'POST',
    });
  },
};

// ============================================================================
// Phase 5: Social Publishing & Content Calendar API
// ============================================================================

export interface ApiSocialAccount {
  id: string;
  platform: 'youtube' | 'tiktok' | 'facebook' | 'instagram' | string;
  account_name: string;
  external_account_id: string;
  niche_id?: string;
  timezone?: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'TOKEN_EXPIRED';
  credential_reference: string;
  videos_per_day: number;
  post_times: string[];
  branding_config?: any;
  created_at?: string;
}

export interface ApiPostQueueItem {
  id: string;
  video_project_id?: string;
  account_id: string;
  title: string;
  caption: string;
  hashtags: string[];
  scheduled_time: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' | 'REJECTED' | 'PUBLISH_RESULT_UNKNOWN';
  idempotency_key: string;
  external_post_id?: string;
  post_url?: string;
  posted_time?: string;
  error_message?: string;
  created_at?: string;
}

export interface ApiMetadataResult {
  title: string;
  caption: string;
  hashtags: string[];
  platform: string;
  niche: string;
  estimated_char_count: number;
}

export const PublishingApi = {
  async getAccounts(): Promise<ApiResponse<ApiSocialAccount[]>> {
    return request<ApiSocialAccount[]>('/social/accounts');
  },

  async createAccount(payload: {
    platform: string;
    account_name: string;
    external_account_id: string;
    niche_id?: string;
    timezone?: string;
    access_token?: string;
    refresh_token?: string;
    videos_per_day?: number;
    post_times?: string[];
    branding_config?: any;
  }): Promise<ApiResponse<ApiSocialAccount>> {
    return request<ApiSocialAccount>('/social/accounts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteAccount(id: string): Promise<ApiResponse<{ account_id: string; deleted: boolean; message: string }>> {
    return request<any>(`/social/accounts/${id}`, {
      method: 'DELETE',
    });
  },

  async testAccount(id: string): Promise<ApiResponse<{
    account_id: string;
    platform: string;
    account_name: string;
    status: string;
    latency_ms: number;
    tested_at: string;
    channel_info: any;
  }>> {
    return request<any>(`/social/accounts/${id}/test`, {
      method: 'POST',
    });
  },

  async getQueue(status?: string): Promise<ApiResponse<ApiPostQueueItem[]>> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<ApiPostQueueItem[]>(`/publishing/queue${query}`);
  },

  async enqueuePost(payload: {
    video_project_id?: string;
    account_id: string;
    title: string;
    caption: string;
    hashtags?: string[];
    scheduled_time: string;
    status?: string;
  }): Promise<ApiResponse<ApiPostQueueItem>> {
    return request<ApiPostQueueItem>('/publishing/queue', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async approvePost(id: string): Promise<ApiResponse<{ id: string; status: string; message: string }>> {
    return request<any>(`/publishing/${id}/approve`, {
      method: 'POST',
    });
  },

  async rejectPost(id: string, reason: string): Promise<ApiResponse<{ id: string; status: string; reason: string; message: string }>> {
    return request<any>(`/publishing/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async publishNow(id: string): Promise<ApiResponse<{
    success: boolean;
    status: string;
    post_url: string;
    external_post_id: string;
    latency_ms: number;
    message: string;
  }>> {
    return request<any>(`/publishing/${id}/publish-now`, {
      method: 'POST',
    });
  },

  async reconcilePost(id: string): Promise<ApiResponse<{
    is_reconciled: boolean;
    found_on_platform: boolean;
    external_post_id?: string;
    post_url?: string;
    status: string;
    message: string;
  }>> {
    return request<any>(`/publishing/${id}/reconcile`, {
      method: 'POST',
    });
  },

  async getAttempts(id: string): Promise<ApiResponse<any[]>> {
    return request<any[]>(`/publishing/${id}/attempts`);
  },

  async generateMetadata(payload: {
    title: string;
    content_summary?: string;
    platform?: string;
    niche?: string;
  }): Promise<ApiResponse<ApiMetadataResult>> {
    return request<ApiMetadataResult>('/publishing/generate-metadata', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export interface ApiTrendItem {
  id: string;
  niche_id: string;
  title: string;
  summary: string;
  trend_score: number;
  confidence: number;
  sources_count: number;
  verification_status: string;
  primary_publisher: string;
  published_at: string;
  url?: string;
}

export const TrendsApi = {
  async getTrends(niche?: string): Promise<ApiResponse<ApiTrendItem[]>> {
    const query = niche && niche !== 'all' ? `?niche=${encodeURIComponent(niche)}` : '';
    return request<ApiTrendItem[]>(`/trends${query}`);
  },

  async getTrendsRadarStatus(): Promise<ApiResponse<{
    last_synced_at: string;
    next_refresh_seconds: number;
    ttl_seconds: number;
    scanned_sources_count: number;
    total_topics_today: number;
    filtered_count: number;
  }>> {
    return request<any>('/trends/status');
  },

  async scanTrends(): Promise<ApiResponse<{ scanned_sources: number; new_trends_found: number; message: string }>> {
    return request<any>('/trends/scan', {
      method: 'POST',
    });
  },

  async convertTrendToPlan(trendId: string, options: { target_duration_seconds?: number; aspect_ratio?: string; auto_start?: boolean } = {}): Promise<ApiResponse<ApiPlanDetail>> {
    return request<ApiPlanDetail>(`/trends/${trendId}/convert-to-plan`, {
      method: 'POST',
      body: JSON.stringify({
        target_duration_seconds: options.target_duration_seconds || 60,
        aspect_ratio: options.aspect_ratio || '9:16',
        auto_start: options.auto_start ?? true,
      }),
    });
  },
};

export interface ApiVoiceItem {
  id: string;
  name: string;
  gender: 'male' | 'female';
  voice_id: string;
  rate: string;
  pitch: string;
  accent: string;
  badge: string;
  description: string;
}

export const StudioApi = {
  getBackendBaseUrl(): string {
    return API_BASE_URL.replace('/api/v1', '');
  },

  getRenderedVideoUrl(projectId?: string): string {
    const backendHost = this.getBackendBaseUrl();
    if (projectId) {
      const sanitized = projectId.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 40);
      return `${backendHost}/storage/artifacts/rendered_${sanitized}.mp4`;
    }
    return `${backendHost}/storage/artifacts/rendered_short_1080x1920.mp4`;
  },

  getVoiceoverAudioUrl(projectId?: string): string {
    const backendHost = this.getBackendBaseUrl();
    if (projectId) {
      const sanitized = projectId.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 40);
      return `${backendHost}/storage/artifacts/voiceover_${sanitized}.mp3`;
    }
    return `${backendHost}/storage/artifacts/voiceover_neural.mp3`;
  },

  async getVoices(): Promise<ApiResponse<ApiVoiceItem[]>> {
    return request<ApiVoiceItem[]>('/studio/voices');
  },

  async synthesizeVoice(payload: {
    project_id?: string;
    text?: string;
    scenes?: any[];
    voice_id?: string;
    voice_preset_id?: string;
    rate?: string;
    pitch?: string;
  }): Promise<ApiResponse<{
    audio_url: string;
    global_audio_url: string;
    duration_seconds: number;
    word_count: number;
    voice_id: string;
    rate: string;
    pitch: string;
    project_id: string;
  }>> {
    return request<any>('/studio/synthesize-voice', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async renderVideo(payload: {
    project_id: string;
    title?: string;
    scenes: any[];
    voice_id?: string;
    voice_preset_id?: string;
    subtitle_mode?: string;
    template?: string;
    account_id?: string;
    scheduled_time?: string;
  }): Promise<ApiResponse<{
    video_url: string;
    global_video_url: string;
    audio_url: string;
    duration_seconds: number;
    scenes_count: number;
    project_id: string;
    voice_id: string;
    quality_audit?: any;
  }>> {
    return request<any>('/studio/render-video', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export interface ApiExportedVideo {
  id: string;
  project_id: string;
  title: string;
  status: 'RENDERING' | 'READY' | 'SCHEDULED' | 'PUBLISHED' | 'CLEANED_UP' | 'FAILED' | 'PENDING_APPROVAL';
  raw_status?: string;
  progress_percent: number;
  current_step: string;
  video_url: string | null;
  duration_seconds: number | null;
  file_size_mb: number;
  file_exists: boolean;
  is_cleaned_up: boolean;
  account: {
    id: string;
    account_name: string;
    platform: string;
  } | null;
  scheduled_time: string | null;
  posted_time: string | null;
  post_url: string | null;
  cleanup_time: string | null;
  remaining_cleanup_seconds: number | null;
  created_at: string | null;
}

export const ExportedVideosApi = {
  async getExportedVideos(): Promise<ApiResponse<ApiExportedVideo[]>> {
    return request<ApiExportedVideo[]>('/exported-videos');
  },

  async publishNow(id: string): Promise<ApiResponse<any>> {
    return request<any>(`/exported-videos/${id}/publish-now`, {
      method: 'POST',
    });
  },

  async updateSchedule(id: string, payload: { account_id?: string; scheduled_time?: string }): Promise<ApiResponse<any>> {
    return request<any>(`/exported-videos/${id}/schedule`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteVideo(id: string): Promise<ApiResponse<any>> {
    return request<any>(`/exported-videos/${id}`, {
      method: 'DELETE',
    });
  },

  async triggerTick(): Promise<ApiResponse<any>> {
    return request<any>('/exported-videos/trigger-tick', {
      method: 'POST',
    });
  },
};





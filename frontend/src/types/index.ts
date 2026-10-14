// Domain Types matching PROJECT.md Master Specification

export type NicheId = 'tech' | 'finance' | 'science' | 'history';

export type ClaimVerificationStatus = 
  | 'UNVERIFIED' 
  | 'SUPPORTED' 
  | 'CONFLICTING_SOURCES' 
  | 'INSUFFICIENT_EVIDENCE' 
  | 'VERIFIED_BY_REVIEW';

export type MediaRightsStatus = 
  | 'UNKNOWN' 
  | 'NEEDS_REVIEW' 
  | 'LICENSED' 
  | 'USER_OWNED' 
  | 'PUBLIC_DOMAIN_VERIFIED' 
  | 'RESTRICTED' 
  | 'REJECTED';

export type ProviderStatus = 
  | 'HEALTHY' 
  | 'DEGRADED' 
  | 'OPEN_CIRCUIT' 
  | 'DISABLED' 
  | 'UNKNOWN';

export type FreeStatus = 
  | 'FREE_CONFIRMED' 
  | 'FREE_LIMITED' 
  | 'TRIAL' 
  | 'PAID' 
  | 'UNKNOWN' 
  | 'DISCONTINUED';

export type AiCapability = 
  | 'text_generation' 
  | 'structured_output' 
  | 'vision' 
  | 'video_understanding' 
  | 'image_generation' 
  | 'text_to_speech' 
  | 'forced_alignment';

export type VideoProjectStatus = 
  | 'DRAFT' 
  | 'GENERATING_SCRIPT' 
  | 'STORYBOARD_READY' 
  | 'WAITING_FOR_APPROVAL' 
  | 'RENDERING' 
  | 'READY_TO_PUBLISH' 
  | 'PUBLISHED' 
  | 'FAILED';

export interface StoryboardScene {
  id: string;
  order: number;
  text: string;
  estimated_duration_seconds: number;
  search_keywords: string[];
  visual_intent: string;
  layout_type: 'fullscreen' | 'split_screen' | 'blurred_bg' | 'cutout_focus';
  caption_emphasis: string[];
  source_claim_ids: string[];
  media_candidate?: {
    id: string;
    title: string;
    source: string;
    thumbnail_url: string;
    rights_status: MediaRightsStatus;
    relevance_score: number;
    license_name: string;
  };
}

export interface VideoProject {
  id: string;
  title: string;
  niche: string;
  target_duration_seconds: number;
  status: VideoProjectStatus;
  current_stage: string;
  created_at: string;
  scenes_count: number;
  scenes: StoryboardScene[];
}

export interface AiModel {
  id: string;
  provider_id: string;
  model_identifier: string;
  display_name: string;
  capabilities: AiCapability[];
  free_status: FreeStatus;
  context_limit: string;
  status: 'ACTIVE' | 'DEGRADED' | 'DISABLED';
  verified_quota?: string;
  last_test_result?: string;
}

export interface AiProvider {
  id: string;
  name: string;
  provider_type: 'gemini' | 'groq' | 'openrouter' | 'cloudflare' | 'custom_openai';
  base_url: string;
  status: ProviderStatus;
  priority: number;
  is_free_confirmed: boolean;
  models_count: number;
  last_health_check: string;
  latency_ms: number;
  quota_info: string;
  models: AiModel[];
}

export interface TrendTopic {
  id: string;
  niche_id: NicheId;
  title: string;
  summary: string;
  trend_score: number;
  confidence: number;
  sources_count: number;
  verification_status: ClaimVerificationStatus;
  primary_publisher: string;
  published_at: string;
}

export interface SocialAccount {
  id: string;
  platform: 'youtube' | 'tiktok' | 'facebook' | 'instagram';
  account_name: string;
  handle: string;
  niche: string;
  status: 'ACTIVE' | 'AUTH_REQUIRED' | 'PAUSED';
  target_daily_posts: number;
  scheduled_today: number;
}

import type { VideoProject, AiProvider, TrendTopic, SocialAccount } from '../types';

// DỮ LIỆU MẪU ĐƯỢC ĐÁNH DẤU RÕ RÀNG THEO ĐẶC TẢ PROJECT.MD (RULE 6)
export const IS_DEMO_DATA = true;

export const INITIAL_PROJECT: VideoProject = {
  id: 'proj-ai-chip-2026',
  title: 'Cuộc Đua Siêu Chip Bán Dẫn 2nm: Ai Sẽ Thống Trị Kỷ Nguyên AI?',
  niche: 'Công nghệ & Bán dẫn',
  target_duration_seconds: 60,
  status: 'WAITING_FOR_APPROVAL',
  current_stage: 'VALIDATE_ARTIFACT',
  created_at: '2026-10-14 19:30',
  scenes_count: 4,
  scenes: [
    {
      id: 'scene-001',
      order: 1,
      text: 'Đây là con chip 2 nanomet mỏng hơn cả sợi tóc, nhưng mang sức mạnh tính toán thay đổi toàn bộ nền kinh tế thế giới.',
      estimated_duration_seconds: 5,
      search_keywords: ['semiconductor wafer 2nm', 'silicon microchip macro'],
      visual_intent: 'Cận cảnh đĩa silicon wafer lấp lánh phản chiếu ánh sáng trong phòng sạch công nghệ cao.',
      layout_type: 'fullscreen',
      caption_emphasis: ['2 nanomet', 'sợi tóc', 'kinh tế thế giới'],
      source_claim_ids: ['claim-semi-01'],
      media_candidate: {
        id: 'med-01',
        title: 'TSMC Cleanroom Wafer Macro',
        source: 'Wikimedia Commons (Verified)',
        thumbnail_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
        rights_status: 'LICENSED',
        relevance_score: 98,
        license_name: 'CC-BY-SA 4.0'
      }
    },
    {
      id: 'scene-002',
      order: 2,
      text: 'Công nghệ bóng bán dẫn Gate-All-Around cho phép nhồi nhét hơn 50 tỷ bóng bán dẫn vào diện tích chỉ bằng một chiếc móng tay.',
      estimated_duration_seconds: 6,
      search_keywords: ['GAA transistor architecture diagram', 'microscopic electronic circuit'],
      visual_intent: 'Mô hình đồ họa 3D kiến trúc bóng bán dẫn GAA và dòng electron di chuyển.',
      layout_type: 'split_screen',
      caption_emphasis: ['Gate-All-Around', '50 tỷ bóng bán dẫn', 'móng tay'],
      source_claim_ids: ['claim-semi-02'],
      media_candidate: {
        id: 'med-02',
        title: 'Microscopic Circuit Blueprint',
        source: 'Unsplash License (Commercial Allowed)',
        thumbnail_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80',
        rights_status: 'LICENSED',
        relevance_score: 94,
        license_name: 'Unsplash Free Commercial'
      }
    },
    {
      id: 'scene-003',
      order: 3,
      text: 'Cuộc đua giữa các ông lớn không chỉ là công nghệ sản xuất, mà là cuộc chiến giành giật cỗ máy quang khắc EUV trị giá 350 triệu USD.',
      estimated_duration_seconds: 7,
      search_keywords: ['ASML High NA EUV machine factory'],
      visual_intent: 'Cỗ máy quang khắc High-NA EUV khổng lồ đang hoạt động trong nhà máy.',
      layout_type: 'fullscreen',
      caption_emphasis: ['cỗ máy quang khắc EUV', '350 triệu USD'],
      source_claim_ids: ['claim-semi-03'],
      media_candidate: {
        id: 'med-03',
        title: 'High NA Lithography Machine',
        source: 'News Press Kit (Attribution Required)',
        thumbnail_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&auto=format&fit=crop&q=80',
        rights_status: 'NEEDS_REVIEW',
        relevance_score: 89,
        license_name: 'Editorial Only (Needs Human Check)'
      }
    },
    {
      id: 'scene-004',
      order: 4,
      text: 'Liệu ai sẽ làm chủ cuộc chơi AI khi thế hệ chip này chính thức bước ra thị trường thương mại? Hãy theo dõi kênh để không bỏ lỡ!',
      estimated_duration_seconds: 5,
      search_keywords: ['futuristic AI datacenter glowing servers'],
      visual_intent: 'Hàng dài tủ server trung tâm dữ liệu AI phát ánh sáng xanh tím rực rỡ.',
      layout_type: 'cutout_focus',
      caption_emphasis: ['làm chủ cuộc chơi AI', 'thương mại'],
      source_claim_ids: ['claim-semi-04'],
      media_candidate: {
        id: 'med-04',
        title: 'Modern AI Datacenter Racks',
        source: 'Public Domain Archive',
        thumbnail_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
        rights_status: 'PUBLIC_DOMAIN_VERIFIED',
        relevance_score: 96,
        license_name: 'CC0 Public Domain'
      }
    }
  ]
};

export const MOCK_PROVIDERS: AiProvider[] = [
  {
    id: 'prov-gemini',
    name: 'Google Gemini API',
    provider_type: 'gemini',
    base_url: 'https://generativelanguage.googleapis.com/v1beta',
    status: 'HEALTHY',
    priority: 1,
    is_free_confirmed: true,
    models_count: 3,
    last_health_check: 'Vừa xong (200 OK)',
    latency_ms: 320,
    quota_info: '15 RPM / 1M TPM (Free Tier)',
    models: [
      {
        id: 'gemini-1.5-flash',
        provider_id: 'prov-gemini',
        model_identifier: 'gemini-1.5-flash',
        display_name: 'Gemini 1.5 Flash (Kịch bản & Structuring)',
        capabilities: ['text_generation', 'structured_output', 'vision'],
        free_status: 'FREE_CONFIRMED',
        context_limit: '1M tokens',
        status: 'ACTIVE',
        verified_quota: '15 RPM / 1,500 RPD',
        last_test_result: 'PASS (240ms)'
      },
      {
        id: 'gemini-1.5-pro',
        provider_id: 'prov-gemini',
        model_identifier: 'gemini-1.5-pro',
        display_name: 'Gemini 1.5 Pro (Deep Fact-Check & Reasoning)',
        capabilities: ['text_generation', 'structured_output', 'vision', 'video_understanding'],
        free_status: 'FREE_CONFIRMED',
        context_limit: '2M tokens',
        status: 'ACTIVE',
        verified_quota: '2 RPM / 50 RPD',
        last_test_result: 'PASS (890ms)'
      }
    ]
  },
  {
    id: 'prov-groq',
    name: 'Groq Cloud Inference',
    provider_type: 'groq',
    base_url: 'https://api.groq.com/openai/v1',
    status: 'HEALTHY',
    priority: 2,
    is_free_confirmed: true,
    models_count: 2,
    last_health_check: '2 phút trước (200 OK)',
    latency_ms: 110,
    quota_info: '30 RPM / 14,400 RPD (Free Tier)',
    models: [
      {
        id: 'llama-3.3-70b-versatile',
        provider_id: 'prov-groq',
        model_identifier: 'llama-3.3-70b-versatile',
        display_name: 'Llama 3.3 70B Versatile (Tốc độ suy luận cao)',
        capabilities: ['text_generation', 'structured_output'],
        free_status: 'FREE_CONFIRMED',
        context_limit: '128k tokens',
        status: 'ACTIVE',
        verified_quota: '30 RPM',
        last_test_result: 'PASS (115ms)'
      }
    ]
  },
  {
    id: 'prov-openrouter',
    name: 'OpenRouter Aggregator',
    provider_type: 'openrouter',
    base_url: 'https://openrouter.ai/api/v1',
    status: 'DEGRADED',
    priority: 3,
    is_free_confirmed: true,
    models_count: 5,
    last_health_check: '5 phút trước (429 Rate Limited)',
    latency_ms: 680,
    quota_info: 'Free models pool (Đã chạm 429)',
    models: [
      {
        id: 'meta-llama/llama-3-8b-instruct:free',
        provider_id: 'prov-openrouter',
        model_identifier: 'meta-llama/llama-3-8b-instruct:free',
        display_name: 'Llama 3 8B Instruct (Free Pool)',
        capabilities: ['text_generation'],
        free_status: 'FREE_LIMITED',
        context_limit: '8k tokens',
        status: 'DEGRADED',
        verified_quota: 'Shared Pool',
        last_test_result: '429 Rate Limit (Fallback triggered)'
      }
    ]
  },
  {
    id: 'prov-cloudflare',
    name: 'Cloudflare Workers AI',
    provider_type: 'cloudflare',
    base_url: 'https://api.cloudflare.com/client/v4/accounts/{id}/ai/run',
    status: 'HEALTHY',
    priority: 4,
    is_free_confirmed: true,
    models_count: 2,
    last_health_check: '10 phút trước (200 OK)',
    latency_ms: 290,
    quota_info: '10,000 Neurons/ngày miễn phí',
    models: [
      {
        id: '@cf/meta/llama-3-8b-instruct',
        provider_id: 'prov-cloudflare',
        model_identifier: '@cf/meta/llama-3-8b-instruct',
        display_name: 'CF Llama 3 8B',
        capabilities: ['text_generation'],
        free_status: 'FREE_CONFIRMED',
        context_limit: '8k tokens',
        status: 'ACTIVE',
        verified_quota: '10k Neurons/day',
        last_test_result: 'PASS (280ms)'
      }
    ]
  }
];

export const MOCK_TRENDS: TrendTopic[] = [
  {
    id: 'tr-01',
    niche_id: 'tech',
    title: 'TSMC và Intel bắt đầu thử nghiệm thương mại nút bán dẫn 2nm GAA',
    summary: 'Bước đột phá trong cấu trúc Gate-All-Around giúp tiết kiệm 30% điện năng tiêu thụ cho cụm máy chủ huấn luyện AI.',
    trend_score: 96,
    confidence: 0.94,
    sources_count: 4,
    verification_status: 'SUPPORTED',
    primary_publisher: 'Reuters Tech & EE Times',
    published_at: '2 giờ trước'
  },
  {
    id: 'tr-02',
    niche_id: 'finance',
    title: 'Dòng tiền 4.2 tỷ USD đổ vào các quỹ ETF hạ tầng điện toán toán học',
    summary: 'Nhu cầu điện năng cho trung tâm dữ liệu kích hoạt làn sóng đầu tư vào năng lượng hạt nhân thế hệ mới.',
    trend_score: 88,
    confidence: 0.89,
    sources_count: 3,
    verification_status: 'SUPPORTED',
    primary_publisher: 'Bloomberg Financial',
    published_at: '4 giờ trước'
  },
  {
    id: 'tr-03',
    niche_id: 'science',
    title: 'Phát hiện vật liệu quang học mới có thể tăng tốc độ truyền dẫn cáp quang gấp 10 lần',
    summary: 'Nghiên cứu từ phòng thí nghiệm MIT cho thấy tiềm năng giải quyết nút thắt cổ chai kết nối AI Clusters.',
    trend_score: 82,
    confidence: 0.78,
    sources_count: 2,
    verification_status: 'UNVERIFIED',
    primary_publisher: 'Nature Optics Pre-print',
    published_at: 'Hôm nay'
  }
];

export const MOCK_ACCOUNTS: SocialAccount[] = [
  {
    id: 'acc-yt-tech',
    platform: 'youtube',
    account_name: 'TechBytes Shorts VN',
    handle: '@TechBytesVN',
    niche: 'Công nghệ & Bán dẫn',
    status: 'ACTIVE',
    target_daily_posts: 3,
    scheduled_today: 2
  },
  {
    id: 'acc-tt-tech',
    platform: 'tiktok',
    account_name: 'Kênh Khám Phá Công Nghệ',
    handle: '@khamphacongnghe.ai',
    niche: 'Công nghệ & Bán dẫn',
    status: 'ACTIVE',
    target_daily_posts: 4,
    scheduled_today: 3
  },
  {
    id: 'acc-fb-tech',
    platform: 'facebook',
    account_name: 'Reels Công Nghệ Tương Lai',
    handle: '@reels.congnghe',
    niche: 'Khoa học công nghệ',
    status: 'AUTH_REQUIRED',
    target_daily_posts: 2,
    scheduled_today: 0
  }
];

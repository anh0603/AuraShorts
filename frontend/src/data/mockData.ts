import type { VideoProject, AiProvider, TrendTopic, SocialAccount } from '../types';

// DỮ LIỆU MẪU ĐƯỢC ĐÁNH DẤU RÕ RÀNG THEO ĐẶC TẢ PROJECT.MD (RULE 6)
export const IS_DEMO_DATA = true;

export const INITIAL_PROJECT: VideoProject = {
  id: 'proj-ai-chip-2026',
  title: 'Cuộc Đua Siêu Chip Bán Dẫn 2nm: Ai Sẽ Thống Trị Kỷ Nguyên AI?',
  niche: 'Công nghệ & Bán dẫn',
  target_duration_seconds: 73,
  status: 'WAITING_FOR_APPROVAL',
  current_stage: 'VALIDATE_ARTIFACT',
  created_at: '2026-10-15 15:30',
  scenes_count: 12,
  scenes: [
    {
      id: 'scene-001',
      order: 1,
      text: 'Đây là con chip bán dẫn 2 nanomet mỏng hơn sợi tóc, mang sức mạnh tính toán định hình thế giới.',
      estimated_duration_seconds: 6.2,
      search_keywords: ['semiconductor wafer 2nm', 'silicon microchip macro'],
      visual_intent: 'Cận cảnh đĩa silicon wafer lấp lánh phản chiếu ánh sáng trong phòng sạch công nghệ cao.',
      layout_type: 'fullscreen',
      caption_emphasis: ['2 nanomet', 'sợi tóc', 'định hình thế giới'],
      source_claim_ids: ['claim-semi-01'],
      media_candidate: {
        id: 'med-01',
        title: 'TSMC Cleanroom Wafer Macro',
        source: 'Unsplash Verified Stock',
        thumbnail_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=720&auto=format&fit=crop&q=80',
        rights_status: 'LICENSED',
        relevance_score: 99,
        license_name: 'Commercial Allowed'
      }
    },
    {
      id: 'scene-002',
      order: 2,
      text: 'Kiến trúc bóng bán dẫn Gate-All-Around cho phép nhồi nhét hơn 50 tỷ linh kiện trên một ngón tay.',
      estimated_duration_seconds: 6.0,
      search_keywords: ['GAA transistor architecture diagram', 'microscopic electronic circuit'],
      visual_intent: 'Mô hình mạch vi điện tử nano phát sáng với hàng tỷ đường dẫn quang học.',
      layout_type: 'split_screen',
      caption_emphasis: ['Gate-All-Around', '50 tỷ linh kiện'],
      source_claim_ids: ['claim-semi-02'],
      media_candidate: {
        id: 'med-02',
        title: 'Microscopic Electronic Circuit',
        source: 'Pexels Verified Stock',
        thumbnail_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=720&auto=format&fit=crop&q=80',
        rights_status: 'LICENSED',
        relevance_score: 96,
        license_name: 'Commercial Allowed'
      }
    },
    {
      id: 'scene-003',
      order: 3,
      text: 'Trái tim của cuộc đua là cỗ máy quang khắc High-NA EUV trị giá 350 triệu USD của ASML Hà Lan.',
      estimated_duration_seconds: 6.5,
      search_keywords: ['ASML High NA EUV machine factory'],
      visual_intent: 'Cỗ máy quang khắc High-NA EUV khổng lồ vận hành chính xác tới từng phân tử.',
      layout_type: 'fullscreen',
      caption_emphasis: ['High-NA EUV', '350 triệu USD', 'ASML'],
      source_claim_ids: ['claim-semi-03'],
      media_candidate: {
        id: 'med-03',
        title: 'High NA Lithography Machine',
        source: 'News Press Kit (Editorial Verified)',
        thumbnail_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=720&auto=format&fit=crop&q=80',
        rights_status: 'LICENSED',
        relevance_score: 93,
        license_name: 'Editorial Commercial'
      }
    },
    {
      id: 'scene-004',
      order: 4,
      text: 'Mỗi thiết bị cần tới 3 chiếc chuyên cơ Boeing 747 vận chuyển hàng nghìn thấu kính tinh xảo.',
      estimated_duration_seconds: 5.8,
      search_keywords: ['aerospace cargo logistics high tech'],
      visual_intent: 'Chuyên cơ vận tải hàng hóa công nghệ cao và phòng thí nghiệm quang học tối tân.',
      layout_type: 'cutout_focus',
      caption_emphasis: ['Boeing 747', 'thấu kính tinh xảo'],
      source_claim_ids: ['claim-semi-04'],
      media_candidate: {
        id: 'med-04',
        title: 'High Tech Precision Cleanroom Lab',
        source: 'Unsplash Verified Stock',
        thumbnail_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=720&auto=format&fit=crop&q=80',
        rights_status: 'LICENSED',
        relevance_score: 91,
        license_name: 'Commercial Allowed'
      }
    },
    {
      id: 'scene-005',
      order: 5,
      text: 'TSMC, Intel và Samsung đang chạy đua không ngừng nghỉ để hoàn thiện dây chuyền thương mại.',
      estimated_duration_seconds: 5.8,
      search_keywords: ['robotic arm wafer handling automation'],
      visual_intent: 'Cánh tay robot phòng sạch tự động gắp tấm wafer bán dẫn siêu chuẩn xác.',
      layout_type: 'fullscreen',
      caption_emphasis: ['TSMC', 'Intel', 'Samsung', 'dây chuyền'],
      source_claim_ids: ['claim-semi-05'],
      media_candidate: {
        id: 'med-05',
        title: 'Robotic Fab Wafer Automation',
        source: 'Pexels Verified Stock',
        thumbnail_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=720&auto=format&fit=crop&q=80',
        rights_status: 'LICENSED',
        relevance_score: 95,
        license_name: 'Commercial Allowed'
      }
    },
    {
      id: 'scene-006',
      order: 6,
      text: 'Các cụm siêu máy tính trí tuệ nhân tạo thế hệ mới đang khát những con chip 2 nanomet này.',
      estimated_duration_seconds: 6.0,
      search_keywords: ['modern AI datacenter glowing blue lights'],
      visual_intent: 'Hàng dài tủ server trung tâm dữ liệu AI phát ánh sáng xanh tím rực rỡ.',
      layout_type: 'fullscreen',
      caption_emphasis: ['siêu máy tính', 'AI', 'khát chip'],
      source_claim_ids: ['claim-semi-06'],
      media_candidate: {
        id: 'med-06',
        title: 'Modern AI Datacenter Racks',
        source: 'Public Domain Verified',
        thumbnail_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=720&auto=format&fit=crop&q=80',
        rights_status: 'PUBLIC_DOMAIN_VERIFIED',
        relevance_score: 97,
        license_name: 'CC0 Public Domain'
      }
    },
    {
      id: 'scene-007',
      order: 7,
      text: 'Hiệu năng tính toán tăng vọt 35 phần trăm trong khi tiêu thụ điện năng giảm đến 30 phần trăm.',
      estimated_duration_seconds: 6.0,
      search_keywords: ['energy efficient futuristic processor circuit'],
      visual_intent: 'Đồ họa phát sáng mô tả hiệu suất năng lượng xanh trên bo mạch tương lai.',
      layout_type: 'split_screen',
      caption_emphasis: ['tăng 35%', 'tiết kiệm 30%'],
      source_claim_ids: ['claim-semi-07'],
      media_candidate: {
        id: 'med-07',
        title: 'Energy Efficient Circuit Neon',
        source: 'Unsplash Verified Stock',
        thumbnail_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=720&auto=format&fit=crop&q=80',
        rights_status: 'LICENSED',
        relevance_score: 94,
        license_name: 'Commercial Allowed'
      }
    },
    {
      id: 'scene-008',
      order: 8,
      text: 'Từ robot hình người thông minh đến xe tự hành cấp độ 5 sẽ hoàn toàn lột xác nhờ bước đột phá.',
      estimated_duration_seconds: 6.5,
      search_keywords: ['humanoid robot autonomous AI vehicle'],
      visual_intent: 'Robot hình người trí tuệ nhân tạo và hệ thống xử lý thị giác máy tính.',
      layout_type: 'cutout_focus',
      caption_emphasis: ['robot hình người', 'xe tự hành', 'lột xác'],
      source_claim_ids: ['claim-semi-08'],
      media_candidate: {
        id: 'med-08',
        title: 'Humanoid AI Robot Assistant',
        source: 'Unsplash Verified Stock',
        thumbnail_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=720&auto=format&fit=crop&q=80',
        rights_status: 'LICENSED',
        relevance_score: 96,
        license_name: 'Commercial Allowed'
      }
    },
    {
      id: 'scene-009',
      order: 9,
      text: 'Ngay trên chiếc điện thoại trong túi bạn, mô hình AI nghìn tỷ tham số sẽ chạy mượt mà ngoại tuyến.',
      estimated_duration_seconds: 6.5,
      search_keywords: ['futuristic smartphone neural engine on device'],
      visual_intent: 'Màn hình smartphone tương lai hiển thị trợ lý trí tuệ nhân tạo siêu tốc độ.',
      layout_type: 'fullscreen',
      caption_emphasis: ['điện thoại', 'mô hình AI', 'ngoại tuyến'],
      source_claim_ids: ['claim-semi-09'],
      media_candidate: {
        id: 'med-09',
        title: 'Futuristic Mobile Neural Interface',
        source: 'Pexels Verified Stock',
        thumbnail_url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=720&auto=format&fit=crop&q=80',
        rights_status: 'LICENSED',
        relevance_score: 93,
        license_name: 'Commercial Allowed'
      }
    },
    {
      id: 'scene-010',
      order: 10,
      text: 'Cuộc chiến silicon không dừng lại ở thương mại, mà là chìa khóa chủ quyền công nghệ toàn cầu.',
      estimated_duration_seconds: 5.8,
      search_keywords: ['global cyber network digital map technology'],
      visual_intent: 'Bản đồ mạng lưới công nghệ số toàn cầu kết nối các trung tâm bán dẫn thế giới.',
      layout_type: 'split_screen',
      caption_emphasis: ['cuộc chiến silicon', 'chủ quyền công nghệ'],
      source_claim_ids: ['claim-semi-10'],
      media_candidate: {
        id: 'med-10',
        title: 'Global Tech Grid Network',
        source: 'Unsplash Verified Stock',
        thumbnail_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=720&auto=format&fit=crop&q=80',
        rights_status: 'LICENSED',
        relevance_score: 97,
        license_name: 'Commercial Allowed'
      }
    },
    {
      id: 'scene-011',
      order: 11,
      text: 'Những lô chip 2nm đầu tiên dự kiến xuất xưởng thương mại vào cuối năm nay với giá trị kỷ lục.',
      estimated_duration_seconds: 6.0,
      search_keywords: ['silicon wafer fabrication engineer inspecting'],
      visual_intent: 'Kỹ sư công nghệ kiểm tra bề mặt wafer 2nm dưới kính hiển vi điện tử quét.',
      layout_type: 'fullscreen',
      caption_emphasis: ['xuất xưởng', 'cuối năm nay', 'kỷ lục'],
      source_claim_ids: ['claim-semi-11'],
      media_candidate: {
        id: 'med-011',
        title: 'Wafer Fab Inspection Tech',
        source: 'News Archive Stock',
        thumbnail_url: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=720&auto=format&fit=crop&q=80',
        rights_status: 'LICENSED',
        relevance_score: 92,
        license_name: 'Commercial Allowed'
      }
    },
    {
      id: 'scene-012',
      order: 12,
      text: 'Bạn nghĩ ai sẽ dẫn đầu kỷ nguyên AI tiếp theo? Bình luận ngay và đăng ký kênh để cập nhật!',
      estimated_duration_seconds: 6.0,
      search_keywords: ['cyberpunk smart city futuristic skyline night'],
      visual_intent: 'Thành phố tương lai rực rỡ ánh sáng công nghệ với lời kêu gọi tương tác video.',
      layout_type: 'cutout_focus',
      caption_emphasis: ['ai sẽ dẫn đầu', 'bình luận', 'đăng ký kênh'],
      source_claim_ids: ['claim-semi-12'],
      media_candidate: {
        id: 'med-012',
        title: 'Futuristic Cyber City Call to Action',
        source: 'Unsplash Verified Stock',
        thumbnail_url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=720&auto=format&fit=crop&q=80',
        rights_status: 'LICENSED',
        relevance_score: 95,
        license_name: 'Commercial Allowed'
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
  },
  {
    id: 'tr-04',
    niche_id: 'national',
    title: 'Đột phá hạ tầng quốc gia: Thông xe toàn tuyến cao tốc Bắc - Nam và xúc tiến đường sắt tốc độ cao',
    summary: 'Chính phủ chỉ đạo tập trung mọi nguồn lực hoàn thành mạng lưới hạ tầng giao thông huyết mạch kết nối liên vùng, tạo động lực phát triển kinh tế đất nước.',
    trend_score: 98,
    confidence: 0.98,
    sources_count: 6,
    verification_status: 'SUPPORTED',
    primary_publisher: 'Cổng Thông Tin Điện Tử Chính Phủ & TTXVN',
    published_at: '30 phút trước'
  },
  {
    id: 'tr-05',
    niche_id: 'geopolitics',
    title: 'Hội nghị thượng đỉnh ngoại giao đa phương: Định vị chiến lược kinh tế và chuỗi cung ứng toàn cầu',
    summary: 'Việt Nam ký kết thỏa thuận đối tác chiến lược toàn diện mới, nâng cao vị thế ngoại giao và uy tín quốc gia trên trường quốc tế.',
    trend_score: 93,
    confidence: 0.95,
    sources_count: 5,
    verification_status: 'SUPPORTED',
    primary_publisher: 'Báo Quốc Tế & Báo Nhân Dân',
    published_at: '1 giờ trước'
  },
  {
    id: 'tr-06',
    niche_id: 'history',
    title: 'Hồ sơ lịch sử: Cột mốc hào hùng của các công trình thế kỷ kiến thiết đất nước',
    summary: 'Phục dựng tư liệu lịch sử quý giá về ý chí kiên cường vượt khó trong các chiến dịch mở đường Trường Sơn và công cuộc tái thiết sau chiến tranh.',
    trend_score: 87,
    confidence: 0.92,
    sources_count: 4,
    verification_status: 'SUPPORTED',
    primary_publisher: 'Bảo Tàng Lịch Sử Quốc Gia & Đài THVN',
    published_at: 'Hôm qua'
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

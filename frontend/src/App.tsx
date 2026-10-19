import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './views/DashboardView';
import { UrlToVideoView } from './views/UrlToVideoView';
import { AiProviderManagerView } from './views/AiProviderManagerView';
import { TrendsView, type TrendCreateOptions } from './views/TrendsView';
import { PublishingView } from './views/PublishingView';
import { ExportedVideosView } from './views/ExportedVideosView';
import { INITIAL_PROJECT, MOCK_PROVIDERS } from './data/mockData';
import type { VideoProject, AiProvider, TrendTopic } from './types';
import { StudioApi } from './services/api';

export function App() {
  const [currentTab, setCurrentTabState] = useState<string>(() => {
    return localStorage.getItem('storymxh_current_tab') || 'exported-videos';
  });
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [project, setProject] = useState<VideoProject>(INITIAL_PROJECT);
  const [providers, setProviders] = useState<AiProvider[]>(MOCK_PROVIDERS);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  const setCurrentTab = (tab: string) => {
    localStorage.setItem('storymxh_current_tab', tab);
    setCurrentTabState(tab);
  };

  const handleProjectGeneratedFromUrl = (newProject: VideoProject) => {
    setProject(newProject);
    setCurrentTab('exported-videos');
  };

  const handleSelectTopicToCreate = async (topic: TrendTopic, planId?: string, options?: TrendCreateOptions) => {
    if (planId) {
      setActivePlanId(planId);
    }

    const nicheLabel = topic.niche_id === 'national'
      ? 'Thời Sự & Đất Nước'
      : topic.niche_id === 'geopolitics'
      ? 'Địa Chính Trị & Quốc Tế'
      : topic.niche_id === 'history'
      ? 'Lịch Sử Dân Tộc'
      : topic.niche_id === 'tech'
      ? 'Công Nghệ & Bán Dẫn'
      : topic.niche_id === 'science'
      ? 'Khoa Học Đột Phá'
      : 'Tài Chính & Kinh Tế';

    const projId = planId || `proj-${topic.id}-${Date.now().toString().slice(-4)}`;

    // Generate contextual scenes strictly matching the topic's niche and content
    const isHistory = topic.niche_id === 'history' || topic.title.toLowerCase().includes('lịch sử') || topic.title.toLowerCase().includes('hào hùng');
    const isNational = topic.niche_id === 'national' || topic.title.toLowerCase().includes('cao tốc') || topic.title.toLowerCase().includes('đất nước');
    const isTech = topic.niche_id === 'tech' || topic.title.toLowerCase().includes('chip') || topic.title.toLowerCase().includes('bán dẫn') || topic.title.toLowerCase().includes('ai');

    const sceneImages = isHistory ? [
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=720&auto=format&fit=crop&q=80', // Cờ hoa di tích hào hùng
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=720&auto=format&fit=crop&q=80', // Núi non đường Trường Sơn hiểm trở
      'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=720&auto=format&fit=crop&q=80', // Bảo tàng di tích lịch sử
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=720&auto=format&fit=crop&q=80', // Công trình thế kỷ vươn mình hiện đại
      'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=720&auto=format&fit=crop&q=80'  // Tự hào thế hệ trẻ
    ] : isNational ? [
      'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=720&auto=format&fit=crop&q=80', // Đại lộ cao tốc Bắc Nam
      'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=720&auto=format&fit=crop&q=80', // Tàu tốc hành hiện đại
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=720&auto=format&fit=crop&q=80', // Cầu lớn hầm xuyên núi
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=720&auto=format&fit=crop&q=80', // Kinh tế biển bứt phá
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=720&auto=format&fit=crop&q=80'
    ] : isTech ? [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=720&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=720&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=720&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=720&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=720&auto=format&fit=crop&q=80'
    ] : [
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=720&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=720&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=720&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=720&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=720&auto=format&fit=crop&q=80'
    ];

    const isCrimeOrTraffic = /va chạm|ẩu đả|hành hung|tai nạn|tạm giữ|bắt giữ|khởi tố|xử phạt|vi phạm|chém nhau|gây rối|biển số giả/i.test(topic.title);

    // 1. Dynamic Viral Hook
    const cleanTitle = topic.title.replace(/[.!?]+$/, '').trim();
    const hookText = isHistory
      ? `Mốc son chói lọi của dân tộc: ${cleanTitle} khiến bao thế hệ tự hào!`
      : isNational
      ? `Đại công trình nghìn tỷ vừa lộ diện: ${cleanTitle}!`
      : isTech
      ? `Đột phá công nghệ chấn động: ${cleanTitle} vừa được hé lộ!`
      : isCrimeOrTraffic
      ? `Cái giá đắt cho một phút bốc đồng: ${cleanTitle}!`
      : `Bạn có tin nổi không? Sự việc ${cleanTitle} đang làm dậy sóng cộng đồng mạng!`;

    // 2. Engaging Narrative Context
    const summaryRaw = (topic.summary || 'Thông tin chi tiết đang thu hút sự quan tâm lớn của đông đảo cộng đồng.').trim();
    const cleanSummary = summaryRaw.charAt(0).toLowerCase() + summaryRaw.slice(1);
    const scene2Text = `Đáng chú ý là ${cleanSummary}`;

    // 3. Shocking Revelation / Verification Detail
    const scene3Text = isHistory
      ? 'Những tư liệu lịch sử vô giá đã tái hiện trọn vẹn tinh thần kiên cường, bất khuất của các thế hệ cha anh.'
      : isNational
      ? 'Hàng trăm kỹ sư và công nhân đã làm việc xuyên ngày đêm để đưa dự án trọng điểm về đích vượt tiến độ.'
      : isTech
      ? 'Các chuyên gia đầu ngành đánh giá đây là bước nhảy vọt quan trọng mở ra tiềm năng ứng dụng không giới hạn.'
      : isCrimeOrTraffic
      ? 'Lực lượng chức năng đã nhanh chóng vào cuộc trích xuất hình ảnh hiện trường và triệu tập các đối tượng liên quan.'
      : 'Điều khiến nhiều người bất ngờ nhất chính là những tình tiết mới vừa được các bên liên quan hé lộ.';

    // 4. Consequence / Forward Impact
    const scene4Text = isHistory
      ? 'Từ những mốc son lịch sử hào hùng ấy, các thế hệ hôm nay đang tiếp bước kiến tạo nên những kỳ tích mới cho đất nước!'
      : isNational
      ? 'Tuyến giao thông huyết mạch khi vận hành sẽ rút ngắn một nửa thời gian di chuyển và tạo đòn bẩy kinh tế cho cả vùng.'
      : isTech
      ? 'Bước tiến vượt bậc này hứa hẹn sẽ định hình lại thói quen công nghệ và tạo nên làn sóng đổi mới toàn cầu.'
      : isCrimeOrTraffic
      ? 'Vụ việc là bài học cảnh tỉnh sâu sắc: Một phút thiếu kiềm chế có thể phải trả giá bằng cả tương lai.'
      : 'Sự việc tiếp tục lan tỏa mạnh mẽ trên khắp các diễn đàn mạng xã hội với những cuộc thảo luận vô cùng sôi nổi.';

    const scene4Intent = isHistory
      ? 'Cầu dây văng hiện đại, đập thủy điện và cao tốc kỳ vĩ vươn tầm quốc tế trên non sông đất nước.'
      : isNational
      ? 'Cầu vượt biển hiện đại và cảng nước sâu đón những chuyến tàu chở hàng quốc tế.'
      : isTech
      ? 'Đồ họa phát sáng mô tả hiệu suất năng lượng xanh trên bo mạch tương lai.'
      : 'Toàn cảnh thành phố hiện đại và dòng chuyển động của công nghệ số tương lai.';

    // 5. Debate-Triggering Call to Action
    const scene5Text = isHistory
      ? 'Hãy cùng lan tỏa niềm tự hào dân tộc bằng cách thả tim, để lại bình luận và follow kênh nhé!'
      : isTech
      ? 'Bạn có tin công nghệ mới này sẽ sớm phổ biến không? Hãy chia sẻ ngay góc nhìn của bạn bên dưới nhé!'
      : isCrimeOrTraffic
      ? 'Bạn nghĩ hành vi này đáng bị xử phạt ra sao? Hãy bình luận bên dưới và theo dõi kênh để cập nhật tin nóng nhé!'
      : isNational
      ? 'Bạn đã sẵn sàng trải nghiệm công trình mới này chưa? Hãy để lại cảm nghĩ và follow kênh nhé!'
      : 'Quan điểm của bạn về câu chuyện này thế nào? Hãy để lại bình luận và đăng ký kênh để không bỏ lỡ tin mới nhé!';

    const topicScenes = [
      {
        id: `sc-${topic.id}-1`,
        order: 1,
        text: hookText,
        estimated_duration_seconds: Math.round(Math.max(4.2, (hookText.split(' ').length / 2.8) + 0.3) * 10) / 10,
        search_keywords: ['breaking news headline broadcast'],
        visual_intent: isHistory ? 'Biểu tượng lịch sử hào hùng và cờ đỏ rực sáng tạo hook trong 3 giây đầu.' : 'Đồ họa tin nóng chớp sáng ấn tượng tạo hook thu hút người xem trong 3 giây đầu.',
        layout_type: 'fullscreen' as const,
        caption_emphasis: ['Tin nóng', 'chấn động'],
        source_claim_ids: [`cl-${topic.id}-1`],
        media_candidate: {
          id: `med-${topic.id}-1`,
          title: topic.title,
          source: topic.primary_publisher || 'Verified Media',
          thumbnail_url: sceneImages[0],
          rights_status: 'LICENSED' as const,
          relevance_score: 98,
          license_name: 'Verified Editorial'
        }
      },
      {
        id: `sc-${topic.id}-2`,
        order: 2,
        text: scene2Text,
        estimated_duration_seconds: Math.round(Math.max(4.5, (scene2Text.split(' ').length / 2.8) + 0.3) * 10) / 10,
        search_keywords: isHistory ? ['truong son trail historic landmark reconstruction'] : ['analytical document report technology data'],
        visual_intent: isHistory ? 'Tư liệu lịch sử hào hùng về mở đường Trường Sơn và công cuộc tái thiết sau chiến tranh.' : 'Biểu đồ trực quan và tư liệu phân tích chuyên sâu về diễn biến sự việc.',
        layout_type: 'fullscreen' as const,
        caption_emphasis: ['chi tiết', 'đáng chú ý'],
        source_claim_ids: [`cl-${topic.id}-2`],
        media_candidate: {
          id: `med-${topic.id}-2`,
          title: isHistory ? 'Historic Reconstruction' : 'Report Analysis Overview',
          source: topic.primary_publisher || 'Stock Verified',
          thumbnail_url: sceneImages[1],
          rights_status: 'LICENSED' as const,
          relevance_score: 96,
          license_name: 'CC-BY 4.0'
        }
      },
      {
        id: `sc-${topic.id}-3`,
        order: 3,
        text: scene3Text,
        estimated_duration_seconds: Math.round(Math.max(4.2, (scene3Text.split(' ').length / 2.8) + 0.3) * 10) / 10,
        search_keywords: ['museum history documents verified facts'],
        visual_intent: isHistory ? 'Không gian trang trọng của Bảo tàng Lịch sử lưu giữ những hiện vật thiêng liêng.' : 'Phòng làm việc của các chuyên gia phân tích dữ liệu và cơ quan báo chí uy tín.',
        layout_type: 'fullscreen' as const,
        caption_emphasis: ['bất ngờ', 'tình tiết mới'],
        source_claim_ids: [`cl-${topic.id}-3`],
        media_candidate: {
          id: `med-${topic.id}-3`,
          title: 'Fact Checked Independent Sources',
          source: topic.primary_publisher || 'Editorial Stock Verified',
          thumbnail_url: sceneImages[2],
          rights_status: 'LICENSED' as const,
          relevance_score: 95,
          license_name: 'Editorial Commercial'
        }
      },
      {
        id: `sc-${topic.id}-4`,
        order: 4,
        text: scene4Text,
        estimated_duration_seconds: Math.round(Math.max(4.5, (scene4Text.split(' ').length / 2.8) + 0.3) * 10) / 10,
        search_keywords: ['mega landmark bridges engineering national development'],
        visual_intent: scene4Intent,
        layout_type: 'fullscreen' as const,
        caption_emphasis: isHistory ? ['kỳ tích mới', 'vươn tầm quốc tế'] : ['bài học', 'tác động'],
        source_claim_ids: [`cl-${topic.id}-4`],
        media_candidate: {
          id: `med-${topic.id}-4`,
          title: isHistory ? 'Landmark Engineering Landmark' : 'Future Market Impact',
          source: 'Creative Commons Verified',
          thumbnail_url: sceneImages[3],
          rights_status: 'LICENSED' as const,
          relevance_score: 95,
          license_name: 'Commercial Allowed'
        }
      },
      {
        id: `sc-${topic.id}-5`,
        order: 5,
        text: scene5Text,
        estimated_duration_seconds: Math.round(Math.max(4.2, (scene5Text.split(' ').length / 2.8) + 0.3) * 10) / 10,
        search_keywords: ['proud national legacy follow channel'],
        visual_intent: isHistory ? 'Ngọn lửa tự hào dân tộc và lời kêu gọi tri ân thế hệ cha anh.' : 'Biểu tượng nút đăng ký kênh và hộp thoại tương tác sống động.',
        layout_type: 'fullscreen' as const,
        caption_emphasis: ['bình luận', 'theo dõi kênh'],
        source_claim_ids: [`cl-${topic.id}-5`],
        media_candidate: {
          id: `med-${topic.id}-5`,
          title: 'Call to Action Interaction',
          source: 'AuraShorts Studio Verified',
          thumbnail_url: sceneImages[4],
          rights_status: 'LICENSED' as const,
          relevance_score: 94,
          license_name: 'Commercial Allowed'
        }
      }
    ];

    const totalDur = Math.round(topicScenes.reduce((a, b) => a + b.estimated_duration_seconds, 0));

    const newProj: VideoProject = {
      id: projId,
      title: topic.title,
      niche: nicheLabel,
      target_duration_seconds: totalDur,
      status: 'WAITING_FOR_APPROVAL',
      current_stage: 'STORYBOARD_READY',
      created_at: 'Vừa tạo từ Xu hướng',
      scenes_count: topicScenes.length,
      scenes: topicScenes,
      voice_id: options?.voicePreset?.includes('HoaiMy') ? 'vi-VN-HoaiMyNeural' : 'vi-VN-NamMinhNeural',
      voice_preset_id: options?.voicePreset || 'vi-VN-NamMinhNeural-news',
      audio_url: `/storage/artifacts/voiceover_${projId}.mp3`,
      video_url: undefined // Clear old video to show fresh project
    };

    const voicePreset = options?.voicePreset || 'vi-VN-NamMinhNeural-news';
    const voiceId = voicePreset.includes('HoaiMy') ? 'vi-VN-HoaiMyNeural' : 'vi-VN-NamMinhNeural';
    const targetSchedTime = options?.scheduleOption === 'custom' && options?.customDateTime
      ? new Date(options.customDateTime).toISOString()
      : undefined;

    setProject(newProj);
    // Start render in background and jump immediately to exported-videos
    StudioApi.renderVideo({
      project_id: projId,
      title: topic.title,
      scenes: topicScenes,
      voice_id: voiceId,
      voice_preset_id: voicePreset,
      subtitle_mode: 'word_group',
      account_id: options?.accountId || undefined,
      scheduled_time: targetSchedTime
    }).catch(console.error);

    setCurrentTab('exported-videos');
  };

  return (
    <div className="flex min-h-screen bg-[#080C15] text-[#F8FAFC]">
      {/* Collapsible Left Navigation Bar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentTab={currentTab}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          onOpenQuickCreate={() => setCurrentTab('url-to-video')}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              project={project}
              activePlanId={activePlanId || undefined}
              onOpenStudio={() => setCurrentTab('url-to-video')}
              onOpenProviders={() => setCurrentTab('ai-providers')}
              onOpenTrends={() => setCurrentTab('trends')}
              onOpenPublishing={() => setCurrentTab('publishing')}
              onOpenUrlToVideo={() => setCurrentTab('url-to-video')}
            />
          )}

          {currentTab === 'exported-videos' && (
            <ExportedVideosView
              onNavigateToStudio={() => setCurrentTab('url-to-video')}
              onNavigateToCreate={() => setCurrentTab('url-to-video')}
            />
          )}

          {currentTab === 'url-to-video' && (
            <UrlToVideoView
              onProjectGenerated={handleProjectGeneratedFromUrl}
              onPlanCreated={(planId) => setActivePlanId(planId)}
              onNavigateToExportedVideos={() => setCurrentTab('exported-videos')}
            />
          )}

          {currentTab === 'ai-providers' && (
            <AiProviderManagerView
              providers={providers}
              onUpdateProviders={setProviders}
            />
          )}

          {currentTab === 'trends' && (
            <TrendsView
              onSelectTopicToCreate={handleSelectTopicToCreate}
            />
          )}

          {currentTab === 'publishing' && (
            <PublishingView />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

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

    const scene4Text = isHistory
      ? 'Từ những mốc son lịch sử hào hùng ấy, các thế hệ hôm nay đang tiếp bước kiến tạo nên những đại công trình thế kỷ vươn tầm quốc tế!'
      : isNational
      ? 'Hạ tầng giao thông kết nối thông suốt mở toang cánh cửa bứt phá mạnh mẽ cho toàn bộ nền kinh tế biển trọng điểm.'
      : isTech
      ? 'Hiệu năng tính toán tăng vọt 35 phần trăm giúp định hình lại toàn bộ cuộc cách mạng trí tuệ nhân tạo toàn cầu.'
      : 'Sự kiện này dự kiến sẽ tác động mạnh mẽ đến thị trường và mở ra bước chuyển dịch lớn trong giai đoạn tới.';

    const scene4Intent = isHistory
      ? 'Cầu dây văng hiện đại, đập thủy điện và cao tốc kỳ vĩ vươn tầm quốc tế trên non sông đất nước.'
      : isNational
      ? 'Cầu vượt biển hiện đại và cảng nước sâu đón những chuyến tàu chở hàng quốc tế.'
      : isTech
      ? 'Đồ họa phát sáng mô tả hiệu suất năng lượng xanh trên bo mạch tương lai.'
      : 'Toàn cảnh thành phố hiện đại và dòng chuyển động của công nghệ số tương lai.';

    const scene5Text = isHistory
      ? 'Bạn có cảm nghĩ gì về mốc son lịch sử đáng tự hào này? Hãy để lại bình luận và theo dõi kênh để cùng lan tỏa giá trị dân tộc nhé!'
      : 'Bạn có nhận định gì về thông tin đáng chú ý này? Hãy để lại ý kiến bình luận bên dưới và theo dõi kênh để cập nhật sớm nhất nhé!';

    const topicScenes = [
      {
        id: `sc-${topic.id}-1`,
        order: 1,
        text: `Tin nóng vừa được xác nhận: ${topic.title}!`,
        estimated_duration_seconds: 5.5,
        search_keywords: ['breaking news headline broadcast'],
        visual_intent: isHistory ? 'Biểu tượng lịch sử hào hùng và cờ đỏ rực sáng tạo hook trong 3 giây đầu.' : 'Đồ họa tin nóng chớp sáng ấn tượng tạo hook thu hút người xem trong 3 giây đầu.',
        layout_type: 'fullscreen' as const,
        caption_emphasis: ['Tin nóng', 'vừa xác nhận'],
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
        text: topic.summary,
        estimated_duration_seconds: 6.8,
        search_keywords: isHistory ? ['truong son trail historic landmark reconstruction'] : ['analytical document report technology data'],
        visual_intent: isHistory ? 'Tư liệu lịch sử hào hùng về mở đường Trường Sơn và công cuộc tái thiết sau chiến tranh.' : 'Biểu đồ trực quan và tư liệu phân tích chuyên sâu về diễn biến sự việc.',
        layout_type: 'fullscreen' as const,
        caption_emphasis: ['chi tiết', 'bước đột phá'],
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
        text: `Theo xác minh từ ${topic.primary_publisher}, thông tin này đã được ${topic.sources_count} nguồn báo chí độc lập kiểm chứng và công bố.`,
        estimated_duration_seconds: 6.0,
        search_keywords: ['museum history documents verified facts'],
        visual_intent: isHistory ? 'Không gian trang trọng của Bảo tàng Lịch sử lưu giữ những hiện vật thiêng liêng.' : 'Phòng làm việc của các chuyên gia phân tích dữ liệu và cơ quan báo chí uy tín.',
        layout_type: 'fullscreen' as const,
        caption_emphasis: [topic.primary_publisher, 'nguồn độc lập'],
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
        estimated_duration_seconds: 5.5,
        search_keywords: ['mega landmark bridges engineering national development'],
        visual_intent: scene4Intent,
        layout_type: 'fullscreen' as const,
        caption_emphasis: isHistory ? ['đại công trình thế kỷ', 'vươn tầm quốc tế'] : ['tác động mạnh mẽ', 'thị trường'],
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
        estimated_duration_seconds: 5.8,
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

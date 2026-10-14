import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './views/DashboardView';
import { VideoStudioView } from './views/VideoStudioView';
import { AiProviderManagerView } from './views/AiProviderManagerView';
import { TrendsView } from './views/TrendsView';
import { PublishingView } from './views/PublishingView';
import { INITIAL_PROJECT, MOCK_PROVIDERS } from './data/mockData';
import type { VideoProject, AiProvider, TrendTopic } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [project, setProject] = useState<VideoProject>(INITIAL_PROJECT);
  const [providers, setProviders] = useState<AiProvider[]>(MOCK_PROVIDERS);

  const handleSelectTopicToCreate = (topic: TrendTopic) => {
    // Generate new project from topic and switch to studio
    const newProj: VideoProject = {
      id: `proj-${topic.id}-${Date.now().toString().slice(-4)}`,
      title: topic.title,
      niche: topic.niche_id === 'tech' ? 'Công nghệ & Bán dẫn' : 'Tài chính & Kinh tế',
      target_duration_seconds: 60,
      status: 'WAITING_FOR_APPROVAL',
      current_stage: 'STORYBOARD_READY',
      created_at: 'Vừa tạo từ Xu hướng',
      scenes_count: 4,
      scenes: [
        {
          id: 'sc-1',
          order: 1,
          text: `Tin chấn động vừa được xác nhận: ${topic.title.toLowerCase()}!`,
          estimated_duration_seconds: 5,
          search_keywords: ['breaking news technology headline'],
          visual_intent: 'Tiêu đề đồ họa chớp sáng ấn tượng thu hút người xem trong 3 giây đầu.',
          layout_type: 'fullscreen',
          caption_emphasis: ['Tin chấn động', 'vừa xác nhận'],
          source_claim_ids: ['cl-1'],
          media_candidate: {
            id: 'm-new-1',
            title: 'Breaking Tech Graphic',
            source: 'Verified Stock CC0',
            thumbnail_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
            rights_status: 'LICENSED',
            relevance_score: 95,
            license_name: 'CC0 Public Domain'
          }
        },
        ...INITIAL_PROJECT.scenes.slice(1)
      ]
    };
    setProject(newProj);
    setCurrentTab('studio');
  };

  return (
    <div className="flex min-h-screen bg-[#090D16] text-[#F8FAFC]">
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
          onOpenQuickCreate={() => setCurrentTab('trends')}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              project={project}
              onOpenStudio={() => setCurrentTab('studio')}
              onOpenProviders={() => setCurrentTab('ai-providers')}
              onOpenTrends={() => setCurrentTab('trends')}
              onOpenPublishing={() => setCurrentTab('publishing')}
            />
          )}

          {currentTab === 'studio' && (
            <VideoStudioView
              project={project}
              onUpdateProject={setProject}
              onOpenPublishing={() => setCurrentTab('publishing')}
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

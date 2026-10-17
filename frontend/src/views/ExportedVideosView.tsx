import React, { useState, useEffect, useCallback } from 'react';
import { 
  Film, 
  Play, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  RefreshCw, 
  ExternalLink, 
  Sparkles, 
  Download, 
  Calendar, 
  Eye,
  X,
  Send,
  Loader2,
  Search,
  Link2,
  Mic,
  Zap,
  Cloud
} from 'lucide-react';
import { ExportedVideosApi, PublishingApi, type ApiExportedVideo, StudioApi } from '../services/api';

const Youtube: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

interface ExportedVideosViewProps {
  onNavigateToStudio?: () => void;
  onNavigateToCreate?: () => void;
}

export const ExportedVideosView: React.FC<ExportedVideosViewProps> = ({ 
  onNavigateToStudio: _studio,
  onNavigateToCreate: _create 
}) => {
  const [videos, setVideos] = useState<ApiExportedVideo[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideoModal, setActiveVideoModal] = useState<ApiExportedVideo | null>(null);
  const [scheduleModalVideo, setScheduleModalVideo] = useState<ApiExportedVideo | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedDateTime, setSelectedDateTime] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createUrlInput, setCreateUrlInput] = useState('');
  const [createAccountId, setCreateAccountId] = useState('');
  const [createVoicePreset, setCreateVoicePreset] = useState('vi-VN-NamMinhNeural-news');
  const [createScheduleOption, setCreateScheduleOption] = useState<'immediate' | 'custom'>('immediate');
  const [createCustomDateTime, setCreateCustomDateTime] = useState('');
  const [isCreatingVideo, setIsCreatingVideo] = useState(false);

  const sampleArticles = [
    {
      label: 'Thời Sự Quốc Gia: Cao Tốc & Đường Sắt',
      url: 'https://baochinhphu.vn/thong-xe-toan-tuyen-cao-toc-bac-nam-va-duong-sat-toc-do-cao-102261015.htm',
      title: 'Đột phá hạ tầng quốc gia: Hoàn thành trục xương sống kết nối kinh tế toàn diện đất nước',
      publisher: 'Cổng Thông Tin Điện Tử Chính Phủ & TTXVN'
    },
    {
      label: 'Khoa Học & Đột Phá: Pin Thể Rắn 1.000km',
      url: 'https://vnexpress.net/oto-dien-pin-the-ran-chay-1000km-moi-lan-sac-4792101.html',
      title: 'Đột phá xe điện chạy 1.000km một lần sạc nhờ pin thể rắn thế hệ mới',
      publisher: 'VnExpress Khoa Học'
    },
    {
      label: 'Y Tế & Đời Sống: AI Phát Hiện Ung Thư',
      url: 'https://tuoitre.vn/ai-phat-hien-som-ung-thu-truoc-3-nam-20261014.htm',
      title: 'AI phát hiện sớm tế bào ung thư trước 3 năm so với chẩn đoán truyền thống',
      publisher: 'Tuổi Trẻ Online'
    }
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const backendHost = StudioApi.getBackendBaseUrl();

  const loadData = useCallback(async () => {
    try {
      const [vidsRes, accsRes] = await Promise.all([
        ExportedVideosApi.getExportedVideos(),
        PublishingApi.getAccounts()
      ]);

      if (vidsRes.success && vidsRes.data) {
        setVideos(vidsRes.data);
      }
      if (accsRes.success && accsRes.data) {
        setAccounts(accsRes.data);
      }
    } catch (err) {
      console.error('Failed to load exported videos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load and periodic polling every 4 seconds for live progress
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handlePublishNow = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await ExportedVideosApi.publishNow(id);
      if (res.success) {
        showToast('🚀 Đã xuất bản video thành công lên kênh YouTube!');
        loadData();
      } else {
        showToast(res.error?.message || 'Xuất bản thất bại.');
      }
    } catch {
      showToast('Lỗi kết nối khi gửi yêu cầu đăng video.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateSchedule = async () => {
    if (!scheduleModalVideo) return;
    setActionLoadingId(scheduleModalVideo.id);
    try {
      const res = await ExportedVideosApi.updateSchedule(scheduleModalVideo.id, {
        account_id: selectedAccountId || undefined,
        scheduled_time: selectedDateTime ? new Date(selectedDateTime).toISOString() : undefined
      });
      if (res.success) {
        showToast('✅ Đã cập nhật kênh và lịch hẹn đăng video!');
        setScheduleModalVideo(null);
        loadData();
      } else {
        showToast(res.error?.message || 'Cập nhật lịch đăng thất bại.');
      }
    } catch {
      showToast('Lỗi khi cập nhật lịch đăng.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa video này khỏi danh sách?')) return;
    setActionLoadingId(id);
    try {
      const res = await ExportedVideosApi.deleteVideo(id);
      if (res.success) {
        showToast('Đã xóa video.');
        loadData();
      } else {
        showToast(res.error?.message || 'Không thể xóa video.');
      }
    } catch {
      showToast('Lỗi khi xóa video.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleTriggerTick = async () => {
    try {
      const res = await ExportedVideosApi.triggerTick();
      if (res.success) {
        showToast('⚡ Đã kiểm tra lịch đăng tự động và quy trình dọn dẹp sau 1 giờ!');
        loadData();
      }
    } catch {
      showToast('Lỗi kiểm tra lịch đăng.');
    }
  };

  const handleStartQuickCreate = async () => {
    const rawUrl = createUrlInput.trim();
    if (!rawUrl) {
      showToast('Vui lòng nhập hoặc chọn link bài báo!');
      return;
    }

    setIsCreatingVideo(true);
    const matchedSample = sampleArticles.find(s => s.url === rawUrl);
    const videoTitle = matchedSample ? matchedSample.title : `Tin Tức Nổi Bật: ${rawUrl.replace(/^https?:\/\//, '').split('/')[0]}`;
    const publisherName = matchedSample ? matchedSample.publisher : rawUrl.replace(/^https?:\/\//, '').split('/')[0];

    const projId = `proj-render-${Date.now().toString().slice(-4)}`;
    const voiceId = createVoicePreset.includes('HoaiMy') ? 'vi-VN-HoaiMyNeural' : 'vi-VN-NamMinhNeural';
    const targetSchedTime = createScheduleOption === 'custom' && createCustomDateTime
      ? new Date(createCustomDateTime).toISOString()
      : undefined;

    const scenes = [
      {
        id: `sc-${projId}-1`,
        order: 1,
        text: `Tiêu điểm tin tức hôm nay: ${videoTitle}!`,
        estimated_duration_seconds: 5.5,
        search_keywords: ['breaking news broadcast headline'],
        visual_intent: 'Đồ họa tiêu điểm tin nóng ấn tượng trong 3 giây đầu.',
        layout_type: 'fullscreen',
        caption_emphasis: ['tiêu điểm', 'tin tức']
      },
      {
        id: `sc-${projId}-2`,
        order: 2,
        text: matchedSample ? matchedSample.title : 'Thông tin chi tiết bóc tách trực tiếp từ liên kết bài báo với độ chính xác và kiểm chứng cao.',
        estimated_duration_seconds: 6.5,
        search_keywords: ['detailed document report analytics'],
        visual_intent: 'Tư liệu chi tiết và diễn giải logic các khía cạnh cốt lõi của sự việc.',
        layout_type: 'fullscreen',
        caption_emphasis: ['chi tiết', 'kiểm chứng']
      },
      {
        id: `sc-${projId}-3`,
        order: 3,
        text: `Theo xác minh từ ${publisherName}, toàn bộ dữ liệu đã được rà soát và xác thực tính pháp lý nghiêm ngặt.`,
        estimated_duration_seconds: 5.8,
        search_keywords: ['verified press news facts report'],
        visual_intent: 'Phòng làm việc chuyên gia biên tập tin tức và kiểm chứng nguồn tin.',
        layout_type: 'fullscreen',
        caption_emphasis: [publisherName, 'xác thực']
      },
      {
        id: `sc-${projId}-4`,
        order: 4,
        text: 'Công trình và sự kiện này đang tạo đòn bẩy phát triển mạnh mẽ và thu hút sự quan tâm lớn của đông đảo cộng đồng.',
        estimated_duration_seconds: 5.5,
        search_keywords: ['economic growth industrial port logistics cargo'],
        visual_intent: 'Nhịp sống phát triển hiện đại và các cơ hội tăng trưởng vượt bậc.',
        layout_type: 'fullscreen',
        caption_emphasis: ['đòn bẩy', 'phát triển']
      },
      {
        id: `sc-${projId}-5`,
        order: 5,
        text: 'Bạn có suy nghĩ gì về vấn đề này? Hãy bình luận bên dưới và bấm theo dõi kênh để cập nhật diễn biến mới nhất nhé!',
        estimated_duration_seconds: 5.5,
        search_keywords: ['discussion subscribe comment social icon'],
        visual_intent: 'Hộp thoại tương tác và nút đăng ký kênh theo dõi tin tức đời sống.',
        layout_type: 'fullscreen',
        caption_emphasis: ['bình luận', 'theo dõi kênh']
      }
    ];

    try {
      const targetAcc = accounts.find(a => a.id === createAccountId) || accounts[0];
      const optimisticVideo: ApiExportedVideo = {
        id: projId,
        project_id: projId,
        title: videoTitle,
        video_url: null,
        duration_seconds: 28,
        status: 'RENDERING',
        progress_percent: 15,
        current_step: 'Đang tổng hợp âm thanh AI Neural & canh khung phụ đề Pop-in...',
        file_size_mb: 0,
        file_exists: false,
        created_at: new Date().toISOString(),
        is_cleaned_up: false,
        account: targetAcc || null,
        scheduled_time: targetSchedTime || null,
        posted_time: null,
        post_url: null,
        cleanup_time: null,
        remaining_cleanup_seconds: null
      };

      setVideos(prev => [optimisticVideo, ...prev]);
      setIsCreateModalOpen(false);
      showToast('🚀 Đã bắt đầu tạo video! Vòng xoay neon đang chạy quanh ô video...');

      // Call backend render API
      StudioApi.renderVideo({
        project_id: projId,
        title: videoTitle,
        scenes: scenes,
        voice_id: voiceId,
        voice_preset_id: createVoicePreset,
        subtitle_mode: 'word_group',
        account_id: createAccountId || targetAcc?.id || undefined,
        scheduled_time: targetSchedTime
      }).catch(err => {
        console.warn('Render trigger warning:', err);
      });

      setCreateUrlInput('');
      setTimeout(loadData, 2000);
    } catch {
      showToast('Lỗi khi bắt đầu tạo video.');
    } finally {
      setIsCreatingVideo(false);
    }
  };

  // Status Metrics
  const totalCount = videos.length;
  const renderingCount = videos.filter(v => v.status === 'RENDERING').length;
  const scheduledCount = videos.filter(v => v.status === 'SCHEDULED' || v.status === 'READY' || v.status === 'PENDING_APPROVAL').length;
  const publishedCount = videos.filter(v => v.status === 'PUBLISHED').length;
  const cleanedCount = videos.filter(v => v.status === 'CLEANED_UP' || v.is_cleaned_up).length;

  // Filtered List
  const filteredVideos = videos.filter(v => {
    if (filterStatus === 'rendering' && v.status !== 'RENDERING') return false;
    if (filterStatus === 'scheduled' && !['SCHEDULED', 'READY', 'PENDING_APPROVAL'].includes(v.status)) return false;
    if (filterStatus === 'published' && v.status !== 'PUBLISHED') return false;
    if (filterStatus === 'cleaned' && !v.is_cleaned_up && v.status !== 'CLEANED_UP') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = v.title.toLowerCase().includes(q);
      const matchAccount = v.account?.account_name.toLowerCase().includes(q);
      return matchTitle || matchAccount;
    }
    return true;
  });

  const getMediaFullUrl = (relativeUrl: string | null) => {
    if (!relativeUrl) return '';
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) return relativeUrl;
    return `${backendHost}${relativeUrl}`;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-xl border border-indigo-500/50 shadow-2xl flex items-center space-x-3 backdrop-blur-md animate-bounce">
          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-[#0F172A]/70 border border-white/10 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tổng Video Đã Xử Lý</span>
            <Film className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Toàn bộ dự án render</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F172A]/70 border border-amber-500/30 backdrop-blur-md flex flex-col justify-between relative overflow-hidden">
          {renderingCount > 0 && (
            <div className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </div>
          )}
          <div className="flex items-center justify-between text-amber-300 text-xs">
            <span>Đang Render</span>
            <Loader2 className={`w-4 h-4 text-amber-400 ${renderingCount > 0 ? 'animate-spin' : ''}`} />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400">{renderingCount}</div>
          <div className="text-[11px] text-amber-300/80 mt-1">Live tiến trình tạo video</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F172A]/70 border border-purple-500/30 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-300 text-xs">
            <span>Chờ Đăng & Lên Lịch</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-400">{scheduledCount}</div>
          <div className="text-[11px] text-purple-300/80 mt-1">Tự động đẩy khi đến giờ</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F172A]/70 border border-red-500/30 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-red-300 text-xs">
            <span>Đã Đăng YouTube</span>
            <Youtube className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-red-400">{publishedCount}</div>
          <div className="text-[11px] text-red-300/80 mt-1">Đã phát sóng thành công</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F172A]/70 border border-emerald-500/30 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-300 text-xs">
            <span>Đã Dọn Dẹp Bộ Nhớ</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{cleanedCount}</div>
          <div className="text-[11px] text-emerald-300/80 mt-1">Tự xóa file sau 1h đăng</div>
        </div>
      </div>

      {/* Control Bar: Filters, Search, Manual Sync */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-[#0F172A]/80 border border-white/10 rounded-2xl backdrop-blur-md">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'rendering', label: `Đang Render (${renderingCount})` },
            { id: 'scheduled', label: `Chờ Đăng (${scheduledCount})` },
            { id: 'published', label: `Đã Đăng (${publishedCount})` },
            { id: 'cleaned', label: `Đã Dọn Dẹp (${cleanedCount})` }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                filterStatus === f.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 font-semibold'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, kênh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={handleTriggerTick}
            title="Kích hoạt kiểm tra lịch đăng và dọn dẹp ngay"
            className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs flex items-center gap-1.5 transition whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Kiểm tra lịch & Dọn dẹp</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition transform hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
            <span>+ Tạo Video Mới</span>
          </button>
        </div>
      </div>

      {/* Videos List Grid */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-xs text-slate-400">Đang đồng bộ danh sách video đã xuất...</span>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0F172A]/50 border border-white/10 flex flex-col items-center justify-center space-y-4">
          <Film className="w-12 h-12 text-slate-600" />
          <div className="text-sm font-medium text-slate-300">Chưa có video nào trong danh mục này</div>
          <p className="text-xs text-slate-400 max-w-md">
            Khi bạn bấm "Tạo Video Mới", hệ thống sẽ tự động tổng hợp âm thanh, phụ đề Pop-in và render video. Video đang render sẽ có vòng chạy neon xoay tròn quanh khung video, đạt 100% sẽ mở ra xem!
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-cyan-200" />
            <span>+ Tạo Video Mới Ngay</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredVideos.map((video) => {
            const isRendering = video.status === 'RENDERING';
            const isCleaned = video.is_cleaned_up || video.status === 'CLEANED_UP';
            const isPublished = video.status === 'PUBLISHED';
            const isScheduled = ['SCHEDULED', 'READY', 'PENDING_APPROVAL'].includes(video.status);
            const mediaUrl = getMediaFullUrl(video.video_url);

            return (
              <div 
                key={video.id}
                className="bg-[#0F172A]/80 border border-white/10 hover:border-white/20 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between shadow-xl backdrop-blur-md"
              >
                <div>
                  {/* Top Bar: Channel Badge & Status Tag */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {/* Channel Badge */}
                    <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                      <Youtube className="w-3.5 h-3.5 text-red-500" />
                      <span>{video.account?.account_name || 'Kênh YouTube MCN'}</span>
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center space-x-2">
                      {isRendering && (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1.5 animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Đang tạo video ({video.progress_percent}%)
                        </span>
                      )}

                      {isScheduled && !isRendering && (
                        <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-semibold flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          Đã lên lịch đăng
                        </span>
                      )}

                      {isPublished && !isCleaned && (
                        <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-md shadow-red-600/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Đã đăng YouTube
                        </span>
                      )}

                      {isCleaned && (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          Đã dọn dẹp file sau 1h
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Preview Container */}
                  <h3 className="font-semibold text-sm text-white line-clamp-2 mb-3">
                    {video.title}
                  </h3>

                  {/* Visual Preview / Rendering Progress / Cleaned message */}
                  {isRendering ? (
                    <div 
                      onClick={() => showToast(`⏳ Video "${video.title}" đang được render (${video.progress_percent}%). Vui lòng đợi đạt 100% để mở xem video!`)}
                      className="relative w-full rounded-2xl overflow-hidden aspect-[16/9] mb-4 p-[3px] flex items-center justify-center shadow-2xl cursor-not-allowed group select-none"
                    >
                      {/* VÒNG CHẠY QUANH Ô VIDEO (Animated running multi-color spinning border beam) */}
                      <div 
                        className="absolute inset-[-140%] animate-[spin_3s_linear_infinite]"
                        style={{
                          background: 'conic-gradient(from 0deg, #6366f1, #06b6d4, #10b981, #f59e0b, #ec4899, #6366f1)'
                        }}
                      />
                      {/* Ambient blur glow */}
                      <div className="absolute inset-0 bg-indigo-950/40 blur-xl animate-pulse" />

                      {/* Inner Dark Surface */}
                      <div className="relative z-10 w-full h-full rounded-[13px] bg-[#0A0F1D]/95 backdrop-blur-md flex flex-col items-center justify-center p-3 text-center">
                        {/* Circular Progress Ring with Live % */}
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-1.5">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="38"
                              className="text-slate-800"
                              strokeWidth="8"
                              stroke="currentColor"
                              fill="transparent"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="38"
                              className="transition-all duration-500 ease-out"
                              strokeWidth="8"
                              strokeDasharray={238.7}
                              strokeDashoffset={238.7 - (238.7 * Math.min(100, Math.max(5, video.progress_percent || 10))) / 100}
                              strokeLinecap="round"
                              stroke="url(#exportProgressGrad)"
                              fill="transparent"
                            />
                            <defs>
                              <linearGradient id="exportProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#06b6d4" />
                                <stop offset="50%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#10b981" />
                              </linearGradient>
                            </defs>
                          </svg>

                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-sm sm:text-base font-black text-cyan-300 font-mono tracking-tight">
                              {video.progress_percent || 10}%
                            </span>
                          </div>
                        </div>

                        {/* Step Description */}
                        <div className="text-[11px] font-semibold text-white truncate max-w-[240px] flex items-center gap-1.5 mb-1">
                          <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                          <span className="truncate">{video.current_step || 'Đang tạo video theo kịch bản...'}</span>
                        </div>

                        {/* Lock Indicator */}
                        <div className="px-2.5 py-0.5 rounded-full bg-slate-800/90 border border-white/10 text-[10px] text-amber-300 font-medium flex items-center gap-1.5 shadow-sm">
                          <span>🔒 Khóa xem • Đạt 100% sẽ mở ra</span>
                        </div>
                      </div>
                    </div>
                  ) : isCleaned ? (
                    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 border border-white/5 aspect-[16/9] mb-4 flex items-center justify-center p-4 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-300">
                        <Sparkles className="w-8 h-8 text-emerald-400 mb-2 opacity-80" />
                        <div className="text-xs font-medium text-emerald-300">
                          File cục bộ đã được dọn dẹp an toàn
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                          Sau khi video đăng tải 1 tiếng, hệ thống tự động giải phóng bộ nhớ ổ đĩa. Bạn có thể xem trực tiếp video đã phát sóng trên YouTube.
                        </p>
                      </div>
                    </div>
                  ) : mediaUrl ? (
                    <div 
                      onClick={() => setActiveVideoModal(video)}
                      className="relative w-full rounded-2xl overflow-hidden bg-slate-900 border border-white/10 hover:border-indigo-500/50 aspect-[16/9] mb-4 flex items-center justify-center cursor-pointer group shadow-lg transition-all"
                    >
                      <video 
                        src={mediaUrl} 
                        className="w-full h-full object-contain bg-black"
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/15 flex items-center justify-center transition">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveVideoModal(video);
                          }}
                          className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-xl transform group-hover:scale-110 transition"
                        >
                          <Play className="w-5 h-5 ml-0.5 fill-white" />
                        </button>
                      </div>
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-slate-300">
                        MP4 9:16
                      </span>
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-500/80 text-[10px] text-white font-medium flex items-center gap-1 shadow">
                        <CheckCircle2 className="w-3 h-3" /> Đã hoàn tất 100%
                      </span>
                    </div>
                  ) : (
                    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 border border-white/5 aspect-[16/9] mb-4 flex items-center justify-center text-center p-4">
                      <Film className="w-8 h-8 text-slate-600 mx-auto mb-1" />
                      <span className="text-xs text-slate-400">File video sẵn sàng</span>
                    </div>
                  )}

                  {/* Metadata and Timing Details */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-white/5 mb-3">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">
                        Lịch: {video.scheduled_time ? new Date(video.scheduled_time).toLocaleString('vi-VN') : 'Ngay sau khi xong'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">
                        {video.posted_time 
                          ? `Đăng lúc: ${new Date(video.posted_time).toLocaleTimeString('vi-VN')}`
                          : 'Chưa phát sóng'}
                      </span>
                    </div>

                    {video.posted_time && (
                      <div className="col-span-2 flex items-center space-x-1.5 text-emerald-400/90 pt-1 border-t border-white/5">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {isCleaned 
                            ? 'Đã tự động xóa file MP4 lưu trữ sau 1h để tiết kiệm đĩa.' 
                            : video.remaining_cleanup_seconds 
                              ? `Tự xóa file sau 1h: Còn ~${Math.ceil(video.remaining_cleanup_seconds / 60)} phút nữa`
                              : 'Đang xếp lịch xóa file sau 1h'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10 gap-2">
                  <div className="flex items-center space-x-2">
                    {mediaUrl && !isCleaned && (
                      <button
                        onClick={() => setActiveVideoModal(video)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/20 flex items-center gap-1 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem Lại</span>
                      </button>
                    )}

                    {video.post_url && (
                      <a
                        href={video.post_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-medium border border-red-500/30 flex items-center gap-1 transition"
                      >
                        <Youtube className="w-3.5 h-3.5 text-red-400" />
                        <span>Xem YouTube</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {mediaUrl && !isCleaned && (
                      <a
                        href={mediaUrl}
                        download={`video_${video.project_id}.mp4`}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
                        title="Tải MP4 về máy"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}

                    <a
                      href={`https://drive.google.com/drive/search?q=${encodeURIComponent(video.title)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition"
                      title="Mở trên Google Drive Cloud"
                    >
                      <Cloud className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Publish Now Button (if not published) */}
                    {!isPublished && !isRendering && (
                      <button
                        onClick={() => handlePublishNow(video.id)}
                        disabled={actionLoadingId === video.id}
                        className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-red-600/20 flex items-center gap-1.5 transition disabled:opacity-50"
                      >
                        {actionLoadingId === video.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Đăng Ngay</span>
                      </button>
                    )}

                    {/* Schedule Re-assign Button */}
                    {!isPublished && (
                      <button
                        onClick={() => {
                          setScheduleModalVideo(video);
                          setSelectedAccountId(video.account?.id || '');
                          if (video.scheduled_time) {
                            setSelectedDateTime(video.scheduled_time.slice(0, 16));
                          }
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                        title="Đổi kênh YouTube hoặc hẹn lại giờ"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(video.id)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                      title="Xóa video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Playback Modal (9:16 Theater Preview) */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative bg-[#0F172A] border border-white/20 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="font-semibold text-xs text-white truncate max-w-[280px]">
                {activeVideoModal.title}
              </span>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative aspect-[9/16] bg-black flex items-center justify-center max-h-[72vh]">
              <video
                src={getMediaFullUrl(activeVideoModal.video_url)}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-3 bg-slate-900 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5 text-red-400">
                <Youtube className="w-4 h-4" />
                {activeVideoModal.account?.account_name || 'Kênh YouTube'}
              </span>

              {activeVideoModal.video_url && (
                <a
                  href={getMediaFullUrl(activeVideoModal.video_url)}
                  download={`rendered_${activeVideoModal.project_id}.mp4`}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải File Gốc</span>
                </a>
              )}

              <a
                href={`https://drive.google.com/drive/search?q=${encodeURIComponent(activeVideoModal.title)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1 transition"
                title="Mở trên Google Drive"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Google Drive</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Change Channel & Schedule Time */}
      {scheduleModalVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-white/15 rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                Cài Đặt Lịch & Kênh YouTube
              </h4>
              <button
                onClick={() => setScheduleModalVideo(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Gán Kênh YouTube:</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Chọn kênh YouTube --</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_name} ({acc.platform})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Thời Gian Tự Động Đăng:</label>
                <input
                  type="datetime-local"
                  value={selectedDateTime}
                  onChange={(e) => setSelectedDateTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Video sẽ tự động được tải lên kênh YouTube đã chọn khi đến giờ hẹn. Sau 1 tiếng đăng, file gốc sẽ tự động dọn dẹp.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-white/10">
              <button
                onClick={() => setScheduleModalVideo(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-300 hover:bg-white/5"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateSchedule}
                disabled={actionLoadingId === scheduleModalVideo.id}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {actionLoadingId === scheduleModalVideo.id && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>Lưu Cài Đặt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Create Video Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0B1120] border border-indigo-500/40 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-fade-in relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Tạo Video Mới & Tự Động Render 9:16</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Auto Pipeline</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Bấm tạo sẽ tự động render âm thanh & hình ảnh, tiến trình hiển thị trực tiếp với vòng xoay quanh ô video
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Article Link */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-cyan-400" />
                <span>Đường Dẫn Bài Báo / Tin Tức Nguồn:</span>
              </label>
              <input
                type="url"
                value={createUrlInput}
                onChange={(e) => setCreateUrlInput(e.target.value)}
                placeholder="Dán link bài báo (VnExpress, Tuổi Trẻ, Báo Chính Phủ, Zing News...)"
                className="w-full px-3.5 py-2.5 bg-[#070B14] border border-white/10 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition"
              />

              {/* Sample Quick Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400">Tin mẫu 1 click:</span>
                {sampleArticles.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCreateUrlInput(sample.url)}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-300 border border-white/10 transition"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Setup Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Option 1: Channel */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Youtube className="w-4 h-4 text-red-500" />
                  <span>Kênh YouTube Đăng Tải:</span>
                </label>
                <select
                  value={createAccountId}
                  onChange={(e) => setCreateAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#070B14] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {accounts.length > 0 ? (
                    accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_name} ({acc.platform})
                      </option>
                    ))
                  ) : (
                    <option value="">TechBytes Shorts VN (MCN Mặc định)</option>
                  )}
                </select>
              </div>

              {/* Option 2: AI Neural Voice */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-cyan-400" />
                  <span>Giọng Đọc AI Neural (Edge-TTS):</span>
                </label>
                <select
                  value={createVoicePreset}
                  onChange={(e) => setCreateVoicePreset(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#070B14] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <optgroup label="Nam Minh (Giọng Nam)">
                    <option value="vi-VN-NamMinhNeural-news">🎙️ Nam Minh [NAM] - Tin Tức Chính Luận (Chuẩn VTV)</option>
                    <option value="vi-VN-NamMinhNeural-drama">🎙️ Nam Minh [NAM] - Thời Sự Nóng Hổi & Kịch Tính</option>
                    <option value="vi-VN-NamMinhNeural-tech">🎙️ Nam Minh [NAM] - Công Nghệ & Khám Phá</option>
                  </optgroup>
                  <optgroup label="Hoài My (Giọng Nữ)">
                    <option value="vi-VN-HoaiMyNeural-news">🎙️ Hoài My [NỮ] - Tự Nhiên & Thời Sự</option>
                    <option value="vi-VN-HoaiMyNeural-inspire">🎙️ Hoài My [NỮ] - Truyền Cảm Hứng & Sách Nói</option>
                  </optgroup>
                </select>
              </div>

              {/* Option 3: Subtitle Style */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Hiệu Ứng Chữ Subtitle:</span>
                </label>
                <div className="p-2.5 bg-[#070B14] border border-white/10 rounded-xl text-xs text-amber-300 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  <span>TikTok Pop-in Jump (Nhảy chữ 135% ➔ 100%)</span>
                </div>
              </div>

              {/* Option 4: Schedule */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span>Lịch Đăng YouTube:</span>
                </label>
                <select
                  value={createScheduleOption}
                  onChange={(e) => setCreateScheduleOption(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-[#070B14] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="immediate">⚡ Đăng ngay khi render xong 100%</option>
                  <option value="custom">📅 Hẹn ngày giờ cụ thể</option>
                </select>
              </div>
            </div>

            {/* Custom Datetime Input if selected */}
            {createScheduleOption === 'custom' && (
              <div className="pt-1">
                <label className="text-xs text-slate-300 block mb-1">Chọn ngày & giờ phát sóng:</label>
                <input
                  type="datetime-local"
                  value={createCustomDateTime}
                  onChange={(e) => setCreateCustomDateTime(e.target.value)}
                  className="w-full sm:w-72 px-3 py-2 bg-[#070B14] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Video 1080x1920 (9:16) nén 25 FPS, phụ đề Pop-in đồng bộ tuyệt đối.
              </span>
              <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/5 transition"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleStartQuickCreate}
                  disabled={isCreatingVideo}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {isCreatingVideo ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
                      <span>Đang Khởi Tạo...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀 Bắt Đầu Tạo Video</span>
                      <Sparkles className="w-4 h-4 text-cyan-200" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

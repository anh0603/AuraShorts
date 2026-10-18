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
  Cloud,
  Settings,
  HardDrive,
  ShieldCheck,
  FolderPlus,
  ArrowUpRight
} from 'lucide-react';
import { ExportedVideosApi, PublishingApi, type ApiExportedVideo, StudioApi, GDriveApi, type GDriveStatus } from '../services/api';

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

  // Google Drive Cloud State
  const [gdriveStatus, setGdriveStatus] = useState<GDriveStatus | null>(null);
  const [isGDriveModalOpen, setIsGDriveModalOpen] = useState(false);
  const [gdriveClientId, setGdriveClientId] = useState('');
  const [gdriveClientSecret, setGdriveClientSecret] = useState('');
  const [autoDeleteLocal, setAutoDeleteLocal] = useState(true);
  const [isTestingGDrive, setIsTestingGDrive] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [gdriveModalTab, setGdriveModalTab] = useState<'config' | 'guide'>('config');
  const [activeGuideStep, setActiveGuideStep] = useState(1);

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
      const [vidsRes, accsRes, gdRes] = await Promise.all([
        ExportedVideosApi.getExportedVideos(),
        PublishingApi.getAccounts(),
        GDriveApi.getStatus()
      ]);

      if (vidsRes.success && vidsRes.data) {
        setVideos(vidsRes.data);
      }
      if (accsRes.success && accsRes.data) {
        setAccounts(accsRes.data);
      }
      if (gdRes.success && gdRes.data) {
        setGdriveStatus(gdRes.data);
        setAutoDeleteLocal(gdRes.data.auto_delete_local_mp4);
      }
    } catch (err) {
      console.error('Failed to load exported videos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTestGDriveUpload = async () => {
    setIsTestingGDrive(true);
    setTestResult(null);
    try {
      const res = await GDriveApi.testUpload();
      setTestResult(res.data);
      if (res.success && res.data?.web_view_link) {
        showToast('🚀 Tải video test lên Google Drive thành công!');
        loadData();
      } else {
        showToast('Tải test: ' + (res.error?.message || 'Chưa hoàn tất'));
      }
    } catch {
      showToast('Lỗi khi gửi yêu cầu kiểm tra Google Drive.');
    } finally {
      setIsTestingGDrive(false);
    }
  };

  const handleSaveGDriveSettings = async () => {
    try {
      const payload: any = {
        auto_delete_local_mp4_post_upload: autoDeleteLocal,
      };
      if (gdriveClientId) payload.client_id = gdriveClientId;
      if (gdriveClientSecret) payload.client_secret = gdriveClientSecret;
      const res = await GDriveApi.updateConfig(payload);
      if (res.success) {
        showToast('✅ Đã lưu cài đặt Google Drive!');
        loadData();
      }
    } catch {
      showToast('Lỗi khi lưu cấu hình.');
    }
  };

  const handleConnectOAuth = async () => {
    try {
      const res = await GDriveApi.getAuthUrl();
      if (res.success && res.data?.auth_url) {
        window.location.href = res.data.auth_url;
      } else {
        showToast('Vui lòng nhập Client ID & Client Secret trước khi đăng nhập Google.');
      }
    } catch {
      showToast('Lỗi khi tạo liên kết đăng nhập Google.');
    }
  };

  const handleUploadJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await GDriveApi.uploadJsonFile(file);
      if (res.success) {
        showToast(res.data?.message || 'Đã nạp file chứng thực Google Drive thành công!');
        loadData();
      } else {
        showToast(res.error?.message || 'Nạp file thất bại.');
      }
    } catch {
      showToast('Lỗi khi tải file chứng thực lên.');
    }
  };

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

      {/* Google Drive Cloud 5TB Sync Status Banner */}
      <div className={`p-4 rounded-2xl border backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
        gdriveStatus?.configured
          ? 'bg-emerald-950/20 border-emerald-500/30'
          : 'bg-amber-950/20 border-amber-500/30'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
            gdriveStatus?.configured
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white'
              : 'bg-gradient-to-tr from-amber-600 to-orange-500 text-white'
          }`}>
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">
                LƯU TRỮ GOOGLE DRIVE CLOUD (5TB)
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                gdriveStatus?.configured
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}>
                {gdriveStatus?.configured ? '🟢 Đã kết nối 5TB' : '🟡 Chế độ mô phỏng đám mây'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
              {gdriveStatus?.configured
                ? `Đang tự động đẩy video vào thư mục: ${gdriveStatus.folder_name}/YYYY-MM-DD/ và dọn dẹp bộ nhớ máy tính (Zero Local Storage).`
                : 'Chưa gắn tài khoản Google Drive 5TB. Các liên kết video đang hiển thị ở chế độ xem trước đám mây. Hãy bấm cấu hình để video tự đẩy thẳng vào Drive cá nhân.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={handleTestGDriveUpload}
            disabled={isTestingGDrive}
            className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium border border-white/10 flex items-center justify-center gap-1.5 transition"
            title="Kiểm tra tải thử 1 video mẫu"
          >
            {isTestingGDrive ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            )}
            <span>Test Tải Thử</span>
          </button>

          <button
            onClick={() => setIsGDriveModalOpen(true)}
            className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Cài Đặt Drive 5TB</span>
          </button>
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

                    <button
                      onClick={() => {
                        const targetUrl = (gdriveStatus?.last_upload?.view_url && gdriveStatus.last_upload.title === video.title)
                          ? gdriveStatus.last_upload.view_url
                          : `https://drive.google.com/drive/search?q=${encodeURIComponent(video.title)}`;
                        window.open(targetUrl, '_blank');
                      }}
                      className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition"
                      title={gdriveStatus?.configured ? "Mở video trên Google Drive 5TB" : "Mở Google Drive (Chế độ xem trước)"}
                    >
                      <Cloud className="w-4 h-4" />
                    </button>
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
      {/* Google Drive 5TB Configuration Modal */}
      {isGDriveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-[#0B132B] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh] space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Kết Nối Google Drive Cloud (5TB)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      0 VND Phí API
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tự động tạo thư mục theo ngày (AuraShorts/YYYY-MM-DD) và giải phóng 100% dung lượng đĩa
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGDriveModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center space-x-2 p-1 bg-slate-900/90 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setGdriveModalTab('config')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  gdriveModalTab === 'config'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Cấu Hình & Kết Nối</span>
              </button>
              <button
                type="button"
                onClick={() => setGdriveModalTab('guide')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  gdriveModalTab === 'guide'
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                <span>Slide Hướng Dẫn Từng Bước (0đ)</span>
              </button>
            </div>

            {gdriveModalTab === 'config' ? (
              <>
                {/* Current Status Overview */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Trạng thái kết nối:</span>
                    <span className={`font-semibold flex items-center gap-1.5 ${
                      gdriveStatus?.configured ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${gdriveStatus?.configured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                      {gdriveStatus?.configured ? 'Đã kết nối tài khoản Google thành công' : 'Chưa kết nối (Chế độ mô phỏng)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Thư mục tự động tạo:</span>
                    <span className="font-mono text-cyan-300 font-medium">AuraShorts / {new Date().toISOString().slice(0, 10)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Tự xóa file máy tính sau khi đẩy (Zero Disk):</span>
                    <span className={`font-semibold ${autoDeleteLocal ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {autoDeleteLocal ? 'BẬT (0 MB ổ cứng)' : 'TẮT (Giữ lại file máy)'}
                    </span>
                  </div>
                </div>

                {/* Method 1: OAuth2 1-Click Connect */}
                <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <span>Cách 1: Đăng nhập Google (Tài khoản 5TB)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Miễn phí trọn đời</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-300 font-medium block mb-1">Google Client ID:</label>
                      <input
                        type="text"
                        placeholder="xxxx.apps.googleusercontent.com"
                        value={gdriveClientId}
                        onChange={(e) => setGdriveClientId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-300 font-medium block mb-1">Google Client Secret:</label>
                      <input
                        type="password"
                        placeholder="GOCSPX-xxxx"
                        value={gdriveClientSecret}
                        onChange={(e) => setGdriveClientSecret(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveGDriveSettings}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium transition"
                    >
                      Lưu Thông Tin
                    </button>
                    <button
                      type="button"
                      onClick={handleConnectOAuth}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 flex items-center gap-1.5 transition"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Đăng Nhập Google 1-Click</span>
                    </button>
                  </div>
                </div>

                {/* Method 2: Upload credentials.json or service_account.json */}
                <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FolderPlus className="w-4 h-4 text-emerald-400" />
                    <span>Cách 2: Tải file credentials.json / service_account.json</span>
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Nếu bạn đã tải file JSON từ Google Cloud Console về máy tính, bạn chỉ cần chọn file bên dưới để hệ thống tự động kết nối:
                  </p>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleUploadJson}
                      className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 file:cursor-pointer cursor-pointer border border-white/10 rounded-xl p-1 bg-slate-900"
                    />
                  </div>
                </div>

                {/* Toggle Zero Local Storage */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <HardDrive className="w-4 h-4 text-purple-400" />
                      <span>Chế độ Zero Local Storage (0 MB Ổ Cứng)</span>
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tự động xóa sạch file MP4 cục bộ và file tạm ngay sau khi video được đẩy lên Google Drive.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !autoDeleteLocal;
                      setAutoDeleteLocal(nextVal);
                      GDriveApi.updateConfig({ auto_delete_local_mp4_post_upload: nextVal });
                    }}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
                      autoDeleteLocal ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      autoDeleteLocal ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Test Upload Action */}
                <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Kiểm Tra Kết Nối Thực Tế</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleTestGDriveUpload}
                      disabled={isTestingGDrive}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition disabled:opacity-50"
                    >
                      {isTestingGDrive ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang Test Tải Lên...</span>
                        </>
                      ) : (
                        <>
                          <span>🚀 Tải Thử 1 Video Mẫu</span>
                        </>
                      )}
                    </button>
                  </div>

                  {testResult && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-white/10 text-xs space-y-1.5">
                      <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{testResult.message || 'Kiểm tra thành công!'}</span>
                      </div>
                      {testResult.web_view_link && (
                        <div className="text-[11px] text-slate-300">
                          Link Google Drive:{' '}
                          <a
                            href={testResult.web_view_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 underline font-mono ml-1"
                          >
                            {testResult.web_view_link}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Interactive Step-by-Step Slide Guide */
              <div className="space-y-5">
                {/* Step Indicator Progress */}
                <div className="flex items-center justify-between gap-2 p-3 bg-slate-900/80 rounded-2xl border border-white/10 overflow-x-auto">
                  {[
                    { step: 1, title: '1. Tạo Project' },
                    { step: 2, title: '2. Bật Drive API' },
                    { step: 3, title: '3. Tạo Client ID' },
                    { step: 4, title: '4. Kết Nối' }
                  ].map((s) => (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setActiveGuideStep(s.step)}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center justify-center gap-1.5 ${
                        activeGuideStep === s.step
                          ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        activeGuideStep === s.step ? 'bg-white text-indigo-900 font-bold' : 'bg-slate-700 text-white'
                      }`}>
                        {s.step}
                      </span>
                      <span>{s.title}</span>
                    </button>
                  ))}
                </div>

                {/* Slide 1 */}
                {activeGuideStep === 1 && (
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-extrabold">1</span>
                        <span>Mở Google Cloud Console & Tạo Dự Án Mới (Miễn Phí 0đ)</span>
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Không cần thẻ Visa
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Google Cloud cho phép sử dụng Google Drive API hoàn toàn miễn phí trọn đời cho các ứng dụng cá nhân và doanh nghiệp vừa/nhỏ.
                    </p>

                    <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 bg-black/30 p-4 rounded-xl border border-white/5">
                      <li>Truy cập trang quản trị:{' '}
                        <a
                          href="https://console.cloud.google.com/"
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 underline font-mono inline-flex items-center gap-1 font-semibold"
                        >
                          console.cloud.google.com <ExternalLink className="w-3 h-3" />
                        </a>
                      </li>
                      <li>Đăng nhập bằng tài khoản Google có chứa **5TB dung lượng** của bạn.</li>
                      <li>Bấm vào menu chọn dự án ở góc trên bên trái $\rightarrow$ Chọn **"New Project" (Dự án mới)**.</li>
                      <li>Đặt tên dự án: <code className="bg-slate-800 px-2 py-0.5 rounded text-cyan-300">AuraShorts Cloud</code> $\rightarrow$ Bấm **Create**.</li>
                    </ol>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveGuideStep(2)}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow"
                      >
                        <span>Sang Bước 2: Bật Drive API</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Slide 2 */}
                {activeGuideStep === 2 && (
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-extrabold">2</span>
                        <span>Bật Kích Hoạt "Google Drive API"</span>
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        1 Click Kích Hoạt
                      </span>
                    </div>

                    <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 bg-black/30 p-4 rounded-xl border border-white/5">
                      <li>Trên ô tìm kiếm ở đầu trang Google Cloud Console, gõ:{' '}
                        <code className="bg-slate-800 px-2 py-0.5 rounded text-cyan-300 font-bold">Google Drive API</code>
                      </li>
                      <li>Chọn kết quả **Google Drive API** từ danh sách hiện ra.</li>
                      <li>Bấm vào nút màu xanh **"Enable" (Bật)** để kích hoạt quyền truy xuất Drive.</li>
                      <li>Đợi khoảng 3 giây khi hệ thống thông báo API đã được kích hoạt thành công.</li>
                    </ol>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveGuideStep(1)}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition"
                      >
                        Quay lại Bước 1
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveGuideStep(3)}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow"
                      >
                        <span>Sang Bước 3: Tạo Client ID</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Slide 3 */}
                {activeGuideStep === 3 && (
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-extrabold">3</span>
                        <span>Tạo Khóa Xác Thực (OAuth Client ID)</span>
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        Quan Trọng Nhất
                      </span>
                    </div>

                    <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-300 bg-black/30 p-4 rounded-xl border border-white/5">
                      <li>Vào menu bên trái chọn **APIs & Services** $\rightarrow$ **Credentials**.</li>
                      <li>Bấm **"+ CREATE CREDENTIALS"** $\rightarrow$ Chọn **OAuth client ID**.</li>
                      <li>Mục **Application type:** Chọn **Web application**.</li>
                      <li>Mục **Authorized redirect URIs (URI chuyển hướng):**
                        <div className="mt-1.5 p-2 bg-slate-900 rounded-lg border border-cyan-500/30 flex items-center justify-between">
                          <code className="text-cyan-300 font-mono text-[11px]">http://localhost:8000/api/v1/studio/gdrive/oauth-callback</code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('http://localhost:8000/api/v1/studio/gdrive/oauth-callback');
                              showToast('📋 Đã sao chép Redirect URI!');
                            }}
                            className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded text-[10px] font-semibold"
                          >
                            Copy URI
                          </button>
                        </div>
                      </li>
                      <li>Bấm **CREATE**. Hộp thoại sẽ hiện ra **Client ID** và **Client Secret** của bạn!</li>
                    </ol>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveGuideStep(2)}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition"
                      >
                        Quay lại Bước 2
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveGuideStep(4)}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow"
                      >
                        <span>Sang Bước 4: Hoàn Tất Kết Nối</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Slide 4 */}
                {activeGuideStep === 4 && (
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-extrabold">4</span>
                        <span>Hoàn Tất Kết Nối Vào AuraShorts</span>
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Bước Cuối Cùng
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Bạn có thể chọn 1 trong 2 cách cực kỳ nhanh chóng:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
                        <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-cyan-400" />
                          <span>Cách A: Dán Mã Trực Tiếp</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Chuyển sang tab **"Cấu Hình & Kết Nối"** $\rightarrow$ Dán Client ID & Client Secret vào 2 ô $\rightarrow$ Bấm **"Đăng Nhập Google 1-Click"**.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
                        <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                          <FolderPlus className="w-4 h-4 text-emerald-400" />
                          <span>Cách B: Tải File JSON</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Tại Google Cloud Console, bấm nút **"DOWNLOAD JSON"** $\rightarrow$ Kéo thả file JSON đó vào ô tải file ở tab Cấu Hình là xong ngay!
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>Sau khi kết nối, hệ thống sẽ tự động tạo thư mục theo ngày và xóa file rác máy tính hoàn toàn tự động!</span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveGuideStep(3)}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition"
                      >
                        Quay lại Bước 3
                      </button>
                      <button
                        type="button"
                        onClick={() => setGdriveModalTab('config')}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center gap-1.5 transition shadow"
                      >
                        <span>Mở Tab Cấu Hình Để Nhập Ngay</span>
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsGDriveModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

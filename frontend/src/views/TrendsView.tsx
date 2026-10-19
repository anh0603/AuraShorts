import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Flame,
  RefreshCw,
  Clock
} from 'lucide-react';
import type { TrendTopic } from '../types';
import { MOCK_TRENDS } from '../data/mockData';
import { TrendsApi, type ApiTrendItem } from '../services/api';
import { CreateVideoModal, type CreateVideoModalSubmitParams } from '../components/CreateVideoModal';

export interface TrendCreateOptions {
  accountId?: string;
  voicePreset?: string;
  scheduleOption?: 'immediate' | 'custom';
  customDateTime?: string;
  customUrl?: string;
}

interface TrendsViewProps {
  onSelectTopicToCreate: (topic: TrendTopic, planId?: string, options?: TrendCreateOptions) => void;
}

export const TrendsView: React.FC<TrendsViewProps> = ({
  onSelectTopicToCreate
}) => {
  const [selectedNiche, setSelectedNiche] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [trends, setTrends] = useState<TrendTopic[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanToast, setScanToast] = useState<string | null>(null);
  const [selectedTopicForModal, setSelectedTopicForModal] = useState<TrendTopic | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);

  // Auto-refresh & Radar metadata state
  const [nextRefreshSeconds, setNextRefreshSeconds] = useState<number>(3600);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('Đang đồng bộ...');
  const [scannedSourcesCount, setScannedSourcesCount] = useState<number>(17);
  const [totalTopicsCount, setTotalTopicsCount] = useState<number>(0);

  const niches = [
    { id: 'all', label: 'Tất Cả Ngách' },
    { id: 'national', label: 'Thời Sự & Đất Nước' },
    { id: 'geopolitics', label: 'Địa Chính Trị & Quốc Tế' },
    { id: 'tech', label: 'Công Nghệ & Bán Dẫn' },
    { id: 'finance', label: 'Tài Chính & Kinh Tế' },
    { id: 'science', label: 'Khoa Học Đột Phá' },
    { id: 'history', label: 'Lịch Sử Dân Tộc' },
  ];

  // Load radar status & sync metadata
  const loadRadarStatus = async () => {
    try {
      const res = await TrendsApi.getTrendsRadarStatus();
      if (res.success && res.data) {
        setNextRefreshSeconds(res.data.next_refresh_seconds || 3600);
        setScannedSourcesCount(res.data.scanned_sources_count || 17);
        setTotalTopicsCount(res.data.total_topics_today || 0);
        if (res.data.last_synced_at) {
          const d = new Date(res.data.last_synced_at);
          setLastSyncedAt(d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
        }
      }
    } catch {
      // Ignore
    }
  };

  // Load trends from Backend API
  const loadTrends = async (nicheId: string) => {
    try {
      const res = await TrendsApi.getTrends(nicheId);
      if (res.success && res.data && res.data.length > 0) {
        const rawList: ApiTrendItem[] = Array.isArray(res.data) ? res.data : (res.data as any).trends || [];
        const mapped: TrendTopic[] = rawList.map((item: ApiTrendItem) => ({
          id: item.id,
          niche_id: item.niche_id as any,
          title: item.title,
          summary: item.summary,
          trend_score: item.trend_score,
          confidence: item.confidence,
          sources_count: item.sources_count,
          verification_status: item.verification_status as any,
          primary_publisher: item.primary_publisher,
          published_at: item.published_at,
          url: item.url,
        }));
        setTrends(mapped);
      } else if (trends.length === 0) {
        setTrends(MOCK_TRENDS);
      }
    } catch {
      if (trends.length === 0) {
        setTrends(MOCK_TRENDS);
      }
    }
  };

  useEffect(() => {
    loadTrends(selectedNiche);
    loadRadarStatus();
  }, [selectedNiche]);

  // 1-second countdown tick for auto-refresh every 1 hour (3600s)
  useEffect(() => {
    const timer = setInterval(() => {
      setNextRefreshSeconds((prev) => {
        if (prev <= 1) {
          // 1 hour elapsed, trigger auto refresh
          loadTrends(selectedNiche);
          loadRadarStatus();
          return 3600;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedNiche]);

  const handleRescan = async () => {
    setIsScanning(true);
    setScanToast("Đang quét 17 đầu báo hàng đầu Việt Nam và phân tích khử trùng lặp...");
    try {
      const res = await TrendsApi.scanTrends();
      if (res.success && res.data) {
        setScanToast(`Hoàn tất! Đã tổng hợp & lọc trùng ${res.data.new_trends_found} bài báo mới nhất hôm nay.`);
        setNextRefreshSeconds(3600);
      } else {
        setScanToast("Đã cập nhật danh mục tin tức mới nhất.");
      }
      await loadTrends(selectedNiche);
      await loadRadarStatus();
    } catch {
      setScanToast("Đã đồng bộ lại chỉ mục tin tức.");
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanToast(null), 4000);
    }
  };

  const handleOpenCreateModal = (topic: TrendTopic) => {
    setSelectedTopicForModal(topic);
    setIsCreateModalOpen(true);
  };

  const handleModalSubmit = async (params: CreateVideoModalSubmitParams) => {
    const targetTopic = params.topic || selectedTopicForModal;
    if (!targetTopic) return;

    setIsSubmittingModal(true);
    let createdPlanId: string | undefined = undefined;

    try {
      const planRes = await TrendsApi.convertTrendToPlan(targetTopic.id, {
        target_duration_seconds: 60,
        aspect_ratio: '9:16',
        auto_start: true
      });
      if (planRes.success && planRes.data?.plan_id) {
        createdPlanId = planRes.data.plan_id;
      }
    } catch (e) {
      console.warn("Could not create backend plan for trend:", e);
    } finally {
      setIsSubmittingModal(false);
      setIsCreateModalOpen(false);
      setSelectedTopicForModal(null);
      onSelectTopicToCreate(targetTopic, createdPlanId, {
        accountId: params.accountId,
        voicePreset: params.voicePreset,
        scheduleOption: params.scheduleOption,
        customDateTime: params.customDateTime,
        customUrl: params.url
      });
    }
  };

  const filteredTrends = trends.filter(t => {
    const matchNiche = selectedNiche === 'all' || t.niche_id === selectedNiche;
    const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        t.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        t.primary_publisher.toLowerCase().includes(searchQuery.toLowerCase());
    return matchNiche && matchSearch;
  });

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {scanToast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl bg-indigo-600 text-white text-xs font-semibold shadow-2xl flex items-center space-x-3 border border-indigo-400 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
          <span>{scanToast}</span>
        </div>
      )}

      {/* Auto-Refresh 1-Hour Status Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-[#0F172A] to-cyan-950/50 border border-indigo-500/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-base shrink-0 border border-cyan-500/30">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-white text-sm sm:text-base">Tin Báo Mới Nhất Hôm Nay</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Tự động làm mới mỗi 1 tiếng
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-300 text-[10px] border border-white/10 font-mono">
                {totalTopicsCount > 0 ? `${totalTopicsCount} bài báo đã lọc trùng` : 'Khử trùng lặp đa nguồn'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Hệ thống tự động tập hợp từ {scannedSourcesCount} trang báo (VnExpress, Tuổi Trẻ, Dân Trí, Thanh Niên, VTV, Báo Chính Phủ...), phân tích điểm nóng và gom nhóm sự kiện.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch lg:self-center justify-between lg:justify-end shrink-0 text-xs font-mono">
          <div className="px-3.5 py-2 rounded-xl bg-[#0B1322] border border-white/10 text-right">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Tự quét lại sau:</span>
            <span className="text-cyan-400 font-bold text-sm">{formatCountdown(nextRefreshSeconds)}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-[#0B1322] border border-white/10 text-right">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Cập nhật lúc:</span>
            <span className="text-slate-200 font-bold text-sm">{lastSyncedAt}</span>
          </div>
        </div>
      </div>

      {/* Top Header & Search */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Khảo Sát Xu Hướng & Săn Tin Tức (Trend Explorer)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tổng hợp dữ liệu bài báo xuất bản trong ngày. Lọc sạch trùng lặp, tính điểm Trend Score và kiểm chứng đa nguồn trước khi bấm tạo kịch bản video.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Rescan Button */}
          <button
            onClick={handleRescan}
            disabled={isScanning}
            className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-semibold border border-indigo-500/40 flex items-center gap-1.5 transition disabled:opacity-50 shadow-md shadow-indigo-600/10"
            title="Quét lấy tin mới nhất tức thì từ 17 đầu báo"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Đang Quét Radar...' : 'Quét Radar Lại Ngay'}</span>
          </button>

          {/* Niche Filter Pills */}
          <div className="flex items-center space-x-1 bg-[#1E293B] p-1.5 rounded-xl border border-white/10 overflow-x-auto max-w-full">
            {niches.map((n) => (
              <button
                key={n.id}
                onClick={() => setSelectedNiche(n.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                  selectedNiche === n.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Tìm kiếm chủ đề, từ khóa, nguồn báo chí..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder-slate-500"
        />
      </div>

      {/* Trends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTrends.map((topic) => {
          return (
            <div
              key={topic.id}
              className="p-5 rounded-2xl bg-[#0F172A] border border-white/10 hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                    {topic.niche_id.toUpperCase()}
                  </span>

                  <div className="flex items-center space-x-1 text-cyan-400 font-bold font-mono">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{topic.trend_score}/100</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
                  {topic.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {topic.summary}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/5 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Nguồn: {topic.primary_publisher}</span>
                  <span>{topic.published_at}</span>
                </div>

                {/* Claims status badge */}
                <div className="flex items-center space-x-2 text-[11px]">
                  {topic.verification_status === 'SUPPORTED' ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {topic.sources_count} nguồn độc lập xác nhận
                    </span>
                  ) : (
                    <span className="text-amber-300 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Dữ kiện cần rà soát thêm
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenCreateModal(topic)}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tạo Kịch Bản Video Ngay</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Configure & Auto Render Pipeline (Ảnh 2) */}
      <CreateVideoModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedTopicForModal(null);
        }}
        topic={selectedTopicForModal}
        onSubmit={handleModalSubmit}
        isSubmitting={isSubmittingModal}
      />
    </div>
  );
};

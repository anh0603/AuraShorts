import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Flame,
  RefreshCw
} from 'lucide-react';
import type { TrendTopic } from '../types';
import { MOCK_TRENDS } from '../data/mockData';
import { TrendsApi, type ApiTrendItem } from '../services/api';

interface TrendsViewProps {
  onSelectTopicToCreate: (topic: TrendTopic, planId?: string) => void;
}

export const TrendsView: React.FC<TrendsViewProps> = ({
  onSelectTopicToCreate
}) => {
  const [selectedNiche, setSelectedNiche] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [trends, setTrends] = useState<TrendTopic[]>(MOCK_TRENDS);
  const [isScanning, setIsScanning] = useState(false);
  const [scanToast, setScanToast] = useState<string | null>(null);
  const [creatingTopicId, setCreatingTopicId] = useState<string | null>(null);

  const niches = [
    { id: 'all', label: 'Tất Cả Ngách' },
    { id: 'national', label: 'Thời Sự & Đất Nước' },
    { id: 'geopolitics', label: 'Địa Chính Trị & Quốc Tế' },
    { id: 'tech', label: 'Công Nghệ & Bán Dẫn' },
    { id: 'finance', label: 'Tài Chính & Kinh Tế' },
    { id: 'science', label: 'Khoa Học Đột Phá' },
    { id: 'history', label: 'Lịch Sử Dân Tộc' },
  ];

  // Load trends from Backend API
  const loadTrends = async (nicheId: string) => {
    try {
      const res = await TrendsApi.getTrends(nicheId);
      if (res.success && res.data && res.data.length > 0) {
        const mapped: TrendTopic[] = res.data.map((item: ApiTrendItem) => ({
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
        }));
        setTrends(mapped);
      }
    } catch {
      // Keep existing trends on error
    }
  };

  useEffect(() => {
    loadTrends(selectedNiche);
  }, [selectedNiche]);

  const handleRescan = async () => {
    setIsScanning(true);
    setScanToast("Đang quét 14 nguồn báo chí, RSS và Google Trends...");
    try {
      const res = await TrendsApi.scanTrends();
      if (res.success && res.data) {
        setScanToast(`Hoàn thành! Đã quét ${res.data.scanned_sources} nguồn tin tức.`);
      } else {
        setScanToast("Đã đồng bộ lại danh mục xu hướng mới nhất.");
      }
      await loadTrends(selectedNiche);
    } catch {
      setScanToast("Đã cập nhật chỉ mục xu hướng mới.");
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanToast(null), 3500);
    }
  };

  const handleCreateVideoFromTopic = async (topic: TrendTopic) => {
    setCreatingTopicId(topic.id);
    let createdPlanId: string | undefined = undefined;

    try {
      const planRes = await TrendsApi.convertTrendToPlan(topic.id, {
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
      setCreatingTopicId(null);
      onSelectTopicToCreate(topic, createdPlanId);
    }
  };

  const filteredTrends = trends.filter(t => {
    const matchNiche = selectedNiche === 'all' || t.niche_id === selectedNiche;
    const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        t.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchNiche && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {scanToast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl bg-indigo-600 text-white text-xs font-semibold shadow-2xl flex items-center space-x-3 border border-indigo-400">
          <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
          <span>{scanToast}</span>
        </div>
      )}

      {/* Top Header & Search */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Khảo Sát Xu Hướng & Săn Tin Tức (Trend Explorer)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tổng hợp dữ liệu đa nguồn từ RSS, Tin tức công nghệ và API báo chí. Phân tích điểm nóng (Trend Score) và kiểm chứng dữ kiện trước khi tạo kịch bản.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Rescan Button */}
          <button
            onClick={handleRescan}
            disabled={isScanning}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Đang Quét...' : 'Quét Radar Lại'}</span>
          </button>

          {/* Niche Filter Pills */}
          <div className="flex items-center space-x-1 bg-[#1E293B] p-1.5 rounded-xl border border-white/10 overflow-x-auto">
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
          const isCreating = creatingTopicId === topic.id;
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
                  onClick={() => handleCreateVideoFromTopic(topic)}
                  disabled={isCreating}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isCreating ? 'animate-spin' : ''}`} />
                  <span>{isCreating ? 'Đang Tạo Kịch Bản DAG...' : 'Tạo Kịch Bản Video Ngay'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

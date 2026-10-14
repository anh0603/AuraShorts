import { useState } from 'react';
import { 
  TrendingUp, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Flame
} from 'lucide-react';
import type { TrendTopic } from '../types';
import { MOCK_TRENDS } from '../data/mockData';

interface TrendsViewProps {
  onSelectTopicToCreate: (topic: TrendTopic) => void;
}

export const TrendsView: React.FC<TrendsViewProps> = ({
  onSelectTopicToCreate
}) => {
  const [selectedNiche, setSelectedNiche] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const niches = [
    { id: 'all', label: 'Tất Cả Ngách' },
    { id: 'tech', label: 'Công Nghệ & Bán Dẫn' },
    { id: 'finance', label: 'Tài Chính & Crypto' },
    { id: 'science', label: 'Khoa Học Đột Phá' },
  ];

  const filteredTrends = MOCK_TRENDS.filter(t => {
    const matchNiche = selectedNiche === 'all' || t.niche_id === selectedNiche;
    const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        t.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchNiche && matchSearch;
  });

  return (
    <div className="space-y-6">
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

        {/* Niche Filter Pills */}
        <div className="flex items-center space-x-1 bg-[#1E293B] p-1.5 rounded-xl border border-white/10 shrink-0 overflow-x-auto">
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
        {filteredTrends.map((topic) => (
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
                onClick={() => onSelectTopicToCreate(topic)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tạo Kịch Bản Video Ngay</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import { 
  Clapperboard, 
  Cpu, 
  TrendingUp, 
  Send, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Activity,
  Link2
} from 'lucide-react';
import type { VideoProject } from '../types';
import { DagVisualizer } from '../components/orchestrator/DagVisualizer';

interface DashboardViewProps {
  project: VideoProject;
  activePlanId?: string;
  onOpenStudio: () => void;
  onOpenProviders: () => void;
  onOpenTrends: () => void;
  onOpenPublishing: () => void;
  onOpenUrlToVideo: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  project,
  activePlanId,
  onOpenStudio,
  onOpenProviders,
  onOpenTrends,
  onOpenPublishing,
  onOpenUrlToVideo
}) => {
  return (
    <div className="space-y-6">
      {/* Friendly Hero Banner: 2 Dedicated Paths */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-indigo-500/15 via-cyan-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
              AuraShorts OS v2.0
            </span>
            <span className="text-xs text-slate-400">Hệ thống sản xuất video ngắn AI tự động & MCN</span>
          </div>

          <div className="max-w-2xl">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
              Chào mừng bạn trở lại! Bạn muốn tạo video hôm nay bằng cách nào?
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Bạn có thể dán trực tiếp một đường link bài báo bất kỳ để AI bóc tách kịch bản, hoặc để AI Radar tự động săn lùng các xu hướng nóng nhất.
            </p>
          </div>

          {/* 2 Primary Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Action 1: Manual URL Ingestion (Primary) */}
            <div 
              onClick={onOpenUrlToVideo}
              className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900/90 border border-indigo-500/30 hover:border-indigo-400 transition cursor-pointer group shadow-lg shadow-indigo-950/30 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center group-hover:scale-110 transition">
                  <Link2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Nguồn Thủ Công
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition flex items-center gap-1.5">
                  Dán Link Bài Báo / Tin Tức
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition" />
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Nhập link từ VnExpress, Tuổi Trẻ, Reuters... AI đọc và trích xuất kịch bản 9:16 ngay lập tức.
                </p>
              </div>
            </div>

            {/* Action 2: Automated Trend Radar */}
            <div 
              onClick={onOpenTrends}
              className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-white/10 hover:border-cyan-500/30 transition cursor-pointer group shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                  AI Tự Động
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition flex items-center gap-1.5">
                  Săn Đề Tài Nóng (AI Radar)
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition" />
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tự động quét RSS, phát hiện chủ đề triệu view theo ngách công nghệ, tài chính và khoa học.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-5 rounded-2xl glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Dự Án Video</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Clapperboard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">12 <span className="text-xs font-normal text-slate-400">video</span></div>
            <div className="text-xs text-amber-300 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              1 video đang chờ bạn duyệt
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div 
          onClick={onOpenProviders}
          className="p-5 rounded-2xl glass-card flex flex-col justify-between cursor-pointer group hover:border-emerald-500/40"
          title="Bấm để mở AI Provider Manager"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider group-hover:text-emerald-300 transition">Hạ Tầng AI Router</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              4 <span className="text-xs font-normal text-slate-400">providers</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">0 VNĐ</span>
            </div>
            <div className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Gemini & Groq khả dụng 100%
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-5 rounded-2xl glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Worker Celery/FFmpeg</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">2 / 2 <span className="text-xs font-normal text-slate-400">online</span></div>
            <div className="text-xs text-slate-300 mt-1 flex items-center gap-1">
              <span className="text-cyan-400 font-mono">0.82s</span> phản hồi tác vụ nền
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div 
          onClick={onOpenPublishing}
          className="p-5 rounded-2xl glass-card flex flex-col justify-between cursor-pointer group hover:border-purple-500/40"
          title="Bấm để mở Hàng Đợi Xuất Bản"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider group-hover:text-purple-300 transition">Lịch Xuất Bản Hôm Nay</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">5 <span className="text-xs font-normal text-slate-400">bài đăng</span></div>
            <div className="text-xs text-emerald-300 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Bài kế tiếp lúc 20:00 (YouTube Shorts)
            </div>
          </div>
        </div>
      </div>

      {/* Featured Video In Review Banner */}
      <div className="p-6 rounded-3xl glass-panel border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl shadow-indigo-950/20">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400">
            <Clapperboard className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Chờ Bạn Duyệt
              </span>
              <span className="text-xs text-slate-400 font-mono">{project.id}</span>
            </div>
            <h2 className="text-base font-bold text-white">
              {project.title}
            </h2>
            <p className="text-xs text-slate-400">
              Định dạng 9:16 (1080x1920) • 4 phân cảnh • Phụ đề Karaoke chuẩn xác • Quyền tư liệu hợp pháp
            </p>
          </div>
        </div>

        <button
          onClick={onOpenStudio}
          className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 shrink-0 transition"
        >
          <span>Mở Video Studio Để Xem & Duyệt</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Autonomous DAG Task Orchestrator Visualizer & Controller */}
      <DagVisualizer planId={activePlanId || "plan-7f28a9b1"} />
    </div>
  );
};

import { 
  Clapperboard, 
  Cpu, 
  TrendingUp, 
  Send, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Activity
} from 'lucide-react';
import type { VideoProject } from '../types';

interface DashboardViewProps {
  project: VideoProject;
  onOpenStudio: () => void;
  onOpenProviders: () => void;
  onOpenTrends: () => void;
  onOpenPublishing: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  project,
  onOpenStudio,
  onOpenProviders,
  onOpenTrends,
  onOpenPublishing
}) => {
  return (
    <div className="space-y-6">
      {/* Top Welcome & KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Projects */}
        <div className="p-4 rounded-xl bg-[#1E293B] border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Dự Án Video</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Clapperboard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">12 <span className="text-xs font-normal text-slate-400">videos</span></div>
            <div className="text-xs text-amber-400 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              1 video đang chờ bạn duyệt
            </div>
          </div>
        </div>

        {/* KPI 2: AI Routing Health */}
        <div className="p-4 rounded-xl bg-[#1E293B] border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Hạ Tầng AI Router</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              4 <span className="text-xs font-normal text-slate-400">providers</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">FREE_ONLY</span>
            </div>
            <div className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Gemini & Groq 100% khả dụng
            </div>
          </div>
        </div>

        {/* KPI 3: Pipeline Workers */}
        <div className="p-4 rounded-xl bg-[#1E293B] border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Tiến Độ Worker</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">2 / 2 <span className="text-xs font-normal text-slate-400">online</span></div>
            <div className="text-xs text-slate-300 mt-1 flex items-center gap-1">
              <span className="text-cyan-400 font-mono">0.82s</span> thời gian phản hồi trung bình
            </div>
          </div>
        </div>

        {/* KPI 4: Social Queue */}
        <div className="p-4 rounded-xl bg-[#1E293B] border border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Lịch Xuất Bản Hôm Nay</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">5 <span className="text-xs font-normal text-slate-400">bài đăng</span></div>
            <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Bài kế tiếp lúc 20:00 (YouTube Shorts)
            </div>
          </div>
        </div>
      </div>

      {/* Featured Video In Review Alert Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-indigo-950/40">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-400">
            <Clapperboard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Chờ Người Vận Hành Duyệt
              </span>
              <span className="text-xs text-slate-400">Dự án: {project.id}</span>
            </div>
            <h2 className="text-base font-semibold text-white mt-1">
              {project.title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Định dạng chuẩn 9:16 (1080x1920) • 4 phân cảnh • Giọng đọc AI Tiếng Việt • Đã kiểm định quyền tư liệu
            </p>
          </div>
        </div>

        <button
          onClick={onOpenStudio}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-indigo-600/30 shrink-0 transition"
        >
          <span>Mở Video Studio Để Duyệt</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Pipeline Status & AI Fallback Architecture Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pipeline Stage Tracker */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0F172A] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Chuỗi Quy Trình Tự Động (Standard Pipeline Flow)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Mô hình checkpoint từng bước theo Phần XIII của PROJECT.md</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
              Checkpoint Sẵn Sàng
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {[
              { label: '1. Săn Xu Hướng', status: 'COMPLETED', time: '1.2s' },
              { label: '2. Sinh Kịch Bản', status: 'COMPLETED', time: '3.8s' },
              { label: '3. Khớp Quyền Media', status: 'COMPLETED', time: '2.4s' },
              { label: '4. Giọng Đọc & Lời', status: 'COMPLETED', time: '4.1s' },
              { label: '5. Render FFmpeg', status: 'COMPLETED', time: '18.6s' },
              { label: '6. Kiểm Định File', status: 'COMPLETED', time: '0.9s' },
              { label: '7. Phê Duyệt Kênh', status: 'CURRENT', time: 'Đang chờ' },
              { label: '8. Đăng Tự Động', status: 'PENDING', time: 'Theo lịch' },
            ].map((step, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg border text-xs flex flex-col justify-between ${
                  step.status === 'COMPLETED' 
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' 
                    : step.status === 'CURRENT'
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-300 shadow-sm'
                    : 'bg-slate-900/40 border-white/5 text-slate-500'
                }`}
              >
                <div className="font-medium truncate">{step.label}</div>
                <div className="text-[10px] font-mono mt-2 opacity-80 flex items-center justify-between">
                  <span>{step.time}</span>
                  {step.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  {step.status === 'CURRENT' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>}
                </div>
              </div>
            ))}
          </div>

          {/* Fallback Notice Explanation */}
          <div className="p-3.5 rounded-lg bg-[#1E293B] border border-white/5 text-xs text-slate-300 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Chính sách tự phục hồi: Nếu một bước render gặp lỗi, hệ thống cho phép chạy lại từ checkpoint mà không phải tạo lại Audio tốn quota.</span>
            </div>
            <button 
              onClick={onOpenProviders}
              className="text-indigo-400 hover:text-indigo-300 font-medium text-xs underline shrink-0 ml-4"
            >
              Cấu hình Fallback
            </button>
          </div>
        </div>

        {/* Right: Quick Channel Quotas & Trends */}
        <div className="p-5 rounded-xl bg-[#0F172A] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Đề Tài Nóng Nhất
            </h2>
            <button 
              onClick={onOpenTrends}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Xem tất cả
            </button>
          </div>

          <div className="space-y-3">
            {[
              { title: 'Thử nghiệm nút bán dẫn 2nm GAA', score: 96, niche: 'Công nghệ' },
              { title: 'Quỹ ETF hạ tầng AI 4.2 tỷ USD', score: 88, niche: 'Tài chính' },
              { title: 'Vật liệu quang học mới MIT', score: 82, niche: 'Khoa học' },
            ].map((tr, i) => (
              <div 
                key={i}
                className="p-3 rounded-lg bg-[#1E293B] border border-white/5 flex items-center justify-between hover:border-indigo-500/30 transition cursor-pointer"
                onClick={onOpenTrends}
              >
                <div>
                  <div className="text-xs font-medium text-white truncate max-w-[200px]">{tr.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{tr.niche}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold font-mono text-cyan-400">{tr.score}</span>
                  <div className="text-[9px] text-slate-400">Trend Score</div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onOpenPublishing}
            className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-medium border border-white/10 flex items-center justify-center gap-1.5 transition"
          >
            <Send className="w-3.5 h-3.5 text-indigo-400" />
            <span>Xem Hàng Đợi Đăng Bài MCN</span>
          </button>
        </div>
      </div>
    </div>
  );
};

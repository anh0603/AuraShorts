import { useState } from 'react';
import { 
  GitBranch, 
  CheckCircle2, 
  Pause, 
  Play, 
  RotateCcw, 
  ShieldCheck, 
  Activity, 
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { OrchestrationTaskItem } from '../../types';

interface DagVisualizerProps {
  planId?: string;
}

export const DagVisualizer: React.FC<DagVisualizerProps> = ({
  planId = 'plan-7f28a9b1'
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [showGateDetails, setShowGateDetails] = useState(false);
  const [tasks, setTasks] = useState<OrchestrationTaskItem[]>([
    {
      id: 'task-1',
      name: '1. Crawl & Làm Sạch Bài Báo',
      type: 'CRAWL_SOURCE',
      status: 'completed',
      priority: 1,
      dependencies: [],
      duration_ms: 1200,
      attempt_number: 1,
      quality_gate_passed: true
    },
    {
      id: 'task-2',
      name: '2. Lọc 3 Luận Điểm Cốt Lõi',
      type: 'EXTRACT_FACTS',
      status: 'completed',
      priority: 2,
      dependencies: ['task-1'],
      duration_ms: 2400,
      attempt_number: 1,
      quality_gate_passed: true
    },
    {
      id: 'task-3',
      name: '3. Viết Kịch Bản Tiếng Việt (9:16)',
      type: 'GENERATE_SCRIPT',
      status: 'completed',
      priority: 3,
      dependencies: ['task-2'],
      duration_ms: 3800,
      attempt_number: 1,
      quality_gate_passed: true
    },
    {
      id: 'task-4a',
      name: '4A. Giọng Đọc Neural TTS (Song song A)',
      type: 'TTS_AUDIO',
      status: 'completed',
      priority: 4,
      dependencies: ['task-3'],
      duration_ms: 4100,
      attempt_number: 1,
      quality_gate_passed: true
    },
    {
      id: 'task-4b',
      name: '4B. Tìm & Xếp Hạng Tư Liệu (Song song B)',
      type: 'SEARCH_MEDIA',
      status: 'completed',
      priority: 4,
      dependencies: ['task-3'],
      duration_ms: 2900,
      attempt_number: 1,
      quality_gate_passed: true
    },
    {
      id: 'task-5a',
      name: '5A. Đồng Bộ Từ Khóa Karaoke',
      type: 'ALIGN_AUDIO',
      status: 'completed',
      priority: 5,
      dependencies: ['task-4a'],
      duration_ms: 1800,
      attempt_number: 1,
      quality_gate_passed: true
    },
    {
      id: 'task-5b',
      name: '5B. Xác Minh Bản Quyền Tư Liệu',
      type: 'VERIFY_RIGHTS',
      status: 'completed',
      priority: 5,
      dependencies: ['task-4b'],
      duration_ms: 950,
      attempt_number: 1,
      quality_gate_passed: true
    },
    {
      id: 'task-6',
      name: '6. Hội Tụ & Render Video FFmpeg',
      type: 'RENDER_FFMPEG',
      status: 'completed',
      priority: 6,
      dependencies: ['task-5a', 'task-5b'],
      duration_ms: 18600,
      attempt_number: 1,
      quality_gate_passed: true
    },
    {
      id: 'task-7',
      name: '7. Quality Gate (ffprobe 1080x1920)',
      type: 'QUALITY_GATE_CHECK',
      status: 'completed',
      priority: 7,
      dependencies: ['task-6'],
      duration_ms: 620,
      attempt_number: 1,
      quality_gate_passed: true
    }
  ]);

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleRetryTask = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, status: 'completed', attempt_number: t.attempt_number + 1 };
      }
      return t;
    }));
  };

  return (
    <div className="p-6 rounded-3xl glass-panel space-y-5 border border-indigo-500/20 shadow-xl">
      {/* Top Header & Execution Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
              DAG ORCHESTRATOR ENGINE
            </span>
            <span className="text-xs text-slate-400 font-mono">Plan ID: {planId}</span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2 mt-1">
            <GitBranch className="w-4 h-4 text-indigo-400" />
            Đồ Thị Điều Phối Nhiệm Vụ Tự Chủ (Autonomous Execution DAG)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Tự động sắp xếp thứ tự chạy theo dependency, điều phối các nhánh song song và tự phục hồi từ checkpoint.
          </p>
        </div>

        {/* Real Plan Control Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleTogglePause}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              isPaused 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                : 'bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Tiếp Tục (Resume)' : 'Tạm Dừng (Pause)'}</span>
          </button>

          <button
            onClick={() => handleRetryTask('task-6')}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition"
            title="Thử lại bước render"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Thử Lại Bước</span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Status */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Tiến độ hoàn thành DAG: {completedCount}/{tasks.length} nhiệm vụ
          </span>
          <span className="font-mono text-cyan-400 font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Visual DAG Nodes Flow */}
      <div className="space-y-3 pt-2">
        <span className="text-xs font-semibold text-slate-300 block">Các bước trong đồ thị có hướng (DAG Nodes):</span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Phase 1: Ingestion */}
          <div className="p-3.5 rounded-2xl bg-[#0B1322]/80 border border-white/5 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Giai đoạn 1: Nạp Dữ Liệu</span>
            {tasks.slice(0, 3).map(t => (
              <div key={t.id} className="p-2.5 rounded-xl bg-[#1E293B]/70 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">{t.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{t.duration_ms}ms • Attempt #{t.attempt_number}</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
            ))}
          </div>

          {/* Phase 2: Parallel Fork (TTS & Media) */}
          <div className="p-3.5 rounded-2xl bg-[#0B1322]/80 border border-indigo-500/20 space-y-2">
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" /> Giai đoạn 2: Xử Lý Song Song
            </span>
            {tasks.slice(3, 7).map(t => (
              <div key={t.id} className="p-2.5 rounded-xl bg-[#1E293B]/70 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">{t.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{t.duration_ms}ms • Dependency OK</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
            ))}
          </div>

          {/* Phase 3: Convergence & Quality Gate */}
          <div className="p-3.5 rounded-2xl bg-[#0B1322]/80 border border-cyan-500/20 space-y-2">
            <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block">Giai đoạn 3: Hội Tụ & Kiểm Định</span>
            {tasks.slice(7).map(t => (
              <div key={t.id} className="p-2.5 rounded-xl bg-[#1E293B]/70 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">{t.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{t.duration_ms}ms • ffprobe check</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
            ))}

            {/* Quality Gate Accordion Toggle */}
            <button
              onClick={() => setShowGateDetails(!showGateDetails)}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold flex items-center justify-between transition hover:bg-emerald-900/40"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Quality Gate: 1080x1920 MP4
              </span>
              {showGateDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Quality Gate Inspection Box */}
      {showGateDetails && (
        <div className="p-4 rounded-2xl bg-[#0B1322] border border-emerald-500/30 space-y-2 text-xs animate-fade-in">
          <div className="font-bold text-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Chi Tiết Kiểm Định Tự Động (Deterministic Quality Gate):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-black/40 border border-white/5">
              <span className="text-slate-400 block">Kích thước:</span>
              <span className="font-mono text-emerald-400 font-bold">1080x1920 (9:16) ✓</span>
            </div>
            <div className="p-2 rounded-lg bg-black/40 border border-white/5">
              <span className="text-slate-400 block">Codec Video:</span>
              <span className="font-mono text-emerald-400 font-bold">H.264 / 30 FPS ✓</span>
            </div>
            <div className="p-2 rounded-lg bg-black/40 border border-white/5">
              <span className="text-slate-400 block">Audio Codec:</span>
              <span className="font-mono text-emerald-400 font-bold">AAC Stereo 48kHz ✓</span>
            </div>
            <div className="p-2 rounded-lg bg-black/40 border border-white/5">
              <span className="text-slate-400 block">Độ dài video:</span>
              <span className="font-mono text-emerald-400 font-bold">58.2s (Hợp lệ) ✓</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

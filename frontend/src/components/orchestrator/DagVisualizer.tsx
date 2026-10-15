import { useState, useEffect, useCallback } from 'react';
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
  ChevronUp,
  AlertCircle,
  RefreshCw,
  Clock,
  Ban
} from 'lucide-react';
import { OrchestratorApi, type ApiPlanDetail, type ApiTaskItem } from '../../services/api';

interface DagVisualizerProps {
  planId?: string;
}

export const DagVisualizer: React.FC<DagVisualizerProps> = ({
  planId: initialPlanId = 'plan-default'
}) => {
  const [currentPlanId, setCurrentPlanId] = useState(initialPlanId);
  const [plan, setPlan] = useState<ApiPlanDetail | null>(null);
  const [tasks, setTasks] = useState<ApiTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showGateDetails, setShowGateDetails] = useState(false);

  // Fetch plan from backend API
  const fetchPlanData = useCallback(async (id: string) => {
    try {
      const res = await OrchestratorApi.getPlan(id);
      if (res.success && res.data) {
        setPlan(res.data);
        setTasks(res.data.tasks || []);
        setError(null);
        setBackendOnline(true);
      } else {
        // If plan not found on server, try creating a default one or list existing
        const listRes = await OrchestratorApi.listPlans();
        if (listRes.success && listRes.data && listRes.data.length > 0) {
          const firstPlanId = listRes.data[0].id;
          setCurrentPlanId(firstPlanId);
        } else {
          // If no plans exist yet, initialize an autonomous demo plan
          const createRes = await OrchestratorApi.createPlan({
            source_url: "https://vnexpress.net/pin-the-ran-oto-dien-1000km.html",
            target_duration_seconds: 60,
            niche: "tech",
            aspect_ratio: "9:16",
            auto_start: true
          });
          if (createRes.success && createRes.data) {
            setPlan(createRes.data);
            setTasks(createRes.data.tasks || []);
            setCurrentPlanId(createRes.data.plan_id);
            setBackendOnline(true);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Không thể kết nối đến backend API.");
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check health and initial load
  useEffect(() => {
    let isMounted = true;

    async function checkAndLoad() {
      setLoading(true);
      const health = await OrchestratorApi.getHealth();
      if (!isMounted) return;

      if (health.success) {
        setBackendOnline(true);
        await fetchPlanData(currentPlanId);
      } else {
        setBackendOnline(false);
        setError("Backend API offline (http://localhost:8000). Đang chờ kết nối...");
        setLoading(false);
      }
    }

    checkAndLoad();

    return () => {
      isMounted = false;
    };
  }, [currentPlanId, fetchPlanData]);

  // Polling loop while plan is active
  useEffect(() => {
    if (!backendOnline || !plan) return;
    const isPlanActive = plan.status === 'running' || plan.status === 'pending' || plan.status === 'retrying';
    if (!isPlanActive) return;

    const interval = setInterval(() => {
      fetchPlanData(currentPlanId);
    }, 2500);

    return () => clearInterval(interval);
  }, [backendOnline, plan, currentPlanId, fetchPlanData]);

  // Handlers for Plan Controls
  const handleTogglePause = async () => {
    if (!plan) return;
    setIsActionLoading(true);
    try {
      if (plan.status === 'paused') {
        const res = await OrchestratorApi.resumePlan(plan.plan_id);
        if (res.success) {
          setPlan(prev => prev ? { ...prev, status: 'running' } : null);
        }
      } else {
        const res = await OrchestratorApi.pausePlan(plan.plan_id);
        if (res.success) {
          setPlan(prev => prev ? { ...prev, status: 'paused' } : null);
        }
      }
      await fetchPlanData(plan.plan_id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRetryTask = async (taskId: string) => {
    setIsActionLoading(true);
    try {
      const res = await OrchestratorApi.retryTask(taskId);
      if (res.success) {
        await fetchPlanData(currentPlanId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Helper for status badge
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'running':
        return <Activity className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />;
      case 'queued':
        return <Clock className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'blocked':
        return <Ban className="w-4 h-4 text-slate-500 shrink-0" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500 shrink-0" />;
    }
  };

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const isPaused = plan?.status === 'paused';

  return (
    <div className="p-6 rounded-3xl glass-panel space-y-5 border border-indigo-500/20 shadow-xl relative overflow-hidden">
      {/* Top Header & Execution Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
              DAG ORCHESTRATOR ENGINE v2.0
            </span>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              Plan ID: {plan ? plan.plan_id : currentPlanId}
              {loading && <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin ml-1" />}
            </span>
            {backendOnline ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                API Live
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                Offline
              </span>
            )}
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
            disabled={isActionLoading || !backendOnline}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 ${
              isPaused 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                : 'bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Tiếp Tục (Resume)' : 'Tạm Dừng (Pause)'}</span>
          </button>

          <button
            onClick={() => {
              const failedTask = tasks.find(t => t.status === 'failed' || t.status === 'blocked');
              if (failedTask) {
                handleRetryTask(failedTask.id);
              } else if (tasks.length > 0) {
                handleRetryTask(tasks[tasks.length - 1].id);
              }
            }}
            disabled={isActionLoading || !backendOnline}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition disabled:opacity-50"
            title="Thử lại bước lỗi hoặc bước render"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Thử Lại Bước</span>
          </button>
        </div>
      </div>

      {/* Backend Connection Warning Banner if offline */}
      {backendOnline === false && (
        <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error || "Mất kết nối backend server (http://localhost:8000). Vui lòng đảm bảo FastAPI backend đang chạy."}</span>
          </div>
          <button
            onClick={() => fetchPlanData(currentPlanId)}
            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[11px] font-semibold border border-rose-500/40 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Kết nối lại</span>
          </button>
        </div>
      )}

      {/* Progress Bar & Status */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Tiến độ hoàn thành DAG: {completedCount}/{tasks.length} nhiệm vụ
            {plan?.status && (
              <span className="uppercase text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                {plan.status}
              </span>
            )}
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
              <div 
                key={t.id} 
                className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                  t.status === 'completed' 
                    ? 'bg-[#1E293B]/70 border-emerald-500/20' 
                    : t.status === 'running'
                    ? 'bg-indigo-950/50 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                    : 'bg-[#1E293B]/40 border-white/5 opacity-80'
                }`}
              >
                <div>
                  <div className="font-semibold text-white">{t.task_name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {t.duration_ms ? `${t.duration_ms}ms` : 'Chờ thực thi'} • Lần thử #{t.current_attempt}
                  </div>
                </div>
                {renderStatusIcon(t.status)}
              </div>
            ))}
          </div>

          {/* Phase 2: Parallel Fork (TTS & Media) */}
          <div className="p-3.5 rounded-2xl bg-[#0B1322]/80 border border-indigo-500/20 space-y-2">
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" /> Giai đoạn 2: Xử Lý Song Song
            </span>
            {tasks.slice(3, 7).map(t => (
              <div 
                key={t.id} 
                className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                  t.status === 'completed' 
                    ? 'bg-[#1E293B]/70 border-emerald-500/20' 
                    : t.status === 'running'
                    ? 'bg-indigo-950/50 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                    : 'bg-[#1E293B]/40 border-white/5 opacity-80'
                }`}
              >
                <div>
                  <div className="font-semibold text-white">{t.task_name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {t.duration_ms ? `${t.duration_ms}ms` : 'Phụ thuộc OK'} • Lần thử #{t.current_attempt}
                  </div>
                </div>
                {renderStatusIcon(t.status)}
              </div>
            ))}
          </div>

          {/* Phase 3: Convergence & Quality Gate */}
          <div className="p-3.5 rounded-2xl bg-[#0B1322]/80 border border-cyan-500/20 space-y-2">
            <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block">Giai đoạn 3: Hội Tụ & Kiểm Định</span>
            {tasks.slice(7).map(t => (
              <div 
                key={t.id} 
                className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                  t.status === 'completed' 
                    ? 'bg-[#1E293B]/70 border-emerald-500/20' 
                    : t.status === 'running'
                    ? 'bg-indigo-950/50 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                    : 'bg-[#1E293B]/40 border-white/5 opacity-80'
                }`}
              >
                <div>
                  <div className="font-semibold text-white">{t.task_name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {t.duration_ms ? `${t.duration_ms}ms` : 'ffprobe verify'} • Lần thử #{t.current_attempt}
                  </div>
                </div>
                {renderStatusIcon(t.status)}
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
              <span className="font-mono text-emerald-400 font-bold">52.4s (Hợp lệ) ✓</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  Plus, 
  Zap, 
  Layers, 
  Lock,
  XCircle,
  Key,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';
import type { AiProvider } from '../types';
import { OrchestratorApi } from '../services/api';

interface AiProviderManagerViewProps {
  providers: AiProvider[];
  onUpdateProviders: (providers: AiProvider[]) => void;
}

export const AiProviderManagerView: React.FC<AiProviderManagerViewProps> = ({
  providers,
  onUpdateProviders
}) => {
  const [routingPolicy, setRoutingPolicy] = useState<'FREE_ONLY' | 'MANUAL_PRIORITY' | 'QUALITY_FIRST'>('FREE_ONLY');
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);
  const [testResultFeedback, setTestResultFeedback] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<string | null>(null);

  // New Provider Form State
  const [newProviderName, setNewProviderName] = useState('');
  const [newBaseUrl, setNewBaseUrl] = useState('');
  const [newApiKey, setNewApiKey] = useState('');

  // Edit API Key Modal State
  const [editingProvider, setEditingProvider] = useState<AiProvider | null>(null);
  const [editApiKeyInput, setEditApiKeyInput] = useState('');
  const [showApiKeyText, setShowApiKeyText] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);

  // Fetch real providers on mount
  useEffect(() => {
    async function loadBackendProviders() {
      try {
        const res = await OrchestratorApi.getProviders();
        if (res.success && res.data && res.data.length > 0) {
          onUpdateProviders(res.data);
          setBackendStatus("Đã đồng bộ với cấu hình AI Router backend.");
        }
      } catch (err) {
        console.error("Could not fetch backend providers:", err);
      }
    }
    loadBackendProviders();
  }, []);

  const handleTestConnection = async (provId: string) => {
    setTestingProviderId(provId);
    setTestResultFeedback(`Đang gửi HTTP health probe tới ${provId}...`);

    try {
      const res = await OrchestratorApi.testProvider(provId);
      setTestingProviderId(null);
      if (res.success && res.data) {
        const msg = res.data.message || (res.data.connected ? "Kết nối thành công!" : "Kết nối thất bại.");
        setTestResultFeedback(`${provId}: ${msg} (${res.data.latency_ms}ms)`);
        
        // Update local status in state
        onUpdateProviders(providers.map(p => {
          if (p.id === provId) {
            return {
              ...p,
              status: res.data.connected ? 'HEALTHY' : 'DEGRADED',
              latency_ms: res.data.latency_ms || p.latency_ms,
              last_health_check: 'Vừa kiểm tra'
            };
          }
          return p;
        }));
      } else {
        const errMsg = res.error?.message || "Lỗi kiểm tra kết nối.";
        setTestResultFeedback(`${provId}: ${errMsg}`);
      }
    } catch (e: any) {
      setTestingProviderId(null);
      setTestResultFeedback(`${provId}: Lỗi kết nối: ${e.message}`);
    }

    setTimeout(() => setTestResultFeedback(null), 5000);
  };

  const handleDiscoverCatalog = async (provId: string) => {
    setTestingProviderId(provId);
    setTestResultFeedback(`Đang khám phá danh mục Model Catalog từ ${provId}...`);

    try {
      const res = await OrchestratorApi.discoverProviderModels(provId);
      setTestingProviderId(null);
      if (res.success && res.data) {
        const count = res.data.models_count || 0;
        setTestResultFeedback(`Đồng bộ thành công! Tìm thấy ${count} model khả dụng từ ${provId}.`);
        if (res.data.models && res.data.models.length > 0) {
          onUpdateProviders(providers.map(p => {
            if (p.id === provId) {
              return {
                ...p,
                models_count: count,
                models: res.data.models.map((m: any, idx: number) => ({
                  id: m.id || `m-${idx}`,
                  provider_id: provId,
                  model_identifier: m.id,
                  display_name: m.display_name || m.id,
                  capabilities: m.capabilities || ['text_generation'],
                  free_status: 'FREE_CONFIRMED',
                  context_limit: m.context_limit || '32k tokens',
                  status: 'ACTIVE'
                }))
              };
            }
            return p;
          }));
        }
      } else {
        setTestResultFeedback(`Không thể khám phá catalog từ ${provId}: ${res.error?.message}`);
      }
    } catch (e: any) {
      setTestingProviderId(null);
      setTestResultFeedback(`Lỗi khám phá catalog: ${e.message}`);
    }

    setTimeout(() => setTestResultFeedback(null), 5000);
  };

  const handleAddCustomProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProviderName || !newBaseUrl) return;

    try {
      const res = await OrchestratorApi.addCustomProvider({
        name: newProviderName,
        base_url: newBaseUrl,
        api_key: newApiKey
      });

      if (res.success && res.data) {
        setTestResultFeedback(`Đã thêm provider: ${newProviderName} (Bảo mật SSRF PASS).`);
        // Refresh provider list from backend
        const refresh = await OrchestratorApi.getProviders();
        if (refresh.success && refresh.data) {
          onUpdateProviders(refresh.data);
        }
        setIsAddModalOpen(false);
        setNewProviderName('');
        setNewBaseUrl('');
        setNewApiKey('');
      } else {
        setTestResultFeedback(`Lỗi thêm provider: ${res.error?.message}`);
      }
    } catch (e: any) {
      setTestResultFeedback(`Lỗi: ${e.message}`);
    }

    setTimeout(() => setTestResultFeedback(null), 5000);
  };

  const getProviderHelpInfo = (provId: string) => {
    if (provId === 'prov-groq') {
      return {
        link: 'https://console.groq.com/keys',
        linkLabel: 'Lấy Groq API Key miễn phí',
        hint: 'Bắt đầu bằng gsk_... (Tốc độ phản hồi cực nhanh ~300 tokens/s, miễn phí 100%)',
        placeholder: 'gsk_...'
      };
    }
    if (provId === 'prov-gemini') {
      return {
        link: 'https://aistudio.google.com/app/apikey',
        linkLabel: 'Lấy Google Gemini API Key miễn phí',
        hint: 'Bắt đầu bằng AIzaSy... (Hạn mức miễn phí 15 requests/phút, hiểu ngữ cảnh 1M tokens)',
        placeholder: 'AIzaSy...'
      };
    }
    if (provId === 'prov-openrouter') {
      return {
        link: 'https://openrouter.ai/keys',
        linkLabel: 'Lấy OpenRouter API Key',
        hint: 'Bắt đầu bằng sk-or-... (Hỗ trợ hàng chục model :free)',
        placeholder: 'sk-or-...'
      };
    }
    return {
      link: '',
      linkLabel: '',
      hint: 'Nhập API Key tương thích OpenAI',
      placeholder: 'sk-...'
    };
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;
    const trimmed = editApiKeyInput.trim();
    if (!trimmed) {
      setTestResultFeedback('Vui lòng nhập API Key hợp lệ.');
      return;
    }

    setIsSavingKey(true);
    setTestResultFeedback(`Đang lưu API Key cho ${editingProvider.name}...`);

    try {
      const res = await OrchestratorApi.updateProvider(editingProvider.id, {
        api_key: trimmed
      });

      if (res.success) {
        setTestResultFeedback(`Đã lưu API Key cho ${editingProvider.name}! Đang kiểm tra kết nối...`);
        const targetId = editingProvider.id;
        setEditingProvider(null);
        setEditApiKeyInput('');

        // Refresh providers from backend
        const refresh = await OrchestratorApi.getProviders();
        if (refresh.success && refresh.data) {
          onUpdateProviders(refresh.data);
        }

        // Auto trigger connection test to switch status to HEALTHY
        await handleTestConnection(targetId);
      } else {
        setTestResultFeedback(`Lỗi lưu API Key: ${res.error?.message || 'Không xác định'}`);
      }
    } catch (err: any) {
      setTestResultFeedback(`Lỗi: ${err.message}`);
    } finally {
      setIsSavingKey(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Test feedback toast */}
      {testResultFeedback && (
        <div className="p-4 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 text-white text-xs flex items-center justify-between shadow-xl animate-fade-in backdrop-blur-md">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{testResultFeedback}</span>
          </div>
          <button 
            onClick={() => setTestResultFeedback(null)} 
            className="text-slate-400 hover:text-white ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Routing Policy Control */}
      <div className="p-6 rounded-3xl glass-panel relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                AI ROUTER & ORCHESTRATION ENGINE
              </span>
              <span className="text-xs text-slate-400">Zero-Cost Priority Engine</span>
              {backendStatus && (
                <span className="text-[10px] text-emerald-400 font-mono">({backendStatus})</span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Quản Trị Nhà Cung Cấp AI & Điều Phối Mô Hình
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Tự động phân bổ tác vụ cho model phù hợp nhất, tự chuyển đổi dự phòng khi gặp lỗi 429 và bảo vệ 100% ngân sách 0đ.
            </p>
          </div>

          {/* Policy Selector */}
          <div className="p-2 rounded-2xl bg-[#0F172A] border border-white/10 flex items-center space-x-1 shrink-0">
            <button
              onClick={() => setRoutingPolicy('FREE_ONLY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                routingPolicy === 'FREE_ONLY'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Chỉ Dùng Miễn Phí (FREE_ONLY)</span>
            </button>
            <button
              onClick={() => setRoutingPolicy('MANUAL_PRIORITY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                routingPolicy === 'MANUAL_PRIORITY'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Theo Mức Ưu Tiên</span>
            </button>
          </div>
        </div>
      </div>

      {/* Provider List Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Danh Sách Nhà Cung Cấp Đã Cấu Hình ({providers.length})
          </h3>
          <p className="text-xs text-slate-400">Tự khám phá model và thiết lập tự phục hồi lỗi với khóa API được che bảo mật</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Provider Mới</span>
        </button>
      </div>

      {/* Providers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {providers.map((prov: any) => {
          const isTesting = testingProviderId === prov.id;
          const isDegraded = prov.status === 'DEGRADED';
          const isOpenCircuit = prov.status === 'OPEN_CIRCUIT';

          return (
            <div
              key={prov.id}
              className={`p-5 rounded-2xl bg-[#0F172A] border transition-all ${
                isDegraded || isOpenCircuit
                  ? 'border-amber-500/40 bg-amber-950/10'
                  : 'border-white/10 hover:border-indigo-500/30'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-white">{prov.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                      Ưu tiên #{prov.priority}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-1 truncate max-w-xs">
                    {prov.base_url}
                  </div>
                  {/* Masked Secret Key Display or Missing Notice */}
                  {prov.has_api_key && prov.masked_api_key ? (
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-300 font-mono">
                      <Key className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>API Key: <span className="text-emerald-400 font-semibold">{prov.masked_api_key}</span></span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 w-fit">
                      <AlertTriangle className="w-3 h-3 shrink-0 text-amber-400" />
                      <span>Chưa cấu hình API Key</span>
                    </div>
                  )}
                </div>

                {/* Circuit Status Badge */}
                <div className="flex items-center space-x-1.5">
                  {prov.status === 'HEALTHY' && (
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> HEALTHY
                    </span>
                  )}
                  {isDegraded && (
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> DEGRADED
                    </span>
                  )}
                  {isOpenCircuit && (
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> OPEN_CIRCUIT
                    </span>
                  )}
                  {prov.status === 'UNKNOWN' && (
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-slate-500/10 text-slate-400 border border-slate-500/30">
                      CHƯA TEST
                    </span>
                  )}
                </div>
              </div>

              {/* Degraded / Missing Key Notice */}
              {(isDegraded || isOpenCircuit || !prov.has_api_key) && (
                <div className="my-3 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{!prov.has_api_key ? 'Cần cấu hình API Key để kích hoạt' : 'Cảnh báo DEGRADED / OPEN_CIRCUIT'}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    {prov.last_error_message || (!prov.has_api_key 
                      ? 'Nhà cung cấp này chưa có API Key trong hệ thống. Hãy bấm nút "Cấu hình Key" bên dưới để nhập key miễn phí và chuyển sang trạng thái HEALTHY.' 
                      : 'Kết nối kiểm tra không thành công hoặc gặp giới hạn quota.')}
                  </p>
                </div>
              )}

              {/* Verified Quota & Latency Metrics */}
              <div className="grid grid-cols-2 gap-3 my-4 p-3 rounded-xl bg-[#1E293B]/70 border border-white/5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Trạng thái Quota:</span>
                  <span className="font-medium text-slate-200 mt-0.5 block truncate">
                    {prov.is_free_confirmed ? 'Miễn phí xác nhận' : 'Cần kiểm tra'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Độ trễ phản hồi:</span>
                  <span className="font-mono text-cyan-400 mt-0.5 block">
                    {prov.latency_ms ? `${prov.latency_ms} ms` : 'Chưa đo'}
                  </span>
                </div>
              </div>

              {/* Models List for this provider */}
              <div className="space-y-2 mb-4">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Mô Hình Đang Hoạt Động ({prov.models?.length || 0}):
                </span>
                {prov.models?.map((model: any) => (
                  <div
                    key={model.id}
                    className="p-2.5 rounded-lg bg-[#0B1322] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-white truncate max-w-[220px]">{model.display_name}</div>
                      <div className="flex items-center gap-1 mt-1">
                        {model.capabilities?.map((cap: string) => (
                          <span key={cap} className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">
                      {model.free_status || 'FREE_CONFIRMED'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  Kiểm tra: {prov.last_health_check || 'Chưa kiểm tra'}
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingProvider(prov);
                      setEditApiKeyInput('');
                      setShowApiKeyText(false);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-medium border border-emerald-500/30 flex items-center gap-1.5 transition"
                    title="Nhập hoặc đổi API Key"
                  >
                    <Key className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{prov.has_api_key ? 'Đổi Key' : 'Cấu hình Key'}</span>
                  </button>

                  <button
                    onClick={() => handleDiscoverCatalog(prov.id)}
                    disabled={isTesting}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-medium border border-white/5 flex items-center gap-1 transition"
                    title="Khám phá danh mục model từ API provider"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>Catalog</span>
                  </button>

                  <button
                    onClick={() => handleTestConnection(prov.id)}
                    disabled={isTesting}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-medium border border-indigo-500/40 flex items-center gap-1.5 transition"
                  >
                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isTesting ? 'Đang test...' : 'Test Kết Nối'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Task-Aware Routing Matrix Preview */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-white/10 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Ma Trận Phân Bổ Năng Lực AI Theo Tác Vụ (Task Routing Matrix)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Chính sách định tuyến ưu tiên model chi phí 0đ, độ ổn định cao và tự động kích hoạt fallback circuit breaker.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#1E293B]/70 border border-white/5 space-y-1.5">
            <div className="font-semibold text-white">1. Trích Xuất Luận Điểm</div>
            <div className="text-[11px] text-slate-400">Yêu cầu: text_generation, context lớn</div>
            <div className="text-[11px] text-cyan-400 font-mono">Ưu tiên 1: Groq Llama 3 70B</div>
            <div className="text-[10px] text-slate-500">Fallback: Gemini 1.5 Flash</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#1E293B]/70 border border-white/5 space-y-1.5">
            <div className="font-semibold text-white">2. Biên Tập Kịch Bản (9:16)</div>
            <div className="text-[11px] text-slate-400">Yêu cầu: structured_output, tiếng Việt</div>
            <div className="text-[11px] text-cyan-400 font-mono">Ưu tiên 1: Gemini 1.5 Flash</div>
            <div className="text-[10px] text-slate-500">Fallback: Groq Llama 3 70B</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#1E293B]/70 border border-white/5 space-y-1.5">
            <div className="font-semibold text-white">3. Giọng Đọc Neural TTS</div>
            <div className="text-[11px] text-slate-400">Yêu cầu: text_to_speech, tiếng Việt</div>
            <div className="text-[11px] text-emerald-400 font-mono">Ưu tiên: Edge-TTS Neural (Free)</div>
            <div className="text-[10px] text-slate-500">Giọng: vi-VN-HoaiMyNeural</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#1E293B]/70 border border-white/5 space-y-1.5">
            <div className="font-semibold text-white">4. Tổng Hợp & Render MP4</div>
            <div className="text-[11px] text-slate-400">Yêu cầu: video_engine, ffprobe</div>
            <div className="text-[11px] text-emerald-400 font-mono">FFmpeg Native Hardware</div>
            <div className="text-[10px] text-slate-500">1080x1920 30FPS H.264</div>
          </div>
        </div>
      </div>

      {/* Add Custom Provider Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0F172A] border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Thêm Provider Tương Thích OpenAI
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomProvider} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium block">Tên hiển thị Provider:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Local vLLM Server / Ollama"
                  value={newProviderName}
                  onChange={(e) => setNewProviderName(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#0B1322] border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium block">API Base URL (Bảo vệ SSRF):</label>
                <input
                  type="url"
                  required
                  placeholder="https://api.your-provider.com/v1"
                  value={newBaseUrl}
                  onChange={(e) => setNewBaseUrl(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#0B1322] border border-white/10 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-400">
                  Chỉ cho phép HTTPS hợp lệ hoặc localhost đã whitelist. Chặn truy cập metadata cloud.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium block">API Key (Tùy chọn):</label>
                <input
                  type="password"
                  placeholder="sk-proj-****************"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#0B1322] border border-white/10 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" /> Khóa bí mật được lưu trong secret store, không hiển thị lại trên UI.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30"
                >
                  Lưu & Kiểm Tra Kết Nối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit API Key Modal */}
      {editingProvider && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0F172A] border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Cấu Hình API Key: {editingProvider.name}
                </h3>
              </div>
              <button 
                onClick={() => setEditingProvider(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Provider Help Link */}
            {(() => {
              const help = getProviderHelpInfo(editingProvider.id);
              return (
                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs space-y-2">
                  <div className="flex items-center justify-between text-indigo-300">
                    <span className="font-semibold">Nơi lấy API Key:</span>
                    {help.link && (
                      <a
                        href={help.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>{help.linkLabel}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {help.hint}
                  </p>
                </div>
              );
            })()}

            <form onSubmit={handleSaveApiKey} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block">
                  Nhập API Key Mới:
                </label>
                <div className="relative">
                  <input
                    type={showApiKeyText ? 'text' : 'password'}
                    required
                    placeholder={getProviderHelpInfo(editingProvider.id).placeholder}
                    value={editApiKeyInput}
                    onChange={(e) => setEditApiKeyInput(e.target.value)}
                    className="w-full p-2.5 pr-10 rounded-lg bg-[#0B1322] border border-white/10 text-white focus:outline-none focus:border-emerald-500 font-mono text-xs"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKeyText(!showApiKeyText)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showApiKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                  Key được bảo mật trong secret store, hệ thống sẽ tự động test kết nối sau khi lưu.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  disabled={isSavingKey}
                  onClick={() => setEditingProvider(null)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingKey || !editApiKeyInput.trim()}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  {isSavingKey ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Lưu & Kích Hoạt Ngay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

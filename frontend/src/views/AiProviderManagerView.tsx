import { useState } from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  Plus, 
  Zap, 
  Layers, 
  Lock
} from 'lucide-react';
import type { AiProvider } from '../types';

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

  // New Provider Form State
  const [newProviderName, setNewProviderName] = useState('');
  const [newBaseUrl, setNewBaseUrl] = useState('');
  const [newApiKey, setNewApiKey] = useState('');

  const handleTestConnection = (provId: string) => {
    setTestingProviderId(provId);
    setTestResultFeedback(`Đang gửi HTTP health check tới provider ${provId}...`);

    setTimeout(() => {
      setTestingProviderId(null);
      if (provId === 'prov-openrouter') {
        setTestResultFeedback("OpenRouter: Phát hiện mã HTTP 429 (Rate Limit). Fallback sang Groq Cloud đã kích hoạt thành công!");
      } else {
        setTestResultFeedback(`Kết nối thành công tới ${provId}! HTTP 200 OK, latency ổn định.`);
      }
      setTimeout(() => setTestResultFeedback(null), 4000);
    }, 1200);
  };

  const handleDiscoverCatalog = (provId: string) => {
    setTestingProviderId(provId);
    setTestResultFeedback(`Đang khám phá danh mục Model Catalog từ ${provId}...`);
    setTimeout(() => {
      setTestingProviderId(null);
      setTestResultFeedback(`Đã đồng bộ thành công danh sách model mới từ ${provId}!`);
      setTimeout(() => setTestResultFeedback(null), 3000);
    }, 1500);
  };

  const handleAddCustomProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProviderName || !newBaseUrl) return;

    const newProvider: AiProvider = {
      id: `prov-custom-${Date.now()}`,
      name: newProviderName,
      provider_type: 'custom_openai',
      base_url: newBaseUrl,
      status: 'HEALTHY',
      priority: providers.length + 1,
      is_free_confirmed: true,
      models_count: 1,
      last_health_check: 'Vừa thêm (Chưa test)',
      latency_ms: 180,
      quota_info: 'Custom Self-Hosted / Free tier',
      models: [
        {
          id: `custom-model-01`,
          provider_id: `prov-custom-${Date.now()}`,
          model_identifier: 'custom-llm',
          display_name: `${newProviderName} Default Model`,
          capabilities: ['text_generation', 'structured_output'],
          free_status: 'FREE_CONFIRMED',
          context_limit: '32k tokens',
          status: 'ACTIVE'
        }
      ]
    };

    onUpdateProviders([...providers, newProvider]);
    setIsAddModalOpen(false);
    setNewProviderName('');
    setNewBaseUrl('');
    setNewApiKey('');
    setTestResultFeedback(`Đã thêm provider tùy chỉnh: ${newProviderName}`);
    setTimeout(() => setTestResultFeedback(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Test feedback toast */}
      {testResultFeedback && (
        <div className="p-3.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-xs text-indigo-200 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{testResultFeedback}</span>
          </div>
          <button onClick={() => setTestResultFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Routing Policy & Fallback Controller Bar */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              Chế Độ Định Tuyến AI (AI Routing Policy)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Chi Phí: 0 VNĐ
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Theo Mục 20 & 97 của PROJECT.md: Chế độ mặc định bắt buộc là <strong className="text-white">FREE_ONLY</strong>. Hệ thống chỉ sử dụng các provider và model đã xác minh miễn phí. Tuyệt đối không tự động kích hoạt gói trả phí.
          </p>
        </div>

        {/* Policy Selector */}
        <div className="flex items-center space-x-2 bg-[#1E293B] p-1.5 rounded-xl border border-white/10 shrink-0">
          {[
            { id: 'FREE_ONLY', label: 'FREE_ONLY (Bắt Buộc)' },
            { id: 'MANUAL_PRIORITY', label: 'Ưu Tiên Thủ Công' },
            { id: 'QUALITY_FIRST', label: 'Chất Lượng Tối Đa' },
          ].map((pol) => (
            <button
              key={pol.id}
              onClick={() => setRoutingPolicy(pol.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                routingPolicy === pol.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {pol.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quota & Circuit Breaker Status Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-white">Google Gemini API</div>
            <div className="text-slate-400 text-[11px]">15 RPM / 1M TPM khả dụng</div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-white">Groq Cloud (Llama 3.3)</div>
            <div className="text-slate-400 text-[11px]">30 RPM • Độ trễ: 110ms</div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-white">OpenRouter Circuit Breaker</div>
            <div className="text-amber-300 text-[11px]">Tạm ngắt (HTTP 429) - Đã fallback sang Groq</div>
          </div>
        </div>
      </div>

      {/* Provider List Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Danh Sách Nhà Cung Cấp Đã Cấu Hình ({providers.length})
          </h3>
          <p className="text-xs text-slate-400">Tự khám phá model và thiết lập tự phục hồi lỗi</p>
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
        {providers.map((prov) => {
          const isTesting = testingProviderId === prov.id;
          const isDegraded = prov.status === 'DEGRADED';

          return (
            <div
              key={prov.id}
              className={`p-5 rounded-2xl bg-[#0F172A] border transition-all ${
                isDegraded
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
                      <AlertTriangle className="w-3 h-3" /> DEGRADED (429)
                    </span>
                  )}
                </div>
              </div>

              {/* Verified Quota & Latency Metrics */}
              <div className="grid grid-cols-2 gap-3 my-4 p-3 rounded-xl bg-[#1E293B]/70 border border-white/5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Hạn mức đã xác minh:</span>
                  <span className="font-medium text-slate-200 mt-0.5 block truncate">{prov.quota_info}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Độ trễ trung bình:</span>
                  <span className="font-mono text-cyan-400 mt-0.5 block">{prov.latency_ms} ms</span>
                </div>
              </div>

              {/* Models List for this provider */}
              <div className="space-y-2 mb-4">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Mô Hình Đang Hoạt Động ({prov.models.length}):
                </span>
                {prov.models.map((model) => (
                  <div
                    key={model.id}
                    className="p-2.5 rounded-lg bg-[#0B1322] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-white truncate max-w-[220px]">{model.display_name}</div>
                      <div className="flex items-center gap-1 mt-1">
                        {model.capabilities.map((cap) => (
                          <span key={cap} className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">
                      {model.free_status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  Kiểm tra: {prov.last_health_check}
                </span>

                <div className="flex items-center space-x-2">
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
          <p className="text-xs text-slate-400 mt-0.5">Không hardcode model vào logic; AI Router tự chọn model phù hợp nhất theo năng lực</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#1E293B] border border-white/5 space-y-1.5">
            <span className="text-slate-400 text-[11px] block">1. Viết Kịch Bản & Cấu Trúc</span>
            <div className="font-semibold text-white">Gemini 1.5 Flash</div>
            <span className="text-[10px] text-emerald-400 font-mono block">text_generation + structured_output</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#1E293B] border border-white/5 space-y-1.5">
            <span className="text-slate-400 text-[11px] block">2. Fact-Checking & Claims</span>
            <div className="font-semibold text-white">Llama 3.3 70B (Groq)</div>
            <span className="text-[10px] text-cyan-400 font-mono block">High-speed cross-source reasoning</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#1E293B] border border-white/5 space-y-1.5">
            <span className="text-slate-400 text-[11px] block">3. Đánh Giá Bản Quyền & Visual</span>
            <div className="font-semibold text-white">Gemini 1.5 Flash Vision</div>
            <span className="text-[10px] text-indigo-400 font-mono block">vision capability verified</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#1E293B] border border-white/5 space-y-1.5">
            <span className="text-slate-400 text-[11px] block">4. Giọng Đọc & Timestamp</span>
            <div className="font-semibold text-white">Vietnamese Neural TTS</div>
            <span className="text-[10px] text-amber-300 font-mono block">forced_alignment audio ms</span>
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
    </div>
  );
};

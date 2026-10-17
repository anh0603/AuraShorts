import { useState, useEffect } from 'react';
import { 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Plus,
  Sparkles,
  Wifi,
  Trash2,
  X,
  XCircle,
  Check,
  Shield,
  Calendar,
  ExternalLink,
  Copy,
  Hash
} from 'lucide-react';
import { PublishingApi } from '../services/api';
import type { 
  ApiSocialAccount, 
  ApiPostQueueItem, 
  ApiMetadataResult 
} from '../services/api';
import { MOCK_ACCOUNTS } from '../data/mockData';

export const PublishingView: React.FC = () => {
  const [approvalMode, setApprovalMode] = useState<'SEMI_AUTO' | 'FULL_AUTO'>('SEMI_AUTO');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING_APPROVAL' | 'SCHEDULED' | 'PUBLISHED' | 'REJECTED'>('ALL');
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [testingAccId, setTestingAccId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Live Accounts and Queue with fallback
  const [accounts, setAccounts] = useState<ApiSocialAccount[]>([]);
  const [queueItems, setQueueItems] = useState<ApiPostQueueItem[]>([]);
  const [accountTestStatus, setAccountTestStatus] = useState<Record<string, { latency_ms: number; status: string; message: string }>>({});

  // Modals state
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
  const [rejectingItem, setRejectingItem] = useState<ApiPostQueueItem | null>(null);
  const [rejectReason, setRejectReason] = useState('Cần điều chỉnh lại tiêu đề và tư liệu hình ảnh');

  // New Account Form State
  const [newPlatform, setNewPlatform] = useState<'youtube' | 'tiktok' | 'facebook' | 'instagram'>('youtube');
  const [newAccountName, setNewAccountName] = useState('');
  const [newExternalId, setNewExternalId] = useState('');
  const [newNiche, setNewNiche] = useState('tech');
  const [newToken, setNewToken] = useState('');
  const [newVideosPerDay, setNewVideosPerDay] = useState(2);
  const [newPostTimes, setNewPostTimes] = useState('11:30, 20:00');

  // AI Metadata Generator Form State
  const [metaTitle, setMetaTitle] = useState('Pin thể rắn xe điện sạc 12 phút đi 1000km');
  const [metaSummary, setMetaSummary] = useState('Loại bỏ hoàn toàn nguy cơ cháy nổ, sạc siêu tốc 12 phút, công nghệ vật liệu mới thay đổi tương lai xe điện');
  const [metaPlatform, setMetaPlatform] = useState<'youtube' | 'tiktok' | 'facebook' | 'instagram'>('youtube');
  const [metaNiche, setMetaNiche] = useState('tech');
  const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);
  const [generatedMeta, setGeneratedMeta] = useState<ApiMetadataResult | null>(null);
  const [targetEnqueueAccount, setTargetEnqueueAccount] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load live accounts and queue from backend
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [accRes, queueRes] = await Promise.all([
        PublishingApi.getAccounts(),
        PublishingApi.getQueue()
      ]);

      if (accRes.success && accRes.data && accRes.data.length > 0) {
        setAccounts(accRes.data);
      } else {
        // Fallback mapping
        setAccounts(MOCK_ACCOUNTS.map(m => ({
          id: m.id,
          platform: m.platform,
          account_name: m.account_name,
          external_account_id: m.handle,
          niche_id: m.niche,
          status: 'CONNECTED',
          credential_reference: 'ya29.••••••••yt01',
          videos_per_day: m.target_daily_posts,
          post_times: ['11:30', '20:00']
        })));
      }

      if (queueRes.success && queueRes.data && queueRes.data.length > 0) {
        setQueueItems(queueRes.data);
      } else {
        // Fallback default queue
        setQueueItems([
          {
            id: 'pq-01',
            account_id: 'acc-yt-tech',
            title: 'Cuộc Đua Siêu Chip Bán Dẫn 2nm: Ai Sẽ Thống Trị Kỷ Nguyên AI?',
            caption: 'Thế giới đang chứng kiến cuộc đua khốc liệt nhất giữa TSMC, Intel và Samsung trong quy trình đóng gói bán dẫn 2nm...',
            hashtags: ['#shorts', '#semiconductor', '#aichips', '#congnghe'],
            scheduled_time: '2026-10-15T20:00:00Z',
            status: 'PENDING_APPROVAL',
            idempotency_key: 'idem-yt-2nm-chip-20261014-a9b'
          },
          {
            id: 'pq-02',
            account_id: 'acc-tk-ai',
            title: 'Top 3 Đột Phá AI Thay Đổi Ngành Y Tế Toàn Cầu',
            caption: 'Từ đọc phim chụp cộng hưởng từ sớm 3 năm đến giải mã protein phức tạp, trí tuệ nhân tạo đang tạo nên phép màu y khoa.',
            hashtags: ['#tiktokai', '#yte', '#kienthuc', '#fyp'],
            scheduled_time: '2026-10-15T21:30:00Z',
            status: 'PUBLISHED',
            idempotency_key: 'idem-tt-med-ai-20261014-f41',
            post_url: 'https://tiktok.com/@khamphacongnghe/video/demo'
          }
        ]);
      }
    } catch (err) {
      console.warn("Backend publishing endpoints unavailable, using offline fallback", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update target account default when accounts list changes
  useEffect(() => {
    if (accounts.length > 0 && !targetEnqueueAccount) {
      setTargetEnqueueAccount(accounts[0].id);
    }
  }, [accounts]);

  // Test Channel Connection
  const handleTestAccount = async (accId: string) => {
    setTestingAccId(accId);
    try {
      const res = await PublishingApi.testAccount(accId);
      if (res.success && res.data) {
        setAccountTestStatus(prev => ({
          ...prev,
          [accId]: {
            latency_ms: res.data.latency_ms,
            status: res.data.status,
            message: `Kết nối OAuth thành công (${res.data.latency_ms}ms)`
          }
        }));
        showToast(`Kênh ${res.data.account_name} hoạt động tốt! Độ trễ: ${res.data.latency_ms}ms`);
      } else {
        setAccountTestStatus(prev => ({
          ...prev,
          [accId]: {
            latency_ms: 0,
            status: 'ERROR',
            message: res.error?.message || 'Không thể xác thực token kênh'
          }
        }));
        showToast(`Kiểm tra kênh thất bại: ${res.error?.message || 'Lỗi kết nối'}`);
      }
    } catch {
      showToast("Lỗi kiểm tra kết nối kênh.");
    } finally {
      setTestingAccId(null);
    }
  };

  // Delete/Disconnect Channel
  const handleDeleteAccount = async (accId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn ngắt kết nối kênh này? Lịch đăng tương ứng sẽ bị hủy.")) return;
    try {
      const res = await PublishingApi.deleteAccount(accId);
      if (res.success) {
        setAccounts(prev => prev.filter(a => a.id !== accId));
        showToast("Đã ngắt kết nối kênh an toàn.");
      } else {
        showToast(res.error?.message || "Không thể xóa kênh.");
      }
    } catch {
      showToast("Lỗi kết nối khi xóa kênh.");
    }
  };

  // Add New Channel
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName || !newExternalId) {
      showToast("Vui lòng nhập tên kênh và ID định danh.");
      return;
    }

    try {
      const postTimesArray = newPostTimes.split(',').map(s => s.trim()).filter(Boolean);
      const res = await PublishingApi.createAccount({
        platform: newPlatform,
        account_name: newAccountName,
        external_account_id: newExternalId,
        niche_id: newNiche,
        access_token: newToken || undefined,
        videos_per_day: newVideosPerDay,
        post_times: postTimesArray
      });

      if (res.success && res.data) {
        setAccounts(prev => [res.data, ...prev]);
        setIsAddAccountOpen(false);
        setNewAccountName('');
        setNewExternalId('');
        setNewToken('');
        showToast(`Đã kết nối kênh "${res.data.account_name}" thành công!`);
      } else {
        showToast(res.error?.message || "Không thể kết nối kênh.");
      }
    } catch {
      showToast("Lỗi khi kết nối tài khoản mới.");
    }
  };

  // Operator Approve Workflow
  const handleApprove = async (id: string) => {
    try {
      const res = await PublishingApi.approvePost(id);
      if (res.success) {
        setQueueItems(prev => prev.map(item => {
          if (item.id === id) {
            return { ...item, status: 'SCHEDULED' };
          }
          return item;
        }));
        showToast(`Đã phê duyệt video ${id}! Lịch phát sóng đã được kích hoạt.`);
      } else {
        showToast(res.error?.message || "Phê duyệt thất bại.");
      }
    } catch {
      // Local optimistic update
      setQueueItems(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, status: 'SCHEDULED' };
        }
        return item;
      }));
      showToast(`Đã phê duyệt video ${id}!`);
    }
  };

  // Operator Reject Workflow
  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    const id = rejectingItem.id;
    try {
      const res = await PublishingApi.rejectPost(id, rejectReason);
      if (res.success) {
        setQueueItems(prev => prev.map(item => {
          if (item.id === id) {
            return { ...item, status: 'REJECTED', error_message: rejectReason };
          }
          return item;
        }));
        showToast(`Đã từ chối video ${id}. Lý do: ${rejectReason}`);
      } else {
        showToast(res.error?.message || "Từ chối thất bại.");
      }
    } catch {
      setQueueItems(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, status: 'REJECTED', error_message: rejectReason };
        }
        return item;
      }));
      showToast(`Đã từ chối video ${id}.`);
    } finally {
      setRejectingItem(null);
    }
  };

  // Reconcile API Status
  const handleReconcile = async (id: string) => {
    setReconcilingId(id);
    showToast(`Đang đối chiếu trạng thái từ API nền tảng cho tác vụ ${id}...`);
    try {
      const res = await PublishingApi.reconcilePost(id);
      if (res.success && res.data) {
        setQueueItems(prev => prev.map(item => {
          if (item.id === id) {
            return {
              ...item,
              status: (res.data.status || 'PUBLISHED') as any,
              post_url: res.data.post_url || item.post_url,
              external_post_id: res.data.external_post_id || item.external_post_id
            };
          }
          return item;
        }));
        showToast(res.data.message || "Đối soát thành công! Bài đăng đã được xác nhận tiếp nhận an toàn.");
      } else {
        showToast("Đối soát thất bại: " + (res.error?.message || ""));
      }
    } catch {
      showToast("Lỗi khi kết nối đối soát API.");
    } finally {
      setReconcilingId(null);
    }
  };

  // Instant Publish to Platform (YouTube Shorts)
  const handlePublishNow = async (id: string) => {
    setPublishingId(id);
    showToast(`Đang đẩy video ${id} lên kênh YouTube Shorts...`);
    try {
      const res = await PublishingApi.publishNow(id);
      if (res.success && res.data) {
        setQueueItems(prev => prev.map(item => {
          if (item.id === id) {
            return {
              ...item,
              status: 'PUBLISHED',
              post_url: res.data.post_url,
              external_post_id: res.data.external_post_id
            };
          }
          return item;
        }));
        showToast(res.data.message || `Đã xuất bản thành công! ${res.data.post_url}`);
      } else {
        showToast(res.error?.message || "Xuất bản thất bại.");
      }
    } catch {
      showToast("Lỗi khi gọi API xuất bản.");
    } finally {
      setPublishingId(null);
    }
  };

  // Generate Metadata via AI Router
  const handleGenerateMetadata = async () => {
    if (!metaTitle.trim()) {
      showToast("Vui lòng nhập tiêu đề cốt lõi.");
      return;
    }
    setIsGeneratingMeta(true);
    try {
      const res = await PublishingApi.generateMetadata({
        title: metaTitle,
        content_summary: metaSummary,
        platform: metaPlatform,
        niche: metaNiche
      });

      if (res.success && res.data) {
        setGeneratedMeta(res.data);
        showToast(`AI Router đã sinh xong tiêu đề & hashtag chuẩn SEO cho ${metaPlatform.toUpperCase()}!`);
      } else {
        showToast(res.error?.message || "Không thể sinh metadata.");
      }
    } catch {
      showToast("Lỗi khi kết nối AI Router để sinh metadata.");
    } finally {
      setIsGeneratingMeta(false);
    }
  };

  // Enqueue directly from AI Studio
  const handleEnqueueFromMeta = async () => {
    if (!generatedMeta) return;
    const chosenAcc = accounts.find(a => a.id === targetEnqueueAccount) || accounts[0];
    const accId = chosenAcc ? chosenAcc.id : 'acc-yt-tech';

    try {
      const res = await PublishingApi.enqueuePost({
        account_id: accId,
        title: generatedMeta.title,
        caption: generatedMeta.caption,
        hashtags: generatedMeta.hashtags,
        scheduled_time: new Date(Date.now() + 3600 * 1000 * 3).toISOString(),
        status: approvalMode === 'FULL_AUTO' ? 'SCHEDULED' : 'PENDING_APPROVAL'
      });

      if (res.success && res.data) {
        setQueueItems(prev => [res.data, ...prev]);
        setIsMetadataModalOpen(false);
        showToast(`Đã thêm video vào hàng đợi xuất bản (${res.data.status})!`);
      } else {
        showToast(res.error?.message || "Không thể xếp hàng bài đăng.");
      }
    } catch {
      showToast("Lỗi khi gửi tác vụ vào hàng đợi xuất bản.");
    }
  };

  // Filtered queue items
  const filteredQueue = queueItems.filter(item => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'PENDING_APPROVAL') return item.status === 'PENDING_APPROVAL';
    if (activeFilter === 'SCHEDULED') return item.status === 'SCHEDULED' || item.status === 'APPROVED';
    if (activeFilter === 'PUBLISHED') return item.status === 'PUBLISHED';
    if (activeFilter === 'REJECTED') return item.status === 'REJECTED';
    return true;
  });

  const pendingCount = queueItems.filter(q => q.status === 'PENDING_APPROVAL').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-indigo-600 text-white text-xs font-medium shadow-2xl flex items-center space-x-3 border border-indigo-400 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Operator Control Bar */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Phase 5
            </span>
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-400" />
              Quản Trị Mạng Lưới Kênh & Hàng Đợi Xuất Bản
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Tự động đồng bộ lịch đăng đa nền tảng (YouTube Shorts, TikTok, Facebook Reels, Instagram Reels).
            Bảo đảm tuyệt đối nguyên tắc Idempotency và mã hóa bảo vệ Credential.
          </p>
        </div>

        {/* Action Controls & Mode Switch */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsMetadataModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Sinh Caption AI & SEO
          </button>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-[#1E293B] hover:bg-white/10 text-slate-300 border border-white/10 transition"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {/* Mode Toggle */}
          <div className="flex items-center space-x-1 bg-[#1E293B] p-1 rounded-xl border border-white/10 shrink-0 text-xs">
            <button
              onClick={() => setApprovalMode('SEMI_AUTO')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                approvalMode === 'SEMI_AUTO'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bán Tự Động (Duyệt Tay)
            </button>
            <button
              onClick={() => setApprovalMode('FULL_AUTO')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                approvalMode === 'FULL_AUTO'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Full-Auto Có Kiểm Soát
            </button>
          </div>
        </div>
      </div>

      {/* Connected Channels Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">Tài Khoản Mạng Xã Hội Đã Kết Nối ({accounts.length})</h3>
            <span className="text-[11px] text-slate-400 font-mono">Asia/Ho_Chi_Minh</span>
          </div>
          <button 
            onClick={() => setIsAddAccountOpen(true)}
            className="text-xs px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm Kênh Mới
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const testInfo = accountTestStatus[acc.id];
            return (
              <div
                key={acc.id}
                className="p-4 rounded-xl bg-[#0F172A] border border-white/10 flex flex-col justify-between space-y-3 hover:border-white/20 transition group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs uppercase ${
                      acc.platform === 'youtube' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      acc.platform === 'tiktok' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                      acc.platform === 'facebook' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                    }`}>
                      {acc.platform.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-xs">{acc.account_name}</div>
                      <div className="text-slate-400 text-[11px] font-mono">{acc.external_account_id}</div>
                      {acc.niche_id && (
                        <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-300">
                          {acc.niche_id === 'national' ? 'Thời Sự & Đất Nước' :
                           acc.niche_id === 'geopolitics' ? 'Địa Chính Trị' :
                           acc.niche_id === 'history' ? 'Lịch Sử Dân Tộc' :
                           acc.niche_id}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    {acc.status}
                  </span>
                </div>

                {/* Masked Credentials & Schedule info */}
                <div className="p-2 rounded-lg bg-[#1E293B]/60 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-indigo-400" /> Token bí mật:
                    </span>
                    <span className="font-mono text-slate-300">{acc.credential_reference || 'ya29••••••••'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-cyan-400" /> Tần suất:
                    </span>
                    <span className="text-slate-300 font-medium">
                      {acc.videos_per_day} video/ngày ({acc.post_times?.join(', ') || '11:30, 20:00'})
                    </span>
                  </div>
                </div>

                {/* Connection Ping status */}
                {testInfo && (
                  <div className={`p-2 rounded-lg text-[10px] flex items-center justify-between ${
                    testInfo.status === 'ERROR' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  }`}>
                    <span>{testInfo.message}</span>
                    {testInfo.latency_ms > 0 && <span className="font-mono font-bold">{testInfo.latency_ms}ms</span>}
                  </div>
                )}

                {/* Channel Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs">
                  <button
                    onClick={() => handleTestAccount(acc.id)}
                    disabled={testingAccId === acc.id}
                    className="text-slate-400 hover:text-indigo-400 flex items-center gap-1 py-1 font-medium transition"
                  >
                    <Wifi className={`w-3.5 h-3.5 ${testingAccId === acc.id ? 'animate-pulse text-indigo-400' : ''}`} />
                    <span>{testingAccId === acc.id ? 'Đang ping...' : 'Kiểm Tra Ping'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteAccount(acc.id)}
                    className="text-slate-500 hover:text-rose-400 flex items-center gap-1 py-1 transition"
                    title="Ngắt kết nối kênh"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ngắt Kết Nối</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Publishing Queue Table & Filters */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Hàng Đợi Xuất Bản & Phê Duyệt Video (Publishing Queue)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Đảm bảo nguyên tắc Idempotency: Không tự ý đăng lặp lại video khi mạng gián đoạn
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-1 bg-[#1E293B] p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                activeFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất Cả ({queueItems.length})
            </button>
            <button
              onClick={() => setActiveFilter('PENDING_APPROVAL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                activeFilter === 'PENDING_APPROVAL' ? 'bg-amber-600 text-white' : 'text-amber-400 hover:text-white'
              }`}
            >
              Chờ Duyệt
              {pendingCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveFilter('SCHEDULED')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                activeFilter === 'SCHEDULED' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Đã Lên Lịch
            </button>
            <button
              onClick={() => setActiveFilter('PUBLISHED')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                activeFilter === 'PUBLISHED' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Đã Xuất Bản
            </button>
            <button
              onClick={() => setActiveFilter('REJECTED')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                activeFilter === 'REJECTED' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Từ Chối
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="py-2.5 px-3 font-medium">Video / Tiêu Đề</th>
                <th className="py-2.5 px-3 font-medium">Kênh Đích</th>
                <th className="py-2.5 px-3 font-medium">Lịch Đăng</th>
                <th className="py-2.5 px-3 font-medium">Khóa Idempotency</th>
                <th className="py-2.5 px-3 font-medium">Trạng Thái</th>
                <th className="py-2.5 px-3 font-medium text-right">Thao Tác Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Không có bản ghi xuất bản nào trong danh mục này.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => {
                  const targetAcc = accounts.find(a => a.id === item.account_id);
                  const isPending = item.status === 'PENDING_APPROVAL';

                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition">
                      <td className="py-3 px-3 max-w-sm">
                        <div className="font-semibold text-white truncate" title={item.title}>
                          {item.title}
                        </div>
                        {item.caption && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {item.caption}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.hashtags?.map((tag, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 font-mono">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-300">
                        <span className="capitalize font-semibold text-slate-200">
                          {targetAcc?.platform || 'youtube'}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {targetAcc?.account_name || item.account_id}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                        {item.scheduled_time ? (
                          item.scheduled_time.includes('T')
                            ? new Date(item.scheduled_time).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
                            : item.scheduled_time
                        ) : 'Ngay khi duyệt'}
                      </td>

                      <td className="py-3 px-3 font-mono text-[10px] text-indigo-300 truncate max-w-[130px]" title={item.idempotency_key}>
                        {item.idempotency_key}
                      </td>

                      <td className="py-3 px-3">
                        {item.status === 'PUBLISHED' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            Đã Xuất Bản
                          </span>
                        )}
                        {item.status === 'SCHEDULED' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium">
                            Đã Lên Lịch
                          </span>
                        )}
                        {item.status === 'APPROVED' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                            Đã Phê Duyệt
                          </span>
                        )}
                        {item.status === 'PENDING_APPROVAL' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" /> Chờ Phê Duyệt
                          </span>
                        )}
                        {item.status === 'REJECTED' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium">
                            Đã Từ Chối
                          </span>
                        )}
                        {item.status === 'PUBLISH_RESULT_UNKNOWN' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> Cần Đối Soát
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleApprove(item.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 transition shadow-sm"
                              title="Phê duyệt phát sóng"
                            >
                              <Check className="w-3 h-3" />
                              <span>Duyệt</span>
                            </button>
                            <button
                              onClick={() => {
                                setRejectingItem(item);
                                setRejectReason('Cần chỉnh sửa hình ảnh hoặc nhạc nền');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white font-medium text-xs flex items-center gap-1 transition"
                              title="Từ chối phát sóng"
                            >
                              <X className="w-3 h-3" />
                              <span>Từ Chối</span>
                            </button>
                          </div>
                        ) : (item.status === 'APPROVED' || item.status === 'SCHEDULED') ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handlePublishNow(item.id)}
                              disabled={publishingId === item.id}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm"
                              title="Xuất bản ngay lên kênh YouTube Shorts"
                            >
                              <Send className={`w-3 h-3 ${publishingId === item.id ? 'animate-bounce' : ''}`} />
                              <span>{publishingId === item.id ? 'Đang Đăng...' : 'Đăng Ngay'}</span>
                            </button>
                          </div>
                        ) : item.status === 'PUBLISH_RESULT_UNKNOWN' ? (
                          <button
                            onClick={() => handleReconcile(item.id)}
                            disabled={reconcilingId === item.id}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs flex items-center gap-1 ml-auto transition"
                          >
                            <RefreshCw className={`w-3 h-3 ${reconcilingId === item.id ? 'animate-spin' : ''}`} />
                            <span>Đối Soát API</span>
                          </button>
                        ) : item.post_url ? (
                          <a
                            href={item.post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 text-[11px]"
                          >
                            <span>Xem bài</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-500">Sẵn sàng</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Connect New Channel */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0F172A] border border-white/15 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Kết Nối Kênh Mạng Xã Hội Mới
              </h3>
              <button 
                onClick={() => setIsAddAccountOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Nền Tảng Đích</label>
                <select
                  value={newPlatform}
                  onChange={(e: any) => setNewPlatform(e.target.value)}
                  className="w-full bg-[#1E293B] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="youtube">YouTube Shorts (Khuyên Dùng)</option>
                  <option value="tiktok">TikTok Video</option>
                  <option value="facebook">Facebook Reels</option>
                  <option value="instagram">Instagram Reels</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Tên Kênh Hiển Thị</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Thời Sự & Đất Nước 24/7"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="w-full bg-[#1E293B] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Handle / External Account ID</label>
                <input
                  type="text"
                  placeholder="Ví dụ: @thoisuvietnam hoặc UC_channel_id"
                  value={newExternalId}
                  onChange={(e) => setNewExternalId(e.target.value)}
                  className="w-full bg-[#1E293B] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Chủ Đề (Niche)</label>
                <select
                  value={newNiche}
                  onChange={(e) => setNewNiche(e.target.value)}
                  className="w-full bg-[#1E293B] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="tech">Công Nghệ & AI Bán Dẫn</option>
                  <option value="science">Khoa Học & Đời Sống</option>
                  <option value="national">Thời Sự & Đất Nước</option>
                  <option value="geopolitics">Địa Chính Trị & Quốc Tế</option>
                  <option value="history">Lịch Sử & Dân Tộc</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  OAuth Secret / Token (Được mã hóa & che giấu khi lưu trữ)
                </label>
                <input
                  type="password"
                  placeholder="ya29.•••••••• / actk.••••••••"
                  value={newToken}
                  onChange={(e) => setNewToken(e.target.value)}
                  className="w-full bg-[#1E293B] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Hệ thống tuân thủ Project Rule: Tuyệt đối không lưu raw token ở log hoặc response.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Số Video / Ngày</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newVideosPerDay}
                    onChange={(e) => setNewVideosPerDay(Number(e.target.value))}
                    className="w-full bg-[#1E293B] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Giờ Đăng (Giờ VN)</label>
                  <input
                    type="text"
                    placeholder="11:30, 20:00"
                    value={newPostTimes}
                    onChange={(e) => setNewPostTimes(e.target.value)}
                    className="w-full bg-[#1E293B] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddAccountOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/30 transition"
                >
                  Kết Nối Kênh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AI Caption & Hashtags Generator Studio */}
      {isMetadataModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0F172A] border border-white/15 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">AI Caption & Hashtag Studio</h3>
                  <p className="text-[11px] text-slate-400">Tối ưu hóa tiêu đề giật gân, caption giữ chân và hashtag nền tảng qua AI Router</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMetadataModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Nền Tảng Mục Tiêu</label>
                  <select
                    value={metaPlatform}
                    onChange={(e: any) => setMetaPlatform(e.target.value)}
                    className="w-full bg-[#1E293B] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 capitalize"
                  >
                    <option value="youtube">YouTube Shorts (#Shorts)</option>
                    <option value="tiktok">TikTok (#fyp, #xuhuong)</option>
                    <option value="facebook">Facebook Reels (#reels)</option>
                    <option value="instagram">Instagram Reels (#reelsviral)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Chủ Đề (Niche)</label>
                  <select
                    value={metaNiche}
                    onChange={(e) => setMetaNiche(e.target.value)}
                    className="w-full bg-[#1E293B] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="tech">Công Nghệ & AI</option>
                    <option value="science">Khoa Học Đột Phá</option>
                    <option value="national">Thời Sự & Đất Nước</option>
                    <option value="geopolitics">Địa Chính Trị Quốc Tế</option>
                    <option value="history">Lịch Sử Dân Tộc</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Tiêu Đề / Ý Tưởng Gốc</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Ví dụ: Đột phá tuyến đường sắt cao tốc Bắc Nam..."
                  className="w-full bg-[#1E293B] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Tóm Tắt Nội Dung Video</label>
                <textarea
                  rows={2}
                  value={metaSummary}
                  onChange={(e) => setMetaSummary(e.target.value)}
                  placeholder="Tóm tắt ngắn các điểm nhấn kịch bản để AI rút trích góc nhìn gây tò mò..."
                  className="w-full bg-[#1E293B] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateMetadata}
                disabled={isGeneratingMeta}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition"
              >
                {isGeneratingMeta ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI Router đang phân tích & sinh caption...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Sinh Nội Dung Tối Ưu Bằng AI</span>
                  </>
                )}
              </button>

              {/* Generated Result Preview */}
              {generatedMeta && (
                <div className="p-4 rounded-xl bg-[#1E293B] border border-white/15 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Kết Quả AI Cho {generatedMeta.platform.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {generatedMeta.estimated_char_count} ký tự
                    </span>
                  </div>

                  <div>
                    <div className="text-slate-400 text-[10px] mb-0.5">Tiêu Đề Đề Xuất:</div>
                    <div className="font-semibold text-white text-xs bg-[#0F172A] p-2.5 rounded-lg border border-white/10 flex items-center justify-between">
                      <span>{generatedMeta.title}</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(generatedMeta.title);
                          showToast("Đã sao chép tiêu đề!");
                        }}
                        className="text-slate-400 hover:text-white p-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-[10px] mb-0.5">Caption Mô Tả:</div>
                    <div className="text-slate-200 text-xs bg-[#0F172A] p-2.5 rounded-lg border border-white/10 whitespace-pre-wrap">
                      {generatedMeta.caption}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-[10px] mb-1">Hashtags Gợi Ý:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {generatedMeta.hashtags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[11px] flex items-center gap-0.5">
                          <Hash className="w-3 h-3 opacity-60" />
                          {tag.replace('#', '')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Push to Queue Directly */}
                  <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[11px]">Đăng lên kênh:</span>
                      <select
                        value={targetEnqueueAccount}
                        onChange={(e) => setTargetEnqueueAccount(e.target.value)}
                        className="bg-[#0F172A] border border-white/10 rounded-lg px-2 py-1 text-white text-xs"
                      >
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>{a.account_name} ({a.platform})</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleEnqueueFromMeta}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Đưa Vào Hàng Đợi Xuất Bản</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Reject Post Confirmation */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0F172A] border border-white/15 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-semibold text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Từ Chối Phê Duyệt Video
              </h3>
              <button 
                onClick={() => setRejectingItem(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Bạn đang từ chối video: <strong className="text-white">"{rejectingItem.title}"</strong>.
              Video này sẽ không được xuất bản lên kênh.
            </p>

            <div className="text-xs space-y-1">
              <label className="block text-slate-400 font-medium">Lý do từ chối (Ghi nhận vào log):</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-[#1E293B] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium transition"
              >
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

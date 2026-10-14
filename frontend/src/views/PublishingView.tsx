import { useState } from 'react';
import { 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Plus
} from 'lucide-react';
import { MOCK_ACCOUNTS } from '../data/mockData';

export const PublishingView: React.FC = () => {
  const [approvalMode, setApprovalMode] = useState<'SEMI_AUTO' | 'FULL_AUTO'>('SEMI_AUTO');
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Simulated queue items
  const [queueItems, setQueueItems] = useState([
    {
      id: 'post-001',
      title: 'Cuộc Đua Siêu Chip Bán Dẫn 2nm: Ai Sẽ Thống Trị Kỷ Nguyên AI?',
      platform: 'youtube',
      account: 'TechBytes Shorts VN',
      scheduled_time: 'Hôm nay lúc 20:00 (GMT+7)',
      status: 'QUEUED',
      idempotency_key: 'idem-yt-2nm-chip-20261014-a9b',
      needs_approval: true
    },
    {
      id: 'post-002',
      title: 'Top 3 Đột Phá AI Thay Đổi Ngành Y Tế Toàn Cầu',
      platform: 'tiktok',
      account: 'Kênh Khám Phá Công Nghệ',
      scheduled_time: 'Hôm nay lúc 21:30 (GMT+7)',
      status: 'PUBLISHED',
      idempotency_key: 'idem-tt-med-ai-20261014-f41',
      post_url: 'https://tiktok.com/@khamphacongnghe/video/demo',
      needs_approval: false
    },
    {
      id: 'post-003',
      title: 'Bí Mật Bên Trong Cỗ Máy Quang Khắc EUV 350 Triệu USD',
      platform: 'facebook',
      account: 'Reels Công Nghệ Tương Lai',
      scheduled_time: 'Ngày mai lúc 11:30 (GMT+7)',
      status: 'PUBLISH_RESULT_UNKNOWN',
      idempotency_key: 'idem-fb-euv-machine-20261014-c12',
      needs_approval: false
    }
  ]);

  const handleReconcile = (id: string) => {
    setReconcilingId(id);
    setToastMessage(`Đang đối chiếu trạng thái từ API nền tảng cho tác vụ ${id}...`);

    setTimeout(() => {
      setReconcilingId(null);
      setQueueItems(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, status: 'PUBLISHED', post_url: 'https://facebook.com/reel/verified' };
        }
        return item;
      }));
      setToastMessage("Đối soát thành công! Bài đăng đã được Facebook xác nhận tiếp nhận an toàn.");
      setTimeout(() => setToastMessage(null), 3500);
    }, 1500);
  };

  const handleApprove = (id: string) => {
    setQueueItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, needs_approval: false, status: 'QUEUED' };
      }
      return item;
    }));
    setToastMessage(`Đã phê duyệt video ${id}! Bài đăng sẽ được xuất bản đúng giờ lên kênh.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-indigo-600 text-white text-xs font-medium shadow-2xl flex items-center space-x-3 border border-indigo-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Policy Switch */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <Send className="w-5 h-5 text-indigo-400" />
            Quản Trị Mạng Lưới Kênh & Hàng Đợi Xuất Bản
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Điều phối lịch đăng đa kênh (YouTube Shorts, TikTok, Facebook Reels). Hỗ trợ khóa Idempotency chống đăng trùng và cơ chế đối soát (Reconciliation).
          </p>
        </div>

        {/* Human-in-the-loop Mode Toggle */}
        <div className="flex items-center space-x-2 bg-[#1E293B] p-1.5 rounded-xl border border-white/10 shrink-0 text-xs">
          <button
            onClick={() => setApprovalMode('SEMI_AUTO')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              approvalMode === 'SEMI_AUTO'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Chế độ A: Bán Tự Động (Duyệt Tay)
          </button>
          <button
            onClick={() => setApprovalMode('FULL_AUTO')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              approvalMode === 'FULL_AUTO'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Chế độ B: Full-Auto Có Kiểm Soát
          </button>
        </div>
      </div>

      {/* Connected Channels Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Tài Khoản Mạng Xã Hội Đã Kết Nối ({MOCK_ACCOUNTS.length})</h3>
          <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Thêm Kênh Mới
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MOCK_ACCOUNTS.map((acc) => (
            <div
              key={acc.id}
              className="p-4 rounded-xl bg-[#0F172A] border border-white/10 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs uppercase ${
                  acc.platform === 'youtube' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                  acc.platform === 'tiktok' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                  'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                  {acc.platform.slice(0, 2)}
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-white">{acc.account_name}</div>
                  <div className="text-slate-400 text-[11px] font-mono">{acc.handle}</div>
                </div>
              </div>

              <div>
                {acc.status === 'ACTIVE' ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Đã Kết Nối
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Cần Cấp Lại Token
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Publishing Queue Table */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Hàng Đợi Xuất Bản & Lịch Trình (Publishing Queue)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Bảo đảm nguyên tắc Idempotency: Không tự đăng trùng lặp bài viết khi mạng gián đoạn</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="py-2.5 px-3 font-medium">Video / Tiêu đề</th>
                <th className="py-2.5 px-3 font-medium">Kênh Đích</th>
                <th className="py-2.5 px-3 font-medium">Lịch Đăng</th>
                <th className="py-2.5 px-3 font-medium">Idempotency Key</th>
                <th className="py-2.5 px-3 font-medium">Trạng Thái</th>
                <th className="py-2.5 px-3 font-medium text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {queueItems.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition">
                  <td className="py-3 px-3 max-w-xs">
                    <div className="font-semibold text-white truncate">{item.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.id}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    <span className="capitalize font-medium">{item.platform}</span>
                    <div className="text-[10px] text-slate-400">{item.account}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                    {item.scheduled_time}
                  </td>
                  <td className="py-3 px-3 font-mono text-[10px] text-indigo-300 truncate max-w-[120px]">
                    {item.idempotency_key}
                  </td>
                  <td className="py-3 px-3">
                    {item.status === 'PUBLISHED' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        Đã Xuất Bản
                      </span>
                    )}
                    {item.status === 'QUEUED' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                        Trong Hàng Đợi
                      </span>
                    )}
                    {item.status === 'PUBLISH_RESULT_UNKNOWN' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" /> Chưa Rõ Kết Quả
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {item.needs_approval ? (
                      <button
                        onClick={() => handleApprove(item.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition"
                      >
                        Phê Duyệt
                      </button>
                    ) : item.status === 'PUBLISH_RESULT_UNKNOWN' ? (
                      <button
                        onClick={() => handleReconcile(item.id)}
                        disabled={reconcilingId === item.id}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs flex items-center gap-1 ml-auto transition"
                      >
                        <RefreshCw className={`w-3 h-3 ${reconcilingId === item.id ? 'animate-spin' : ''}`} />
                        <span>Đối Soát API</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500">Hoàn tất</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

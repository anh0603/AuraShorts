import { 
  Menu, 
  AlertTriangle, 
  Link2
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenQuickCreate?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onToggleCollapse,
  onOpenQuickCreate
}) => {
  const getTabTitle = (tab: string) => {
    switch(tab) {
      case 'dashboard': return { title: 'Bảng Điều Khiển Tổng Quan', sub: 'Giám sát pipeline sản xuất video và trạng thái AI Router' };
      case 'exported-videos': return { title: 'Quản Lý Video Đã Xuất & Lịch Đăng YouTube', sub: 'Theo dõi tiến trình render, xem lại video 9:16, tự động đăng kênh YouTube và tự động dọn dẹp file sau 1h' };
      case 'url-to-video': return { title: 'Tạo Kịch Bản Từ Link Bài Báo (Thủ Công)', sub: 'Dán link báo để AI trích xuất dữ kiện và tạo kịch bản 9:16' };
      case 'studio': return { title: 'Video Studio 9:16', sub: 'Biên tập phân cảnh, xem trước phụ đề Karaoke và render video' };
      case 'ai-providers': return { title: 'AI Provider Manager', sub: 'Quản trị mô hình AI, định tuyến tự động và kiểm soát Quota 0đ' };
      case 'trends': return { title: 'Săn Xu Hướng Tự Động (AI Radar)', sub: 'Hệ thống tự động quét RSS, phát hiện đề tài nóng theo ngách' };
      case 'publishing': return { title: 'Quản Trị Kênh & Hàng Đợi Xuất Bản', sub: 'Lịch đăng đa nền tảng, chống đăng trùng Idempotent' };
      default: return { title: 'AuraShorts OS', sub: 'Hệ thống tự động hóa sản xuất video ngắn' };
    }
  };

  const info = getTabTitle(currentTab);

  return (
    <header className="h-16 px-6 border-b border-white/10 bg-[#0F172A]/70 backdrop-blur-xl flex items-center justify-between sticky top-0 z-10">
      {/* Left: Collapse toggle + Breadcrumb Title */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={onToggleCollapse}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
          title="Thu gọn/Mở rộng Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
            {info.title}
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            {info.sub}
          </p>
        </div>
      </div>

      {/* Right: Quick actions + Quota Alert Chip + Admin Profile */}
      <div className="flex items-center space-x-3">
        {/* Defensive UX Quota Alert Badge */}
        <div className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 backdrop-blur-sm">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>OpenRouter 429: Fallback sang Groq Cloud hoạt động trơn tru</span>
        </div>

        {/* Quick Action Button: Links straight to URL to Video */}
        {onOpenQuickCreate && (
          <button 
            onClick={onOpenQuickCreate}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dán Link Bài Báo</span>
          </button>
        )}

        {/* User Status / Role */}
        <div className="flex items-center space-x-2 pl-3 border-l border-white/10">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
            AD
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-200">Admin Operator</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

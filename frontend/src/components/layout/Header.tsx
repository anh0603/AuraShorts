import React from 'react';
import { 
  Menu, 
  AlertTriangle, 
  Sparkles
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
      case 'dashboard': return { title: 'Bảng Điều Khiển Tổng Quan', sub: 'Giám sát pipeline sản xuất video và hạn mức AI' };
      case 'studio': return { title: 'Video Studio 9:16', sub: 'Biên tập kịch bản, đối chiếu tư liệu bản quyền và render video' };
      case 'ai-providers': return { title: 'AI Provider Manager', sub: 'Quản trị mô hình AI, định tuyến tự động và kiểm soát Quota' };
      case 'trends': return { title: 'Săn Xu Hướng & Tin Tức', sub: 'Tổng hợp nguồn tin RSS, kiểm chứng claim và sinh đề tài' };
      case 'publishing': return { title: 'Quản Trị Kênh & Hàng Đợi Xuất Bản', sub: 'Lịch đăng đa nền tảng, cơ chế chống đăng trùng Idempotent' };
      default: return { title: 'AuraShorts OS', sub: 'Hệ thống tự động hóa sản xuất video ngắn' };
    }
  };

  const info = getTabTitle(currentTab);

  return (
    <header className="h-16 px-6 border-b border-white/10 bg-[#0F172A]/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
      {/* Left: Collapse toggle + Breadcrumb Title */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={onToggleCollapse}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
          title="Thu gọn/Mở rộng Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            {info.title}
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block">
            {info.sub}
          </p>
        </div>
      </div>

      {/* Right: Quick actions + Quota Alert Chip + Admin Profile */}
      <div className="flex items-center space-x-3">
        {/* Defensive UX Quota Alert Badge */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>OpenRouter 429: Fallback sang Groq Cloud hoạt động tốt</span>
        </div>

        {/* Quick Action Button */}
        {onOpenQuickCreate && (
          <button 
            onClick={onOpenQuickCreate}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tạo Video Mới</span>
          </button>
        )}

        {/* User Status / Role */}
        <div className="flex items-center space-x-2 pl-3 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-semibold text-indigo-400">
            AD
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-medium text-slate-200">Admin Operator</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Local Workspace
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

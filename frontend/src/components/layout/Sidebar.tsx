import { 
  LayoutDashboard, 
  Clapperboard, 
  Cpu, 
  TrendingUp, 
  Send, 
  ShieldCheck, 
  Layers, 
  Activity,
  Link2,
  Film
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Tổng Quan Hệ Thống',
      shortLabel: 'Tổng quan',
      icon: LayoutDashboard,
      badge: 'Live'
    },
    {
      id: 'exported-videos',
      label: 'Video Đã Xuất',
      subtext: 'Tiến trình render & Lịch YouTube',
      shortLabel: 'Đã xuất',
      icon: Film,
      badge: 'Mới 🎬',
      isHighlight: true
    },
    {
      id: 'url-to-video',
      label: 'Tạo Kịch Bản Từ Link',
      subtext: 'Dán link bài báo / tin tức',
      shortLabel: 'Dán Link',
      icon: Link2,
      badge: 'Auto'
    },
    {
      id: 'trends',
      label: 'Săn Xu Hướng (AI Radar)',
      shortLabel: 'Xu hướng',
      icon: TrendingUp,
      badge: 'Auto'
    },
    {
      id: 'ai-providers',
      label: 'AI Provider Manager',
      shortLabel: 'AI Router',
      icon: Cpu,
      badge: 'Free Tier'
    },
    {
      id: 'publishing',
      label: 'Hàng Đợi & Kênh MCN',
      shortLabel: 'Xuất bản',
      icon: Send,
      badge: '3 Kênh'
    }
  ];

  return (
    <aside 
      className={`${collapsed ? 'w-20' : 'w-72'} transition-all duration-300 ease-in-out border-r border-white/10 bg-[#0F172A]/80 backdrop-blur-xl flex flex-col shrink-0 min-h-screen z-20`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25">
            <Clapperboard className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                AuraShorts <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">OS</span>
              </span>
              <span className="text-[11px] text-slate-400 truncate">AI Video Automation</span>
            </div>
          )}
        </div>
      </div>

      {/* Free Routing Indicator Banner */}
      {!collapsed && (
        <div className="mx-3 mt-4 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs backdrop-blur-sm">
          <div className="flex items-center space-x-2 text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="font-medium text-[11px]">Chế độ: FREE_ONLY</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
      )}

      {/* Main Navigation Links */}
      <nav className="p-3 space-y-1.5 flex-1">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">
          {!collapsed ? 'Menu Tác Nghiệp' : '---'}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-3.5'} py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                  : item.isHighlight
                  ? 'text-cyan-300 hover:text-white bg-cyan-950/20 hover:bg-cyan-900/30 border border-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-white' : item.isHighlight ? 'text-cyan-400' : 'text-slate-400'
                }`} />
                {!collapsed && (
                  <div className="text-left truncate">
                    <div className="truncate">{item.label}</div>
                  </div>
                )}
              </div>
              {!collapsed && item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : item.isHighlight
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-slate-800 text-slate-300 border border-white/5'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Workers Footer */}
      <div className="p-3 border-t border-white/10 bg-[#0B1322]/80 backdrop-blur-md">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" /> Worker Celery
              </span>
              <span className="text-emerald-400 font-mono text-[11px]">2 Online</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" /> Video Pipeline
              </span>
              <span className="text-cyan-400 font-mono text-[11px]">FFmpeg 7.0</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="System Ready"></span>
          </div>
        )}
      </div>
    </aside>
  );
};

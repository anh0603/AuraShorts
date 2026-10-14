import React from 'react';
import { 
  LayoutDashboard, 
  Clapperboard, 
  Cpu, 
  TrendingUp, 
  Send, 
  ShieldCheck, 
  Layers, 
  Activity
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
      id: 'studio',
      label: 'Video Studio (9:16)',
      shortLabel: 'Studio',
      icon: Clapperboard,
      badge: 'Editor'
    },
    {
      id: 'ai-providers',
      label: 'AI Provider Manager',
      shortLabel: 'AI Router',
      icon: Cpu,
      badge: 'Free Tier'
    },
    {
      id: 'trends',
      label: 'Săn Xu Hướng & Niche',
      shortLabel: 'Xu hướng',
      icon: TrendingUp
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
      className={`${collapsed ? 'w-20' : 'w-64'} transition-all duration-300 ease-in-out border-r border-white/10 bg-[#0F172A] flex flex-col shrink-0 min-h-screen z-20`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
            <Clapperboard className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                AuraShorts <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">OS</span>
              </span>
              <span className="text-[11px] text-slate-400 truncate">AI Video Automation</span>
            </div>
          )}
        </div>
      </div>

      {/* Free Routing Indicator Banner */}
      {!collapsed && (
        <div className="mx-3 mt-4 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="font-medium text-[11px]">Chế độ: FREE_ONLY</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
      )}

      {/* Main Navigation Links */}
      <nav className="p-3 space-y-1.5 flex-1">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1">
          {!collapsed ? 'Menu Tác Nghiệp' : '---'}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!collapsed && <span>{item.label}</span>}
              </div>
              {!collapsed && item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  isActive 
                    ? 'bg-white/20 text-white' 
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
      <div className="p-3 border-t border-white/10 bg-[#0B1322]/80">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" /> Worker Celery/Redis
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

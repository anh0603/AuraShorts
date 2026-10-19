import React, { useState, useEffect } from 'react';
import { Sparkles, X, Link2, Mic, Zap, Calendar, Rocket, Newspaper } from 'lucide-react';
import { PublishingApi, type ApiSocialAccount } from '../services/api';
import type { TrendTopic } from '../types';

const Youtube: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export interface CreateVideoModalSubmitParams {
  url: string;
  accountId: string;
  voicePreset: string;
  scheduleOption: 'immediate' | 'custom';
  customDateTime: string;
  topic?: TrendTopic | null;
}

export interface CreateVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic?: TrendTopic | null;
  initialUrl?: string;
  accounts?: ApiSocialAccount[];
  onSubmit: (params: CreateVideoModalSubmitParams) => Promise<void> | void;
  isSubmitting?: boolean;
}

const SAMPLE_ARTICLES = [
  {
    label: 'Thời Sự Quốc Gia: Cao Tốc & Đường Sắt',
    url: 'https://baochinhphu.vn/thong-xe-toan-tuyen-cao-toc-bac-nam-va-duong-sat-toc-do-cao-102261015.htm',
    title: 'Đột phá hạ tầng quốc gia: Hoàn thành trục xương sống kết nối kinh tế toàn diện đất nước',
    publisher: 'Cổng Thông Tin Điện Tử Chính Phủ & TTXVN'
  },
  {
    label: 'Khoa Học & Đột Phá: Pin Thể Rắn 1.000km',
    url: 'https://vnexpress.net/oto-dien-pin-the-ran-chay-1000km-moi-lan-sac-4792101.html',
    title: 'Đột phá xe điện chạy 1.000km một lần sạc nhờ pin thể rắn thế hệ mới',
    publisher: 'VnExpress Khoa Học'
  },
  {
    label: 'Y Tế & Đời Sống: AI Phát Hiện Ung Thư',
    url: 'https://tuoitre.vn/ai-phat-hien-som-ung-thu-truoc-3-nam-20261014.htm',
    title: 'AI phát hiện sớm tế bào ung thư trước 3 năm so với chẩn đoán truyền thống',
    publisher: 'Tuổi Trẻ Online'
  }
];

export const CreateVideoModal: React.FC<CreateVideoModalProps> = ({
  isOpen,
  onClose,
  topic,
  initialUrl = '',
  accounts: propAccounts,
  onSubmit,
  isSubmitting = false
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [loadedAccounts, setLoadedAccounts] = useState<ApiSocialAccount[]>(propAccounts || []);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [voicePreset, setVoicePreset] = useState('vi-VN-NamMinhNeural-news');
  const [scheduleOption, setScheduleOption] = useState<'immediate' | 'custom'>('immediate');
  const [customDateTime, setCustomDateTime] = useState('');

  // Fetch accounts if not passed
  useEffect(() => {
    if (propAccounts && propAccounts.length > 0) {
      setLoadedAccounts(propAccounts);
      const yt = propAccounts.find(a => a.platform === 'youtube') || propAccounts[0];
      if (yt) setSelectedAccountId(yt.id);
    } else {
      PublishingApi.getAccounts().then(res => {
        if (res.success && res.data && res.data.length > 0) {
          setLoadedAccounts(res.data);
          const yt = res.data.find((a: any) => a.platform === 'youtube') || res.data[0];
          if (yt) setSelectedAccountId(yt.id);
        }
      }).catch(console.warn);
    }
  }, [propAccounts, isOpen]);

  // Sync initial values when modal opens or topic changes
  useEffect(() => {
    if (isOpen) {
      if (topic) {
        const topicUrl = topic.url || (topic.primary_publisher ? `https://${topic.primary_publisher.toLowerCase().replace(/[^a-z0-9]/g, '')}.vn/tin-tuc/${topic.id}` : topic.title);
        setUrlInput(topicUrl);
      } else if (initialUrl) {
        setUrlInput(initialUrl);
      } else {
        setUrlInput('');
      }

      // Default custom datetime to +2 hours
      const nextTime = new Date(Date.now() + 2 * 3600 * 1000);
      setCustomDateTime(nextTime.toISOString().slice(0, 16));
    }
  }, [isOpen, topic, initialUrl]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      url: urlInput.trim(),
      accountId: selectedAccountId,
      voicePreset,
      scheduleOption,
      customDateTime,
      topic
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0B1120] border border-indigo-500/40 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-fade-in relative max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Tạo Video Mới & Tự Động Render 9:16</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Auto Pipeline</span>
              </h3>
              <p className="text-xs text-slate-400">
                Bấm tạo sẽ tự động render âm thanh & hình ảnh, tiến trình hiển thị trực tiếp với vòng xoay quanh ô video
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Topic Highlight (if opened from Trends / Radar) */}
        {topic && (
          <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-cyan-300 mt-0.5 shrink-0">
              <Newspaper className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-500/30">
                  Bài Báo Từ Radar Xu Hướng
                </span>
                <span className="text-[11px] text-slate-400">Nguồn: {topic.primary_publisher}</span>
              </div>
              <div className="font-bold text-white truncate text-xs sm:text-sm">{topic.title}</div>
              <div className="text-slate-400 text-[11px] line-clamp-1 mt-0.5">{topic.summary}</div>
            </div>
          </div>
        )}

        {/* Step 1: Article Link */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Link2 className="w-4 h-4 text-cyan-400" />
            <span>Đường Dẫn Bài Báo / Tin Tức Nguồn:</span>
          </label>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Dán link bài báo (VnExpress, Tuổi Trẻ, Báo Chính Phủ, Zing News...)"
            className="w-full px-3.5 py-2.5 bg-[#070B14] border border-white/10 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition"
          />

          {/* Sample Quick Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-400">Tin mẫu 1 click:</span>
            {SAMPLE_ARTICLES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setUrlInput(sample.url)}
                className="text-[10px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-300 border border-white/10 transition"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Setup Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Option 1: Channel */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Youtube className="w-4 h-4 text-red-500" />
              <span>Kênh YouTube Đăng Tải:</span>
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#070B14] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {loadedAccounts.length > 0 ? (
                loadedAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_name} ({acc.platform})
                  </option>
                ))
              ) : (
                <option value="">TechBytes Shorts VN (MCN Mặc định)</option>
              )}
            </select>
          </div>

          {/* Option 2: AI Neural Voice */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-cyan-400" />
              <span>Giọng Đọc AI Neural (Edge-TTS):</span>
            </label>
            <select
              value={voicePreset}
              onChange={(e) => setVoicePreset(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#070B14] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <optgroup label="Nam Minh (Giọng Nam)">
                <option value="vi-VN-NamMinhNeural-news">🎙️ Nam Minh [NAM] - Tin Tức Chính Luận (Chuẩn VTV)</option>
                <option value="vi-VN-NamMinhNeural-drama">🎙️ Nam Minh [NAM] - Thời Sự Nóng Hổi & Kịch Tính</option>
                <option value="vi-VN-NamMinhNeural-tech">🎙️ Nam Minh [NAM] - Công Nghệ & Khám Phá</option>
              </optgroup>
              <optgroup label="Hoài My (Giọng Nữ)">
                <option value="vi-VN-HoaiMyNeural-news">🎙️ Hoài My [NỮ] - Tự Nhiên & Thời Sự</option>
                <option value="vi-VN-HoaiMyNeural-inspire">🎙️ Hoài My [NỮ] - Truyền Cảm Hứng & Sách Nói</option>
              </optgroup>
            </select>
          </div>

          {/* Option 3: Subtitle Style */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Hiệu Ứng Chữ Subtitle:</span>
            </label>
            <div className="p-2.5 bg-[#070B14] border border-white/10 rounded-xl text-xs text-amber-300 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>TikTok Pop-in Jump (Nhảy chữ 135% ➔ 100%)</span>
            </div>
          </div>

          {/* Option 4: Schedule */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>Lịch Đăng YouTube:</span>
            </label>
            <select
              value={scheduleOption}
              onChange={(e) => setScheduleOption(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-[#070B14] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="immediate">⚡ Đăng ngay khi render xong 100%</option>
              <option value="custom">📅 Hẹn ngày giờ cụ thể</option>
            </select>
          </div>
        </div>

        {/* Custom Datetime Input if selected */}
        {scheduleOption === 'custom' && (
          <div className="pt-1">
            <label className="text-xs text-slate-300 block mb-1">Chọn ngày & giờ phát sóng:</label>
            <input
              type="datetime-local"
              value={customDateTime}
              onChange={(e) => setCustomDateTime(e.target.value)}
              className="w-full sm:w-72 px-3 py-2 bg-[#070B14] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Video 1080x1920 (9:16) nén 25 FPS, phụ đề Pop-in đồng bộ tuyệt đối.
          </span>
          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/5 transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Rocket className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang Khởi Tạo...' : 'Bắt Đầu Tạo Video'}</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

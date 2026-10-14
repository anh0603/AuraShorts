import { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  Sliders, 
  Layers, 
  Plus, 
  Save, 
  Send, 
  Upload, 
  Eye, 
  Music,
  Mic
} from 'lucide-react';
import type { VideoProject } from '../types';

interface VideoStudioViewProps {
  project: VideoProject;
  onUpdateProject: (updated: VideoProject) => void;
  onOpenPublishing: () => void;
}

export const VideoStudioView: React.FC<VideoStudioViewProps> = ({
  project,
  onUpdateProject,
  onOpenPublishing
}) => {
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [showSafeZone, setShowSafeZone] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [renderToast, setRenderToast] = useState<string | null>(null);
  const [voiceSpeed, setVoiceSpeed] = useState(1.1);
  const [selectedTemplate, setSelectedTemplate] = useState('News Explainer');

  // Selected scene
  const activeScene = project.scenes[selectedSceneIndex] || project.scenes[0];

  // Simulated total duration
  const totalDuration = project.scenes.reduce((acc, sc) => acc + sc.estimated_duration_seconds, 0);

  // Playback timer simulation
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentPlaybackTime(prev => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          const next = prev + 0.5;
          // Auto switch active scene based on playback
          let accumulated = 0;
          for (let i = 0; i < project.scenes.length; i++) {
            accumulated += project.scenes[i].estimated_duration_seconds;
            if (next <= accumulated) {
              setSelectedSceneIndex(i);
              break;
            }
          }
          return next;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalDuration, project.scenes]);

  const handleUpdateSceneText = (text: string) => {
    const updatedScenes = [...project.scenes];
    updatedScenes[selectedSceneIndex] = {
      ...updatedScenes[selectedSceneIndex],
      text
    };
    onUpdateProject({
      ...project,
      scenes: updatedScenes
    });
  };

  const handleRegenerateScene = (index: number) => {
    setIsRendering(true);
    setRenderToast(`Đang gọi Gemini 1.5 Flash tạo lại kịch bản cho Phân cảnh 0${index + 1}...`);
    setTimeout(() => {
      setIsRendering(false);
      setRenderToast(`Phân cảnh 0${index + 1} đã được cập nhật lời bình mới!`);
      setTimeout(() => setRenderToast(null), 3500);
    }, 1200);
  };

  const handleRenderVideo = () => {
    setIsRendering(true);
    setRenderToast("Bắt đầu render video với FFmpeg 7.0 (Audio Mixing + Subtitles Burn-in)...");
    setTimeout(() => {
      setIsRendering(false);
      setRenderToast("Render video 1080x1920 thành công! Artifact sẵn sàng xuất bản.");
      setTimeout(() => setRenderToast(null), 4000);
    }, 2500);
  };

  // Split text for karaoke simulation
  const words = activeScene.text.split(' ');
  const activeWordIndex = Math.min(
    Math.floor((currentPlaybackTime % activeScene.estimated_duration_seconds) / (activeScene.estimated_duration_seconds / words.length)),
    words.length - 1
  );

  return (
    <div className="space-y-4">
      {/* Toast Notification Alert */}
      {renderToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-indigo-600 text-white text-xs font-medium shadow-2xl flex items-center space-x-3 border border-indigo-400 animate-fade-in">
          <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
          <span>{renderToast}</span>
        </div>
      )}

      {/* Studio Top Control Bar */}
      <div className="p-4 rounded-xl bg-[#0F172A] border border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            9:16 VERTICAL
          </span>
          <h2 className="text-sm font-semibold text-white truncate max-w-md">
            {project.title}
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 shrink-0">
            {project.status}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleUpdateSceneText(activeScene.text)}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-medium border border-white/10 flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5 text-indigo-400" />
            <span>Lưu Kịch Bản</span>
          </button>

          <button
            onClick={handleRenderVideo}
            disabled={isRendering}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRendering ? 'Đang Render FFmpeg...' : 'Render Video Lại'}</span>
          </button>

          <button
            onClick={onOpenPublishing}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Duyệt & Đăng Kênh</span>
          </button>
        </div>
      </div>

      {/* 3-Pane Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ========================================================
            LEFT PANE: Storyboard & Scenes List (4 Cols)
           ======================================================== */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-[#0F172A] border border-white/10 space-y-4 max-h-[820px] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Danh Sách Phân Cảnh (Storyboard)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {project.scenes.length} cảnh • Tổng {totalDuration}s • Định dạng Shorts
              </p>
            </div>
            <button 
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1 border border-white/5"
              title="Thêm phân cảnh mới"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scene Cards */}
          <div className="space-y-3">
            {project.scenes.map((scene, idx) => {
              const isSelected = idx === selectedSceneIndex;
              const hasRestrictedMedia = scene.media_candidate?.rights_status === 'RESTRICTED';
              const needsReviewMedia = scene.media_candidate?.rights_status === 'NEEDS_REVIEW';

              return (
                <div
                  key={scene.id}
                  onClick={() => setSelectedSceneIndex(idx)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1E293B] border-indigo-500 shadow-md shadow-indigo-500/10'
                      : 'bg-[#162032]/60 border-white/5 hover:bg-[#1E293B]/70 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}>
                        CẢNH 0{scene.order}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ~{scene.estimated_duration_seconds}s
                      </span>
                    </div>

                    {/* Rights pill */}
                    <div className="flex items-center space-x-1">
                      {scene.media_candidate?.rights_status === 'LICENSED' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Bản quyền OK
                        </span>
                      )}
                      {needsReviewMedia && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> Cần duyệt
                        </span>
                      )}
                      {hasRestrictedMedia && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                          <ShieldX className="w-3 h-3" /> Chặn
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Editable spoken text for current scene */}
                  {isSelected ? (
                    <div className="space-y-2 mt-2">
                      <label className="text-[11px] font-medium text-slate-300 block">Lời bình (Spoken Script):</label>
                      <textarea
                        value={scene.text}
                        onChange={(e) => handleUpdateSceneText(e.target.value)}
                        rows={3}
                        className="w-full p-2.5 rounded-lg bg-[#0B1322] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 leading-relaxed font-sans resize-none"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {scene.text}
                    </p>
                  )}

                  {/* Visual Intent & Keywords */}
                  <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate max-w-[200px] italic">
                      Visual: {scene.visual_intent}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRegenerateScene(idx);
                      }}
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px] font-medium shrink-0 ml-2"
                      title="Sinh lại lời bình và visual bằng AI"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Tạo lại</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================
            CENTER PANE: 9:16 Vertical Preview Frame (4 Cols)
           ======================================================== */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-[#0F172A] border border-white/10 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3 text-xs text-slate-400">
            <span className="font-medium text-white flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-cyan-400" /> Khung Xem Trước (9:16)
            </span>
            <button
              onClick={() => setShowSafeZone(!showSafeZone)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                showSafeZone ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'bg-white/5 text-slate-400'
              }`}
            >
              {showSafeZone ? 'Ẩn Safe-Zone' : 'Hiện Safe-Zone TikTok'}
            </button>
          </div>

          {/* 9:16 Canvas Phone Frame */}
          <div className="relative w-[280px] sm:w-[310px] aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-2xl border-4 border-slate-800 flex flex-col justify-between">
            {/* Background Media */}
            <img
              src={activeScene.media_candidate?.thumbnail_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80'}
              alt={activeScene.visual_intent}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            />
            {/* Dark gradient for subtitle contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

            {/* Simulated Safe-Zone Overlays (Right Platform Actions) */}
            {showSafeZone && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
                {/* Top sound banner */}
                <div className="self-center px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[10px] text-white flex items-center gap-1 border border-white/10">
                  <Music className="w-3 h-3 text-indigo-400" />
                  <span>Âm thanh gốc - TechBytes VN</span>
                </div>

                {/* Right interaction column (Like, Comment, Share) */}
                <div className="self-end space-y-3 text-center text-white/90">
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-[10px] mx-auto">♥</div>
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-[10px] mx-auto">💬</div>
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-[10px] mx-auto">↗</div>
                </div>

                {/* Bottom title & safe margins */}
                <div className="space-y-1 mb-2">
                  <div className="text-[11px] font-bold text-white drop-shadow">@TechBytesVN</div>
                  <div className="text-[10px] text-white/80 line-clamp-1 drop-shadow">
                    #congnghe #chip2nm #ai #semiconductor
                  </div>
                </div>
              </div>
            )}

            {/* Karaoke Dynamic Subtitle Display (Positioned above bottom safe area) */}
            <div className="relative z-20 px-4 pb-20 text-center">
              <div className="inline-block bg-black/75 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 shadow-lg">
                <p className="text-xs sm:text-sm font-bold text-white tracking-wide leading-relaxed">
                  {words.map((word, wIdx) => {
                    const isWordActive = wIdx === activeWordIndex;
                    return (
                      <span
                        key={wIdx}
                        className={`transition-colors duration-150 inline-block mx-0.5 ${
                          isWordActive 
                            ? 'text-amber-400 scale-105 font-extrabold underline decoration-amber-400 underline-offset-4' 
                            : 'text-white'
                        }`}
                      >
                        {word}
                      </span>
                    );
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline Scrubber & Player Controls */}
          <div className="w-full mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>{Math.floor(currentPlaybackTime)}s</span>
              <span>{totalDuration}s</span>
            </div>

            {/* Progress bar */}
            <div 
              className="w-full h-2 rounded-full bg-slate-800 cursor-pointer overflow-hidden"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = clickX / rect.width;
                setCurrentPlaybackTime(ratio * totalDuration);
              }}
            >
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all"
                style={{ width: `${(currentPlaybackTime / totalDuration) * 100}%` }}
              />
            </div>

            {/* Player Buttons */}
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setCurrentPlaybackTime(0)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                title="Quay lại đầu"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                title={isPlaying ? 'Tạm dừng' : 'Phát'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================
            RIGHT PANE: Inspector, Media Rights & Audio Mix (4 Cols)
           ======================================================== */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-[#0F172A] border border-white/10 space-y-5">
          {/* Header */}
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Thuộc Tính Tư Liệu & Âm Thanh
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Đang chọn: Phân cảnh 0{activeScene.order}
            </p>
          </div>

          {/* Media Rights Inspector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Tư liệu hình ảnh:</span>
              <span className="text-[11px] font-mono text-cyan-400">
                Độ phù hợp: {activeScene.media_candidate?.relevance_score}/100
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#1E293B] border border-white/10 space-y-2.5">
              <div className="flex items-start space-x-3">
                <img
                  src={activeScene.media_candidate?.thumbnail_url}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0"
                />
                <div className="text-xs space-y-1 min-w-0">
                  <div className="font-medium text-white truncate">
                    {activeScene.media_candidate?.title}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Nguồn: {activeScene.media_candidate?.source}
                  </div>
                  <div className="text-[10px] font-mono text-indigo-300">
                    Giấy phép: {activeScene.media_candidate?.license_name}
                  </div>
                </div>
              </div>

              {/* Rights Verification Status */}
              <div className={`p-2 rounded-lg text-xs flex items-center justify-between ${
                activeScene.media_candidate?.rights_status === 'LICENSED'
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-950/40 text-amber-300 border border-amber-500/30'
              }`}>
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span className="font-semibold text-[11px]">
                    {activeScene.media_candidate?.rights_status === 'LICENSED' 
                      ? 'Quyền Sử Dụng: Hợp Pháp (Green)' 
                      : 'Quyền Sử Dụng: Cần Người Duyệt (Yellow)'}
                  </span>
                </div>
              </div>

              {/* Action: Replace Media */}
              <button className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 flex items-center justify-center gap-1.5 transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Thay Tư Liệu Cá Nhân / Duyệt Lại</span>
              </button>
            </div>
          </div>

          {/* Audio Mixing & Voice Profile */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <span className="text-xs font-medium text-slate-300 block">Cấu hình giọng đọc AI (TTS):</span>

            <div className="p-3 rounded-xl bg-[#1E293B] border border-white/10 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-indigo-400" /> Voice Profile:
                </span>
                <span className="text-white font-medium">Hoài My (Giọng Bắc Chuẩn)</span>
              </div>

              {/* Speed Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Tốc độ đọc:</span>
                  <span className="font-mono text-cyan-400">{voiceSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.05"
                  value={voiceSpeed}
                  onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Linear Audio Mix Percentages according to PROJECT.md Section 55 */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <span className="text-[11px] text-slate-400 block font-medium">Mức âm thanh tuyến tính (Mixing):</span>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="p-1.5 rounded bg-[#0F172A] border border-white/5">
                    <span className="text-slate-400 block">Lời đọc</span>
                    <span className="font-mono font-bold text-emerald-400">100%</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#0F172A] border border-white/5">
                    <span className="text-slate-400 block">Nhạc nền</span>
                    <span className="font-mono font-bold text-indigo-400">12%</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#0F172A] border border-white/5">
                    <span className="text-slate-400 block">SFX Whoosh</span>
                    <span className="font-mono font-bold text-cyan-400">40%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Template Selection */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <span className="text-xs font-medium text-slate-300 block">Video Template:</span>
            <div className="grid grid-cols-2 gap-2">
              {['News Explainer', 'Fast News', 'Tech Review', 'Top List'].map((tpl) => (
                <button
                  key={tpl}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`p-2 rounded-lg text-xs font-medium border text-left transition ${
                    selectedTemplate === tpl
                      ? 'bg-indigo-600/30 border-indigo-500 text-white'
                      : 'bg-[#1E293B] border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {tpl}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

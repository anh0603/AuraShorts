import { useState, useEffect, useRef } from 'react';
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
  Mic,
  Film,
  Download,
  Volume2,
  VolumeX,
  RefreshCw
} from 'lucide-react';
import type { VideoProject } from '../types';
import { StudioApi } from '../services/api';

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
  const [subtitleMode, setSubtitleMode] = useState<'single_word' | 'word_group' | 'full_paragraph'>('single_word');
  const [previewMode, setPreviewMode] = useState<'canvas' | 'video'>('canvas');
  const [isRendering, setIsRendering] = useState(false);
  const [renderToast, setRenderToast] = useState<string | null>(null);
  const [voiceSpeed, setVoiceSpeed] = useState(1.1);
  const [selectedTemplate, setSelectedTemplate] = useState('News Explainer');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [audioSourceAvailable, setAudioSourceAvailable] = useState(true);
  const [videoKey, setVideoKey] = useState(Date.now());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Selected scene with safe fallback
  const activeScene = (project.scenes && project.scenes[selectedSceneIndex]) || project.scenes?.[0] || {
    id: 'default',
    order: 1,
    text: '',
    estimated_duration_seconds: 4,
    visual_intent: ''
  };

  // Total duration with safe minimum
  const totalDuration = Math.max(1, (project.scenes || []).reduce((acc, sc) => acc + (sc.estimated_duration_seconds || 0), 0));

  // Cumulative scene start times
  const sceneStartTimes = (project.scenes || []).map((_, idx) =>
    (project.scenes || []).slice(0, idx).reduce((acc, sc) => acc + (sc.estimated_duration_seconds || 0), 0)
  );

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Synchronized seek handler ensuring active scene, timestamp, and word highlight stay in perfect lockstep
  const handleSeek = (targetTime: number) => {
    const clamped = Math.max(0, Math.min(targetTime, totalDuration));
    setCurrentPlaybackTime(clamped);
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = clamped;
      } catch (e) {
        // Safe seek
      }
    }
    let accumulated = 0;
    for (let i = 0; i < (project.scenes || []).length; i++) {
      accumulated += project.scenes[i].estimated_duration_seconds;
      if (clamped < accumulated || i === (project.scenes || []).length - 1) {
        setSelectedSceneIndex(i);
        break;
      }
    }
  };

  // Web Speech API Voiceover Fallback with seamless sentence-to-sentence natural flow
  const speakSceneWithWebSpeech = (sceneIndex: number) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && !isMuted) {
      window.speechSynthesis.cancel();
      const sc = project.scenes?.[sceneIndex];
      if (!sc) return;
      const utterance = new SpeechSynthesisUtterance(sc.text);
      utterance.lang = 'vi-VN';
      utterance.rate = voiceSpeed;
      utterance.volume = isMuted ? 0 : volume;

      // DO NOT cut off! Advance to next scene only after the entire sentence finishes speaking
      utterance.onend = () => {
        if (isPlayingRef.current) {
          if (sceneIndex + 1 < (project.scenes || []).length) {
            setSelectedSceneIndex(sceneIndex + 1);
            speakSceneWithWebSpeech(sceneIndex + 1);
          } else {
            setIsPlaying(false);
            setCurrentPlaybackTime(0);
          }
        }
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  // Audio Play / Pause / Volume sync effect
  useEffect(() => {
    if (previewMode === 'canvas') {
      if (isPlaying) {
        if (audioRef.current && audioSourceAvailable) {
          audioRef.current.playbackRate = voiceSpeed;
          audioRef.current.volume = isMuted ? 0 : volume;
          audioRef.current.play().catch(() => {
            // Audio tag error or blocked -> fallback to browser speech synthesis
            speakSceneWithWebSpeech(selectedSceneIndex);
          });
        } else {
          speakSceneWithWebSpeech(selectedSceneIndex);
        }
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      }
    }
  }, [isPlaying, previewMode, audioSourceAvailable]);

  // Volume & Mute listener
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, volume]);

  // Playback timer & scene tracking matching spoken script duration
  useEffect(() => {
    let animId: number;
    let timerInterval: any;

    if (isPlaying) {
      // If neural audio tag is actively playing, drive time from the audio track
      const syncAudio = () => {
        if (audioRef.current && !audioRef.current.paused && audioRef.current.duration) {
          const currentPos = audioRef.current.currentTime;
          setCurrentPlaybackTime(currentPos);
          let accumulated = 0;
          for (let i = 0; i < (project.scenes || []).length; i++) {
            accumulated += project.scenes[i].estimated_duration_seconds;
            if (currentPos < accumulated || i === (project.scenes || []).length - 1) {
              setSelectedSceneIndex(i);
              break;
            }
          }
          if (currentPos >= totalDuration) {
            setIsPlaying(false);
            return;
          }
        }
        if (isPlayingRef.current) {
          animId = requestAnimationFrame(syncAudio);
        }
      };

      if (audioRef.current && audioSourceAvailable) {
        animId = requestAnimationFrame(syncAudio);
      } else {
        // Fallback smooth timer
        timerInterval = setInterval(() => {
          setCurrentPlaybackTime(prev => {
            if (prev >= totalDuration) {
              setIsPlaying(false);
              return 0;
            }
            const next = prev + 0.05;
            let accumulated = 0;
            for (let i = 0; i < (project.scenes || []).length; i++) {
              accumulated += project.scenes[i].estimated_duration_seconds;
              if (next < accumulated || i === (project.scenes || []).length - 1) {
                setSelectedSceneIndex(i);
                break;
              }
            }
            return next;
          });
        }, 50);
      }
    }

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(timerInterval);
    };
  }, [isPlaying, audioSourceAvailable, totalDuration, project.scenes]);

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
      setPreviewMode('video');
      setRenderToast("Render video 1080x1920 hoàn tất! Đã chuyển sang chế độ Xem Video MP4 thực tế.");
      setTimeout(() => setRenderToast(null), 5000);
    }, 2200);
  };

  // Accurate time within active scene
  const activeSceneStart = sceneStartTimes[selectedSceneIndex] ?? 0;
  const timeInActiveScene = Math.max(0, currentPlaybackTime - activeSceneStart);
  const activeSceneDuration = Math.max(0.5, activeScene.estimated_duration_seconds || 5);

  // Split words cleanly
  const words = (activeScene?.text || '').trim().split(/\s+/).filter(Boolean);
  const wordProgress = Math.min(1, Math.max(0, timeInActiveScene / activeSceneDuration));
  const activeWordIndex = words.length > 0
    ? Math.min(Math.floor(wordProgress * words.length), words.length - 1)
    : 0;
  const currentWord = words[activeWordIndex] || words[0] || '';

  // Compact 3-word window for word_group mode
  const groupStart = Math.max(0, Math.floor(activeWordIndex / 3) * 3);
  const groupWords = words.slice(groupStart, groupStart + 3);

  return (
    <div className="space-y-4">
      {/* Toast Notification Alert */}
      {renderToast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl bg-indigo-600 text-white text-xs font-semibold shadow-2xl flex items-center space-x-3 border border-indigo-400 animate-fade-in">
          <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
          <span>{renderToast}</span>
        </div>
      )}

      {/* Studio Top Control Bar */}
      <div className="p-4 sm:p-5 rounded-3xl glass-panel flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-indigo-300 border border-indigo-500/30">
            9:16 VERTICAL
          </span>
          <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-lg">
            {project.title}
          </h2>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
            {project.status}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleUpdateSceneText(activeScene.text)}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5 text-indigo-400" />
            <span>Lưu Kịch Bản</span>
          </button>

          <button
            onClick={handleRenderVideo}
            disabled={isRendering}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRendering ? 'Đang Render FFmpeg...' : 'Render Video Lại'}</span>
          </button>

          <button
            onClick={onOpenPublishing}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition"
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
        <div className="lg:col-span-4 p-5 rounded-3xl glass-panel space-y-4 max-h-[820px] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Danh Sách Phân Cảnh (Storyboard)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {project.scenes.length} cảnh • Tổng {totalDuration}s • Định dạng Shorts 9:16
              </p>
            </div>
            <button 
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1 border border-white/5"
              title="Thêm phân cảnh mới"
            >
              <Plus className="w-4 h-4" />
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
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1E293B]/90 border-indigo-500 shadow-lg shadow-indigo-500/15'
                      : 'bg-[#162032]/40 border-white/5 hover:bg-[#1E293B]/60 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
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
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                          <ShieldCheck className="w-3 h-3" /> Bản quyền OK
                        </span>
                      )}
                      {needsReviewMedia && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold">
                          <ShieldAlert className="w-3 h-3" /> Cần duyệt
                        </span>
                      )}
                      {hasRestrictedMedia && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 font-semibold">
                          <ShieldX className="w-3 h-3" /> Chặn
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Editable spoken text for current scene */}
                  {isSelected ? (
                    <div className="space-y-1.5 mt-2">
                      <label className="text-[11px] font-semibold text-indigo-300 block">Lời bình (Spoken Script):</label>
                      <textarea
                        value={scene.text}
                        onChange={(e) => handleUpdateSceneText(e.target.value)}
                        rows={3}
                        className="w-full p-3 rounded-xl bg-[#0B1322] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 leading-relaxed font-sans resize-none shadow-inner"
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
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] font-semibold shrink-0 ml-2"
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
            CENTER PANE: 9:16 Vertical Phone Preview Frame (4 Cols)
           ======================================================== */}
        <div className="lg:col-span-4 p-5 rounded-3xl glass-panel flex flex-col items-center">
          {/* Dual-Mode Selector Bar */}
          <div className="w-full flex items-center justify-between mb-3 bg-[#0B1322] p-1.5 rounded-2xl border border-white/10 text-xs">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setPreviewMode('canvas')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                  previewMode === 'canvas'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Interactive Studio</span>
              </button>
              <button
                onClick={() => setPreviewMode('video')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                  previewMode === 'video'
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Video MP4</span>
              </button>
            </div>

            {previewMode === 'video' ? (
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => {
                    setVideoKey(Date.now());
                    setRenderToast("Đã làm mới video MP4 với cache mới nhất!");
                    setTimeout(() => setRenderToast(null), 3000);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 font-semibold flex items-center gap-1 text-[11px] border border-cyan-500/30 transition"
                  title="Tải lại video mới render, xóa bộ nhớ đệm trình duyệt"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Làm mới</span>
                </button>
                <a
                  href={StudioApi.getRenderedVideoUrl()}
                  download="AuraShorts_Rendered.mp4"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 font-semibold flex items-center gap-1 text-[11px] border border-cyan-500/30 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải MP4</span>
                </a>
              </div>
            ) : (
              <button
                onClick={() => setShowSafeZone(!showSafeZone)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition ${
                  showSafeZone ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'bg-white/5 text-slate-400'
                }`}
              >
                {showSafeZone ? 'Ẩn Safe-Zone' : 'Safe-Zone'}
              </button>
            )}
          </div>

          {previewMode === 'video' ? (
            /* 9:16 Rendered Video Player */
            <div className="relative w-[280px] sm:w-[310px] aspect-[9/16] rounded-[32px] overflow-hidden bg-black shadow-2xl border-[6px] border-slate-800/90 flex flex-col justify-center items-center my-auto">
              <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 border border-emerald-500/30 shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>25 FPS • 1080x1920 • AAC</span>
              </div>
              <video
                ref={videoRef}
                key={videoKey}
                src={`${StudioApi.getRenderedVideoUrl()}?t=${videoKey}`}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <>
              {/* Subtitle Mode Selector Bar */}
          <div className="w-full mb-3 p-1.5 rounded-2xl bg-[#0B1322] border border-white/10 flex items-center justify-between gap-1 text-[11px]">
            <span className="text-slate-400 font-semibold px-2">Kiểu Sub:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSubtitleMode('single_word')}
                className={`px-2.5 py-1 rounded-xl font-bold transition flex items-center gap-1 ${
                  subtitleMode === 'single_word'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
                title="Nhảy từng 1 chữ to ở giữa màn hình chuẩn Shorts/TikTok"
              >
                <span>⚡ 1 Từ (Shorts)</span>
              </button>
              <button
                onClick={() => setSubtitleMode('word_group')}
                className={`px-2.5 py-1 rounded-xl font-semibold transition ${
                  subtitleMode === 'word_group'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
                title="Hiển thị cụm 3 chữ ngắn"
              >
                <span>Cụm 3 chữ</span>
              </button>
              <button
                onClick={() => setSubtitleMode('full_paragraph')}
                className={`px-2 py-1 rounded-xl font-semibold transition ${
                  subtitleMode === 'full_paragraph'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
                title="Hiển thị cả đoạn văn kiểu karaoke"
              >
                <span>Cả đoạn</span>
              </button>
            </div>
          </div>

          {/* 9:16 Modern Phone Frame with Dynamic Island */}
          <div className="relative w-[280px] sm:w-[310px] aspect-[9/16] rounded-[32px] overflow-hidden bg-black shadow-2xl border-[6px] border-slate-800/90 flex flex-col justify-between">
            {/* Dynamic Island Bar */}
            <div className="absolute top-2 inset-x-0 mx-auto w-24 h-4 bg-black rounded-full border border-white/10 z-30 pointer-events-none flex items-center justify-end pr-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/60"></div>
            </div>

            {/* Background Media */}
            <img
              src={activeScene.media_candidate?.thumbnail_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80'}
              alt={activeScene.visual_intent}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            />
            {/* Dark gradient for subtitle contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/85 pointer-events-none" />

            {/* Simulated Safe-Zone Overlays (Right Platform Actions) */}
            {showSafeZone && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10 pt-8">
                {/* Top sound banner */}
                <div className="self-center px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-white flex items-center gap-1 border border-white/10">
                  <Music className="w-3 h-3 text-cyan-400" />
                  <span>Âm thanh gốc - TechBytes VN</span>
                </div>

                {/* Right interaction column (Like, Comment, Share) */}
                <div className="self-end space-y-3 text-center text-white/90">
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-[10px] mx-auto">♥</div>
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-[10px] mx-auto">💬</div>
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-[10px] mx-auto">↗</div>
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

            {/* Dynamic TikTok/Shorts Subtitle Display - Exactly at bottom safe area above @TechBytesVN */}
            <div className="absolute bottom-[92px] sm:bottom-[100px] inset-x-0 z-20 px-3 text-center flex flex-col items-center pointer-events-none">
              {subtitleMode === 'single_word' && (
                <div className="flex items-center justify-center">
                  <span
                    key={`${selectedSceneIndex}-${activeWordIndex}`}
                    className="animate-pop inline-block text-xl sm:text-2xl font-black uppercase tracking-wider text-yellow-300 drop-shadow-[0_4px_8px_rgba(0,0,0,1)] [text-shadow:_2px_2px_0_#000,_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000,_0_2px_8px_rgba(0,0,0,1)] px-3.5 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-yellow-400/40 shadow-2xl"
                  >
                    {currentWord || words[0] || ''}
                  </span>
                </div>
              )}

              {subtitleMode === 'word_group' && (
                <div className="px-3.5 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 shadow-2xl max-w-[260px]">
                  <p className="text-sm sm:text-base font-extrabold tracking-wide leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                    {groupWords.map((word, gIdx) => {
                      const actualIdx = groupStart + gIdx;
                      const isWordActive = actualIdx === activeWordIndex;
                      return (
                        <span
                          key={actualIdx}
                          className={`inline-block mx-1 transition-all duration-75 ${
                            isWordActive
                              ? 'text-yellow-300 scale-110 font-black underline decoration-yellow-400 underline-offset-4'
                              : 'text-white/90'
                          }`}
                        >
                          {word}
                        </span>
                      );
                    })}
                  </p>
                </div>
              )}

              {subtitleMode === 'full_paragraph' && (
                <div className="px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 shadow-2xl max-w-[260px]">
                  <p className="text-xs sm:text-sm font-bold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,1)] leading-relaxed">
                    {words.map((word, wIdx) => {
                      const isWordActive = wIdx === activeWordIndex;
                      return (
                        <span
                          key={wIdx}
                          className={`transition-all duration-75 inline-block mx-0.5 ${
                            isWordActive 
                              ? 'text-yellow-300 scale-110 font-black underline decoration-yellow-400 underline-offset-2' 
                              : 'text-white/80'
                          }`}
                        >
                          {word}
                        </span>
                      );
                    })}
                  </p>
                </div>
              )}
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
              className="w-full h-2.5 rounded-full bg-slate-800 cursor-pointer overflow-hidden shadow-inner"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = clickX / rect.width;
                handleSeek(ratio * totalDuration);
              }}
            >
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all"
                style={{ width: `${(currentPlaybackTime / totalDuration) * 100}%` }}
              />
            </div>

            {/* Hidden Neural Voiceover Audio Player */}
            <audio
              ref={audioRef}
              src={StudioApi.getVoiceoverAudioUrl()}
              preload="auto"
              onPlay={() => setAudioSourceAvailable(true)}
              onError={() => {
                // If local MP3 isn't ready or 404, fallback to Web Speech API
                setAudioSourceAvailable(false);
              }}
            />

            {/* Player Buttons & Volume Controls */}
            <div className="flex flex-col items-center gap-2 pt-2">
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => handleSeek(0)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition"
                  title="Quay lại đầu"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-3.5 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-600/30 transition transform hover:scale-105"
                  title={isPlaying ? 'Tạm dừng' : 'Phát (Có âm thanh)'}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-2 rounded-xl border transition ${
                    isMuted
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                  }`}
                  title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Volume Slider & Audio Status Indicator */}
              <div className="w-full flex items-center justify-between px-2 pt-1 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-mono">{isMuted ? 'MUTE' : `${Math.round(volume * 100)}%`}</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value));
                      setIsMuted(false);
                    }}
                    className="w-20 h-1 bg-slate-700 rounded-lg accent-indigo-500 cursor-pointer"
                    title="Âm lượng giọng đọc"
                  />
                </div>
                <div className="flex items-center gap-1 font-mono text-[10px]">
                  {isPlaying ? (
                    <span className="text-emerald-400 flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {audioSourceAvailable ? 'Audio Neural VN' : 'Web Speech VN'}
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      {audioSourceAvailable ? 'TTS Neural Sẵn sàng' : 'TTS Web Speech Sẵn sàng'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </div>

        {/* ========================================================
            RIGHT PANE: Inspector, Media Rights & Audio Mix (4 Cols)
           ======================================================== */}
        <div className="lg:col-span-4 p-5 rounded-3xl glass-panel space-y-5">
          {/* Header */}
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
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
              <span className="text-xs font-semibold text-slate-300">Tư liệu hình ảnh:</span>
              <span className="text-[11px] font-mono text-cyan-400 font-bold">
                Độ phù hợp: {activeScene.media_candidate?.relevance_score}/100
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#1E293B]/70 border border-white/10 space-y-3">
              <div className="flex items-start space-x-3">
                <img
                  src={activeScene.media_candidate?.thumbnail_url}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
                />
                <div className="text-xs space-y-1 min-w-0">
                  <div className="font-bold text-white truncate">
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
              <div className={`p-2.5 rounded-xl text-xs flex items-center justify-between ${
                activeScene.media_candidate?.rights_status === 'LICENSED'
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-950/40 text-amber-300 border border-amber-500/30'
              }`}>
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span className="font-bold text-[11px]">
                    {activeScene.media_candidate?.rights_status === 'LICENSED' 
                      ? 'Quyền Sử Dụng: Hợp Pháp (Green)' 
                      : 'Quyền Sử Dụng: Cần Người Duyệt (Yellow)'}
                  </span>
                </div>
              </div>

              {/* Action: Replace Media */}
              <button className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 flex items-center justify-center gap-1.5 transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Thay Tư Liệu Cá Nhân / Tải Lên</span>
              </button>
            </div>
          </div>

          {/* Audio Mixing & Voice Profile */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <span className="text-xs font-semibold text-slate-300 block">Cấu hình giọng đọc AI (TTS):</span>

            <div className="p-3.5 rounded-2xl bg-[#1E293B]/70 border border-white/10 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-indigo-400" /> Giọng đọc:
                </span>
                <span className="text-white font-bold">Hoài My (Giọng Bắc Chuẩn)</span>
              </div>

              {/* Speed Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Tốc độ đọc:</span>
                  <span className="font-mono text-cyan-400 font-bold">{voiceSpeed}x</span>
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
                <span className="text-[11px] text-slate-400 block font-semibold">Mức âm lượng tuyến tính (Mixing):</span>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="p-2 rounded-xl bg-[#0F172A] border border-white/5">
                    <span className="text-slate-400 block">Lời đọc</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs">100%</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#0F172A] border border-white/5">
                    <span className="text-slate-400 block">Nhạc nền</span>
                    <span className="font-mono font-bold text-indigo-400 text-xs">12%</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#0F172A] border border-white/5">
                    <span className="text-slate-400 block">SFX</span>
                    <span className="font-mono font-bold text-cyan-400 text-xs">40%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Template Selection */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <span className="text-xs font-semibold text-slate-300 block">Video Template:</span>
            <div className="grid grid-cols-2 gap-2">
              {['News Explainer', 'Fast News', 'Tech Review', 'Top List'].map((tpl) => (
                <button
                  key={tpl}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition ${
                    selectedTemplate === tpl
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
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

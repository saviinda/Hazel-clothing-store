'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, ChevronUp, ChevronDown } from 'lucide-react';

interface VideoItem {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  is_enabled: boolean;
}

interface VideoFeedProps {
  videos: VideoItem[];
}

export default function VideoFeed({ videos = [] }: VideoFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeVideos, setActiveVideos] = useState<VideoItem[]>(() =>
    videos.filter((v) => v.is_enabled !== false)
  );
  const [muted, setMuted] = useState(true);
  const [playingMap, setPlayingMap] = useState<Record<string, boolean>>({});
  const [showPlayOverlay, setShowPlayOverlay] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setActiveVideos(videos.filter((v) => v.is_enabled !== false));
  }, [videos]);

  useEffect(() => {
    const scrollContainer = containerRef.current;
    if (!scrollContainer || activeVideos.length === 0) return;

    const options = {
      root: scrollContainer,
      threshold: 0.6,
    };

    const callback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;
        const videoId = video.dataset.id || '';
        if (entry.isIntersecting) {
          video.play().then(() => {
            setPlayingMap((prev) => ({ ...prev, [videoId]: true }));
          }).catch((err) => {
            console.log('Autoplay prevented:', err);
            setPlayingMap((prev) => ({ ...prev, [videoId]: false }));
          });
        } else {
          video.pause();
          video.currentTime = 0;
          setPlayingMap((prev) => ({ ...prev, [videoId]: false }));
        }
      });
    };

    const observer = new IntersectionObserver(callback, options);
    const videoElements = scrollContainer.querySelectorAll('video');
    videoElements.forEach((vid) => observer.observe(vid));
    return () => { observer.disconnect(); };
  }, [activeVideos]);

  useEffect(() => {
    const scrollContainer = containerRef.current;
    if (!scrollContainer) return;
    const videoElements = scrollContainer.querySelectorAll('video');
    videoElements.forEach((vid) => { vid.muted = muted; });
  }, [muted, activeVideos]);

  const handleVideoClick = (videoId: string, videoEl: HTMLVideoElement | null) => {
    if (!videoEl) return;
    if (videoEl.paused) {
      videoEl.play()
        .then(() => setPlayingMap((prev) => ({ ...prev, [videoId]: true })))
        .catch((e) => console.error(e));
      triggerOverlay(videoId);
    } else {
      videoEl.pause();
      setPlayingMap((prev) => ({ ...prev, [videoId]: false }));
      triggerOverlay(videoId);
    }
  };

  const triggerOverlay = (videoId: string) => {
    setShowPlayOverlay((prev) => ({ ...prev, [videoId]: true }));
    setTimeout(() => {
      setShowPlayOverlay((prev) => ({ ...prev, [videoId]: false }));
    }, 500);
  };

  const handleScrollUp = () => {
    const sc = containerRef.current;
    if (!sc) return;
    sc.scrollBy({ top: -sc.clientHeight, behavior: 'smooth' });
  };

  const handleScrollDown = () => {
    const sc = containerRef.current;
    if (!sc) return;
    sc.scrollBy({ top: sc.clientHeight, behavior: 'smooth' });
  };

  if (activeVideos.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 md:px-12 w-full reveal">
      {/* Section Header */}
      <div className="text-center mb-10 sm:mb-14 space-y-2">
        <span className="text-brand-primary text-xs uppercase tracking-[0.3em] font-semibold block mb-2">
          hazel on screen
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-brand-secondary tracking-wide">
          Style <span className="italic font-normal">Inspiration</span>
        </h2>
        <p className="text-xs text-brand-secondary-light/70 max-w-md mx-auto leading-relaxed mt-2 font-medium">
          Scroll through our curated styles. Tap a video to play/pause, or toggle sound to listen.
        </p>
        <div className="h-[1px] w-24 bg-brand-primary/40 mx-auto mt-4" />
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
        {/* Desktop Navigation Sidebar */}
        <div className="hidden lg:flex flex-col items-center gap-6">
          <button onClick={handleScrollUp}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-brand-primary-light/20 text-brand-secondary hover:bg-brand-primary hover:text-white transition shadow-sm"
            title="Previous Look">
            <ChevronUp size={20} />
          </button>
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-secondary/30 rotate-90 my-4 select-none">
            Swipe
          </span>
          <button onClick={handleScrollDown}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-brand-primary-light/20 text-brand-secondary hover:bg-brand-primary hover:text-white transition shadow-sm"
            title="Next Look">
            <ChevronDown size={20} />
          </button>
        </div>

        {/* ══════════════════════════════════════════
            LUXURY MIRROR FRAME
        ══════════════════════════════════════════ */}
        <div className="flex-shrink-0 relative" style={{ filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.35))' }}>

          {/* Outer glow ring (silver/white) */}
          <div
            className="absolute -inset-2 rounded-[28px] opacity-40"
            style={{
              background: 'linear-gradient(135deg, #C0C0C0, #FFFFFF, #E8E8E8, #A8A8A8, #E8E8E8, #FFFFFF, #C0C0C0)',
              filter: 'blur(8px)',
            }}
          />

          {/* Frame outer shell — thick silver/light-metallic gradient */}
          <div
            className="relative rounded-[24px]"
            style={{
              padding: '18px',
              background: `
                linear-gradient(135deg,
                  #a8a8a8 0%,
                  #e8e8e8 12%,
                  #ffffff 22%,
                  #d8d8d8 32%,
                  #bebebe 42%,
                  #d8d8d8 52%,
                  #ffffff 62%,
                  #e8e8e8 72%,
                  #a8a8a8 100%
                )
              `,
              boxShadow: `
                0 0 0 1px #bebebe,
                inset 0 1px 0 rgba(255,255,255,0.8),
                inset 0 -1px 0 rgba(0,0,0,0.15),
                inset 2px 0 0 rgba(255,255,255,0.6),
                inset -2px 0 0 rgba(0,0,0,0.1)
              `,
            }}
          >
            {/* Corner ornaments */}
            {[
              'top-1 left-1',
              'top-1 right-1',
              'bottom-1 left-1',
              'bottom-1 right-1',
            ].map((pos, i) => (
              <span
                key={i}
                className={`absolute ${pos} text-slate-100/90 text-xl leading-none select-none z-10`}
                style={{ textShadow: '0 0 6px rgba(255,255,255,0.9), 0 1px 2px rgba(0,0,0,0.3)' }}
              >
                ✦
              </span>
            ))}

            {/* Top label bar */}
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 z-20">
              <div
                className="px-5 py-1 rounded-b-xl flex items-center gap-2"
                style={{
                  background: 'linear-gradient(180deg, #d8d8d8 0%, #a8a8a8 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  border: '1px solid #bebebe',
                  borderTop: 'none',
                }}
              >
                <span
                  className="text-[9px] tracking-[0.35em] font-bold uppercase"
                  style={{ color: '#2b221f', textShadow: '0 1px 1px rgba(255,255,255,0.5)' }}
                >
                  ✦ HAZEL ✦
                </span>
              </div>
            </div>

            {/* Bottom label bar */}
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 z-20">
              <div
                className="px-5 py-1 rounded-t-xl flex items-center gap-2"
                style={{
                  background: 'linear-gradient(0deg, #d8d8d8 0%, #a8a8a8 100%)',
                  boxShadow: '0 -2px 8px rgba(0,0,0,0.15)',
                  border: '1px solid #bebebe',
                  borderBottom: 'none',
                }}
              >
                <span
                  className="text-[8px] tracking-[0.3em] font-bold uppercase"
                  style={{ color: 'rgba(43,34,31,0.8)', textShadow: '0 1px 1px rgba(255,255,255,0.5)' }}
                >
                  Style Boutique
                </span>
              </div>
            </div>

            {/* Inner bevel ring — dark charcoal/silver for depth */}
            <div
              className="rounded-[10px] overflow-hidden"
              style={{
                padding: '3px',
                background: 'linear-gradient(135deg, #1e1e1e 0%, #3a3a3a 50%, #1e1e1e 100%)',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              {/* Innermost thin silver accent ring */}
              <div
                className="rounded-[8px] overflow-hidden"
                style={{
                  padding: '1px',
                  background: 'linear-gradient(135deg, #e8e8e8, #bebebe, #e8e8e8)',
                }}
              >
                {/* The Video Screen */}
                <div
                  ref={containerRef}
                  className="w-[300px] sm:w-[320px] bg-black snap-y snap-mandatory overflow-y-auto scroll-smooth no-scrollbar rounded-[7px]"
                  style={{ height: '536px' }}
                >
                  {activeVideos.map((video, idx) => {
                    const videoId = video.id || `video-${idx}`;
                    const isPlaying = playingMap[videoId] || false;
                    const hasOverlay = showPlayOverlay[videoId] || false;

                    return (
                      <div
                        key={videoId}
                        className="video-card snap-start w-full relative flex-shrink-0 flex items-center justify-center group"
                        style={{ height: '536px' }}
                      >
                        <video
                          data-id={videoId}
                          className="w-full h-full object-cover cursor-pointer bg-black"
                          src={video.video_url}
                          poster={video.thumbnail_url}
                          loop
                          playsInline
                          muted={muted}
                          onClick={(e) => handleVideoClick(videoId, e.currentTarget)}
                        />

                        {/* Play/Pause Feedback Overlay */}
                        {hasOverlay && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none z-20 animate-ping">
                            <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                              {isPlaying
                                ? <Play size={32} className="fill-white ml-1" />
                                : <Pause size={32} className="fill-white" />}
                            </div>
                          </div>
                        )}

                        {/* Mute Toggle */}
                        <button
                          onClick={() => setMuted(!muted)}
                          className="absolute top-4 right-3 z-20 h-9 w-9 rounded-full bg-black/45 hover:bg-black/65 text-white flex items-center justify-center transition border border-white/10"
                          title={muted ? 'Unmute' : 'Mute'}
                        >
                          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        </button>

                        {/* Bottom Text Gradient */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 pb-5 text-white z-20">
                          <h4 className="font-serif text-base font-light tracking-wide truncate max-w-[85%]">
                            {video.title}
                          </h4>
                          <p className="text-[9px] tracking-[0.2em] uppercase text-brand-primary-light font-bold mt-1.5 flex items-center gap-1.5 select-none">
                            <span className="w-1.5 h-1.5 bg-brand-primary-light rounded-full animate-pulse" />
                            Hazel Lookbook
                          </p>
                        </div>

                        {/* Pause state play button */}
                        {!isPlaying && (
                          <div
                            className="absolute inset-0 flex items-center justify-center bg-black/20 z-10 cursor-pointer"
                            onClick={(e) => {
                              const vidEl = e.currentTarget.parentElement?.querySelector('video');
                              handleVideoClick(videoId, vidEl || null);
                            }}
                          >
                            <div className="h-14 w-14 bg-brand-secondary/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-brand-primary/30 shadow-lg">
                              <Play size={24} className="fill-white ml-1 text-brand-primary-light" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Side decorative vertical bars */}
          <div
            className="absolute top-8 bottom-8 -left-3 w-1.5 rounded-full"
            style={{
              background: 'linear-gradient(180deg, #a8a8a8 0%, #e8e8e8 30%, #ffffff 50%, #e8e8e8 70%, #a8a8a8 100%)',
              boxShadow: '-2px 0 6px rgba(0,0,0,0.15)',
            }}
          />
          <div
            className="absolute top-8 bottom-8 -right-3 w-1.5 rounded-full"
            style={{
              background: 'linear-gradient(180deg, #a8a8a8 0%, #e8e8e8 30%, #ffffff 50%, #e8e8e8 70%, #a8a8a8 100%)',
              boxShadow: '2px 0 6px rgba(0,0,0,0.15)',
            }}
          />
        </div>

        {/* Mobile Scroll Controls */}
        <div className="flex lg:hidden items-center justify-center gap-6 mt-2">
          <button onClick={handleScrollUp}
            className="px-4 py-2 text-[10px] font-bold tracking-widest bg-white border border-brand-primary-light/20 text-brand-secondary rounded shadow-sm hover:bg-brand-primary hover:text-white transition">
            PREVIOUS LOOK
          </button>
          <button onClick={handleScrollDown}
            className="px-4 py-2 text-[10px] font-bold tracking-widest bg-white border border-brand-primary-light/20 text-brand-secondary rounded shadow-sm hover:bg-brand-primary hover:text-white transition">
            NEXT LOOK
          </button>
        </div>
      </div>
    </section>
  );
}

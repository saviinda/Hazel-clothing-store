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

    // Use IntersectionObserver to play/pause videos based on scroll visibility
    const options = {
      root: scrollContainer,
      threshold: 0.6, // Video is active when 60% of it is in the frame
    };

    const callback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;
        const videoId = video.dataset.id || '';

        if (entry.isIntersecting) {
          // Play current video
          video.play().then(() => {
            setPlayingMap((prev) => ({ ...prev, [videoId]: true }));
          }).catch((err) => {
            console.log('Autoplay prevented:', err);
            setPlayingMap((prev) => ({ ...prev, [videoId]: false }));
          });
        } else {
          // Pause when scrolling away
          video.pause();
          video.currentTime = 0; // restart video when scrolled out
          setPlayingMap((prev) => ({ ...prev, [videoId]: false }));
        }
      });
    };

    const observer = new IntersectionObserver(callback, options);
    const videoElements = scrollContainer.querySelectorAll('video');
    videoElements.forEach((vid) => observer.observe(vid));

    return () => {
      observer.disconnect();
    };
  }, [activeVideos]);

  // Sync mute state across all video elements
  useEffect(() => {
    const scrollContainer = containerRef.current;
    if (!scrollContainer) return;
    const videoElements = scrollContainer.querySelectorAll('video');
    videoElements.forEach((vid) => {
      vid.muted = muted;
    });
  }, [muted, activeVideos]);

  const handleVideoClick = (videoId: string, videoEl: HTMLVideoElement | null) => {
    if (!videoEl) return;

    if (videoEl.paused) {
      videoEl.play()
        .then(() => setPlayingMap((prev) => ({ ...prev, [videoId]: true })))
        .catch((e) => console.error(e));
      // Show play feedback overlay
      triggerOverlay(videoId);
    } else {
      videoEl.pause();
      setPlayingMap((prev) => ({ ...prev, [videoId]: false }));
      // Show pause feedback overlay
      triggerOverlay(videoId);
    }
  };

  const triggerOverlay = (videoId: string) => {
    setShowPlayOverlay((prev) => ({ ...prev, [videoId]: true }));
    setTimeout(() => {
      setShowPlayOverlay((prev) => ({ ...prev, [videoId]: false }));
    }, 500);
  };

  const scrollToIndex = (index: number) => {
    const scrollContainer = containerRef.current;
    if (!scrollContainer) return;
    const cards = scrollContainer.querySelectorAll('.video-card');
    if (cards[index]) {
      cards[index].scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollUp = () => {
    const scrollContainer = containerRef.current;
    if (!scrollContainer) return;
    const cardHeight = scrollContainer.clientHeight;
    scrollContainer.scrollBy({ top: -cardHeight, behavior: 'smooth' });
  };

  const handleScrollDown = () => {
    const scrollContainer = containerRef.current;
    if (!scrollContainer) return;
    const cardHeight = scrollContainer.clientHeight;
    scrollContainer.scrollBy({ top: cardHeight, behavior: 'smooth' });
  };

  if (activeVideos.length === 0) {
    return null; // Don't render section if no videos are configured
  }

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 md:px-12 w-full reveal">
      <div className="text-center mb-10 sm:mb-14 space-y-2">
        <span className="text-brand-primary text-xs uppercase tracking-[0.3em] font-semibold block mb-2">hazel on screen</span>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-brand-secondary tracking-wide">
          Style <span className="italic font-normal">Inspiration</span>
        </h2>
        <p className="text-xs text-brand-secondary-light/70 max-w-md mx-auto leading-relaxed mt-2 font-medium">
          Scroll through our curated styles. Tap a video to play/pause, or toggle sound to listen.
        </p>
        <div className="h-[1px] w-24 bg-brand-primary/40 mx-auto mt-4"></div>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12">
        {/* Helper Navigation Sidebar (Desktop Only) */}
        <div className="hidden lg:flex flex-col items-center gap-4">
          <button
            onClick={handleScrollUp}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-brand-primary-light/20 text-brand-secondary hover:bg-brand-primary hover:text-white transition shadow-sm"
            title="Previous Look"
          >
            <ChevronUp size={20} />
          </button>
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-secondary/40 rotate-90 my-4 select-none">
            Swipe
          </span>
          <button
            onClick={handleScrollDown}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-brand-primary-light/20 text-brand-secondary hover:bg-brand-primary hover:text-white transition shadow-sm"
            title="Next Look"
          >
            <ChevronDown size={20} />
          </button>
        </div>

        {/* Smartphone Bezel Mockup */}
        <div className="relative w-full max-w-[360px] sm:max-w-[380px] aspect-[9/16] h-[580px] sm:h-[640px] bg-[#1a1715] rounded-[36px] p-3 shadow-2xl border-4 border-brand-secondary/95 flex-shrink-0 flex flex-col justify-between overflow-hidden">
          {/* Top Notch/Speaker Bar */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-40 bg-brand-secondary/95 rounded-b-2xl z-30 flex items-center justify-center">
            <div className="w-12 h-1 bg-zinc-700/60 rounded-full"></div>
          </div>

          {/* Video Container (The "Screen") */}
          <div
            ref={containerRef}
            className="w-full h-full rounded-[26px] overflow-hidden bg-black snap-y snap-mandatory overflow-y-auto scroll-smooth no-scrollbar relative z-10"
          >
            {activeVideos.map((video, idx) => {
              const videoId = video.id || `video-${idx}`;
              const isPlaying = playingMap[videoId] || false;
              const hasOverlay = showPlayOverlay[videoId] || false;
              const fallbackPoster = video.thumbnail_url || video.video_url.replace(/\.[^/.]+$/, '') + '.jpg';

              return (
                <div
                  key={videoId}
                  className="video-card snap-start w-full h-full relative flex items-center justify-center group"
                >
                  <video
                    data-id={videoId}
                    className="w-full h-full object-cover cursor-pointer bg-black"
                    src={video.video_url}
                    poster={fallbackPoster}
                    loop
                    playsInline
                    muted={muted}
                    onClick={(e) => handleVideoClick(videoId, e.currentTarget)}
                  />

                  {/* Play/Pause state click-feedback overlay */}
                  {hasOverlay && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none z-20 animate-ping">
                      <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                        {isPlaying ? <Play size={32} className="fill-white ml-1" /> : <Pause size={32} className="fill-white" />}
                      </div>
                    </div>
                  )}

                  {/* Top Volume / Mute Controls */}
                  <button
                    onClick={() => setMuted(!muted)}
                    className="absolute top-6 right-4 z-20 h-9 w-9 rounded-full bg-black/45 hover:bg-black/60 text-white flex items-center justify-center transition border border-white/10"
                    title={muted ? 'Unmute' : 'Mute'}
                  >
                    {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>

                  {/* Bottom Text Overlays */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5 pb-6 text-white z-20 flex flex-col justify-end">
                    <h4 className="font-serif text-lg font-light tracking-wide truncate max-w-[85%]">
                      {video.title}
                    </h4>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-brand-primary-light font-bold mt-1.5 flex items-center gap-1.5 select-none">
                      <span className="w-1.5 h-1.5 bg-brand-primary-light rounded-full animate-pulse"></span>
                      Hazel Lookbook
                    </p>
                  </div>

                  {/* Pause state permanent indicator overlay */}
                  {!isPlaying && (
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-black/20 z-15 cursor-pointer"
                      onClick={(e) => {
                        const vidEl = e.currentTarget.parentElement?.querySelector('video');
                        handleVideoClick(videoId, vidEl || null);
                      }}
                    >
                      <div className="h-14 w-14 bg-brand-secondary/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-brand-primary/20 shadow-md">
                        <Play size={24} className="fill-white ml-1 text-brand-primary-light" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Small Navigation helper for mobile (Centered below mockup) */}
        <div className="flex lg:hidden items-center justify-center gap-6 mt-2">
          <button
            onClick={handleScrollUp}
            className="px-4 py-2 text-[10px] font-bold tracking-widest bg-white border border-brand-primary-light/20 text-brand-secondary rounded shadow-sm hover:bg-brand-primary hover:text-white transition"
          >
            PREVIOUS LOOK
          </button>
          <button
            onClick={handleScrollDown}
            className="px-4 py-2 text-[10px] font-bold tracking-widest bg-white border border-brand-primary-light/20 text-brand-secondary rounded shadow-sm hover:bg-brand-primary hover:text-white transition"
          >
            NEXT LOOK
          </button>
        </div>
      </div>
    </section>
  );
}

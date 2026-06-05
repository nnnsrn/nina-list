"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseService, CollectionItem } from "@/lib/supabaseService";

interface Bubble {
  id: number;
  size: number;
  left: number;
  duration: number;
}

type TrendingItem = {
  id: number;
  title: string;
  url: string;
  image: string;
  synopsis: string;
  score: number | null;
  mediaType: "Anime" | "Manga";
  badge: string;
  badgeDetail: string;
};

export default function Home() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [mouseGlow, setMouseGlow] = useState({ x: 0, y: 0, opacity: 0 });
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);

  // Load collection from Supabase or localStorage
  useEffect(() => {
    supabaseService.getCollection().then((data) => {
      setCollection(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetch("/api/jikan/trending", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setTrending(Array.isArray(data.results) ? data.results : []);
      })
      .catch(() => setTrending([]))
      .finally(() => setTrendingLoading(false));
  }, []);

  // Float bubble particles logic
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = setInterval(() => {
      const id = Math.random();
      const size = Math.random() * 15 + 5;
      const left = Math.random() * 100;
      const duration = Math.random() * 8 + 6;

      setBubbles((prev) => [...prev, { id, size, left, duration }]);

      // Cleanup bubble after animation completes
      setTimeout(() => {
        setBubbles((prev) => prev.filter((b) => b.id !== id));
      }, duration * 1000);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  // Handle mouse glow in hero
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouseGlow({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      opacity: 0.6,
    });
  };

  const handleMouseLeave = () => {
    setMouseGlow((prev) => ({ ...prev, opacity: 0 }));
  };

  // Find currently watching item
  const currentlyWatching = collection.find((item) => item.status === "Watching");

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <header
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-background"
        id="hero-section"
      >
        {/* Deep Sea Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary-container/40 via-background to-background bg-gradient-to-br animate-wave"></div>

          {/* Light Rays */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-full bg-gradient-to-b from-primary-container/10 to-transparent blur-[100px] pointer-events-none"></div>

          {/* Mouse Tracking Glow */}
          <div
            className="absolute w-[800px] h-[800px] bg-primary-container/20 rounded-full blur-[120px] pointer-events-none transition-opacity duration-500 ease-out z-0"
            style={{
              transform: "translate(-50%, -50%)",
              left: `${mouseGlow.x}px`,
              top: `${mouseGlow.y}px`,
              opacity: mouseGlow.opacity,
            }}
          />

          {/* Bubble Container */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {bubbles.map((bubble) => (
              <div
                key={bubble.id}
                className="bubble"
                style={{
                  width: `${bubble.size}px`,
                  height: `${bubble.size}px`,
                  left: `${bubble.left}%`,
                  animationDuration: `${bubble.duration}s`,
                }}
              />
            ))}
          </div>

          {/* Floating Particles (Static fallback aesthetics) */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full particle blur-[1px] opacity-60"></div>
          <div className="absolute top-3/4 left-2/3 w-3 h-3 bg-secondary rounded-full particle blur-[2px] opacity-40"></div>
          <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-tertiary rounded-full particle blur-[0.5px] opacity-80"></div>
          <div className="absolute bottom-1/4 left-1/3 w-4 h-4 bg-primary-container rounded-full particle blur-[3px] opacity-30"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-container-max mx-auto flex flex-col items-center">
          {/* Main Hero Logo removed per request */}
          <h1 className="font-plus-jakarta text-5xl md:text-[72px] md:leading-[80px] text-primary mb-6 tracking-tight drop-shadow-2xl font-bold">
            Dive Into <span className="text-gradient-cyan">Every Story.</span>
          </h1>
          <p className="font-manrope text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
            List of animes, manga, manhwa, and manhua, I, Nina have watched/read till date. Explore and also feel free to add any suggestions. 😸
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full sm:w-auto">
            <Link
              href="/library"
              className="w-full sm:w-auto bg-gradient-to-r from-primary-fixed to-primary-container text-on-primary-container font-label-md text-sm uppercase tracking-wider px-8 py-4 rounded-full shadow-[0_0_20px_rgba(0,229,255,0.2)] hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] hover:-translate-y-1 transition-all duration-300 text-center font-bold"
            >
              Start Tracking
            </Link>
            <Link
              href="/library"
              className="w-full sm:w-auto border border-primary-container/50 text-primary-container font-label-md text-sm uppercase tracking-wider px-8 py-4 rounded-full hover:bg-primary-container/10 hover:border-primary-container transition-all duration-300 backdrop-blur-sm text-center font-bold"
            >
              View Collection
            </Link>
          </div>
        </div>

        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10"></div>
      </header>

      {/* Main Content */}
      <main className="relative z-20 pb-32">
        {(trendingLoading || trending.length > 0) && (
        <section className="max-w-container-max mx-auto px-6 md:px-16 mb-24">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="font-plus-jakarta text-2xl md:text-3xl text-primary mb-2 flex items-center gap-3 font-bold">
                <span className="material-symbols-outlined text-primary-container">trending_up</span>
                Trending in the Deep
              </h2>
              <p className="font-manrope text-sm md:text-base text-on-surface-variant">
                What others are discovering right now.
              </p>
            </div>
            <Link
              href="/library"
              className="hidden md:flex items-center gap-1 font-label-md text-sm uppercase tracking-wider text-secondary hover:text-primary transition-colors font-bold"
            >
              View All <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </Link>
          </div>

          <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-8 -mx-6 px-6 md:mx-0 md:px-0 snap-x snap-mandatory">
            {trendingLoading ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`${i === 1 ? "min-w-[300px] md:min-w-[400px]" : "min-w-[200px] md:min-w-[240px]"} flex-shrink-0 snap-start`}
                >
                  <div className="h-[400px] rounded-2xl bg-surface-container/30 animate-pulse border border-outline-variant/10" />
                </div>
              ))
            ) : trending.length > 0 ? (
              trending.map((item, index) => {
                const isFeatured = index === 0;
                const fallbackImage =
                  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80";

                return (
                  <div
                    key={`${item.mediaType}-${item.id}`}
                    className={`${isFeatured ? "min-w-[300px] md:min-w-[400px]" : "min-w-[200px] md:min-w-[240px]"} flex-shrink-0 snap-start`}
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block h-[400px] rounded-2xl relative overflow-hidden group glass-card bg-surface-container border border-outline-variant/10 shadow-lg"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/50 to-transparent z-10"></div>
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        alt={item.title}
                        src={item.image || fallbackImage}
                      />
                      <div className={`absolute bottom-0 left-0 right-0 z-20 ${isFeatured ? "p-6" : "p-5"}`}>
                        <div className={`flex items-center gap-2 ${isFeatured ? "mb-3" : "mb-2"}`}>
                          <span
                            className={`px-2.5 py-1 rounded-full font-label-md text-[12px] border backdrop-blur-md font-bold ${
                              item.mediaType === "Anime"
                                ? "bg-primary-container/20 text-primary-container border-primary-container/30"
                                : "bg-secondary-container/50 text-secondary border-secondary/20"
                            }`}
                          >
                            {item.badge}
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-surface-variant/80 text-on-surface-variant font-label-md text-[12px] backdrop-blur-md">
                            {item.badgeDetail}
                          </span>
                        </div>
                        <h3
                          className={`font-plus-jakarta text-on-surface mb-1 group-hover:text-primary transition-colors font-semibold ${
                            isFeatured ? "text-xl md:text-2xl" : "text-lg"
                          }`}
                        >
                          {item.title}
                        </h3>
                        {isFeatured ? (
                          <p className="font-manrope text-sm text-on-surface-variant line-clamp-2">
                            {item.synopsis || "Trending on MyAnimeList right now."}
                          </p>
                        ) : item.score ? (
                          <div className="flex items-center gap-1 text-on-surface-variant text-[12px]">
                            <span
                              className="material-symbols-outlined text-[14px] fill-icon text-primary-container"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              star
                            </span>
                            {item.score.toFixed(1)}
                          </div>
                        ) : null}
                      </div>
                    </a>
                  </div>
                );
              })
            ) : null}

            <div className="min-w-[200px] md:min-w-[240px] flex-shrink-0 snap-start">
              <Link
                href="/library"
                className="h-[400px] rounded-2xl relative overflow-hidden group glass-card bg-surface-container border border-outline-variant/10 flex items-center justify-center cursor-pointer hover:border-primary/30"
              >
                <div className="text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-surface-variant/50 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-container/20 group-hover:text-primary-container transition-colors border border-outline-variant/30">
                    <span className="material-symbols-outlined text-[32px]">arrow_forward</span>
                  </div>
                  <span className="font-label-md text-sm text-on-surface-variant group-hover:text-primary transition-colors">
                    Explore All Database
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </section>
        )}

        {/* Continue Tracking / Progress Section (Bento Grid) */}
        <section className="max-w-container-max mx-auto px-6 md:px-16 mb-24">
          <h2 className="font-plus-jakarta text-2xl md:text-3xl text-primary mb-8 flex items-center gap-3 font-bold">
            <span className="material-symbols-outlined text-primary-container">history</span>
            Current Currents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Progress Card */}
            {currentlyWatching ? (
              <div className="md:col-span-2 glass-card bg-surface-container-high/40 rounded-2xl border border-outline-variant/20 p-6 relative overflow-hidden flex flex-col md:flex-row gap-6 items-center backdrop-blur-xl">
                <div className="absolute right-0 top-0 w-64 h-64 bg-primary-container/5 rounded-full blur-[80px] pointer-events-none"></div>
                <img
                  className="w-full md:w-32 md:h-40 h-48 object-cover rounded-xl shadow-lg border border-outline-variant/30 flex-shrink-0"
                  alt={currentlyWatching.title}
                  src={currentlyWatching.cover_image || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&q=80"}
                />
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-primary-container font-label-md text-[12px] uppercase tracking-wider mb-1 block font-bold">
                        Currently Watching
                      </span>
                      <h3 className="font-plus-jakarta text-xl md:text-2xl text-on-surface font-semibold">
                        {currentlyWatching.title}
                      </h3>
                    </div>
                    <Link
                      href="/library"
                      className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                    >
                      <span className="material-symbols-outlined fill-icon" style={{ fontVariationSettings: "'FILL' 1" }}>
                        play_arrow
                      </span>
                    </Link>
                  </div>
                  <p className="font-manrope text-sm text-on-surface-variant mb-6">
                    Episode {currentlyWatching.progress_current} of {currentlyWatching.progress_total}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between font-label-md text-[12px] text-on-surface-variant">
                      <span>Progress</span>
                      <span className="text-primary">
                        {currentlyWatching.progress_current} / {currentlyWatching.progress_total} Episodes
                      </span>
                    </div>
                    <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-fixed to-primary-container rounded-full relative"
                        style={{
                          width: `${(currentlyWatching.progress_current / currentlyWatching.progress_total) * 100}%`,
                        }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="md:col-span-2 glass-card bg-surface-container-high/40 rounded-2xl border border-outline-variant/20 p-6 flex items-center justify-center backdrop-blur-xl">
                <div className="text-center p-6">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">
                    hourglass_empty
                  </span>
                  <h3 className="font-plus-jakarta text-lg text-on-surface mb-1">No active series</h3>
                  <p className="font-manrope text-sm text-on-surface-variant">
                    Add an anime to your collection and set its status to Watching!
                  </p>
                </div>
              </div>
            )}

            {/* Stat Card */}
            <div className="glass-card bg-surface-container-high/40 rounded-2xl border border-outline-variant/20 p-6 flex flex-col justify-between backdrop-blur-xl group">
              <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-secondary-container/30 flex items-center justify-center border border-secondary-container">
                  <span className="material-symbols-outlined text-secondary">book</span>
                </div>
                <span className="font-label-md text-secondary font-bold">Library Stats</span>
              </div>
              <div>
                <p className="font-plus-jakarta text-[40px] text-on-surface mb-1 group-hover:text-primary transition-colors font-bold">
                  {loading ? "--" : collection.length}
                </p>
                <p className="font-manrope text-sm text-on-surface-variant">Total titles explored</p>
              </div>
              <div className="mt-4 pt-4 border-t border-outline-variant/20">
                <p className="font-label-md text-[13px] text-primary-container flex items-center gap-1 font-bold">
                  <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                  Active Progress
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative bottom-0 w-full bg-surface-container-lowest border-t border-outline-variant/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-6 md:px-16 py-16 max-w-container-max mx-auto">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="font-plus-jakarta text-lg font-bold text-primary">NinaList</span>
            </div>
            <p className="font-manrope text-sm text-secondary">
              © {new Date().getFullYear()} NinaList. Deep dive into my collections.
            </p>
          </div>
          <div className="flex flex-col md:items-end justify-center gap-4">
            <div className="flex flex-wrap gap-6 font-manrope text-sm">
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">API Docs</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Contact Support</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { supabaseService, CollectionItem } from "@/lib/supabaseService";
import {
  ActivityEntry,
  computeHeatmapLevels,
  computeStreak,
  formatRelativeTime,
  getActivityIcon,
  getActivityLabel,
  getCurrentWeekActivity,
  getHeatmapCellClass,
} from "@/lib/activity";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const totalEntries = collection.length;
  const completedCount = collection.filter((i) => i.status === "Completed").length;
  const watchingCount = collection.filter((i) => i.status === "Watching" && i.type === "Anime").length;
  const readingCount = collection.filter((i) => i.status === "Watching" && i.type !== "Anime").length;
  const favoritesCount = collection.filter((i) => i.rating >= 8.5).length;
  const activeSeries = collection.filter((i) => i.status === "Watching");
  const recentActivities = activities.slice(0, 6);
  const streak = computeStreak(activities);
  const heatmapLevels = computeHeatmapLevels(activities, 30);
  const weekActivity = getCurrentWeekActivity(activities);
  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

  useEffect(() => {
    Promise.all([supabaseService.getCollection(), supabaseService.getActivities()]).then(
      ([collectionData, activityData]) => {
        setCollection(collectionData);
        setActivities(activityData);
        setLoading(false);
      }
    );
  }, []);

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-6 md:p-16 max-w-container-max mx-auto w-full pb-28 md:pb-16">
        <header className="mb-12 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
          <div>
            <h2 className="font-plus-jakarta text-3xl md:text-5xl text-on-background mb-2 font-bold">
              Welcome Back, <span className="text-gradient-cyan animate-pulse-slow">Nina</span>
            </h2>
            <p className="font-manrope text-base md:text-lg text-on-surface-variant">
              Here is your overview for today.
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/library"
              className="glass-panel px-6 py-3 rounded-full flex items-center gap-2 hover:bg-surface-variant/30 transition-all border border-outline-variant/20 hover:border-primary/45 group"
            >
              <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">add</span>
              <span className="font-label-md text-sm text-primary font-bold">New Entry</span>
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-16">
          <div className="glass-panel p-6 rounded-xl flex flex-col gap-4 relative overflow-hidden group card-glow bg-surface-container-low/40">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary-container/10 rounded-full blur-2xl group-hover:bg-primary-container/20 transition-all"></div>
            <div className="flex justify-between items-start">
              <span className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider font-bold">Total Entries</span>
              <span className="material-symbols-outlined text-outline">library_books</span>
            </div>
            <div>
              <span className="font-plus-jakarta text-3xl font-bold text-on-surface">
                {loading ? "--" : totalEntries}
              </span>
              <div className="flex items-center gap-1 text-primary text-xs mt-1 font-bold">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span>Active records</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl flex flex-col gap-4 relative overflow-hidden group card-glow bg-surface-container-low/40">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-secondary/10 rounded-full blur-2xl group-hover:bg-secondary/20 transition-all"></div>
            <div className="flex justify-between items-start">
              <span className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider font-bold">Completed</span>
              <span className="material-symbols-outlined text-secondary">task_alt</span>
            </div>
            <div>
              <span className="font-plus-jakarta text-3xl font-bold text-on-surface">
                {loading ? "--" : completedCount}
              </span>
              <div className="w-full bg-surface-container-highest h-1 mt-3 rounded-full overflow-hidden">
                <div
                  className="bg-secondary h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalEntries > 0 ? (completedCount / totalEntries) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl flex flex-col gap-4 relative overflow-hidden group card-glow border-primary/20 bg-primary-container/5">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary-container/20 rounded-full blur-xl group-hover:bg-primary-container/30 transition-all"></div>
            <div className="flex justify-between items-start">
              <span className="font-label-md text-xs text-primary uppercase tracking-wider font-bold">Watching</span>
              <span className="material-symbols-outlined text-primary-container">live_tv</span>
            </div>
            <div>
              <span className="font-plus-jakarta text-3xl font-bold text-on-surface">
                {loading ? "--" : watchingCount}
              </span>
              <p className="text-xs text-on-surface-variant mt-1 font-semibold">Active series</p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl flex flex-col gap-4 relative overflow-hidden group card-glow bg-surface-container-low/40">
            <div className="flex justify-between items-start">
              <span className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider font-bold">Reading</span>
              <span className="material-symbols-outlined text-outline">menu_book</span>
            </div>
            <div>
              <span className="font-plus-jakarta text-3xl font-bold text-on-surface">
                {loading ? "--" : readingCount}
              </span>
              <p className="text-xs text-on-surface-variant mt-1 font-semibold">Active reading</p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl flex flex-col gap-4 relative overflow-hidden group card-glow bg-surface-container-low/40">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-error/10 rounded-full blur-2xl group-hover:bg-error/20 transition-all"></div>
            <div className="flex justify-between items-start">
              <span className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider font-bold">Favorites</span>
              <span className="material-symbols-outlined text-error">favorite</span>
            </div>
            <div>
              <span className="font-plus-jakarta text-3xl font-bold text-on-surface">
                {loading ? "--" : favoritesCount}
              </span>
              <p className="text-xs text-on-surface-variant mt-1 font-semibold">Score &ge; 8.5</p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="flex justify-between items-end mb-6">
            <h3 className="font-plus-jakarta text-xl md:text-2xl text-on-surface font-bold">Dive Back In</h3>
            <Link
              href="/library"
              className="font-label-md text-xs text-primary hover:text-primary-container transition-colors flex items-center gap-1 uppercase tracking-wider font-bold"
            >
              View All <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-panel rounded-xl h-40 animate-pulse bg-surface-container/20" />
              ))}
            </div>
          ) : activeSeries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeSeries.slice(0, 3).map((item) => {
                const percentage = Math.min(100, Math.max(0, (item.progress_current / item.progress_total) * 100));
                return (
                  <div key={item.id} className="glass-panel rounded-xl overflow-hidden card-glow group flex h-40 bg-surface-container-low/40">
                    <div className="w-28 h-full shrink-0 relative">
                      <img alt={item.title} className="w-full h-full object-cover" src={item.cover_image} />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background"></div>
                    </div>
                    <div className="p-5 flex flex-col justify-between flex-1 relative z-10">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border border-primary/20">
                            {item.type}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            {item.type === "Anime" ? `Ep ${item.progress_current} / ${item.progress_total}` : `Vol ${item.progress_current} / ${item.progress_total}`}
                          </span>
                        </div>
                        <h4 className="font-plus-jakarta text-md leading-tight text-on-surface group-hover:text-primary transition-colors line-clamp-2 font-semibold">
                          {item.title}
                        </h4>
                      </div>
                      <div className="mt-4">
                        <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                          <div className="progress-bar-fill h-full rounded-full relative" style={{ width: `${percentage}%` }}>
                            <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/20 blur-sm"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel rounded-xl p-8 text-center border border-outline-variant/15">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-2">
                live_tv
              </span>
              <p className="font-manrope text-sm text-on-surface-variant">No active series currently in progress.</p>
              <Link href="/library" className="text-primary hover:underline text-xs mt-2 block font-bold">
                Browse Library
              </Link>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <section className="lg:col-span-2 glass-panel p-8 rounded-2xl bg-surface-container-low/40">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-plus-jakarta text-xl text-on-surface font-bold">Recent Activity</h3>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-xl bg-surface-container/20 animate-pulse" />
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[19px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-outline-variant/30 before:to-transparent">
                {recentActivities.map((activity, idx) => {
                  const isPrimary = idx === 0;
                  const isCompleted = activity.action === "completed_series";
                  return (
                    <div
                      key={activity.id}
                      className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
                    >
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${
                          isPrimary
                            ? "border-2 border-primary bg-background shadow-[0_0_10px_rgba(0,229,255,0.3)]"
                            : "border border-outline-variant/50 bg-surface-container-highest"
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-[18px] ${
                            isPrimary ? "text-primary" : isCompleted ? "text-secondary" : "text-on-surface-variant"
                          }`}
                          style={{ fontVariationSettings: isPrimary ? "'FILL' 1" : undefined }}
                        >
                          {getActivityIcon(activity.action)}
                        </span>
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest/40 backdrop-blur-sm group-hover:border-primary/30 transition-colors">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[10px] text-on-surface-variant mb-1 uppercase tracking-wider font-bold">
                            <span className={isCompleted ? "text-secondary" : ""}>{getActivityLabel(activity.action)}</span>
                            <span className="normal-case font-normal opacity-70">{formatRelativeTime(activity.created_at)}</span>
                          </div>
                          <strong className="font-plus-jakarta text-sm text-on-surface font-bold">{activity.title}</strong>
                          <span className={`text-xs ${isCompleted ? "text-on-surface-variant" : "text-secondary"}`}>
                            {activity.detail}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3 block">
                  history
                </span>
                <p className="font-manrope text-sm text-on-surface-variant">No activity yet.</p>
                <p className="font-manrope text-xs text-on-surface-variant/70 mt-1">
                  Your watch and read history will appear here as you track progress.
                </p>
              </div>
            )}
          </section>

          <section className="lg:col-span-1 flex flex-col gap-6">
            <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden card-glow bg-surface-container-low/40">
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-container to-transparent"></div>
              <div className="w-20 h-20 rounded-full bg-primary-container/10 flex items-center justify-center mb-4 border border-primary/20 shadow-[0_0_30px_rgba(0,229,255,0.15)] relative">
                <span className="material-symbols-outlined text-[36px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  local_fire_department
                </span>
                {streak > 0 && (
                  <>
                    <div className="absolute -top-2 left-2 w-1.5 h-1.5 bg-primary rounded-full opacity-50 animate-ping"></div>
                    <div className="absolute top-4 -right-1 w-2 h-2 bg-primary rounded-full opacity-30 animate-pulse"></div>
                  </>
                )}
              </div>
              <h3 className="font-plus-jakarta text-3xl font-bold text-on-surface mb-1">
                {loading ? "--" : streak} <span className="text-xl text-on-surface-variant font-normal">Days</span>
              </h3>
              <p className="font-manrope text-xs text-on-surface-variant">Current Activity Streak</p>
              <div className="mt-6 flex items-center gap-2">
                {weekDays.map((day, idx) => (
                  <span
                    key={idx}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                      weekActivity[idx]
                        ? "bg-primary-container text-on-primary-container border-primary shadow-[0_0_10px_rgba(0,229,255,0.5)]"
                        : "bg-surface-container-highest/50 text-on-surface-variant/50 border-outline-variant/30"
                    }`}
                  >
                    {day}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl flex-1 card-glow bg-surface-container-low/40">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-plus-jakarta text-sm text-on-surface font-bold">Activity Map</h3>
                <span className="text-[10px] text-on-surface-variant opacity-70">Last 30 Days</span>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {heatmapLevels.map((level, idx) => (
                  <div key={idx} className={`aspect-square rounded-sm ${getHeatmapCellClass(level)}`} />
                ))}
              </div>
              <div className="flex justify-between items-center mt-4 text-[9px] text-on-surface-variant uppercase tracking-wider opacity-60 font-bold">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-sm bg-surface-container-highest"></div>
                  <div className="w-3 h-3 rounded-sm bg-primary/20"></div>
                  <div className="w-3 h-3 rounded-sm bg-primary/40"></div>
                  <div className="w-3 h-3 rounded-sm bg-primary/80"></div>
                  <div className="w-3 h-3 rounded-sm bg-primary/100"></div>
                </div>
                <span>More</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

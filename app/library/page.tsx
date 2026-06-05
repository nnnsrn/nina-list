"use client";

import Navbar from "@/components/Navbar";
import { Suspense, useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { MEDIA_TYPES, supabaseService, CollectionItem, MediaType, MediaTypeFilter } from "@/lib/supabaseService";

type JikanRecommendation = {
  id: number;
  title: string;
  url: string;
  image: string;
  genres: string[];
  synopsis: string;
  score: number | null;
  episodes: number | null;
  chapters: number | null;
  jikanType: string;
};

function LibraryPageContent() {
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<MediaTypeFilter>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Watching" | "Completed" | "Plan to Watch">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [, startTransition] = useTransition();
  const searchParams = useSearchParams();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CollectionItem | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<MediaType>("Anime");
  const [newStatus, setNewStatus] = useState<"Watching" | "Completed" | "Plan to Watch">("Watching");
  const [newGenre, setNewGenre] = useState("");
  const [newRating, setNewRating] = useState("0");
  const [newProgressCurrent, setNewProgressCurrent] = useState("0");
  const [newProgressTotal, setNewProgressTotal] = useState("12");
  const [newCoverImage, setNewCoverImage] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [recommendations, setRecommendations] = useState<JikanRecommendation[]>([]);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadData = () => {
    supabaseService.getCollection().then((data) => {
      setCollection(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
    fetch("/api/admin/check", {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        setIsAdmin(data.loggedIn);
      })
      .catch(() => {
        setIsAdmin(false);
      });
  }, []);

  useEffect(() => {
    const requestedType = searchParams.get("type");
    if (requestedType === "Anime" || requestedType === "Manga" || requestedType === "Manhwa" || requestedType === "Manhua") {
      startTransition(() => {
        setTypeFilter(requestedType);
      });
    }
  }, [searchParams, startTransition]);

  useEffect(() => {
    const query = newTitle.trim();

    if (query.length < 2) {
      startTransition(() => {
        setRecommendations([]);
        setRecommendationLoading(false);
      });
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setRecommendationLoading(true);
      try {
        const response = await fetch(
          `/api/jikan/search?q=${encodeURIComponent(query)}&type=${newType}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch recommendations");
        }

        const data = await response.json();
        setRecommendations(Array.isArray(data.results) ? data.results : []);
      } catch {
        setRecommendations([]);
      } finally {
        setRecommendationLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [newTitle, newType]);

  const handleIncrementProgress = async (id: number, current: number, total: number) => {
    if (!isAdmin || current >= total) return;
    const nextVal = current + 1;
    await supabaseService.updateCollectionProgress(id, nextVal);
    loadData();
  };

  const handleUpdateRating = async (id: number, rating: number) => {
    if (!isAdmin) return;
    await supabaseService.updateCollectionRating(id, rating);
    loadData();
  };

  const handleStartEdit = (item: CollectionItem) => {
    setEditingItem(item);
    setNewTitle(item.title);
    setNewType(item.type);
    setNewStatus(item.status);
    setNewGenre(item.genre);
    setNewRating(String(item.rating));
    setNewProgressCurrent(String(item.progress_current));
    setNewProgressTotal(String(item.progress_total));
    setNewCoverImage(item.cover_image);
    setNewDescription("");
    setRecommendations([]);
    setIsModalOpen(true);
  };

  const handleDeleteEntry = async (id: number, title: string) => {
    if (!isAdmin) return;
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      setLoading(true);
      const deleted = await supabaseService.deleteCollectionItem(id);
      if (!deleted) {
        alert("Failed to delete this entry. Please try again while signed in as admin.");
      }
      loadData();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setNewTitle("");
    setNewType("Anime");
    setNewStatus("Watching");
    setNewGenre("");
    setNewRating("0");
    setNewProgressCurrent("0");
    setNewProgressTotal("12");
    setNewCoverImage("");
    setNewDescription("");
    setRecommendations([]);
  };

  // Handle submit new item or editing item
  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Use a cool default ocean-themed fallback image based on type
    const fallbackImage = newType === "Anime"
      ? "https://lh3.googleusercontent.com/aida-public/AB6AXuAQqlNGdgniLM2NOUdEfWXJhUOFnfz0EbcXWry0xcAb7Y2c_STOqLkJwhxVgSds402efYqFF8Zldq0SyPzitQUeEllqpatNUsxIFoWEd8LXshxHZuwe3UU-lF38R7uM_-RPBfeWIQ-gFsQKudIHCMzyB4HyujlTmdMGA36_IfUPJZMCu0kN80JIbxgMHSBc1onnYWqKCck3QnNcT8ydwu_sAeMay9w6obzN4QgXK_Nu9RMDmwXMJ61LW6nl4mldmRt4Qnzf169JHmqc"
      : "https://lh3.googleusercontent.com/aida-public/AB6AXuD1NcrszxaI_dCEQSngMfiYD8MPkXlo6axOkXxVE7E2awS_glnaNDW2KThJZDDnuQv3NYHSKSfIbVf-_Osoa0EAqw7mUbIB52a-kYHZl4Elsjbag3Q8APTMKs8aNvZvoXgHKA4mG7UyEOhIW5RTff6gLX1ODe5BYUkv21q50grk87Mg_OsFoJqKjkqv_fmkOuYd6uZkDFlrVGoT55NBqk3nwqoMzdnPe1-5jRMphOGBbP0ruMbHX0Z9P0SlIhcuE8SHo8CHSZTACS5l";

    const finalCover = newCoverImage.trim() || fallbackImage;

    if (isAdmin) {
      const itemData = {
        title: newTitle,
        type: newType,
        status: newStatus,
        genre: newGenre || "Unknown",
        rating: parseFloat(newRating) || 0,
        progress_current: parseInt(newProgressCurrent) || 0,
        progress_total: parseInt(newProgressTotal) || 12,
        cover_image: finalCover,
      };

      if (editingItem) {
        const updated = await supabaseService.updateCollectionItem(editingItem.id, itemData);
        if (!updated) {
          alert("Failed to update this entry. Make sure you are signed in as admin.");
          return;
        }
      } else {
        const { item, error } = await supabaseService.addCollectionItem(itemData);
        if (!item) {
          alert(error ?? "Failed to add this entry. Make sure you are signed in as admin.");
          return;
        }
      }
      loadData();
    } else {
      const newSuggestion = {
        title: newTitle,
        type: newType,
        description: newDescription || "No description provided.",
        cover_image: finalCover,
      };

      await supabaseService.addSuggestion(newSuggestion);
      alert("Thank you! Your suggestion has been submitted successfully.");
    }

    handleCloseModal();
  };

  // Filter logic
  const filteredCollection = collection.filter((item) => {
    const matchesType = typeFilter === "All" || item.type === typeFilter;
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.genre.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const handleUseRecommendation = (recommendation: JikanRecommendation) => {
    setNewTitle(recommendation.title);
    setNewCoverImage(recommendation.image);

    if (recommendation.genres.length > 0) {
      setNewGenre(recommendation.genres.slice(0, 3).join(", "));
    }

    const totalFromJikan = newType === "Anime" ? recommendation.episodes : recommendation.chapters;
    if (typeof totalFromJikan === "number" && totalFromJikan > 0 && (newProgressTotal === "12" || newProgressTotal === "0")) {
      setNewProgressTotal(String(totalFromJikan));
    }
  };

  return (
    <>
      <Navbar />

      <main className="flex-grow pt-32 pb-24 max-w-container-max mx-auto px-6 md:px-16 w-full">
        {/* Title and Add Entry Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="font-plus-jakarta text-3xl md:text-4xl text-primary font-bold tracking-tight mb-2">
              My Collection
            </h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-primary-fixed to-primary-container text-on-primary-container font-label-md text-sm uppercase tracking-wider px-6 py-3 rounded-full flex items-center gap-2 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all font-bold hover:-translate-y-0.5"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            {isAdmin ? "Add Entry" : "Suggest Title"}
          </button>
        </div>

        {/* Filters and Search Bar Row */}
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-stretch lg:items-center mb-8 bg-surface-container/30 p-4 rounded-2xl border border-outline-variant/10 backdrop-blur-md">
          {/* Tabs for Type */}
          <div className="flex gap-2">
            {(["All", ...MEDIA_TYPES] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-4 py-2 rounded-lg font-label-md text-sm transition-all ${
                  typeFilter === type
                    ? "bg-primary-container/20 text-primary border border-primary/30 font-bold"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/20"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Filters for Status & Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center flex-1 lg:max-w-2xl">
            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setStatusFilter(e.target.value as "All" | "Watching" | "Completed" | "Plan to Watch")
              }
              className="bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl py-2 px-4 focus:outline-none focus:border-primary w-full sm:w-48 appearance-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Watching">Watching</option>
              <option value="Completed">Completed</option>
              <option value="Plan to Watch">Plan to Watch</option>
            </select>

            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search collection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-xl py-2 pl-4 pr-10 focus:outline-none focus:border-primary placeholder-on-surface-variant/50"
              />
              <span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant">
                search
              </span>
            </div>
          </div>
        </div>

        {/* Media Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-panel rounded-xl overflow-hidden h-96 animate-pulse bg-surface-container/20" />
            ))}
          </div>
        ) : filteredCollection.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredCollection.map((item) => {
              const progressPercentage = Math.min(
                100,
                Math.max(0, (item.progress_current / item.progress_total) * 100)
              );

              return (
                <div
                  key={item.id}
                  className="glass-panel rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300 group flex flex-col relative h-full bg-surface-container-low/40"
                >
                  {/* Card Cover Image */}
                  <div className="relative h-56 w-full overflow-hidden">
                    <img
                      alt={item.title}
                      className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-all duration-500"
                      src={item.cover_image}
                    />

                    {/* Admin Actions Overlay (Top Left) */}
                    {isAdmin && (
                      <div className="absolute top-3 left-3 flex gap-2 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(item);
                          }}
                          className="w-8 h-8 rounded-full bg-surface-container-lowest/95 backdrop-blur-md border border-outline-variant/30 text-on-surface hover:text-primary flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer"
                          title="Edit Entry"
                        >
                          <span className="material-symbols-outlined text-[15px] font-bold">edit</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEntry(item.id, item.title);
                          }}
                          className="w-8 h-8 rounded-full bg-surface-container-lowest/95 backdrop-blur-md border border-outline-variant/30 text-error hover:bg-error hover:text-on-error flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer"
                          title="Delete Entry"
                        >
                          <span className="material-symbols-outlined text-[15px] font-bold">delete</span>
                        </button>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3 bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/30 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.status === "Watching"
                            ? "bg-primary animate-pulse"
                            : item.status === "Completed"
                            ? "bg-secondary"
                            : "bg-outline"
                        }`}
                      />
                      <span className="text-on-surface font-semibold">{item.status}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex flex-col flex-grow justify-between gap-3">
                    <div>
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <span className="text-outline font-label-md text-xs uppercase tracking-wider truncate">
                          {item.type} • {item.genre}
                        </span>

                        {/* Rating Display */}
                        <div className="flex items-center gap-0.5 text-primary shrink-0">
                          <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                            star
                          </span>
                          <span className="font-label-md text-xs font-bold">
                            {item.rating > 0 ? item.rating.toFixed(1) : "--"}
                          </span>
                        </div>
                      </div>
                      <h3 className="font-plus-jakarta text-md font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
                        {item.title}
                      </h3>
                    </div>

                    {/* Progress Bar & Operations */}
                    <div className="mt-2 border-t border-outline-variant/10 pt-3">
                      <div className="flex justify-between items-center text-on-surface-variant font-label-md text-xs mb-2">
                        <span>Progress</span>
                        <span className="text-primary font-bold">
                          {item.progress_current} / {item.progress_total} {item.type === "Anime" ? "EP" : "VOL"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Progress Bar */}
                        <div className="flex-1 bg-surface-container-highest rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              item.status === "Completed"
                                ? "bg-secondary"
                                : "bg-gradient-to-r from-primary-fixed to-primary-container progress-glow"
                            }`}
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>

                        {isAdmin && item.status !== "Completed" && (
                          <button
                            onClick={() => handleIncrementProgress(item.id, item.progress_current, item.progress_total)}
                            className="w-7 h-7 rounded-full bg-primary-container/20 text-primary border border-primary/30 flex items-center justify-center hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-90"
                          >
                            <span className="material-symbols-outlined text-sm font-bold">add</span>
                          </button>
                        )}
                      </div>

                      {isAdmin ? (
                        <div className="flex gap-1.5 justify-end mt-3 border-t border-outline-variant/5 pt-2">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isActive = item.rating >= star * 2;
                            return (
                              <button
                                key={star}
                                onClick={() => handleUpdateRating(item.id, star * 2)}
                                className={`material-symbols-outlined text-sm hover:text-primary transition-colors ${
                                  isActive ? "text-primary-container fill-icon" : "text-outline-variant"
                                }`}
                                style={{ fontVariationSettings: isActive ? "'FILL' 1" : undefined }}
                              >
                                star
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel text-center py-20 rounded-2xl border border-outline-variant/10">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4">
              search_off
            </span>
            <h3 className="font-plus-jakarta text-xl text-on-surface mb-2 font-semibold">
              No matching collection items found
            </h3>
            <p className="font-manrope text-sm text-on-surface-variant max-w-sm mx-auto mb-6">
              Try adjusting your search query, type filters, or status selections.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setTypeFilter("All");
                setStatusFilter("All");
              }}
              className="border border-primary/35 text-primary px-5 py-2 rounded-full font-label-md text-xs hover:bg-primary/10 transition-all font-bold"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </main>      {/* Add New Entry / Suggest Title Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/85 backdrop-blur-md transition-opacity">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-primary/20 bg-surface-container-lowest animate-wave max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h2 className="font-plus-jakarta text-2xl text-primary mb-6 font-bold">
              {isAdmin ? (editingItem ? "Edit Entry" : "Add to Collection") : "Suggest New Title"}
            </h2>

            <form onSubmit={handleAddMedia} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block font-label-md text-xs text-on-surface-variant mb-1 uppercase tracking-wider font-bold">
                  Title
                </label>
                <input
                  required
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/50 rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g. Neon Genesis Evangelion..."
                />
                <div className="mt-3 space-y-2">
                  {recommendationLoading ? (
                    <p className="text-xs text-on-surface-variant">Finding matches on Jikan...</p>
                  ) : recommendations.length > 0 ? (
                    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                      {recommendations.map((recommendation, index) => (
                        <button
                          key={`${recommendation.jikanType}-${recommendation.id}-${index}`}
                          type="button"
                          onClick={() => handleUseRecommendation(recommendation)}
                          className="w-full flex items-center gap-3 text-left rounded-xl border border-outline-variant/30 bg-surface-container/60 p-2 hover:border-primary/40 hover:bg-primary-container/10 transition-all"
                        >
                          <img
                            src={recommendation.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuAQqlNGdgniLM2NOUdEfWXJhUOFnfz0EbcXWry0xcAb7Y2c_STOqLkJwhxVgSds402efYqFF8Zldq0SyPzitQUeEllqpatNUsxIFoWEd8LXshxHZuwe3UU-lF38R7uM_-RPBfeWIQ-gFsQKudIHCMzyB4HyujlTmdMGA36_IfUPJZMCu0kN80JIbxgMHSBc1onnYWqKCck3QnNcT8ydwu_sAeMay9w6obzN4QgXK_Nu9RMDmwXMJ61LW6nl4mldmRt4Qnzf169JHmqc"}
                            alt={recommendation.title}
                            className="w-12 h-16 rounded-md object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm text-on-surface font-semibold truncate">{recommendation.title}</span>
                              <span className="text-[11px] text-primary uppercase tracking-wider">Use</span>
                            </div>
                            <p className="text-[11px] text-on-surface-variant line-clamp-1">
                              {recommendation.genres.slice(0, 3).join(" • ") || recommendation.jikanType}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : newTitle.trim().length >= 2 ? (
                    <p className="text-xs text-on-surface-variant">No Jikan matches yet for that title.</p>
                  ) : null}
                </div>
              </div>

              {/* Type selection */}
              {isAdmin ? (
                /* Type & Status Grid for Admin */
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label-md text-xs text-on-surface-variant mb-1 uppercase tracking-wider font-bold">
                      Type
                    </label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as MediaType)}
                      className="w-full bg-surface-container border border-outline-variant/50 rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:border-primary appearance-none cursor-pointer"
                    >
                      {MEDIA_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-label-md text-xs text-on-surface-variant mb-1 uppercase tracking-wider font-bold">
                      Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setNewStatus(e.target.value as "Watching" | "Completed" | "Plan to Watch")
                      }
                      className="w-full bg-surface-container border border-outline-variant/50 rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:border-primary appearance-none cursor-pointer"
                    >
                      <option value="Watching">Watching</option>
                      <option value="Completed">Completed</option>
                      <option value="Plan to Watch">Plan to Watch</option>
                    </select>
                  </div>
                </div>
              ) : (
                /* Type only for Suggestion */
                <div>
                  <label className="block font-label-md text-xs text-on-surface-variant mb-1 uppercase tracking-wider font-bold">
                    Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as MediaType)}
                    className="w-full bg-surface-container border border-outline-variant/50 rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:border-primary appearance-none cursor-pointer"
                  >
                    {MEDIA_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Conditional Fields based on Admin / Suggestion */}
              {isAdmin ? (
                <>
                  {/* Genre & Rating Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label-md text-xs text-on-surface-variant mb-1 uppercase tracking-wider font-bold">
                        Genre
                      </label>
                      <input
                        type="text"
                        value={newGenre}
                        onChange={(e) => setNewGenre(e.target.value)}
                        className="w-full bg-surface-container border border-outline-variant/50 rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:border-primary transition-all"
                        placeholder="e.g. Mecha, Sci-Fi..."
                      />
                    </div>

                    <div>
                      <label className="block font-label-md text-xs text-on-surface-variant mb-1 uppercase tracking-wider font-bold">
                        Rating (0-10)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={newRating}
                        onChange={(e) => setNewRating(e.target.value)}
                        className="w-full bg-surface-container border border-outline-variant/50 rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Progress Fields Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label-md text-xs text-on-surface-variant mb-1 uppercase tracking-wider font-bold">
                        Progress Current
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newProgressCurrent}
                        onChange={(e) => setNewProgressCurrent(e.target.value)}
                        className="w-full bg-surface-container border border-outline-variant/50 rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:border-primary transition-all"
                      />
                    </div>

                    <div>
                      <label className="block font-label-md text-xs text-on-surface-variant mb-1 uppercase tracking-wider font-bold">
                        Total Episodes/Vols
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newProgressTotal}
                        onChange={(e) => setNewProgressTotal(e.target.value)}
                        className="w-full bg-surface-container border border-outline-variant/50 rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Description field for Suggestion */
                <div>
                  <label className="block font-label-md text-xs text-on-surface-variant mb-1 uppercase tracking-wider font-bold">
                    Description / Synopsis
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/50 rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:border-primary transition-all resize-none"
                    placeholder="Why should this be added? Provide a brief synopsis..."
                  />
                </div>
              )}

              {/* Cover Image Url */}
              <div>
                <label className="block font-label-md text-xs text-on-surface-variant mb-1 uppercase tracking-wider font-bold">
                  Cover Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={newCoverImage}
                  onChange={(e) => setNewCoverImage(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/50 rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:border-primary transition-all"
                  placeholder="https://images.unsplash.com/... (optional)"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/10">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg font-label-md text-sm text-on-surface hover:bg-surface-variant/40 transition-colors border border-outline-variant/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg font-label-md text-sm bg-primary text-on-primary hover:bg-primary-fixed transition-colors font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                >
                  {isAdmin ? (editingItem ? "Update Entry" : "Save Entry") : "Submit Suggestion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Public Footer */}
      <footer className="bg-surface-container-lowest relative bottom-0 w-full border-t border-outline-variant/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-6 md:px-16 py-16 max-w-container-max mx-auto">
          <div>
            <span className="font-plus-jakarta text-xl font-bold text-primary block mb-2">NinaList</span>
            <p className="font-manrope text-sm text-on-surface-variant">© {new Date().getFullYear()} NinaList. Deep dive into my collections.</p>
          </div>
          <div className="flex flex-wrap gap-6 md:justify-end items-start font-manrope text-sm">
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">API Docs</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Contact Support</a>
          </div>
        </div>
      </footer>
    </>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LibraryPageContent />
    </Suspense>
  );
}

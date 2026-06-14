"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useState, useTransition } from "react";
import { MEDIA_TYPES, supabaseService, Suggestion, MediaType, MediaTypeFilter } from "@/lib/supabaseService";

interface JikanRecommendation {
  id: number;
  title: string;
  image: string;
  synopsis: string;
  genres: string[];
  episodes?: number;
  chapters?: number;
  jikanType: string;
}

export default function CommunityPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MediaTypeFilter>("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<MediaType>("Anime");
  const [newDescription, setNewDescription] = useState("");
  const [newCoverImage, setNewCoverImage] = useState("");
  const [recommendations, setRecommendations] = useState<JikanRecommendation[]>([]);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [, startRecommendationTransition] = useTransition();

  const loadData = () => {
    supabaseService.getSuggestions().then((data) => {
      setSuggestions(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Jikan API Search logic
  useEffect(() => {
    if (newTitle.trim().length < 2) {
      startRecommendationTransition(() => {
        setRecommendations([]);
      });
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setRecommendationLoading(true);
      try {
        const queryType = newType === "Anime" ? "anime" : "manga";
        const res = await fetch(`/api/jikan/search?q=${encodeURIComponent(newTitle)}&type=${queryType}`);
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.results || []);
        }
      } catch (err) {
        console.error("Jikan API error:", err);
      } finally {
        setRecommendationLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [newTitle, newType]);

  const handleUseRecommendation = (recommendation: JikanRecommendation) => {
    setNewTitle(recommendation.title);
    setNewCoverImage(recommendation.image);
    setNewDescription(recommendation.synopsis || "");
    setRecommendations([]);
  };

  // Handle Upvote action
  const handleUpvote = async (id: number) => {
    const nextVotes = await supabaseService.voteSuggestion(id);
    if (nextVotes !== null) {
      setSuggestions((prev) =>
        prev
          .map((s) => (s.id === id ? { ...s, votes: nextVotes } : s))
          .sort((a, b) => b.votes - a.votes)
      );
    }
  };

  // Handle Submit Suggestion
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Default covers based on type
    const fallbackImage = newType === "Anime"
      ? "https://lh3.googleusercontent.com/aida-public/AB6AXuAQqlNGdgniLM2NOUdEfWXJhUOFnfz0EbcXWry0xcAb7Y2c_STOqLkJwhxVgSds402efYqFF8Zldq0SyPzitQUeEllqpatNUsxIFoWEd8LXshxHZuwe3UU-lF38R7uM_-RPBfeWIQ-gFsQKudIHCMzyB4HyujlTmdMGA36_IfUPJZMCu0kN80JIbxgMHSBc1onnYWqKCck3QnNcT8ydwu_sAeMay9w6obzN4QgXK_Nu9RMDmwXMJ61LW6nl4mldmRt4Qnzf169JHmqc"
      : "https://lh3.googleusercontent.com/aida-public/AB6AXuD1NcrszxaI_dCEQSngMfiYD8MPkXlo6axOkXxVE7E2awS_glnaNDW2KThJZDDnuQv3NYHSKSfIbVf-_Osoa0EAqw7mUbIB52a-kYHZl4Elsjbag3Q8APTMKs8aNvZvoXgHKA4mG7UyEOhIW5RTff6gLX1ODe5BYUkv21q50grk87Mg_OsFoJqKjkqv_fmkOuYd6uZkDFlrVGoT55NBqk3nwqoMzdnPe1-5jRMphOGBbP0ruMbHX0Z9P0SlIhcuE8SHo8CHSZTACS5l";

    const newSuggestion = {
      title: newTitle,
      type: newType,
      description: newDescription,
      cover_image: newCoverImage.trim() || fallbackImage,
    };

    await supabaseService.addSuggestion(newSuggestion);
    loadData();

    // Reset Form
    setNewTitle("");
    setNewDescription("");
    setNewCoverImage("");
    setRecommendations([]);
    setIsModalOpen(false);
  };

  // Filter Suggestions
  const filteredSuggestions = suggestions
    .filter((s) => {
      const matchesType = typeFilter === "All" || s.type === typeFilter;
      const matchesSearch =
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    })
    .sort((a, b) => b.votes - a.votes);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-6 md:p-16 max-w-container-max mx-auto w-full pb-28 md:pb-16">
        {/* Header Section */}
        <header className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
          <div>
            <h2 className="font-plus-jakarta text-3xl md:text-4xl text-on-background mb-2 font-bold">
              Community <span className="text-gradient-cyan">Suggestions</span>
            </h2>
            <p className="font-manrope text-sm md:text-base text-on-surface-variant">
              Suggest and vote on what to add next to my list.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-4 w-full md:w-auto">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full md:w-auto bg-linear-to-r from-primary-fixed to-primary-container text-on-primary-container font-label-md text-sm uppercase tracking-wider px-6 py-3 rounded-full flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all font-bold hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Suggest Title
            </button>
          </div>
        </header>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between mb-8 bg-surface-container/30 p-4 rounded-xl border border-outline-variant/10 backdrop-blur-md">
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

          {/* Search Input */}
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Search suggestions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/35 text-on-surface rounded-xl py-2 pl-4 pr-10 focus:outline-none focus:border-primary placeholder-on-surface-variant/50"
            />
            <span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant">
              search
            </span>
          </div>
        </div>

        {/* Suggestions list */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-panel rounded-2xl h-44 animate-pulse bg-surface-container/20" />
            ))}
          </div>
        ) : filteredSuggestions.length > 0 ? (
          <div className="space-y-6">
            {filteredSuggestions.map((item) => (
              <div
                key={item.id}
                className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-center relative overflow-hidden group hover:border-primary/20 transition-all duration-300 bg-surface-container-low/40"
              >
                {/* Voting Container */}
                <div className="flex flex-row md:flex-col items-center justify-center gap-2 shrink-0 self-stretch border-r border-outline-variant/10 pr-6">
                  <button
                    onClick={() => handleUpvote(item.id)}
                    className="w-12 h-12 rounded-full bg-primary-container/10 border border-primary/30 text-primary flex items-center justify-center hover:bg-primary-container hover:text-on-primary-container hover:scale-110 active:scale-90 transition-all duration-200"
                  >
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                      arrow_upward
                    </span>
                  </button>
                  <div className="text-center">
                    <span className="font-plus-jakarta text-lg font-bold text-on-surface">
                      {item.votes.toLocaleString()}
                    </span>
                    <p className="font-manrope text-[10px] text-on-surface-variant uppercase tracking-wider block md:-mt-1">
                      Votes
                    </p>
                  </div>
                </div>

                {/* Suggestion Card Content */}
                <img
                  alt={item.title}
                  className="w-full md:w-24 md:h-32 h-40 object-cover rounded-xl border border-outline-variant/20 shadow-md group-hover:scale-102 transition-transform duration-500"
                  src={item.cover_image}
                />

                <div className="flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/30 text-secondary font-label-md text-[11px] border border-secondary/20 font-bold">
                      {item.type}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-label-md text-[11px] font-bold ${
                        item.status === "Added to Library"
                          ? "bg-secondary/20 text-secondary border border-secondary/35"
                          : "bg-surface-variant/80 text-on-surface-variant"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <h3 className="font-plus-jakarta text-xl font-semibold text-on-surface group-hover:text-primary transition-colors mb-2">
                    {item.title}
                  </h3>
                  <p className="font-manrope text-sm text-on-surface-variant leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel text-center py-20 rounded-2xl border border-outline-variant/10">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4">
              explore_off
            </span>
            <h3 className="font-plus-jakarta text-xl text-on-surface mb-2 font-semibold">
              No suggestions found
            </h3>
            <p className="font-manrope text-sm text-on-surface-variant max-w-sm mx-auto mb-6">
              Be the first to submit this title to the community suggestions box!
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-label-md text-xs hover:bg-primary-fixed transition-all font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]"
            >
              Suggest Title Now
            </button>
          </div>
        )}
      </main>

      {/* Suggest Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/85 backdrop-blur-md transition-opacity">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-primary/20 bg-surface-container-lowest animate-wave max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h2 className="font-plus-jakarta text-2xl text-primary mb-6 font-bold">Suggest New Title</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="e.g. Ocean Waves..."
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

              {/* Type */}
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

              {/* Description */}
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
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-label-md text-sm text-on-surface hover:bg-surface-variant/40 transition-colors border border-outline-variant/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg font-label-md text-sm bg-primary text-on-primary hover:bg-primary-fixed transition-colors font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                >
                  Submit Suggestion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

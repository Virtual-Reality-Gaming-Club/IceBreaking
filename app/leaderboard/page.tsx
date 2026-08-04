"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Trophy, Sparkles, Crown, X } from "lucide-react";

const PAGE_SIZE = 25;

interface ParticipantItem {
  id: string;
  registrationNumber: string;
  fullName: string;
  totalScore?: number;
}

export default function PublicLeaderboardPage() {
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Realtime subscription — participants sorted on arrival, no re-sort in derived data
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "participants"), (snapshot) => {
      const list: ParticipantItem[] = [];
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          registrationNumber: docSnap.id,
          fullName: data.fullName || "Participant",
          totalScore: Number(data.totalScore) || 0,
        });
      });
      list.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
      setParticipants(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Debounced search input handler
  const handleSearchChange = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      setVisibleCount(PAGE_SIZE); // reset pagination on search
    }, 150);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const toggleSearch = useCallback(() => {
    const next = !searchExpanded;
    setSearchExpanded(next);
    if (next) {
      setTimeout(() => searchInputRef.current?.focus(), 250);
    } else {
      setSearch("");
      setVisibleCount(PAGE_SIZE);
    }
  }, [searchExpanded]);

  // Memoized: full filtered list (searches ALL participants)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return participants;
    return participants.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.registrationNumber.toLowerCase().includes(q)
    );
  }, [participants, search]);

  // Podium top 3 — derived from filtered list
  const top1 = useMemo(() => (!search ? participants[0] : filtered[0]), [participants, filtered, search]);
  const top2 = useMemo(() => (!search ? participants[1] : filtered[1]), [participants, filtered, search]);
  const top3 = useMemo(() => (!search ? participants[2] : filtered[2]), [participants, filtered, search]);

  // Visible slice for the ranked list below the podium
  const visibleList = useMemo(() => {
    if (search) {
      // When searching, show all matches (no podium shown)
      return filtered.slice(0, visibleCount);
    }
    // Normal mode: show from rank 4 onward, paginated
    return participants.slice(3, visibleCount + 3);
  }, [participants, filtered, search, visibleCount]);

  const totalToShow = search ? filtered.length : participants.length - 3;
  const hasMore = visibleCount < totalToShow;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col bg-transparent text-slate-100 font-sans overflow-x-hidden">

      <PublicNavbar />

      {/* Floating search cluster */}
      <div className="fixed top-16 left-0 right-0 z-40 pointer-events-none">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 relative">
          <div className="absolute right-3 sm:right-4 top-2 flex items-center gap-2 pointer-events-auto">
            <div
              className={`overflow-hidden transition-[width,opacity] duration-300 ${
                searchExpanded ? "w-44 sm:w-64 opacity-100" : "w-0 opacity-0"
              }`}
            >
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search name or reg no..."
                defaultValue=""
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/90 border border-violet-400/50 text-white text-xs font-semibold outline-none backdrop-blur-xl shadow-xl placeholder:text-slate-500"
              />
            </div>

            <button
              onClick={toggleSearch}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer backdrop-blur-md shadow-lg ${
                searchExpanded
                  ? "bg-violet-600 border border-violet-400 text-white"
                  : "bg-white/10 border border-white/20 text-white hover:bg-white/20"
              }`}
              title={searchExpanded ? "Close search" : "Search participants"}
            >
              {searchExpanded ? <X size={16} /> : <Search size={16} />}
            </button>
          </div>
        </div>
      </div>

      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 pt-24 sm:pt-28 pb-16">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-2">
            VRGC · VIT BHOPAL UNIVERSITY
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-3 flex items-center justify-center gap-2 sm:gap-3">
            <span>Live Leaderboard</span>
            <Trophy className="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" size={32} />
          </h1>
          <p className="text-slate-400 text-sm font-medium mb-4">
            Glitch Fest 2026 Official Realtime Participant Standings
          </p>

          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold text-xs px-4 py-1.5 animate-pulse inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span>{participants.length} Ranked Participants</span>
          </Badge>
        </div>

        {/* Loading / Empty */}
        {loading ? (
          <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl">
            <Sparkles className="mx-auto text-violet-400 mb-3 animate-spin" size={32} />
            <p className="text-slate-400 text-sm font-bold">Loading Live Rankings...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-dashed border-white/10 backdrop-blur-2xl">
            <Trophy className="mx-auto text-slate-600 mb-3" size={36} />
            <h3 className="text-base font-bold text-white mb-1">No Standings Found</h3>
            <p className="text-slate-400 text-xs">
              {search ? "No participant matched your search criteria." : "No scores recorded yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">

            {/* TOP 3 PODIUM — only when not searching */}
            {!search && top1 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-6 items-end pt-2 sm:pt-4 pb-2">

                {/* Silver - Rank 2 */}
                {top2 ? (
                  <Card className="group relative bg-white/[0.03] border-slate-300/30 p-3 sm:p-6 backdrop-blur-3xl rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center text-center hover:border-slate-300/60 transition-colors order-1 ring-1 ring-white/[0.05]">
                    <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-200 via-slate-300 to-slate-500 text-slate-950 font-black flex items-center justify-center text-[10px] sm:text-base shadow-lg shadow-slate-400/20 mb-1.5 sm:mb-3">
                      🥈 #2
                    </div>
                    <h3 className="text-[10px] sm:text-lg font-black text-white mb-0.5 tracking-tight line-clamp-1 break-all sm:break-normal w-full">{top2.fullName}</h3>
                    <span className="text-[8px] sm:text-xs font-mono text-slate-400 font-bold mb-1.5 sm:mb-4 truncate max-w-full">{top2.registrationNumber}</span>
                    <Badge className="bg-slate-300/15 text-slate-200 border-slate-300/40 font-black text-[9px] sm:text-xs px-1.5 sm:px-4 py-0.5 sm:py-1.5 backdrop-blur-md">
                      {top2.totalScore || 0} PTS
                    </Badge>
                  </Card>
                ) : <div />}

                {/* Gold - Rank 1 */}
                <Card className="group relative bg-amber-500/10 border-amber-400/50 p-3 sm:p-8 backdrop-blur-3xl rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center text-center hover:border-amber-300 transition-colors order-2 ring-1 ring-amber-400/40 -translate-y-1.5 sm:-translate-y-2">
                  <div className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 px-2 sm:px-3.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-extrabold text-[7px] sm:text-[10px] uppercase tracking-widest shadow-md flex items-center gap-1 whitespace-nowrap">
                    <Crown size={8} className="fill-current hidden sm:inline" />
                    <span>CHAMPION</span>
                  </div>
                  <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 text-slate-950 font-black flex items-center justify-center text-xs sm:text-xl shadow-xl shadow-amber-500/40 mb-1.5 sm:mb-3">
                    👑 #1
                  </div>
                  <h3 className="text-xs sm:text-xl font-black text-amber-200 mb-0.5 tracking-tight line-clamp-1 break-all sm:break-normal w-full">{top1.fullName}</h3>
                  <span className="text-[8px] sm:text-xs font-mono text-amber-400/80 font-bold mb-1.5 sm:mb-4 truncate max-w-full">{top1.registrationNumber}</span>
                  <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 border-amber-300 font-black text-[10px] sm:text-sm px-2 sm:px-5 py-0.5 sm:py-1.5 shadow-lg shadow-amber-400/20">
                    {top1.totalScore || 0} PTS
                  </Badge>
                </Card>

                {/* Bronze - Rank 3 */}
                {top3 ? (
                  <Card className="group relative bg-white/[0.03] border-amber-700/40 p-3 sm:p-6 backdrop-blur-3xl rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center text-center hover:border-amber-700/70 transition-colors order-3 ring-1 ring-white/[0.05]">
                    <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-amber-100 font-black flex items-center justify-center text-[10px] sm:text-base shadow-lg shadow-amber-900/30 mb-1.5 sm:mb-3">
                      🥉 #3
                    </div>
                    <h3 className="text-[10px] sm:text-lg font-black text-white mb-0.5 tracking-tight line-clamp-1 break-all sm:break-normal w-full">{top3.fullName}</h3>
                    <span className="text-[8px] sm:text-xs font-mono text-amber-600/80 font-bold mb-1.5 sm:mb-4 truncate max-w-full">{top3.registrationNumber}</span>
                    <Badge className="bg-amber-700/20 text-amber-300 border-amber-700/40 font-black text-[9px] sm:text-xs px-1.5 sm:px-4 py-0.5 sm:py-1.5 backdrop-blur-md">
                      {top3.totalScore || 0} PTS
                    </Badge>
                  </Card>
                ) : <div />}
              </div>
            )}

            {/* RANKED LIST */}
            <Card className="bg-white/[0.02] border-white/[0.08] p-4 sm:p-6 backdrop-blur-3xl rounded-2xl sm:rounded-3xl shadow-2xl ring-1 ring-white/[0.04]">
              {visibleList.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {visibleList.map((item, idx) => {
                    const actualRank = search
                      ? participants.findIndex((p) => p.registrationNumber === item.registrationNumber) + 1
                      : idx + 4;

                    return (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-violet-400/50 hover:bg-violet-500/10 transition-colors flex-wrap gap-2 sm:gap-3 backdrop-blur-md"
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center font-black text-xs text-violet-300 group-hover:bg-violet-600 group-hover:text-white transition-colors shrink-0">
                            #{actualRank}
                          </div>
                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-white m-0 leading-snug group-hover:text-violet-200 transition-colors">
                              {item.fullName}
                            </h4>
                            <span className="text-xs font-mono text-violet-400/90 font-semibold block mt-0.5">
                              {item.registrationNumber}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-lg sm:text-xl font-black text-sky-400 block leading-none">
                            {item.totalScore || 0}
                          </span>
                          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">PTS</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8 text-sm">
                  {search ? "No results found." : "No more participants to show."}
                </p>
              )}

              {/* Load More */}
              {hasMore && (
                <div className="mt-4 sm:mt-6 text-center">
                  <button
                    onClick={handleLoadMore}
                    className="px-6 py-3 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-violet-500/15 hover:border-violet-400/40 text-slate-300 hover:text-white font-bold text-sm transition-colors cursor-pointer min-h-[44px]"
                  >
                    Load 25 More ({Math.min(PAGE_SIZE, totalToShow - visibleCount)} remaining of {totalToShow - visibleCount})
                  </button>
                </div>
              )}
            </Card>

          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { VideoBackground } from "@/components/ui/VideoBackground";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Trophy, Sparkles, Crown, Award, Medal } from "lucide-react";

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

  // Realtime subscription to Firestore 'participants' collection
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

      // Sort descending by score
      list.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
      setParticipants(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return participants;
    return participants.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.registrationNumber.toLowerCase().includes(q)
    );
  }, [participants, search]);

  const top1 = filtered[0];
  const top2 = filtered[1];
  const top3 = filtered[2];
  const remaining = filtered.slice(3);

  return (
    <div className="relative min-h-screen flex flex-col bg-[#05070e] text-slate-100 font-sans overflow-x-hidden">
      <VideoBackground />
      <PublicNavbar />

      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 pt-28 pb-16">
        
        {/* HEADER SECTION */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-2">
            VRGC · VIT BHOPAL UNIVERSITY
          </p>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3 flex items-center justify-center gap-3">
            <span>Live Leaderboard</span>
            <Trophy className="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" size={38} />
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            Glitch Fest 2026 Official Realtime Participant Standings
          </p>
        </div>

        {/* SEARCH BAR & META STATS */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or registration number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 focus:border-violet-400/60 text-white font-medium text-sm outline-none transition-all placeholder:text-slate-500 backdrop-blur-xl shadow-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold text-xs px-3.5 py-2 animate-pulse flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span>{participants.length} Ranked Participants</span>
            </Badge>
          </div>
        </div>

        {/* LOADING SKELETON */}
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
          <div className="space-y-8">
            
            {/* TOP 3 PODIUM CARDS */}
            {!search && top1 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4 pb-2">
                
                {/* Silver - Rank 2 */}
                {top2 ? (
                  <Card className="group relative bg-white/[0.03] border-slate-300/30 p-6 backdrop-blur-3xl rounded-3xl flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(203,213,225,0.08)] hover:shadow-[0_0_40px_rgba(203,213,225,0.2)] hover:border-slate-300/60 transition-all duration-300 order-2 md:order-1 ring-1 ring-white/[0.05]">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-200 via-slate-300 to-slate-500 text-slate-950 font-black flex items-center justify-center text-base shadow-lg shadow-slate-400/20 mb-3 group-hover:scale-110 transition-transform">
                      🥈 #2
                    </div>
                    <h3 className="text-lg font-black text-white mb-0.5 tracking-tight">{top2.fullName}</h3>
                    <span className="text-xs font-mono text-slate-400 font-bold mb-4">{top2.registrationNumber}</span>
                    <Badge className="bg-slate-300/15 text-slate-200 border-slate-300/40 font-black text-xs px-4 py-1.5 backdrop-blur-md">
                      {top2.totalScore || 0} PTS
                    </Badge>
                  </Card>
                ) : <div />}

                {/* Gold - Rank 1 */}
                <Card className="group relative bg-amber-500/10 border-amber-400/50 p-8 backdrop-blur-3xl rounded-3xl flex flex-col items-center justify-center text-center shadow-[0_0_60px_rgba(245,158,11,0.25)] hover:shadow-[0_0_80px_rgba(245,158,11,0.45)] hover:border-amber-300 transition-all duration-300 order-1 md:order-2 ring-1 ring-amber-400/40 -translate-y-2">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-extrabold text-[10px] uppercase tracking-widest shadow-md flex items-center gap-1">
                    <Crown size={12} className="fill-current" />
                    <span>CHAMPION</span>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 text-slate-950 font-black flex items-center justify-center text-xl shadow-xl shadow-amber-500/40 mb-3 group-hover:scale-110 transition-transform">
                    👑 #1
                  </div>
                  <h3 className="text-xl font-black text-amber-200 mb-0.5 tracking-tight">{top1.fullName}</h3>
                  <span className="text-xs font-mono text-amber-400/80 font-bold mb-4">{top1.registrationNumber}</span>
                  <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 border-amber-300 font-black text-sm px-5 py-1.5 shadow-lg shadow-amber-400/20">
                    {top1.totalScore || 0} PTS
                  </Badge>
                </Card>

                {/* Bronze - Rank 3 */}
                {top3 ? (
                  <Card className="group relative bg-white/[0.03] border-amber-700/40 p-6 backdrop-blur-3xl rounded-3xl flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(180,83,9,0.08)] hover:shadow-[0_0_40px_rgba(180,83,9,0.2)] hover:border-amber-700/70 transition-all duration-300 order-3 ring-1 ring-white/[0.05]">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-amber-100 font-black flex items-center justify-center text-base shadow-lg shadow-amber-900/30 mb-3 group-hover:scale-110 transition-transform">
                      🥉 #3
                    </div>
                    <h3 className="text-lg font-black text-white mb-0.5 tracking-tight">{top3.fullName}</h3>
                    <span className="text-xs font-mono text-amber-600/80 font-bold mb-4">{top3.registrationNumber}</span>
                    <Badge className="bg-amber-700/20 text-amber-300 border-amber-700/40 font-black text-xs px-4 py-1.5 backdrop-blur-md">
                      {top3.totalScore || 0} PTS
                    </Badge>
                  </Card>
                ) : <div />}

              </div>
            )}

            {/* FULL RANKINGS LIST */}
            <Card className="bg-white/[0.02] border-white/[0.08] p-6 backdrop-blur-3xl rounded-3xl shadow-2xl ring-1 ring-white/[0.04]">
              <div className="space-y-3">
                {(search ? filtered : remaining).map((item, idx) => {
                  const actualRank = search
                    ? participants.findIndex((p) => p.registrationNumber === item.registrationNumber) + 1
                    : idx + 4;

                  return (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-violet-400/50 hover:bg-violet-500/10 hover:shadow-[0_0_25px_rgba(139,92,246,0.15)] transition-all duration-200 flex-wrap gap-3 backdrop-blur-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center font-black text-xs text-violet-300 group-hover:bg-violet-600 group-hover:text-white transition-all">
                          #{actualRank}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white m-0 leading-snug group-hover:text-violet-200 transition-colors">{item.fullName}</h4>
                          <span className="text-xs font-mono text-violet-400/90 font-semibold block mt-0.5">
                            {item.registrationNumber}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xl font-black text-sky-400 block leading-none drop-shadow-[0_0_10px_rgba(56,189,248,0.3)]">{item.totalScore || 0}</span>
                        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">PTS</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

          </div>
        )}

      </main>

      <PublicFooter />
    </div>
  );
}

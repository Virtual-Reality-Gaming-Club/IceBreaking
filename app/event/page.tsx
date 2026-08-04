"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, doc, getDoc, updateDoc } from "firebase/firestore";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { VideoBackground } from "@/components/ui/VideoBackground";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { quizData } from "@/quizcontent/data";
import { 
  Gamepad2, 
  Vote, 
  Brain, 
  Trophy, 
  LogOut, 
  Sparkles, 
  CheckCircle2,
  ChevronRight
} from "lucide-react";

interface EventItem {
  id: string;
  title: string;
  category: string;
  status: string;
  description?: string;
  date?: string;
  venue?: string;
}

interface PollItem {
  id: string;
  question: string;
  status: string;
  options: { id: string; text: string; votes: number }[];
  totalVotes?: number;
}

interface QuizItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  timeLimit: number;
  totalPoints: number;
  questions: { id: string; question: string; options: string[]; correctAnswerIndex: number; points: number }[];
}

interface ParticipantItem {
  id: string;
  registrationNumber: string;
  fullName: string;
  totalScore?: number;
}

export default function UserPanelPage() {
  const [liveEvents, setLiveEvents] = useState<EventItem[]>([]);
  const [polls, setPolls] = useState<PollItem[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([{ id: "local_quiz", title: "Icebreaking Ultimate Trivia", description: "Test your gaming and pop culture knowledge!", status: "active" }]);
  const [leaderboard, setLeaderboard] = useState<ParticipantItem[]>([]);

  // Participant session state
  const [regNumber, setRegNumber] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [userScore, setUserScore] = useState<number>(0);
  const [userRank, setUserRank] = useState<number | string>("—");

  // Login verification input state
  const [inputReg, setInputReg] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Poll state
  const [selectedOptions, setSelectedOptions] = useState<{ [pollId: string]: number }>({});
  const [userVotes, setUserVotes] = useState<{ [pollId: string]: string }>({});

  // Quiz state
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ [qIdx: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Active Event Arena state
  const [joinedEvent, setJoinedEvent] = useState<EventItem | null>(null);
  const [eventSubTab, setEventSubTab] = useState<"polls" | "quizzes" | "leaderboard">("polls");

  // Read stored credentials
  useEffect(() => {
    try {
      const storedReg = localStorage.getItem("ib_reg_number") || "";
      const storedName = localStorage.getItem("ib_full_name") || "";
      if (storedReg) {
        setRegNumber(storedReg);
        setFullName(storedName);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch Participant Score & Leaderboard Realtime
  useEffect(() => {
    const unsubParticipants = onSnapshot(collection(db, "participants"), (snapshot) => {
      const list: ParticipantItem[] = [];
      snapshot.docs.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          registrationNumber: d.id,
          fullName: data.fullName || "Participant",
          totalScore: Number(data.totalScore) || 0,
        });
      });

      // Sort descending by score
      list.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
      setLeaderboard(list);

      // Find current user stats
      if (regNumber) {
        const idx = list.findIndex((p) => p.registrationNumber.toUpperCase() === regNumber.toUpperCase());
        if (idx !== -1) {
          setUserScore(list[idx].totalScore || 0);
          setUserRank(idx + 1);
          if (!fullName && list[idx].fullName) {
            setFullName(list[idx].fullName);
          }
        }
      }
    });

    // Realtime Listeners for Events, Polls & Quizzes
    const unsubEvents = onSnapshot(query(collection(db, "events")), (snapshot) => {
      const raw: EventItem[] = [];
      snapshot.docs.forEach((d) => raw.push({ id: d.id, ...d.data() } as EventItem));
      setLiveEvents(raw.filter((e) => e.status === "live" || e.status === "active"));
    });

    const unsubPolls = onSnapshot(query(collection(db, "polls")), (snapshot) => {
      const raw: PollItem[] = [];
      snapshot.docs.forEach((d) => {
        const data = d.data();
        if (data.status === "active" || data.status === "open") {
          raw.push({ id: d.id, ...data } as PollItem);
        }
      });
      setPolls(raw);
    });

    const unsubQuizToggle = onSnapshot(doc(db, "settings", "quiz"), (docSnap) => {
      if (docSnap.exists()) {
        const isOpen = !!docSnap.data().isOpen;
        setQuizzes(isOpen ? [{ id: "local_quiz", title: "Icebreaking Ultimate Trivia", description: "Test your gaming and pop culture knowledge!", status: "active", totalPoints: 15 }] : []);
      } else {
        setQuizzes([]);
      }
    });

    return () => {
      unsubParticipants();
      unsubEvents();
      unsubPolls();
      unsubQuizToggle();
    };
  }, [regNumber, fullName]);

  // Real-time tab auto-fallback if admin closes currently selected poll or quiz
  useEffect(() => {
    if (eventSubTab === "polls" && polls.length === 0 && quizzes.length > 0) {
      setEventSubTab("quizzes");
    } else if (eventSubTab === "quizzes" && quizzes.length === 0 && polls.length > 0) {
      setEventSubTab("polls");
    }
  }, [polls.length, quizzes.length, eventSubTab]);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputReg.trim()) {
      setInputError("Please enter your Registration Number (e.g. 25BCY10001).");
      return;
    }
    const normalized = inputReg.trim().toUpperCase();
    setVerifying(true);
    setInputError(null);

    try {
      const participantRef = doc(db, "participants", normalized);
      const participantSnap = await getDoc(participantRef);

      if (!participantSnap.exists()) {
        setInputError(`Registration Number '${normalized}' was not found. Please register first!`);
        setVerifying(false);
        return;
      }

      const pData = participantSnap.data();
      const pName = pData?.fullName || "";

      try {
        localStorage.setItem("ib_reg_number", normalized);
        if (pName) localStorage.setItem("ib_full_name", pName);
      } catch {
        // ignore
      }

      setRegNumber(normalized);
      setFullName(pName);
      setUserScore(Number(pData?.totalScore) || 0);
    } catch (err: any) {
      console.error("Verification error:", err);
      setInputError("Unable to verify registration. Check connection.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSwitchUser = () => {
    try {
      localStorage.removeItem("ib_reg_number");
      localStorage.removeItem("ib_full_name");
    } catch {
      // ignore
    }
    setRegNumber("");
    setFullName("");
    setUserScore(0);
    setUserRank("—");
  };

  const handleCastVote = async (pollId: string) => {
    const selectedIdx = selectedOptions[pollId];
    if (selectedIdx === undefined || userVotes[pollId]) return;

    try {
      const poll = polls.find((p) => p.id === pollId);
      if (!poll) return;

      const updatedOptions = [...poll.options];
      updatedOptions[selectedIdx].votes = (updatedOptions[selectedIdx].votes || 0) + 1;

      await updateDoc(doc(db, "polls", pollId), {
        options: updatedOptions,
      });

      setUserVotes((prev) => ({ ...prev, [pollId]: updatedOptions[selectedIdx].id }));
    } catch (err) {
      console.error("Error submitting poll answer:", err);
    }
  };

  const handleQuizSubmit = async () => {
    if (!activeQuiz) return;
    let earnedPoints = 0;
    quizData.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswerIndex) {
        earnedPoints += q.points || 1;
      }
    });

    setQuizScore(earnedPoints);
    setQuizSubmitted(true);

    if (regNumber && earnedPoints > 0) {
      try {
        const pRef = doc(db, "participants", regNumber.toUpperCase());
        const pSnap = await getDoc(pRef);
        if (pSnap.exists()) {
          const currentTotal = Number(pSnap.data().totalScore) || 0;
          await updateDoc(pRef, {
            totalScore: currentTotal + earnedPoints,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error("Error updating participant total score:", err);
      }
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#060812] text-slate-100 font-sans overflow-x-hidden">
      <VideoBackground />
      <PublicNavbar />

      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 pt-28 pb-16">
        {!regNumber ? (
          /* LOGIN CARD IF NO SESSION */
          <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-white/[0.015] border border-white/10 backdrop-blur-3xl shadow-[0_0_60px_rgba(124,58,237,0.15)] text-center ring-1 ring-white/[0.05]">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-violet-600/40">
              🎮
            </div>
            <h1 className="text-2xl font-black text-white mb-2">User Event Panel</h1>
            <p className="text-slate-400 text-sm mb-6">
              Enter your Registration Number to access ongoing events and activities.
            </p>

            <form onSubmit={handleManualLogin} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Reg Number (e.g. 25BCY10001)"
                value={inputReg}
                onChange={(e) => setInputReg(e.target.value.toUpperCase())}
                className="w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-violet-400/60 text-white font-bold text-center text-base tracking-wider outline-none transition-all placeholder:text-slate-600 backdrop-blur-md"
              />

              {inputError && <p className="text-rose-400 text-xs font-semibold">{inputError}</p>}

              <button
                type="submit"
                disabled={verifying}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-black text-sm shadow-lg shadow-violet-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {verifying ? "Verifying Session..." : "Access User Panel →"}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/[0.08] flex items-center justify-center gap-2 text-xs text-slate-400">
              <span>New Participant?</span>
              <Link href="/register" className="text-violet-400 font-bold hover:underline">
                Register Here ↗
              </Link>
            </div>
          </div>
        ) : (
          /* USER PANEL DASHBOARD */
          <div className="flex flex-col gap-6">
            
            {/* PLAYER PROFILE BANNER */}
            <div className="rounded-3xl bg-white/[0.015] border border-white/10 backdrop-blur-3xl p-6 shadow-[0_0_40px_rgba(124,58,237,0.10)] ring-1 ring-white/[0.05] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-violet-600/40">
                  {(fullName || regNumber).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-black text-white">{fullName || "Participant"}</h2>
                    <Badge variant="outline" className="bg-violet-950/60 text-violet-300 border-violet-500/40 font-mono font-bold text-xs">
                      {regNumber}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-1">Glitch Fest 2026 Participant Roster</p>
                </div>
              </div>

              {/* LIVE PLAYER STATS & ACTION BUTTONS */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md text-center">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score</span>
                  <span className="text-base font-black text-sky-400">{userScore} <span className="text-[10px] text-slate-500">PTS</span></span>
                </div>

                <div className="px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md text-center">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rank</span>
                  <span className="text-base font-black text-violet-400">#{userRank}</span>
                </div>

                <button
                  onClick={handleSwitchUser}
                  className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 hover:bg-white/[0.06] text-slate-400 hover:text-white transition-all cursor-pointer backdrop-blur-md"
                  title="Switch Participant Session"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>

            {/* MAIN CONTENT AREA: ONGOING EVENTS */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Gamepad2 className="text-sky-400" size={22} />
                  <span>Ongoing Events</span>
                </h3>
                {liveEvents.length > 0 && (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold text-xs animate-pulse">
                    ● {liveEvents.length} LIVE NOW
                  </Badge>
                )}
              </div>

              {liveEvents.length === 0 ? (
                <div className="p-12 rounded-3xl bg-white/[0.01] border border-dashed border-white/10 text-center backdrop-blur-2xl">
                  <Sparkles className="mx-auto text-violet-400 mb-3 animate-pulse" size={36} />
                  <h3 className="text-lg font-bold text-white mb-1">No Ongoing Events Right Now</h3>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">
                    Admins will launch live icebreaker events here. When an event goes live, click Enter Event Arena to join!
                  </p>
                </div>
              ) : (
                liveEvents.map((evt) => (
                  <Card key={evt.id} className="bg-white/[0.015] border-sky-400/20 p-6 backdrop-blur-3xl shadow-[0_0_30px_rgba(14,165,233,0.08)] hover:border-sky-400/40 hover:shadow-[0_0_40px_rgba(14,165,233,0.15)] transition-all ring-1 ring-white/[0.04]">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <Badge className="bg-sky-500/15 text-sky-300 border-sky-500/30 font-bold text-xs">
                        {evt.category || "General Activity"}
                      </Badge>
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-extrabold text-[11px] animate-pulse">
                        ● ONGOING NOW
                      </Badge>
                    </div>

                    <h3 className="text-xl font-black text-white mb-2">{evt.title}</h3>
                    {evt.description && <p className="text-slate-300 text-sm leading-relaxed mb-4">{evt.description}</p>}

                    <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-800/80 text-xs text-sky-400 font-semibold gap-3">
                      <div className="flex items-center gap-4">
                        {evt.date && <span>📅 {evt.date}</span>}
                        {evt.venue && <span>📍 {evt.venue}</span>}
                      </div>

                      <button
                        onClick={() => {
                          setJoinedEvent(evt);
                          setEventSubTab(polls.length > 0 ? "polls" : quizzes.length > 0 ? "quizzes" : "polls");
                        }}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-sky-500/30 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Gamepad2 size={16} />
                        <span>Enter Event Arena</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* EVENT ARENA FULL-SCREEN GLASSMODAL */}
            {joinedEvent && (
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
                <div className="w-full max-w-4xl bg-white/[0.03] border border-violet-400/25 rounded-3xl p-6 sm:p-8 text-slate-100 shadow-[0_0_80px_rgba(124,58,237,0.20)] ring-1 ring-white/[0.06] my-auto max-h-[92vh] overflow-y-auto flex flex-col relative backdrop-blur-2xl">
                  
                  {/* Arena Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-white/[0.08]">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-500 p-[1px] shadow-lg shadow-violet-600/40">
                        <div className="w-full h-full rounded-[inherit] bg-slate-950 flex items-center justify-center text-2xl">
                          🎮
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h2 className="text-2xl font-black text-white tracking-tight">{joinedEvent.title}</h2>
                          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-extrabold text-[11px] px-2.5 py-0.5 animate-pulse">
                            ● ARENA LIVE
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Glitch Fest Interactive Event Arena</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setJoinedEvent(null)}
                      className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.07] text-slate-400 hover:text-white font-bold text-xs transition-all cursor-pointer backdrop-blur-md"
                    >
                      ✕ Exit Arena
                    </button>
                  </div>

                  {/* Arena Sub-Tabs Navigation - only visible if there is content */}
                  {(polls.length > 0 || quizzes.length > 0) && (
                    <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-6 backdrop-blur-2xl">
                      {polls.length > 0 && (
                        <button
                          onClick={() => setEventSubTab("polls")}
                          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            eventSubTab === "polls"
                              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                          }`}
                        >
                          <Vote size={16} />
                          <span>Live Polls ({polls.length})</span>
                        </button>
                      )}

                      {quizzes.length > 0 && (
                        <button
                          onClick={() => setEventSubTab("quizzes")}
                          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            eventSubTab === "quizzes"
                              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30"
                              : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                          }`}
                        >
                          <Brain size={16} />
                          <span>Trivia Quizzes ({quizzes.length})</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Arena Tab Content */}
                  <div className="flex-1 overflow-y-auto pr-1">
                    
                    {/* Sub-Tab 1: Polls inside Arena */}
                    {eventSubTab === "polls" && polls.length > 0 && (
                      <div className="space-y-5">
                        {polls.map((poll) => {
                            const hasVoted = Boolean(userVotes[poll.id]);
                            const userVotedOptionId = userVotes[poll.id];
                            const selectedOptIdx = selectedOptions[poll.id];
                            const totalVotes = poll.options
                              ? poll.options.reduce((sum, o) => sum + (o.votes || 0), 0)
                              : poll.totalVotes || 0;

                            return (
                              <Card key={poll.id} className="bg-white/[0.02] p-6 border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl ring-1 ring-white/[0.04]">
                                <div className="flex items-center justify-between gap-2 mb-3">
                                  <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">Live Audience Question</span>
                                  {hasVoted && (
                                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold text-xs flex items-center gap-1">
                                      <CheckCircle2 size={12} /> Response Recorded
                                    </Badge>
                                  )}
                                </div>

                                <h3 className="text-lg font-black text-white mb-5 leading-snug">{poll.question}</h3>

                                {hasVoted ? (
                                    <div className="space-y-3 mt-4 pt-3 border-t border-white/[0.08]">
                                      {poll.options.map((opt, optIdx) => {
                                        const count = opt.votes || 0;
                                        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                                        const isMyChoice = userVotedOptionId === opt.id;
                                        
                                        const barGradients = [
                                          "from-violet-600 via-indigo-500 to-cyan-400 shadow-[0_0_15px_rgba(139,92,246,0.4)]",
                                          "from-pink-500 via-rose-500 to-amber-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]",
                                          "from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]",
                                          "from-amber-400 via-orange-500 to-red-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]",
                                          "from-purple-500 via-fuchsia-500 to-pink-400 shadow-[0_0_15px_rgba(217,70,239,0.4)]",
                                        ];
                                        const currentGradient = barGradients[optIdx % barGradients.length];

                                        return (
                                          <div key={opt.id || optIdx} className={`p-3.5 rounded-2xl border transition-all ${isMyChoice ? "bg-violet-950/40 border-violet-400/60 shadow-lg shadow-violet-950/40" : "bg-slate-950/60 border-slate-800/80"}`}>
                                            <div className="flex justify-between items-center text-xs sm:text-sm font-bold mb-2">
                                              <span className="text-white flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center font-black text-[10px] text-violet-300">
                                                  {String.fromCharCode(65 + optIdx)}
                                                </span>
                                                <span>{opt.text}</span>
                                                {isMyChoice && <span className="text-[10px] text-violet-300 font-extrabold bg-violet-500/20 px-2 py-0.5 rounded-full border border-violet-500/40">(Your Choice)</span>}
                                              </span>
                                              <span className="text-sky-400 font-black">{pct}% ({count} votes)</span>
                                            </div>
                                            <div className="h-3 rounded-full bg-slate-950/80 overflow-hidden p-0.5 border border-white/[0.06]">
                                              <div
                                                className={`h-full bg-gradient-to-r ${currentGradient} rounded-full transition-all duration-1000 ease-out`}
                                                style={{ width: `${pct}%` }}
                                              />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                  <div className="space-y-4">
                                    <div className="space-y-2.5">
                                      {poll.options.map((opt, optIdx) => {
                                        const isSelected = selectedOptIdx === optIdx;
                                        return (
                                          <button
                                            key={opt.id || optIdx}
                                            onClick={() => setSelectedOptions((prev) => ({ ...prev, [poll.id]: optIdx }))}
                                            className={`w-full text-left p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 transition-all cursor-pointer ${
                                              isSelected
                                                ? "bg-violet-900/50 border-violet-500 text-white shadow-lg shadow-violet-950/50"
                                                : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700"
                                            }`}
                                          >
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${isSelected ? "bg-violet-500 text-white" : "bg-slate-800 text-slate-400"}`}>
                                              {String.fromCharCode(65 + optIdx)}
                                            </div>
                                            <span>{opt.text}</span>
                                          </button>
                                        );
                                      })}
                                    </div>

                                    <button
                                      onClick={() => handleCastVote(poll.id)}
                                      disabled={selectedOptIdx === undefined}
                                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-black text-sm shadow-lg shadow-violet-600/30 transition-all cursor-pointer disabled:opacity-40"
                                    >
                                      Submit Response
                                    </button>
                                  </div>
                                )}
                              </Card>
                            );
                          })}
                      </div>
                    )}

                    {/* Sub-Tab 2: Quizzes inside Arena */}
                    {eventSubTab === "quizzes" && quizzes.length > 0 && (
                      <div className="space-y-4">
                        {!activeQuiz ? (
                          quizzes.map((quiz) => (
                              <Card key={quiz.id} className="bg-white/[0.02] p-6 border-purple-400/25 shadow-[0_4px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl ring-1 ring-white/[0.04]">
                                <div className="flex justify-between items-center mb-3">
                                  <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30 font-bold text-xs">
                                    Trivia Challenge
                                  </Badge>
                                  <span className="text-xs font-black text-purple-400">🏆 {quiz.totalPoints} PTS</span>
                                </div>
                                <h3 className="text-lg font-black text-white mb-2">{quiz.title}</h3>
                                {quiz.description && <p className="text-slate-300 text-xs mb-5 leading-relaxed">{quiz.description}</p>}
                                <button
                                  onClick={() => {
                                    setActiveQuiz(quiz);
                                    setUserAnswers({});
                                    setQuizSubmitted(false);
                                    setQuizScore(0);
                                  }}
                                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                                >
                                  <span>Start Quiz Challenge</span>
                                  <ChevronRight size={14} />
                                </button>
                              </Card>
                            ))
                        ) : (
                          /* QUIZ RUNNER INTERFACE */
                          <Card className="bg-white/[0.02] border-purple-400/25 p-6 shadow-[0_0_40px_rgba(168,85,247,0.12)] backdrop-blur-2xl ring-1 ring-white/[0.04]">
                            <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
                              <div>
                                <h3 className="text-lg font-black text-white">{activeQuiz.title}</h3>
                                <p className="text-xs text-purple-400 font-bold">Total Points: {activeQuiz.totalPoints}</p>
                              </div>
                              <button
                                onClick={() => setActiveQuiz(null)}
                                className="px-3.5 py-1.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                              >
                                Back to Quizzes
                              </button>
                            </div>

                            {!quizSubmitted ? (
                              <div className="space-y-5">
                                {quizData.map((q, qIdx) => (
                                  <div key={q.id || qIdx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md">
                                    <h4 className="text-sm font-bold text-white mb-4 leading-relaxed">
                                      {qIdx + 1}. {q.question}
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {q.options.map((opt, oIdx) => (
                                        <label
                                          key={oIdx}
                                          className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${
                                            userAnswers[qIdx] === oIdx
                                              ? "bg-purple-500/20 border-purple-400 text-white shadow-md shadow-purple-950/40"
                                              : "bg-white/[0.02] border-white/[0.08] text-slate-300 hover:border-white/20"
                                          }`}
                                        >
                                          <input
                                            type="radio"
                                            name={`arena_q_${qIdx}`}
                                            checked={userAnswers[qIdx] === oIdx}
                                            onChange={() => setUserAnswers({ ...userAnswers, [qIdx]: oIdx })}
                                            className="accent-purple-400 w-4 h-4 shrink-0"
                                          />
                                          {opt.endsWith(".png") || opt.endsWith(".jpg") ? (
                                            <div className="w-full flex justify-center bg-black/40 rounded-lg overflow-hidden p-2 border border-white/5">
                                              <img src={opt} alt={`Option ${oIdx + 1}`} className="max-h-32 object-contain" />
                                            </div>
                                          ) : (
                                            <span>{opt}</span>
                                          )}
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                ))}

                                <button
                                  onClick={handleQuizSubmit}
                                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                                >
                                  Submit Quiz Answers
                                </button>
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <div className="text-4xl mb-2">🏆</div>
                                <h3 className="text-xl font-black text-purple-400 mb-1">Quiz Completed!</h3>
                                <p className="text-slate-300 text-xs mb-5">
                                  You scored <strong className="text-purple-300 text-base">{quizScore}</strong> out of {quizData.reduce((acc, q) => acc + (q.points || 1), 0)} points!
                                </p>
                                <button
                                  onClick={() => setActiveQuiz(null)}
                                  className="px-6 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white font-bold text-xs cursor-pointer hover:bg-white/[0.08] transition-all"
                                >
                                  Back to Arena Quizzes
                                </button>
                              </div>
                            )}
                          </Card>
                        )}
                      </div>
                    )}

                    {/* Empty State when both polls & quizzes are closed/paused */}
                    {polls.length === 0 && quizzes.length === 0 && (
                      <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-dashed border-white/10 backdrop-blur-xl">
                        <Sparkles className="mx-auto text-violet-400 mb-3 animate-pulse" size={36} />
                        <h4 className="text-base font-bold text-white mb-1">No Active Activities</h4>
                        <p className="text-xs text-slate-400">All live polls and trivia quizzes have been paused or closed by admins.</p>
                      </div>
                    )}



                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}

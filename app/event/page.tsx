"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import Image from "next/image";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { quizData, QuizQuestion } from "@/quizcontent/data";
import {
  Gamepad2,
  Vote,
  Brain,
  LogOut,
  Sparkles,
  CheckCircle2,
  ChevronRight,
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

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface PollItem {
  id: string;
  question: string;
  status: string;
  options: PollOption[];
  totalVotes?: number;
}

interface ParticipantItem {
  id: string;
  registrationNumber: string;
  fullName: string;
  totalScore?: number;
}

const BAR_GRADIENTS = [
  "from-violet-600 via-indigo-500 to-cyan-400",
  "from-pink-500 via-rose-500 to-amber-400",
  "from-emerald-500 via-teal-400 to-cyan-400",
  "from-amber-400 via-orange-500 to-red-500",
  "from-purple-500 via-fuchsia-500 to-pink-400",
] as const;

function PollBar({ pct, gradientClass }: { pct: number; gradientClass: string }) {
  return (
    <div className="h-3 rounded-full bg-slate-950/80 overflow-hidden border border-white/[0.06]">
      <div
        className={`h-full bg-gradient-to-r ${gradientClass} rounded-full origin-left`}
        style={{
          transform: `scaleX(${pct / 100})`,
          transition: "transform 700ms ease-out",
          willChange: "transform",
        }}
      />
    </div>
  );
}

export default function UserPanelPage() {
  const [liveEvents, setLiveEvents] = useState<EventItem[]>([]);
  const [polls, setPolls] = useState<PollItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<ParticipantItem[]>([]);

  // Quiz live control state
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [activeQuestionIds, setActiveQuestionIds] = useState<number[]>([]);
  const [userQuizAnswers, setUserQuizAnswers] = useState<{ [qId: number]: number }>({});
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<{ [qId: number]: number }>({});

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

  // Active Event Arena state
  const [joinedEvent, setJoinedEvent] = useState<EventItem | null>(null);
  const [eventSubTab, setEventSubTab] = useState<"polls" | "quizzes" | "leaderboard">("polls");

  // Stable regNumber ref for snapshot listeners
  const regNumberRef = useRef(regNumber);
  const fullNameRef = useRef(fullName);
  useEffect(() => { regNumberRef.current = regNumber; }, [regNumber]);
  useEffect(() => { fullNameRef.current = fullName; }, [fullName]);

  // Read stored credentials once on mount
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

  // Stable useEffect for all Firestore listeners
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
      list.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
      setLeaderboard(list);

      const reg = regNumberRef.current;
      if (reg) {
        const idx = list.findIndex(
          (p) => p.registrationNumber.toUpperCase() === reg.toUpperCase()
        );
        if (idx !== -1) {
          setUserScore(list[idx].totalScore || 0);
          setUserRank(idx + 1);
          if (!fullNameRef.current && list[idx].fullName) {
            setFullName(list[idx].fullName);
          }
        }
      }
    });

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
        const data = docSnap.data();
        setIsQuizOpen(!!data.isOpen);
        setActiveQuestionIds(data.activeQuestionIds || []);
      } else {
        setIsQuizOpen(false);
        setActiveQuestionIds([]);
      }
    });

    const unsubQuizAnswers = onSnapshot(collection(db, "quiz_responses"), (snap) => {
      const answersMap: { [qId: number]: number } = {};
      snap.forEach((d) => {
        const qId = Number(d.id);
        const answers = d.data()?.answers || {};
        const reg = regNumberRef.current;
        if (reg && answers[reg.toUpperCase()] !== undefined) {
          answersMap[qId] = answers[reg.toUpperCase()];
        }
      });
      setUserQuizAnswers(answersMap);
    });

    return () => {
      unsubParticipants();
      unsubEvents();
      unsubPolls();
      unsubQuizToggle();
      unsubQuizAnswers();
    };
  }, []);

  // Filter local hardcoded questions to currently active question IDs
  const activeQuizQuestions = useMemo(() => {
    if (!isQuizOpen || activeQuestionIds.length === 0) return [];
    return quizData.filter((q) => activeQuestionIds.includes(q.id));
  }, [isQuizOpen, activeQuestionIds]);

  // Auto-fallback tab when admin closes activity
  useEffect(() => {
    if (eventSubTab === "polls" && polls.length === 0 && activeQuizQuestions.length > 0) {
      setEventSubTab("quizzes");
    } else if (eventSubTab === "quizzes" && activeQuizQuestions.length === 0 && polls.length > 0) {
      setEventSubTab("polls");
    }
  }, [polls.length, activeQuizQuestions.length, eventSubTab]);

  // Update user rank/score whenever leaderboard changes
  useEffect(() => {
    if (!regNumber || leaderboard.length === 0) return;
    const idx = leaderboard.findIndex(
      (p) => p.registrationNumber.toUpperCase() === regNumber.toUpperCase()
    );
    if (idx !== -1) {
      setUserScore(leaderboard[idx].totalScore || 0);
      setUserRank(idx + 1);
    }
  }, [leaderboard, regNumber]);

  const handleManualLogin = useCallback(async (e: React.FormEvent) => {
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
  }, [inputReg]);

  const handleSwitchUser = useCallback(() => {
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
  }, []);

  const handleCastVote = useCallback(async (pollId: string) => {
    const selectedIdx = selectedOptions[pollId];
    if (selectedIdx === undefined || userVotes[pollId]) return;

    try {
      setPolls((prevPolls) => {
        const poll = prevPolls.find((p) => p.id === pollId);
        if (!poll) return prevPolls;
        const updatedOptions = poll.options.map((opt, idx) =>
          idx === selectedIdx ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
        );
        updateDoc(doc(db, "polls", pollId), { options: updatedOptions }).catch(console.error);
        return prevPolls;
      });
      setUserVotes((prev) => ({ ...prev, [pollId]: polls.find((p) => p.id === pollId)?.options[selectedIdx]?.id || "" }));
    } catch (err) {
      console.error("Error submitting poll answer:", err);
    }
  }, [selectedOptions, userVotes, polls]);

  const handleSelectOption = useCallback((pollId: string, optIdx: number) => {
    setSelectedOptions((prev) => ({ ...prev, [pollId]: optIdx }));
  }, []);

  // QUIZ SUBMISSION PER QUESTION
  const handleSelectQuizOption = useCallback((qId: number, optIdx: number) => {
    setSelectedQuizAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  }, []);

  const handleSubmitQuizAnswer = useCallback(async (q: QuizQuestion) => {
    const selectedOptIdx = selectedQuizAnswers[q.id];
    if (selectedOptIdx === undefined || userQuizAnswers[q.id] !== undefined || !regNumber) return;

    const regUpper = regNumber.toUpperCase();

    // Optimistic UI update
    setUserQuizAnswers((prev) => ({ ...prev, [q.id]: selectedOptIdx }));

    try {
      const qDocRef = doc(db, "quiz_responses", String(q.id));
      await setDoc(
        qDocRef,
        {
          answers: {
            [regUpper]: selectedOptIdx,
          },
        },
        { merge: true }
      );

      // Score update if correct answer
      if (selectedOptIdx === q.correctAnswerIndex) {
        const pRef = doc(db, "participants", regUpper);
        const pSnap = await getDoc(pRef);
        if (pSnap.exists()) {
          const currentTotal = Number(pSnap.data().totalScore) || 0;
          await updateDoc(pRef, {
            totalScore: currentTotal + (q.points || 1),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.error("Error submitting quiz answer:", err);
    }
  }, [selectedQuizAnswers, userQuizAnswers, regNumber]);

  const handleJoinEvent = useCallback((evt: EventItem) => {
    setJoinedEvent(evt);
    setEventSubTab(polls.length > 0 ? "polls" : activeQuizQuestions.length > 0 ? "quizzes" : "polls");
  }, [polls.length, activeQuizQuestions.length]);

  return (
    <div className="relative min-h-screen flex flex-col bg-transparent text-slate-100 font-sans overflow-x-hidden">

      <PublicNavbar />

      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 pt-24 sm:pt-28 pb-16">
        {!regNumber ? (
          /* LOGIN CARD */
          <div className="max-w-md mx-auto my-8 sm:my-12 p-6 sm:p-8 rounded-3xl bg-white/[0.015] border border-white/10 backdrop-blur-3xl shadow-[0_0_60px_rgba(124,58,237,0.15)] text-center ring-1 ring-white/[0.05]">
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
                className="w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-violet-400/60 text-white font-bold text-center text-base tracking-wider outline-none transition-colors placeholder:text-slate-600 backdrop-blur-md"
              />

              {inputError && <p className="text-rose-400 text-xs font-semibold">{inputError}</p>}

              <button
                type="submit"
                disabled={verifying}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-black text-sm shadow-lg shadow-violet-600/30 transition-opacity cursor-pointer disabled:opacity-50 min-h-[44px]"
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
          <div className="flex flex-col gap-5 sm:gap-6">
            {/* PLAYER PROFILE BANNER */}
            <div className="rounded-3xl bg-white/[0.015] border border-white/10 backdrop-blur-3xl p-4 sm:p-6 shadow-[0_0_40px_rgba(124,58,237,0.10)] ring-1 ring-white/[0.05] flex flex-wrap items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-lg sm:text-xl font-black shadow-lg shadow-violet-600/40 shrink-0">
                  {(fullName || regNumber).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-black text-white truncate max-w-[140px] sm:max-w-none">{fullName || "Participant"}</h2>
                    <Badge variant="outline" className="bg-violet-950/60 text-violet-300 border-violet-500/40 font-mono font-bold text-xs shrink-0">
                      {regNumber}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Glitch Fest 2026 Participant Roster</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="px-3 sm:px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md text-center">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score</span>
                  <span className="text-sm sm:text-base font-black text-sky-400">{userScore} <span className="text-[10px] text-slate-500">PTS</span></span>
                </div>

                <div className="px-3 sm:px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md text-center">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rank</span>
                  <span className="text-sm sm:text-base font-black text-violet-400">#{userRank}</span>
                </div>

                <button
                  onClick={handleSwitchUser}
                  className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors cursor-pointer backdrop-blur-md min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Switch Participant Session"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>

            {/* ONGOING EVENTS */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-1 sm:px-2">
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <Gamepad2 className="text-sky-400" size={20} />
                  <span>Ongoing Events</span>
                </h3>
                {liveEvents.length > 0 && (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold text-xs animate-pulse">
                    ● {liveEvents.length} LIVE NOW
                  </Badge>
                )}
              </div>

              {liveEvents.length === 0 ? (
                <div className="p-10 sm:p-12 rounded-3xl bg-white/[0.01] border border-dashed border-white/10 text-center backdrop-blur-2xl">
                  <Sparkles className="mx-auto text-violet-400 mb-3 animate-pulse" size={36} />
                  <h3 className="text-base sm:text-lg font-bold text-white mb-1">No Ongoing Events Right Now</h3>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">
                    Admins will launch live icebreaker events here. When an event goes live, click Enter Event Arena to join!
                  </p>
                </div>
              ) : (
                liveEvents.map((evt) => (
                  <Card key={evt.id} className="bg-white/[0.015] border-sky-400/20 p-5 sm:p-6 backdrop-blur-3xl shadow-[0_0_30px_rgba(14,165,233,0.08)] hover:border-sky-400/40 transition-colors ring-1 ring-white/[0.04]">
                    <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                      <Badge className="bg-sky-500/15 text-sky-300 border-sky-500/30 font-bold text-xs">
                        {evt.category || "General Activity"}
                      </Badge>
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-extrabold text-[11px] animate-pulse">
                        ● ONGOING NOW
                      </Badge>
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-white mb-2">{evt.title}</h3>
                    {evt.description && <p className="text-slate-300 text-sm leading-relaxed mb-4">{evt.description}</p>}

                    <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-800/80 text-xs text-sky-400 font-semibold gap-3">
                      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                        {evt.date && <span>📅 {evt.date}</span>}
                        {evt.venue && <span>📍 {evt.venue}</span>}
                      </div>

                      <button
                        onClick={() => handleJoinEvent(evt)}
                        className="px-5 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-sky-500/30 flex items-center gap-2 transition-colors cursor-pointer min-h-[44px]"
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

            {/* EVENT ARENA MODAL */}
            {joinedEvent && (
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xl flex items-start sm:items-center justify-center p-2 sm:p-6 overflow-y-auto">
                <div className="w-full max-w-4xl bg-white/[0.03] border border-violet-400/25 rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-slate-100 shadow-[0_0_80px_rgba(124,58,237,0.20)] ring-1 ring-white/[0.06] my-2 sm:my-auto max-h-[96vh] overflow-y-auto flex flex-col backdrop-blur-2xl">
                  
                  {/* Arena Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-5 mb-4 sm:mb-6 border-b border-white/[0.08]">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-500 p-[1px] shadow-lg shadow-violet-600/40 shrink-0">
                        <div className="w-full h-full rounded-[inherit] bg-slate-950 flex items-center justify-center text-xl sm:text-2xl">
                          🎮
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">{joinedEvent.title}</h2>
                          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-extrabold text-[11px] px-2.5 py-0.5 animate-pulse">
                            ● ARENA LIVE
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Glitch Fest Interactive Event Arena</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setJoinedEvent(null)}
                      className="px-3 sm:px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.07] text-slate-400 hover:text-white font-bold text-xs transition-colors cursor-pointer backdrop-blur-md min-h-[44px]"
                    >
                      ✕ Exit Arena
                    </button>
                  </div>

                  {/* Sub-Tabs Navigation */}
                  {(polls.length > 0 || activeQuizQuestions.length > 0) && (
                    <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-5 sm:mb-6 backdrop-blur-2xl overflow-x-auto">
                      {polls.length > 0 && (
                        <button
                          onClick={() => setEventSubTab("polls")}
                          className={`flex-1 min-w-[120px] py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap ${
                            eventSubTab === "polls"
                              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                          }`}
                        >
                          <Vote size={15} />
                          <span>Live Polls ({polls.length})</span>
                        </button>
                      )}

                      {activeQuizQuestions.length > 0 && (
                        <button
                          onClick={() => setEventSubTab("quizzes")}
                          className={`flex-1 min-w-[120px] py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap ${
                            eventSubTab === "quizzes"
                              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30"
                              : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                          }`}
                        >
                          <Brain size={15} />
                          <span>Trivia Quizzes ({activeQuizQuestions.length})</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Arena Tab Content */}
                  <div className="flex-1 overflow-y-auto">

                    {/* Polls Tab */}
                    {eventSubTab === "polls" && polls.length > 0 && (
                      <div className="space-y-4 sm:space-y-5">
                        {polls.map((poll) => {
                          const hasVoted = Boolean(userVotes[poll.id]);
                          const userVotedOptionId = userVotes[poll.id];
                          const selectedOptIdx = selectedOptions[poll.id];
                          const totalVotes = poll.options
                            ? poll.options.reduce((sum, o) => sum + (o.votes || 0), 0)
                            : poll.totalVotes || 0;

                          return (
                            <Card key={poll.id} className="bg-white/[0.02] p-4 sm:p-6 border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl ring-1 ring-white/[0.04]">
                              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                                <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">Live Audience Question</span>
                                {hasVoted && (
                                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold text-xs flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Response Recorded
                                  </Badge>
                                )}
                              </div>

                              <h3 className="text-base sm:text-lg font-black text-white mb-4 sm:mb-5 leading-snug">{poll.question}</h3>

                              {hasVoted ? (
                                <div className="space-y-3 mt-4 pt-3 border-t border-white/[0.08]">
                                  {poll.options.map((opt, optIdx) => {
                                    const count = opt.votes || 0;
                                    const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                                    const isMyChoice = userVotedOptionId === opt.id;
                                    const gradientClass = BAR_GRADIENTS[optIdx % BAR_GRADIENTS.length];

                                    return (
                                      <div
                                        key={opt.id || optIdx}
                                        className={`p-3 sm:p-3.5 rounded-2xl border transition-colors ${
                                          isMyChoice
                                            ? "bg-violet-950/40 border-violet-400/60"
                                            : "bg-slate-950/60 border-slate-800/80"
                                        }`}
                                      >
                                        <div className="flex justify-between items-center text-xs sm:text-sm font-bold mb-2 gap-2">
                                          <span className="text-white flex items-center gap-2 min-w-0">
                                            <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center font-black text-[10px] text-violet-300 shrink-0">
                                              {String.fromCharCode(65 + optIdx)}
                                            </span>
                                            <span className="truncate">{opt.text}</span>
                                            {isMyChoice && (
                                              <span className="text-[10px] text-violet-300 font-extrabold bg-violet-500/20 px-2 py-0.5 rounded-full border border-violet-500/40 shrink-0">
                                                (Your Choice)
                                              </span>
                                            )}
                                          </span>
                                          <span className="text-sky-400 font-black shrink-0">{pct}% ({count})</span>
                                        </div>
                                        <PollBar pct={pct} gradientClass={gradientClass} />
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="space-y-3 sm:space-y-4">
                                  <div className="space-y-2 sm:space-y-2.5">
                                    {poll.options.map((opt, optIdx) => {
                                      const isSelected = selectedOptIdx === optIdx;
                                      return (
                                        <button
                                          key={opt.id || optIdx}
                                          onClick={() => handleSelectOption(poll.id, optIdx)}
                                          className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 transition-colors cursor-pointer min-h-[48px] ${
                                            isSelected
                                              ? "bg-violet-900/50 border-violet-500 text-white"
                                              : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700"
                                          }`}
                                        >
                                          <div
                                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                              isSelected ? "bg-violet-500 text-white" : "bg-slate-800 text-slate-400"
                                            }`}
                                          >
                                            {String.fromCharCode(65 + optIdx)}
                                          </div>
                                          <span className="text-left">{opt.text}</span>
                                        </button>
                                      );
                                    })}
                                  </div>

                                  <button
                                    onClick={() => handleCastVote(poll.id)}
                                    disabled={selectedOptIdx === undefined}
                                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-black text-sm shadow-lg shadow-violet-600/30 transition-opacity cursor-pointer disabled:opacity-40 min-h-[48px]"
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

                    {/* LIVE TRIVIA QUIZ QUESTIONS TAB */}
                    {eventSubTab === "quizzes" && (
                      <div className="space-y-4 sm:space-y-5">
                        {activeQuizQuestions.length === 0 ? (
                          polls.length > 0 ? (
                            <div className="p-10 sm:p-12 text-center rounded-2xl bg-white/[0.02] border border-dashed border-white/10 backdrop-blur-xl">
                              <Sparkles className="mx-auto text-purple-400 mb-3 animate-pulse" size={36} />
                              <h4 className="text-base font-bold text-white mb-1">No Active Quiz Questions</h4>
                              <p className="text-xs text-slate-400">
                                The event admin will activate trivia questions on your screen live during the event!
                              </p>
                            </div>
                          ) : null
                        ) : (
                          activeQuizQuestions.map((q: QuizQuestion) => {
                            const submittedAnsIdx = userQuizAnswers[q.id];
                            const hasAnswered = submittedAnsIdx !== undefined;
                            const currentSelectedIdx = selectedQuizAnswers[q.id];

                            return (
                              <Card key={q.id} className="bg-white/[0.02] p-4 sm:p-6 border-purple-400/25 shadow-[0_4px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl ring-1 ring-white/[0.04]">
                                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30 font-bold text-xs">
                                      Question #{q.id}
                                    </Badge>
                                    <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 font-bold text-xs">
                                      🏆 {q.points || 1} PTS
                                    </Badge>
                                  </div>
                                  {hasAnswered && (
                                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold text-xs flex items-center gap-1">
                                      <CheckCircle2 size={12} /> Response Submitted
                                    </Badge>
                                  )}
                                </div>

                                <h3 className="text-base sm:text-lg font-black text-white mb-4 leading-snug">{q.question}</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-4">
                                  {q.options.map((opt, oIdx) => {
                                    const isSelected = hasAnswered ? submittedAnsIdx === oIdx : currentSelectedIdx === oIdx;

                                    return (
                                      <button
                                        key={oIdx}
                                        disabled={hasAnswered}
                                        onClick={() => handleSelectQuizOption(q.id, oIdx)}
                                        className={`w-full text-left p-3.5 sm:p-4 rounded-xl border text-sm font-semibold transition-colors cursor-pointer min-h-[48px] flex items-center gap-3 ${
                                          isSelected
                                            ? "bg-purple-500/20 border-purple-400 text-white shadow-md shadow-purple-950/40"
                                            : "bg-white/[0.02] border-white/[0.08] text-slate-300 hover:border-white/20"
                                        } ${hasAnswered ? "cursor-default" : ""}`}
                                      >
                                        <div
                                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                            isSelected ? "bg-purple-500 text-white" : "bg-slate-800 text-slate-400"
                                          }`}
                                        >
                                          {String.fromCharCode(65 + oIdx)}
                                        </div>

                                        {opt.endsWith(".png") || opt.endsWith(".jpg") ? (
                                          <div className="w-full flex justify-center bg-black/40 rounded-lg overflow-hidden p-2 border border-white/5 relative h-28 sm:h-32">
                                            <Image
                                              src={opt}
                                              alt={`Option ${oIdx + 1}`}
                                              fill
                                              sizes="(max-width: 640px) 100vw, 300px"
                                              className="object-contain p-1"
                                              loading="lazy"
                                            />
                                          </div>
                                        ) : (
                                          <span>{opt}</span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>

                                {!hasAnswered && (
                                  <button
                                    onClick={() => handleSubmitQuizAnswer(q)}
                                    disabled={currentSelectedIdx === undefined}
                                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 transition-opacity cursor-pointer disabled:opacity-40 min-h-[48px]"
                                  >
                                    Submit Answer for Q#{q.id}
                                  </button>
                                )}
                              </Card>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* Empty State */}
                    {polls.length === 0 && activeQuizQuestions.length === 0 && (
                      <div className="p-10 sm:p-12 text-center rounded-2xl bg-white/[0.02] border border-dashed border-white/10 backdrop-blur-xl">
                        <Sparkles className="mx-auto text-violet-400 mb-3 animate-pulse" size={36} />
                        <h4 className="text-base font-bold text-white mb-1">No Active Activities</h4>
                        <p className="text-xs text-slate-400">
                          All live polls and trivia quizzes have been paused or closed by admins.
                        </p>
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

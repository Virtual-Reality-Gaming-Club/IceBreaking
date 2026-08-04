"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, doc, getDoc, updateDoc } from "firebase/firestore";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import Link from "next/link";

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

export default function EventsHubPage() {
  const [liveEvents, setLiveEvents] = useState<EventItem[]>([]);
  const [polls, setPolls] = useState<PollItem[]>([]);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActivities, setShowActivities] = useState(false);

  // Participant session from localStorage
  const [regNumber, setRegNumber] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");

  // Manual sign-in input if no session
  const [inputReg, setInputReg] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  // Interactive Poll Choice Selection state
  const [selectedOptions, setSelectedOptions] = useState<{ [pollId: string]: number }>({});
  const [userVotes, setUserVotes] = useState<{ [pollId: string]: string }>({});

  // Active Quiz State
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ [qIdx: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  useEffect(() => {
    try {
      const storedReg = localStorage.getItem("ib_reg_number") || "";
      const storedName = localStorage.getItem("ib_full_name") || "";
      if (storedReg) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRegNumber(storedReg);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFullName(storedName);
      }
    } catch {
      // ignore
    }
  }, []);

  // Realtime Listeners for Live Events, Polls & Quizzes
  useEffect(() => {
    // 1. Events (ONLY Live events shown)
    const unsubEvents = onSnapshot(query(collection(db, "events")), (snapshot) => {
      const raw: EventItem[] = [];
      snapshot.docs.forEach((d) => raw.push({ id: d.id, ...d.data() } as EventItem));
      setLiveEvents(raw.filter((e) => e.status === "live" || e.status === "active"));
      setLoading(false);
    });

    // 2. Polls
    const unsubPolls = onSnapshot(query(collection(db, "polls")), (snapshot) => {
      const raw: PollItem[] = [];
      snapshot.docs.forEach((d) => raw.push({ id: d.id, ...d.data() } as PollItem));
      setPolls(raw.filter((p) => p.status === "active" || p.status === "open"));
    });

    // 3. Quizzes
    const unsubQuizzes = onSnapshot(query(collection(db, "quizzes")), (snapshot) => {
      const raw: QuizItem[] = [];
      snapshot.docs.forEach((d) => raw.push({ id: d.id, ...d.data() } as QuizItem));
      setQuizzes(raw.filter((q) => q.status === "active"));
    });

    return () => {
      unsubEvents();
      unsubPolls();
      unsubQuizzes();
    };
  }, []);

  const [verifying, setVerifying] = useState(false);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputReg.trim()) {
      setInputError("Please enter your registration number (e.g. 25BCY10001).");
      return;
    }
    const normalized = inputReg.trim().toUpperCase();
    setVerifying(true);
    setInputError(null);

    try {
      // Query Firestore participants collection to verify registration
      const participantRef = doc(db, "participants", normalized);
      const participantSnap = await getDoc(participantRef);

      if (!participantSnap.exists()) {
        setInputError(`Registration Number '${normalized}' was not found. Please register first to enter!`);
        setVerifying(false);
        return;
      }

      const participantData = participantSnap.data();
      const pName = participantData?.fullName || "";

      try {
        localStorage.setItem("ib_reg_number", normalized);
        if (pName) localStorage.setItem("ib_full_name", pName);
      } catch {
        // ignore
      }

      setRegNumber(normalized);
      setFullName(pName);
    } catch (err: any) {
      console.error("Verification error:", err);
      setInputError("Unable to verify registration. Please check your internet connection.");
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

  const handleQuizSubmit = () => {
    if (!activeQuiz) return;
    let earnedPoints = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswerIndex) {
        earnedPoints += q.points || 10;
      }
    });
    setQuizScore(earnedPoints);
    setQuizSubmitted(true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#06070a", color: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
      <PublicNavbar />

      <main style={{ flex: 1, maxWidth: "880px", width: "100%", margin: "80px auto 60px", padding: "0 20px" }}>
        {/* If no session, show exact Break folder registration prompt */}
        {!regNumber ? (
          <div
            style={{
              maxWidth: "500px",
              margin: "40px auto",
              background: "rgba(10, 13, 24, 0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(124, 58, 237, 0.35)",
              borderRadius: "24px",
              padding: "36px 28px",
              textAlign: "center",
              boxShadow: "0 20px 45px rgba(0, 0, 0, 0.7), 0 0 30px rgba(124, 58, 237, 0.15)",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🎮</div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#f8fafc", marginBottom: "8px" }}>
              Join Event Activity Hub
            </h1>
            <p style={{ color: "#cbd5e1", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "24px", fontWeight: 500 }}>
              Enter your Registration Number to participate in live activities.
            </p>

            <form onSubmit={handleManualLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <input
                type="text"
                placeholder="Registration Number (e.g. 25BCY10001)"
                value={inputReg}
                onChange={(e) => setInputReg(e.target.value.toUpperCase())}
                style={{
                  padding: "14px 18px",
                  background: "rgba(15, 20, 35, 0.95)",
                  border: "1.5px solid rgba(148, 163, 184, 0.45)",
                  borderRadius: "12px",
                  color: "#ffffff",
                  fontSize: "1rem",
                  textAlign: "center",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  outline: "none",
                }}
              />

              {inputError && (
                <p style={{ color: "#f87171", fontSize: "0.85rem", margin: 0, fontWeight: 600 }}>{inputError}</p>
              )}

              <button
                type="submit"
                disabled={verifying}
                style={{
                  padding: "14px 20px",
                  background: verifying ? "#4b5563" : "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)",
                  border: "none",
                  borderRadius: "12px",
                  color: "#ffffff",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  cursor: verifying ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 16px rgba(124, 58, 237, 0.4)",
                  opacity: verifying ? 0.7 : 1,
                }}
              >
                {verifying ? "🔍 Verifying Registration..." : "Enter Event Hub →"}
              </button>
            </form>

            <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <p style={{ color: "#cbd5e1", fontSize: "0.88rem", margin: "0 0 12px 0", fontWeight: 500 }}>
                Not registered yet?
              </p>
              <Link
                href="/register"
                style={{
                  display: "inline-block",
                  color: "#a78bfa",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Go to Registration Page ↗
              </Link>
            </div>
          </div>
        ) : (
          /* Participant Active Hub - Matching Break Folder Layout */
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Player Profile Card */}
            <div
              style={{
                background: "rgba(10, 13, 24, 0.92)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(124, 58, 237, 0.35)",
                borderRadius: "20px",
                padding: "22px 26px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "18px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: "1.3rem",
                    color: "#fff",
                    boxShadow: "0 0 20px rgba(124, 58, 237, 0.5)",
                    flexShrink: 0,
                  }}
                >
                  {(fullName || regNumber || "P").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "#f8fafc" }}>
                      {fullName || "Participant"}
                    </h2>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        background: "rgba(124, 58, 237, 0.25)",
                        border: "1px solid rgba(124, 58, 237, 0.4)",
                        color: "#c4b5fd",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        fontFamily: "monospace",
                      }}
                    >
                      {regNumber}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0 0", color: "#94a3b8", fontSize: "0.82rem" }}>
                    IceBreaking 2026 Participant
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  onClick={handleSwitchUser}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#94a3b8",
                    borderRadius: "10px",
                    padding: "8px 14px",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Switch ⇄
                </button>
              </div>
            </div>

            {/* Live Activities Container */}
            <div
              style={{
                background: "rgba(10, 13, 24, 0.92)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(124, 58, 237, 0.35)",
                borderRadius: "20px",
                padding: "24px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "5px 14px",
                      borderRadius: "9999px",
                      background: (liveEvents.length > 0 || polls.length > 0 || quizzes.length > 0) ? "rgba(34, 197, 94, 0.18)" : "rgba(148, 163, 184, 0.15)",
                      border: (liveEvents.length > 0 || polls.length > 0 || quizzes.length > 0) ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid rgba(148, 163, 184, 0.3)",
                      color: (liveEvents.length > 0 || polls.length > 0 || quizzes.length > 0) ? "#4ade80" : "#cbd5e1",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      letterSpacing: "0.05em",
                    }}
                  >
                    <span
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        backgroundColor: (liveEvents.length > 0 || polls.length > 0 || quizzes.length > 0) ? "#22c55e" : "#94a3b8",
                        display: "inline-block",
                      }}
                    />
                    {(liveEvents.length > 0 || polls.length > 0 || quizzes.length > 0) ? "LIVE ACTIVITY" : "EVENT STATUS"}
                  </span>
                </div>

                <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 600 }}>
                  ⚡ Realtime Sync Active
                </span>
              </div>

              {/* Active UI Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {(liveEvents.length === 0 && polls.length === 0 && quizzes.length === 0) ? (
                  <div
                    style={{
                      background: "rgba(10, 13, 24, 0.5)",
                      backdropFilter: "blur(16px)",
                      border: "1px dashed rgba(148, 163, 184, 0.2)",
                      borderRadius: "20px",
                      padding: "60px 20px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "3rem",
                        marginBottom: "20px",
                        filter: "drop-shadow(0 0 20px rgba(124, 58, 237, 0.4))",
                      }}
                    >
                      ✨
                    </div>
                    <h3
                      style={{
                        color: "#f8fafc",
                        fontSize: "1.5rem",
                        fontWeight: 800,
                        marginBottom: "10px",
                      }}
                    >
                      Activities Coming Soon
                    </h3>
                    <p style={{ color: "#94a3b8", fontSize: "0.95rem", maxWidth: "340px", lineHeight: 1.6, margin: 0 }}>
                      Hang tight! The host will activate polls, quizzes, and other live activities right here when it&apos;s time.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Live Event Activity Cards */}
                    {liveEvents.map((evt) => {
                      const hasSubActivities = polls.length > 0 || quizzes.length > 0;

                      return (
                        <div
                          key={evt.id}
                          style={{
                            background: "rgba(15, 20, 35, 0.95)",
                            border: "1.5px solid rgba(56, 189, 248, 0.45)",
                            borderRadius: "18px",
                            padding: "22px",
                            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.4)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#bae6fd", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              {evt.category || "Live Event Activity"}
                            </span>
                            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#4ade80", background: "rgba(34, 197, 94, 0.18)", border: "1px solid rgba(34, 197, 94, 0.4)", padding: "4px 10px", borderRadius: "9999px" }}>
                              ● LIVE NOW
                            </span>
                          </div>

                          <h3 style={{ color: "#ffffff", fontSize: "1.25rem", fontWeight: 800, margin: "0 0 10px 0" }}>
                            {evt.title}
                          </h3>
                          {evt.description && (
                            <p style={{ color: "#cbd5e1", fontSize: "0.92rem", lineHeight: 1.5, margin: "0 0 16px" }}>
                              {evt.description}
                            </p>
                          )}

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem", color: "#38bdf8", fontWeight: 600, paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap", gap: "10px" }}>
                            <div style={{ display: "flex", gap: "16px" }}>
                              {evt.date && <span>📅 {evt.date}</span>}
                              {evt.venue && <span>📍 {evt.venue}</span>}
                            </div>

                            {hasSubActivities && (
                              <button
                                onClick={() => setShowActivities(!showActivities)}
                                style={{
                                  padding: "8px 16px",
                                  background: showActivities ? "rgba(56, 189, 248, 0.25)" : "rgba(56, 189, 248, 0.15)",
                                  border: "1px solid rgba(56, 189, 248, 0.4)",
                                  borderRadius: "10px",
                                  color: "#38bdf8",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  fontSize: "0.82rem",
                                  transition: "all 0.2s",
                                }}
                              >
                                {showActivities ? "Hide Activities ↑" : "Join Activity →"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}



                {/* Active Polls & Quizzes (Shown when showActivities is true) */}
                {showActivities && (
                  <>
                    {polls.map((poll, pollIdx) => {
                      const hasVoted = Boolean(userVotes[poll.id]);
                      const userVotedOptionId = userVotes[poll.id];
                      const selectedOptIdx = selectedOptions[poll.id];
                      const totalVotes = poll.options
                        ? poll.options.reduce((sum, o) => sum + (o.votes || 0), 0)
                        : poll.totalVotes || 0;

                      return (
                        <div
                          key={poll.id}
                          style={{
                            background: "rgba(15, 20, 35, 0.95)",
                            border: hasVoted
                              ? "1.5px solid rgba(34, 197, 94, 0.45)"
                              : "1.5px solid rgba(124, 58, 237, 0.45)",
                            borderRadius: "18px",
                            padding: "22px",
                            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.4)",
                          }}
                        >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#c4b5fd", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Live Activity {polls.length > 1 ? `#${pollIdx + 1}` : ""}
                        </span>
                        {hasVoted && (
                          <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#4ade80", background: "rgba(34, 197, 94, 0.18)", border: "1px solid rgba(34, 197, 94, 0.4)", padding: "4px 10px", borderRadius: "9999px" }}>
                            ✓ Response Recorded
                          </span>
                        )}
                      </div>

                      <h3 style={{ color: "#ffffff", fontSize: "1.15rem", fontWeight: 800, margin: "0 0 18px 0", lineHeight: 1.45 }}>
                        {poll.question}
                      </h3>

                      {hasVoted ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          {poll.options.map((opt, optIdx) => {
                            const optionLetter = String.fromCharCode(65 + optIdx);
                            const count = opt.votes || 0;
                            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                            const isMyChoice = userVotedOptionId === opt.id;

                            return (
                              <div
                                key={opt.id || optIdx}
                                style={{
                                  background: isMyChoice ? "rgba(124, 58, 237, 0.25)" : "rgba(22, 27, 46, 0.95)",
                                  border: isMyChoice ? "1.5px solid #a78bfa" : "1.5px solid rgba(148, 163, 184, 0.25)",
                                  borderRadius: "14px",
                                  padding: "14px 16px",
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <span style={{ width: "24px", height: "24px", borderRadius: "6px", background: isMyChoice ? "#7c3aed" : "rgba(148, 163, 184, 0.2)", color: "#ffffff", fontSize: "0.8rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      {optionLetter}
                                    </span>
                                    <span style={{ fontSize: "0.95rem", color: "#ffffff", fontWeight: isMyChoice ? 800 : 600 }}>
                                      {opt.text}
                                    </span>
                                    {isMyChoice && (
                                      <span style={{ fontSize: "0.75rem", color: "#c4b5fd", fontWeight: 800 }}>
                                        (Your Choice)
                                      </span>
                                    )}
                                  </div>
                                  <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#38bdf8" }}>
                                    {pct}%
                                  </span>
                                </div>

                                <div style={{ height: "7px", background: "rgba(255, 255, 255, 0.12)", borderRadius: "99px", overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #7c3aed 0%, #38bdf8 100%)", borderRadius: "99px", transition: "width 0.5s ease-out" }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "18px" }}>
                            {poll.options.map((opt, optIdx) => {
                              const optionLetter = String.fromCharCode(65 + optIdx);
                              const isSelected = selectedOptIdx === optIdx;

                              return (
                                <button
                                  key={opt.id || optIdx}
                                  type="button"
                                  onClick={() => setSelectedOptions((prev) => ({ ...prev, [poll.id]: optIdx }))}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "14px 18px",
                                    borderRadius: "14px",
                                    background: isSelected ? "rgba(124, 58, 237, 0.3)" : "rgba(22, 27, 46, 0.95)",
                                    border: isSelected ? "1.5px solid #a78bfa" : "1.5px solid rgba(148, 163, 184, 0.35)",
                                    color: "#ffffff",
                                    fontSize: "0.95rem",
                                    fontWeight: isSelected ? 800 : 600,
                                    cursor: "pointer",
                                    textAlign: "left",
                                    transition: "all 0.15s ease",
                                    boxShadow: isSelected ? "0 0 16px rgba(124, 58, 237, 0.4)" : "none",
                                  }}
                                >
                                  <span style={{ width: "26px", height: "26px", borderRadius: "6px", background: isSelected ? "#7c3aed" : "rgba(124, 58, 237, 0.25)", border: "1px solid rgba(167, 139, 250, 0.4)", color: isSelected ? "#ffffff" : "#c4b5fd", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 800 }}>
                                    {optionLetter}
                                  </span>
                                  <span>{opt.text}</span>
                                </button>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCastVote(poll.id)}
                            disabled={selectedOptIdx === undefined}
                            style={{
                              width: "100%",
                              padding: "14px",
                              borderRadius: "14px",
                              background: selectedOptIdx !== undefined ? "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)" : "rgba(15, 20, 35, 0.6)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              color: selectedOptIdx !== undefined ? "#ffffff" : "#64748b",
                              fontSize: "0.95rem",
                              fontWeight: 700,
                              cursor: selectedOptIdx !== undefined ? "pointer" : "not-allowed",
                              boxShadow: selectedOptIdx !== undefined ? "0 4px 16px rgba(124, 58, 237, 0.4)" : "none",
                            }}
                          >
                            Submit Answer →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Quizzes Section */}
                {!activeQuiz ? (
                  quizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      style={{
                        background: "rgba(15, 20, 35, 0.95)",
                        border: "1.5px solid rgba(234, 179, 8, 0.45)",
                        borderRadius: "18px",
                        padding: "22px",
                        boxShadow: "0 8px 25px rgba(0, 0, 0, 0.4)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#fef08a", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Live Quiz
                        </span>
                        <span style={{ fontSize: "0.85rem", color: "#fef08a", fontWeight: 700 }}>
                          🏆 {quiz.totalPoints || 20} PTS
                        </span>
                      </div>

                      <h3 style={{ color: "#ffffff", fontSize: "1.15rem", fontWeight: 800, margin: "0 0 10px 0" }}>
                        {quiz.title}
                      </h3>
                      {quiz.description && (
                        <p style={{ color: "#cbd5e1", fontSize: "0.9rem", lineHeight: 1.5, margin: "0 0 16px" }}>
                          {quiz.description}
                        </p>
                      )}

                      <button
                        onClick={() => {
                          setActiveQuiz(quiz);
                          setUserAnswers({});
                          setQuizSubmitted(false);
                          setQuizScore(0);
                        }}
                        style={{
                          width: "100%",
                          padding: "14px",
                          background: "rgba(234, 179, 8, 0.15)",
                          border: "1px solid rgba(234, 179, 8, 0.4)",
                          borderRadius: "12px",
                          color: "#eab308",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        Join Quiz →
                      </button>
                    </div>
                  ))
                ) : (
                  /* Active Quiz Game Runner */
                  <div style={{ background: "rgba(15, 20, 35, 0.95)", border: "1.5px solid rgba(234, 179, 8, 0.45)", borderRadius: "18px", padding: "28px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "14px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "#fff" }}>{activeQuiz.title}</h3>
                      </div>
                      <button
                        onClick={() => setActiveQuiz(null)}
                        style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.3)", color: "#94a3b8", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem" }}
                      >
                        ✕ Exit
                      </button>
                    </div>

                    {!quizSubmitted ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {activeQuiz.questions.map((q, qIdx) => (
                          <div key={q.id || qIdx} style={{ background: "rgba(22, 27, 46, 0.95)", padding: "18px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <h4 style={{ margin: "0 0 12px", fontSize: "1rem", fontWeight: 700, color: "#fff" }}>
                              {qIdx + 1}. {q.question}
                            </h4>
                            <div style={{ display: "grid", gap: "10px" }}>
                              {q.options.map((opt, oIdx) => (
                                <label
                                  key={oIdx}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: "12px 14px",
                                    background: userAnswers[qIdx] === oIdx ? "rgba(234, 179, 8, 0.2)" : "rgba(15, 20, 35, 0.8)",
                                    border: userAnswers[qIdx] === oIdx ? "1px solid #eab308" : "1px solid rgba(148, 163, 184, 0.2)",
                                    borderRadius: "10px",
                                    cursor: "pointer",
                                    fontSize: "0.9rem",
                                    fontWeight: 600,
                                    color: "#cbd5e1",
                                  }}
                                >
                                  <input
                                    type="radio"
                                    name={`q_${qIdx}`}
                                    checked={userAnswers[qIdx] === oIdx}
                                    onChange={() => setUserAnswers({ ...userAnswers, [qIdx]: oIdx })}
                                  />
                                  {opt}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}

                        <button
                          onClick={handleQuizSubmit}
                          style={{
                            width: "100%",
                            padding: "14px",
                            background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "12px",
                            fontWeight: 800,
                            fontSize: "0.95rem",
                            cursor: "pointer",
                          }}
                        >
                          Submit Answers →
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", padding: "16px 0" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🏆</div>
                        <h3 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 6px", color: "#4ade80" }}>Quiz Completed!</h3>
                        <p style={{ fontSize: "1rem", color: "#cbd5e1", margin: "0 0 20px" }}>
                          You scored <strong style={{ color: "#fef08a", fontSize: "1.2rem" }}>{quizScore}</strong> out of {activeQuiz.totalPoints} points!
                        </p>
                        <button
                          onClick={() => setActiveQuiz(null)}
                          style={{ padding: "10px 24px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}
                        >
                          Back to Activity Hub
                        </button>
                      </div>
                    )}
                  </div>
                )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}

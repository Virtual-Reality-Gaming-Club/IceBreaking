"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { checkIsAdmin, getAllAdmins, AdminUser } from "@/lib/adminAuth";
import { SeedDatabaseButton } from "@/components/SeedDatabaseButton";
import { collection, getDocs } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface EventItem {
  id: string;
  title: string;
  category: string;
  status: string;
  description?: string;
  date?: string;
  venue?: string;
  createdAt?: string;
}

interface ParticipantItem {
  id: string;
  registrationNumber: string;
  fullName: string;
  name?: string;
  email?: string;
  role?: string;
  totalScore?: number;
  registeredAt?: any;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Dashboard Stats & Data
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    activeAdmins: 0,
    totalTeams: 0,
  });
  const [participantsList, setParticipantsList] = useState<ParticipantItem[]>([]);
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [pollsList, setPollsList] = useState<any[]>([]);
  const [quizzesList, setQuizzesList] = useState<any[]>([]);
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "events" | "polls" | "quizzes" | "users" | "admins" | "tools">("overview");

  // Global Registration Toggle State
  const [registrationOpen, setRegistrationOpen] = useState(false);

  // Poll Form State
  const [pollModalOpen, setPollModalOpen] = useState(false);
  const [editingPollId, setEditingPollId] = useState<string | null>(null);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollStatus, setPollStatus] = useState<"active" | "closed" | "draft">("active");
  const [isSavingPoll, setIsSavingPoll] = useState(false);

  // Quiz Form State
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizStatus, setQuizStatus] = useState<"active" | "closed" | "draft">("active");
  const [quizTimeLimit, setQuizTimeLimit] = useState(10); // mins
  const [quizQuestions, setQuizQuestions] = useState<
    { id: string; question: string; options: string[]; correctAnswerIndex: number; points: number }[]
  >([
    { id: "q_1", question: "", options: ["", "", "", ""], correctAnswerIndex: 0, points: 10 }
  ]);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);

  // Event Form State
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventCategory, setEventCategory] = useState("Icebreaker Games");
  const [eventStatus, setEventStatus] = useState("live");
  const [eventDescription, setEventDescription] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  // Participant Edit & Delete State
  const [participantModalOpen, setParticipantModalOpen] = useState(false);
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [editParticipantName, setEditParticipantName] = useState("");
  const [editParticipantReg, setEditParticipantReg] = useState("");
  const [editParticipantScore, setEditParticipantScore] = useState(0);
  const [isSavingParticipant, setIsSavingParticipant] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setIsAdmin(false);
        setLoading(false);
        router.push("/admin-panel/login");
        return;
      }

      setUser(currentUser);
      const authorized = await checkIsAdmin(currentUser.email, currentUser.uid);
      setIsAdmin(authorized);

      if (!authorized) {
        setLoading(false);
        router.push("/admin-panel/login");
        return;
      }

      // Load Dashboard Data for verified admin
      fetchDashboardData();
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Participants from Firestore 'participants' collection
      const participantsSnap = await getDocs(collection(db, "participants"));
      const participantsData: ParticipantItem[] = [];
      participantsSnap.forEach((docSnap) => {
        participantsData.push({ id: docSnap.id, ...docSnap.data() } as ParticipantItem);
      });
      setParticipantsList(participantsData);

      // 2. Fetch Events from 'events' collection bucket
      fetchEvents();

      // 3. Fetch Admins
      const adminsData = await getAllAdmins();
      setAdminsList(adminsData);

      // 4. Fetch Leaderboard / Teams count
      const leaderboardSnap = await getDocs(collection(db, "leaderboard"));

      // 5. Fetch Polls & Quizzes & Registration Status
      fetchPolls();
      fetchQuizzes();
      fetchRegistrationStatus();

      const eventsSnap = await getDocs(collection(db, "events"));

      setStats({
        totalUsers: participantsSnap.size,
        totalEvents: eventsSnap.size,
        activeAdmins: adminsData.length > 0 ? adminsData.length : 2,
        totalTeams: leaderboardSnap.size,
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  const fetchRegistrationStatus = async () => {
    try {
      const { doc, getDoc } = await import("firebase/firestore");
      const configSnap = await getDoc(doc(db, "settings", "registration"));
      if (configSnap.exists()) {
        setRegistrationOpen(Boolean(configSnap.data()?.isOpen));
      } else {
        setRegistrationOpen(true);
      }
    } catch (err) {
      console.error("Error fetching registration status:", err);
    }
  };

  const handleToggleRegistration = async () => {
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      const nextState = !registrationOpen;
      await setDoc(doc(db, "settings", "registration"), {
        isOpen: nextState,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setRegistrationOpen(nextState);
    } catch (err) {
      console.error("Error toggling registration status:", err);
      alert("Failed to update registration status.");
    }
  };



  const fetchEvents = async () => {
    try {
      const eventsSnap = await getDocs(collection(db, "events"));
      const events: EventItem[] = [];
      eventsSnap.forEach((docSnap) => {
        events.push({ id: docSnap.id, ...docSnap.data() } as EventItem);
      });
      setEventsList(events);
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };



  const fetchPolls = async () => {
    try {
      const pollsSnap = await getDocs(collection(db, "polls"));
      const polls: any[] = [];
      pollsSnap.forEach((docSnap) => {
        polls.push({ id: docSnap.id, ...docSnap.data() });
      });
      setPollsList(polls);
    } catch (err) {
      console.error("Error fetching polls:", err);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const quizzesSnap = await getDocs(collection(db, "quizzes"));
      const quizzes: any[] = [];
      quizzesSnap.forEach((docSnap) => {
        quizzes.push({ id: docSnap.id, ...docSnap.data() });
      });
      setQuizzesList(quizzes);
    } catch (err) {
      console.error("Error fetching quizzes:", err);
    }
  };

  const handleOpenPollModal = (poll?: any) => {
    if (poll) {
      setEditingPollId(poll.id);
      setPollQuestion(poll.question || "");
      setPollOptions(poll.options ? poll.options.map((opt: any) => opt.text) : ["", ""]);
      setPollStatus(poll.status || "active");
    } else {
      setEditingPollId(null);
      setPollQuestion("");
      setPollOptions(["", ""]);
      setPollStatus("active");
    }
    setPollModalOpen(true);
  };

  const handleSavePoll = async () => {
    if (!pollQuestion.trim()) {
      alert("Please enter a poll question.");
      return;
    }
    const cleanOptions = pollOptions.filter((opt) => opt.trim().length > 0);
    if (cleanOptions.length < 2) {
      alert("Please provide at least 2 options for the poll.");
      return;
    }

    setIsSavingPoll(true);
    try {
      const { doc, setDoc, updateDoc } = await import("firebase/firestore");

      if (editingPollId) {
        const existingPoll = pollsList.find((p) => p.id === editingPollId);
        const updatedOptions = cleanOptions.map((text, idx) => {
          const prevOpt = existingPoll?.options?.[idx];
          return {
            id: prevOpt?.id || `opt_${idx + 1}_${Date.now()}`,
            text: text.trim(),
            votes: prevOpt?.votes || 0,
          };
        });

        await updateDoc(doc(db, "polls", editingPollId), {
          question: pollQuestion.trim(),
          status: pollStatus,
          options: updatedOptions,
          updatedAt: new Date().toISOString(),
        });
      } else {
        const newPollRef = doc(collection(db, "polls"));
        const newOptions = cleanOptions.map((text, idx) => ({
          id: `opt_${idx + 1}_${Date.now()}`,
          text: text.trim(),
          votes: 0,
        }));

        await setDoc(newPollRef, {
          id: newPollRef.id,
          question: pollQuestion.trim(),
          status: pollStatus,
          options: newOptions,
          totalVotes: 0,
          createdAt: new Date().toISOString(),
        });
      }

      setPollModalOpen(false);
      fetchPolls();
    } catch (err) {
      console.error("Error saving poll:", err);
      alert("Failed to save poll. Check console.");
    } finally {
      setIsSavingPoll(false);
    }
  };

  const handleTogglePollStatus = async (poll: any) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const nextStatus = poll.status === "active" ? "closed" : "active";
      await updateDoc(doc(db, "polls", poll.id), { status: nextStatus });
      fetchPolls();
    } catch (err) {
      console.error("Error updating poll status:", err);
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm("Are you sure you want to delete this poll?")) return;
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "polls", pollId));
      fetchPolls();
    } catch (err) {
      console.error("Error deleting poll:", err);
    }
  };

  // QUIZ HANDLERS
  const handleOpenQuizModal = (quiz?: any) => {
    if (quiz) {
      setEditingQuizId(quiz.id);
      setQuizTitle(quiz.title || "");
      setQuizDescription(quiz.description || "");
      setQuizStatus(quiz.status || "active");
      setQuizTimeLimit(quiz.timeLimit || 10);
      setQuizQuestions(
        quiz.questions && quiz.questions.length > 0
          ? quiz.questions
          : [{ id: "q_1", question: "", options: ["", "", "", ""], correctAnswerIndex: 0, points: 10 }]
      );
    } else {
      setEditingQuizId(null);
      setQuizTitle("");
      setQuizDescription("");
      setQuizStatus("active");
      setQuizTimeLimit(10);
      setQuizQuestions([{ id: "q_1", question: "", options: ["", "", "", ""], correctAnswerIndex: 0, points: 10 }]);
    }
    setQuizModalOpen(true);
  };

  const handleSaveQuiz = async () => {
    if (!quizTitle.trim()) {
      alert("Please enter a quiz title.");
      return;
    }
    if (quizQuestions.length === 0) {
      alert("Please add at least one question to the quiz.");
      return;
    }

    for (let i = 0; i < quizQuestions.length; i++) {
      const q = quizQuestions[i];
      if (!q.question.trim()) {
        alert(`Question #${i + 1} text cannot be empty.`);
        return;
      }
      const filledOpts = q.options.filter((o) => o.trim().length > 0);
      if (filledOpts.length < 2) {
        alert(`Question #${i + 1} must have at least 2 option choices.`);
        return;
      }
    }

    setIsSavingQuiz(true);
    try {
      const { doc, setDoc, updateDoc } = await import("firebase/firestore");

      const sanitizedQuestions = quizQuestions.map((q, idx) => ({
        id: q.id || `q_${idx + 1}_${Date.now()}`,
        question: q.question.trim(),
        options: q.options.map((o) => o.trim()),
        correctAnswerIndex: Number(q.correctAnswerIndex),
        points: Number(q.points) || 10,
      }));

      const totalPoints = sanitizedQuestions.reduce((acc, curr) => acc + curr.points, 0);

      if (editingQuizId) {
        await updateDoc(doc(db, "quizzes", editingQuizId), {
          title: quizTitle.trim(),
          description: quizDescription.trim(),
          status: quizStatus,
          timeLimit: Number(quizTimeLimit),
          questions: sanitizedQuestions,
          totalPoints,
          updatedAt: new Date().toISOString(),
        });
      } else {
        const newQuizRef = doc(collection(db, "quizzes"));
        await setDoc(newQuizRef, {
          id: newQuizRef.id,
          title: quizTitle.trim(),
          description: quizDescription.trim(),
          status: quizStatus,
          timeLimit: Number(quizTimeLimit),
          questions: sanitizedQuestions,
          totalPoints,
          createdAt: new Date().toISOString(),
        });
      }

      setQuizModalOpen(false);
      fetchQuizzes();
    } catch (err) {
      console.error("Error saving quiz:", err);
      alert("Failed to save quiz. Check console.");
    } finally {
      setIsSavingQuiz(false);
    }
  };

  const handleToggleQuizStatus = async (quiz: any) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const nextStatus = quiz.status === "active" ? "closed" : "active";
      await updateDoc(doc(db, "quizzes", quiz.id), { status: nextStatus });
      fetchQuizzes();
    } catch (err) {
      console.error("Error updating quiz status:", err);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "quizzes", quizId));
      fetchQuizzes();
    } catch (err) {
      console.error("Error deleting quiz:", err);
    }
  };

  // PARTICIPANT HANDLERS (Firestore 'participants' collection)
  const handleOpenParticipantModal = (participant?: ParticipantItem) => {
    if (participant) {
      setEditingParticipantId(participant.id);
      setEditParticipantName(participant.fullName || participant.name || "");
      setEditParticipantReg(participant.registrationNumber || participant.id || "");
      setEditParticipantScore(participant.totalScore || 0);
    } else {
      setEditingParticipantId(null);
      setEditParticipantName("");
      setEditParticipantReg("");
      setEditParticipantScore(0);
    }
    setParticipantModalOpen(true);
  };

  const handleSaveParticipant = async () => {
    if (!editParticipantReg.trim() || !editParticipantName.trim()) {
      alert("Please provide both Name and Registration Number.");
      return;
    }

    const normalizedReg = editParticipantReg.trim().toUpperCase();
    const normalizedName = editParticipantName.trim();

    setIsSavingParticipant(true);
    try {
      const { doc, setDoc, deleteDoc, getDoc } = await import("firebase/firestore");

      if (editingParticipantId) {
        // If registration number changed, migrate/create new doc and remove old doc
        if (editingParticipantId !== normalizedReg) {
          const oldDocRef = doc(db, "participants", editingParticipantId);
          const oldDocSnap = await getDoc(oldDocRef);
          const oldData = oldDocSnap.exists() ? oldDocSnap.data() : {};

          // Write new document with updated registration number
          await setDoc(doc(db, "participants", normalizedReg), {
            ...oldData,
            registrationNumber: normalizedReg,
            fullName: normalizedName,
            totalScore: Number(editParticipantScore) || 0,
            updatedAt: new Date().toISOString(),
          });

          // Delete old document
          await deleteDoc(oldDocRef);
        } else {
          // Registration number unchanged - update existing document
          await setDoc(
            doc(db, "participants", editingParticipantId),
            {
              fullName: normalizedName,
              registrationNumber: normalizedReg,
              totalScore: Number(editParticipantScore) || 0,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      } else {
        // Create new participant document
        await setDoc(doc(db, "participants", normalizedReg), {
          registrationNumber: normalizedReg,
          fullName: normalizedName,
          totalScore: Number(editParticipantScore) || 0,
          registeredAt: new Date().toISOString(),
        });
      }

      setParticipantModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      console.error("Error saving participant:", err);
      alert("Failed to save participant document. Check console.");
    } finally {
      setIsSavingParticipant(false);
    }
  };

  const handleDeleteParticipant = async (participantId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete participant entry '${name || participantId}'?`)) return;
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "participants", participantId));
      fetchDashboardData();
    } catch (err) {
      console.error("Error deleting participant:", err);
      alert("Failed to delete participant entry.");
    }
  };

  // EVENT HANDLERS (Firestore 'events' collection)
  const handleOpenEventModal = (evt?: any) => {
    if (evt) {
      setEditingEventId(evt.id);
      setEventTitle(evt.title || "");
      setEventCategory(evt.category || "Icebreaker Games");
      setEventStatus(evt.status || "live");
      setEventDescription(evt.description || "");
      setEventVenue(evt.venue || "");
      setEventDate(evt.date || "");
    } else {
      setEditingEventId(null);
      setEventTitle("");
      setEventCategory("Icebreaker Games");
      setEventStatus("live");
      setEventDescription("");
      setEventVenue("");
      setEventDate("");
    }
    setEventModalOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!eventTitle.trim()) {
      alert("Please enter an event title.");
      return;
    }

    setIsSavingEvent(true);
    try {
      const { doc, setDoc, updateDoc } = await import("firebase/firestore");

      if (editingEventId) {
        await updateDoc(doc(db, "events", editingEventId), {
          title: eventTitle.trim(),
          category: eventCategory,
          status: eventStatus,
          description: eventDescription.trim(),
          venue: eventVenue.trim(),
          date: eventDate,
          updatedAt: new Date().toISOString(),
        });
      } else {
        const newEvtRef = doc(collection(db, "events"));
        await setDoc(newEvtRef, {
          id: newEvtRef.id,
          title: eventTitle.trim(),
          category: eventCategory,
          status: eventStatus,
          description: eventDescription.trim(),
          venue: eventVenue.trim(),
          date: eventDate,
          createdAt: new Date().toISOString(),
        });
      }

      setEventModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      console.error("Error saving event:", err);
      alert("Failed to save event.");
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleToggleEventStatus = async (evt: any) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const nextStatus = evt.status === "live" || evt.status === "active" ? "upcoming" : "live";
      await updateDoc(doc(db, "events", evt.id), { status: nextStatus });
      fetchDashboardData();
    } catch (err) {
      console.error("Error updating event status:", err);
    }
  };

  const handleDeleteEvent = async (evtId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "events", evtId));
      fetchDashboardData();
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  };




  if (loading || !user || !isAdmin) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#06070a",
          color: "#a78bfa",
          fontSize: "1.1rem",
          fontWeight: 600,
        }}
      >
        🔒 Verifying Admin Authorization...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 20% -10%, rgba(124, 58, 237, 0.15), transparent 60%), radial-gradient(ellipse at 80% 110%, rgba(59, 130, 246, 0.1), transparent 60%), #06070a", color: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
      {/* Top Navbar */}
      <header
        style={{
          height: "72px",
          borderBottom: "1px solid rgba(124, 58, 237, 0.25)",
          background: "rgba(10, 13, 24, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "0 36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(124, 58, 237, 0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "1.2rem",
              color: "#ffffff",
              boxShadow: "0 0 20px rgba(124, 58, 237, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            ⚡
          </div>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 900, margin: 0, letterSpacing: "-0.01em", background: "linear-gradient(90deg, #ffffff, #c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              VRGC Admin Portal
            </h2>
            <span style={{ fontSize: "0.75rem", color: "#a78bfa", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              IceBreaking 2026 Dashboard
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* User Profile Avatar & Info */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(15, 20, 35, 0.6)", padding: "6px 14px 6px 8px", borderRadius: "30px", border: "1px solid rgba(124, 58, 237, 0.25)" }}>
            <Avatar>
              <AvatarImage
                src={user?.photoURL || undefined}
                alt={user?.displayName || "Admin Avatar"}
              />
              <AvatarFallback className="bg-violet-900 text-violet-200 font-bold">
                {(user?.displayName || user?.email || "A").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div style={{ textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 800, color: "#f8fafc", lineHeight: 1.2 }}>
                {user?.displayName
                  ? user.displayName.replace(/\b[0-9]{2}[A-Za-z]{3}[0-9]{5}\b/gi, "").trim()
                  : "Admin User"}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold">
                  👑 Superadmin
                </Badge>
              </div>
            </div>
          </div>

          <button
            onClick={async () => {
              await signOut(auth);
              router.push("/admin-panel/login");
            }}
            style={{
              padding: "9px 18px",
              fontSize: "0.85rem",
              fontWeight: 700,
              background: "rgba(239, 68, 68, 0.12)",
              color: "#fca5a5",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "12px",
              cursor: "pointer",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.25)";
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)";
              e.currentTarget.style.boxShadow = "0 0 15px rgba(239, 68, 68, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)";
              e.currentTarget.style.color = "#fca5a5";
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            🚪 Sign Out
          </button>
        </div>
      </header>

      <div style={{ display: "flex", minHeight: "calc(100vh - 72px)" }}>
        {/* Sidebar Navigation */}
        <aside
          style={{
            width: "250px",
            borderRight: "1px solid rgba(124, 58, 237, 0.15)",
            background: "rgba(10, 13, 24, 0.6)",
            backdropFilter: "blur(16px)",
            padding: "24px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {[
            { id: "overview", label: "📊 Overview" },
            { id: "events", label: "🎮 Manage Events" },
            { id: "polls", label: "📊 Manage Polls" },
            { id: "quizzes", label: "🧠 Manage Quizzes" },
            { id: "users", label: "👥 Participants" },
            { id: "admins", label: "🛡️ Admin Roster" },
            { id: "tools", label: "⚙️ Database Tools" },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                style={{
                  width: "100%",
                  padding: "12px 18px",
                  borderRadius: "12px",
                  border: isActive ? "1px solid rgba(124, 58, 237, 0.4)" : "1px solid transparent",
                  background: isActive
                    ? "linear-gradient(135deg, rgba(124, 58, 237, 0.3) 0%, rgba(59, 130, 246, 0.15) 100%)"
                    : "transparent",
                  color: isActive ? "#ffffff" : "#94a3b8",
                  fontWeight: isActive ? 800 : 600,
                  fontSize: "0.92rem",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  boxShadow: isActive ? "0 4px 20px rgba(124, 58, 237, 0.25)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(124, 58, 237, 0.12)";
                    e.currentTarget.style.color = "#c4b5fd";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#94a3b8";
                  }
                }}
              >
                {item.label}
              </button>
            );
          })}

          <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid rgba(148, 163, 184, 0.1)" }}>
            <Link href="/" style={{ color: "#a78bfa", fontSize: "0.85rem", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              ← Return to Main Site
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: "36px 44px", maxWidth: "1250px" }}>
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "6px", letterSpacing: "-0.02em" }}>Dashboard Overview</h1>
              <p style={{ color: "#94a3b8", fontSize: "0.98rem", marginBottom: "36px" }}>
                Real-time operational metrics & platform controls for IceBreaking 2026.
              </p>

              {/* Event Registration Status Control Banner */}
              <div
                style={{
                  marginBottom: "32px",
                  padding: "24px 28px",
                  background: registrationOpen ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                  border: registrationOpen ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "16px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "1rem", fontWeight: 800, color: "#f8fafc" }}>
                      📝 Event Registration Status:
                    </span>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontWeight: 700,
                        background: registrationOpen ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                        color: registrationOpen ? "#4ade80" : "#fca5a5",
                        border: registrationOpen ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid rgba(239, 68, 68, 0.4)",
                      }}
                    >
                      {registrationOpen ? "🟢 OPEN (Public Can Register)" : "🔒 CLOSED (Registration Locked)"}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: "#cbd5e1", fontSize: "0.88rem" }}>
                    {registrationOpen
                      ? "Users on the home page can click 'Register Now' to submit their details."
                      : "The home page will display '🔒 Registration is currently closed.'"}
                  </p>
                </div>

                <button
                  onClick={handleToggleRegistration}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "10px",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    background: registrationOpen ? "linear-gradient(135deg, #ef4444, #dc2626)" : "linear-gradient(135deg, #22c55e, #16a34a)",
                    color: "#ffffff",
                    boxShadow: registrationOpen ? "0 0 15px rgba(239, 68, 68, 0.4)" : "0 0 15px rgba(34, 197, 94, 0.4)",
                  }}
                >
                  {registrationOpen ? "🔒 Close Registration" : "🟢 Open Registration"}
                </button>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "22px", marginBottom: "40px" }}>
                {[
                  { label: "Total Participants", value: stats.totalUsers || 2, color: "#818cf8", accent: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" },
                  { label: "Active Events", value: eventsList.length, color: "#60a5fa", accent: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
                  { label: "Active Polls", value: pollsList.length, color: "#fbbf24", accent: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
                  { label: "Active Quizzes", value: quizzesList.length, color: "#f472b6", accent: "bg-pink-500/10 text-pink-400 border-pink-500/30" },
                  { label: "System Admins", value: stats.activeAdmins || 2, color: "#34d399", accent: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
                ].map((card, idx) => (
                  <Card key={idx} className="bg-slate-950/80 border-slate-800 shadow-xl backdrop-blur-xl relative overflow-hidden transition-all hover:border-violet-500/40">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-slate-400 font-bold text-xs uppercase tracking-wider">{card.label}</CardDescription>
                      <CardTitle className="text-3xl font-black text-white" style={{ color: card.color }}>
                        {card.value}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                      <Badge variant="outline" className={`${card.accent} font-bold text-[11px] px-2.5 py-0.5`}>
                        Live System Data
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Registered System Admins Box */}
              <Card className="bg-slate-950/90 border-slate-800 shadow-2xl p-6 backdrop-blur-xl">
                <CardHeader className="px-0 pt-0 pb-6 border-b border-slate-800/80 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-black text-white">Registered Superadmins</CardTitle>
                    <CardDescription className="text-slate-400 mt-1 text-sm">Verified administrator roster with full system privileges.</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-violet-500/15 text-violet-300 border-violet-500/40 px-3.5 py-1 font-bold text-xs">
                    🛡️ 2 Active Admins
                  </Badge>
                </CardHeader>

                <CardContent className="px-0 pt-6">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
                    {[
                      { name: "Jaiyansh", email: "jaiyansh.25bcy10268@vitbhopal.ac.in", role: "Superadmin", initial: "J", bg: "from-violet-600 to-indigo-900" },
                      { name: "Abhinav Mishra", email: "abhinav.25bcy10254@vitbhopal.ac.in", role: "Superadmin", initial: "A", bg: "from-blue-600 to-indigo-900" },
                    ].map((admin, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-violet-500/40 transition-all shadow-lg"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar size="lg">
                            <AvatarFallback className={`bg-gradient-to-br ${admin.bg} text-white font-black text-lg border border-white/20`}>
                              {admin.initial}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <strong className="text-base font-black text-white block">{admin.name}</strong>
                            <span className="text-xs text-slate-400 font-semibold block mt-0.5">{admin.email}</span>
                          </div>
                        </div>

                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-extrabold px-3 py-1 text-xs">
                          👑 {admin.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* EVENTS TAB */}
          {activeTab === "events" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0 0 4px" }}>Manage Events</h1>
                  <p style={{ color: "#94a3b8", fontSize: "0.95rem", margin: 0 }}>View, create, edit, or update status of IceBreaking event activities.</p>
                </div>
                <button
                  onClick={() => handleOpenEventModal()}
                  style={{
                    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                    color: "#ffffff",
                    border: "none",
                    padding: "12px 20px",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    boxShadow: "0 0 15px rgba(59, 130, 246, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  ➕ Create New Event
                </button>
              </div>

              <div style={{ display: "grid", gap: "16px" }}>
                {eventsList.length > 0 ? (
                  eventsList.map((evt: any) => (
                    <div key={evt.id} style={{ padding: "24px", background: "rgba(17, 20, 32, 0.7)", border: "1px solid rgba(148, 163, 184, 0.15)", borderRadius: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "0.8rem", background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.3)", padding: "3px 10px", borderRadius: "6px", fontWeight: 600 }}>
                              {evt.category || "General"}
                            </span>
                            <span style={{ fontSize: "0.75rem", padding: "3px 10px", borderRadius: "20px", fontWeight: 700, background: evt.status === "live" || evt.status === "active" ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)", color: evt.status === "live" || evt.status === "active" ? "#4ade80" : "#fca5a5" }}>
                              ● {(evt.status || "upcoming").toUpperCase()}
                            </span>
                          </div>
                          <h3 style={{ margin: "0 0 6px", fontSize: "1.2rem", fontWeight: 700, color: "#f8fafc" }}>{evt.title}</h3>
                          {evt.description && <p style={{ margin: "0 0 10px", color: "#94a3b8", fontSize: "0.88rem" }}>{evt.description}</p>}
                          <div style={{ display: "flex", gap: "16px", fontSize: "0.8rem", color: "#cbd5e1" }}>
                            {evt.date && <span>📅 {evt.date}</span>}
                            {evt.venue && <span>📍 {evt.venue}</span>}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleToggleEventStatus(evt)}
                            style={{ padding: "6px 12px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(148, 163, 184, 0.2)", color: "#cbd5e1", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}
                          >
                            {evt.status === "live" || evt.status === "active" ? "Set Upcoming" : "Set Live"}
                          </button>
                          <button
                            onClick={() => handleOpenEventModal(evt)}
                            style={{ padding: "6px 12px", background: "rgba(59, 130, 246, 0.2)", border: "1px solid rgba(59, 130, 246, 0.4)", color: "#60a5fa", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(evt.id)}
                            style={{ padding: "6px 12px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "40px", textAlign: "center", background: "rgba(17, 20, 32, 0.5)", border: "1px dashed rgba(148, 163, 184, 0.2)", borderRadius: "16px" }}>
                    <p style={{ color: "#94a3b8", fontSize: "1rem", margin: "0 0 16px" }}>No events found in database.</p>
                    <button
                      onClick={() => handleOpenEventModal()}
                      style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
                    >
                      Create First Event
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}




          {/* POLLS TAB */}
          {activeTab === "polls" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0 0 4px" }}>Polls Management</h1>
                  <p style={{ color: "#94a3b8", fontSize: "0.95rem", margin: 0 }}>Create, edit, toggle active status, or delete audience polls.</p>
                </div>
                <button
                  onClick={() => handleOpenPollModal()}
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                    color: "#ffffff",
                    border: "none",
                    padding: "12px 20px",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    boxShadow: "0 0 15px rgba(124, 58, 237, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  ➕ Create New Poll
                </button>
              </div>

              <div style={{ display: "grid", gap: "20px" }}>
                {pollsList.length > 0 ? (
                  pollsList.map((poll) => {
                    const totalVotes = poll.options
                      ? poll.options.reduce((sum: number, o: any) => sum + (o.votes || 0), 0)
                      : poll.totalVotes || 0;

                    return (
                      <div
                        key={poll.id}
                        style={{
                          background: "rgba(17, 20, 32, 0.7)",
                          border: "1px solid rgba(148, 163, 184, 0.15)",
                          borderRadius: "16px",
                          padding: "24px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  padding: "3px 10px",
                                  borderRadius: "20px",
                                  fontWeight: 700,
                                  background: poll.status === "active" ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                  color: poll.status === "active" ? "#4ade80" : "#fca5a5",
                                  border: poll.status === "active" ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                                }}
                              >
                                {poll.status === "active" ? "🟢 Active Poll" : "🔴 Closed"}
                              </span>
                              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Total Votes: {totalVotes}</span>
                            </div>
                            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#f8fafc" }}>
                              {poll.question}
                            </h3>
                          </div>

                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => handleTogglePollStatus(poll)}
                              style={{
                                padding: "6px 12px",
                                background: "rgba(255, 255, 255, 0.05)",
                                border: "1px solid rgba(148, 163, 184, 0.2)",
                                color: "#cbd5e1",
                                borderRadius: "6px",
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                fontWeight: 600,
                              }}
                            >
                              {poll.status === "active" ? "Pause/Close" : "Set Active"}
                            </button>
                            <button
                              onClick={() => handleOpenPollModal(poll)}
                              style={{
                                padding: "6px 12px",
                                background: "rgba(124, 58, 237, 0.2)",
                                border: "1px solid rgba(124, 58, 237, 0.4)",
                                color: "#c4b5fd",
                                borderRadius: "6px",
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                fontWeight: 600,
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeletePoll(poll.id)}
                              style={{
                                padding: "6px 12px",
                                background: "rgba(239, 68, 68, 0.15)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                color: "#fca5a5",
                                borderRadius: "6px",
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                fontWeight: 600,
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>

                        {/* Poll Options Breakdown */}
                        <div style={{ display: "grid", gap: "10px", marginTop: "16px" }}>
                          {poll.options?.map((opt: any, idx: number) => {
                            const votes = opt.votes || 0;
                            const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                            return (
                              <div key={idx} style={{ background: "rgba(255, 255, 255, 0.03)", padding: "12px 16px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", fontWeight: 600, marginBottom: "6px" }}>
                                  <span>{opt.text}</span>
                                  <span style={{ color: "#a78bfa" }}>{votes} votes ({percentage}%)</span>
                                </div>
                                <div style={{ height: "6px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px", overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${percentage}%`, background: "linear-gradient(90deg, #7c3aed, #a78bfa)", borderRadius: "4px", transition: "width 0.4s ease" }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: "40px", textAlign: "center", background: "rgba(17, 20, 32, 0.5)", border: "1px dashed rgba(148, 163, 184, 0.2)", borderRadius: "16px" }}>
                    <p style={{ color: "#94a3b8", fontSize: "1rem", margin: "0 0 16px" }}>No active or created polls yet.</p>
                    <button
                      onClick={() => handleOpenPollModal()}
                      style={{
                        background: "#7c3aed",
                        color: "#fff",
                        border: "none",
                        padding: "10px 18px",
                        borderRadius: "8px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Create First Poll
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* QUIZZES TAB */}
          {activeTab === "quizzes" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0 0 4px" }}>Quiz Management</h1>
                  <p style={{ color: "#94a3b8", fontSize: "0.95rem", margin: 0 }}>Create, edit, toggle status, or remove gaming trivia quizzes.</p>
                </div>
                <button
                  onClick={() => handleOpenQuizModal()}
                  style={{
                    background: "linear-gradient(135deg, #ec4899, #be185d)",
                    color: "#ffffff",
                    border: "none",
                    padding: "12px 20px",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    boxShadow: "0 0 15px rgba(236, 72, 153, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  ➕ Create New Quiz
                </button>
              </div>

              <div style={{ display: "grid", gap: "20px" }}>
                {quizzesList.length > 0 ? (
                  quizzesList.map((quiz) => (
                    <div
                      key={quiz.id}
                      style={{
                        background: "rgba(17, 20, 32, 0.7)",
                        border: "1px solid rgba(148, 163, 184, 0.15)",
                        borderRadius: "16px",
                        padding: "24px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                padding: "3px 10px",
                                borderRadius: "20px",
                                fontWeight: 700,
                                background: quiz.status === "active" ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                color: quiz.status === "active" ? "#4ade80" : "#fca5a5",
                                border: quiz.status === "active" ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                              }}
                            >
                              {quiz.status === "active" ? "🟢 Active Quiz" : "🔴 Closed"}
                            </span>
                            <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>⏱️ {quiz.timeLimit || 10} Mins</span>
                            <span style={{ fontSize: "0.8rem", color: "#f472b6", fontWeight: 600 }}>
                              🏆 {quiz.totalPoints || 0} Total Points
                            </span>
                          </div>
                          <h3 style={{ margin: "0 0 6px", fontSize: "1.2rem", fontWeight: 700, color: "#f8fafc" }}>
                            {quiz.title}
                          </h3>
                          {quiz.description && (
                            <p style={{ color: "#94a3b8", fontSize: "0.88rem", margin: 0 }}>{quiz.description}</p>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleToggleQuizStatus(quiz)}
                            style={{
                              padding: "6px 12px",
                              background: "rgba(255, 255, 255, 0.05)",
                              border: "1px solid rgba(148, 163, 184, 0.2)",
                              color: "#cbd5e1",
                              borderRadius: "6px",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            {quiz.status === "active" ? "Pause/Close" : "Set Active"}
                          </button>
                          <button
                            onClick={() => handleOpenQuizModal(quiz)}
                            style={{
                              padding: "6px 12px",
                              background: "rgba(236, 72, 153, 0.2)",
                              border: "1px solid rgba(236, 72, 153, 0.4)",
                              color: "#f472b6",
                              borderRadius: "6px",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteQuiz(quiz.id)}
                            style={{
                              padding: "6px 12px",
                              background: "rgba(239, 68, 68, 0.15)",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              color: "#fca5a5",
                              borderRadius: "6px",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>

                      {/* Quiz Questions Preview */}
                      <div style={{ marginTop: "16px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "16px" }}>
                        <h4 style={{ margin: "0 0 12px", fontSize: "0.9rem", color: "#c4b5fd", fontWeight: 700 }}>
                          Questions ({quiz.questions?.length || 0})
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {quiz.questions?.map((q: any, idx: number) => (
                            <div key={idx} style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>
                              <strong>Q{idx + 1}:</strong> {q.question}{" "}
                              <span style={{ color: "#4ade80", fontSize: "0.78rem" }}>({q.points || 10} pts)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "40px", textAlign: "center", background: "rgba(17, 20, 32, 0.5)", border: "1px dashed rgba(148, 163, 184, 0.2)", borderRadius: "16px" }}>
                    <p style={{ color: "#94a3b8", fontSize: "1rem", margin: "0 0 16px" }}>No active or created quizzes yet.</p>
                    <button
                      onClick={() => handleOpenQuizModal()}
                      style={{
                        background: "#ec4899",
                        color: "#fff",
                        border: "none",
                        padding: "10px 18px",
                        borderRadius: "8px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Create First Quiz
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === "users" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0 0 4px" }}>Registered Participants</h1>
                  <p style={{ color: "#94a3b8", fontSize: "0.95rem", margin: 0 }}>Manage event participant registrations, scores, and entries in Firestore.</p>
                </div>
                <button
                  onClick={() => handleOpenParticipantModal()}
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
                    color: "#ffffff",
                    border: "none",
                    padding: "12px 20px",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    boxShadow: "0 0 15px rgba(124, 58, 237, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  ➕ Add New Participant
                </button>
              </div>

              <div style={{ background: "rgba(17, 20, 32, 0.7)", border: "1px solid rgba(148, 163, 184, 0.12)", borderRadius: "16px", padding: "20px" }}>
                {participantsList.length > 0 ? (
                  participantsList.map((u) => {
                    const pName = u.fullName || u.name || "Participant";
                    const pReg = u.registrationNumber || u.id;
                    return (
                      <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderBottom: "1px solid rgba(148, 163, 184, 0.1)", flexWrap: "wrap", gap: "12px" }}>
                        <div>
                          <h4 style={{ margin: "0 0 4px", fontSize: "1rem", fontWeight: 700, color: "#f8fafc" }}>
                            {pName}
                          </h4>
                          <span style={{ fontSize: "0.82rem", color: "#a78bfa", fontWeight: 600 }}>
                            Reg #: {pReg}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "0.85rem", background: "rgba(124, 58, 237, 0.2)", color: "#c4b5fd", padding: "4px 10px", borderRadius: "6px", fontWeight: 700 }}>
                            ⭐ Score: {u.totalScore || 0} pts
                          </span>
                          <button
                            onClick={() => handleOpenParticipantModal(u)}
                            style={{
                              padding: "6px 12px",
                              background: "rgba(59, 130, 246, 0.2)",
                              border: "1px solid rgba(59, 130, 246, 0.4)",
                              color: "#60a5fa",
                              borderRadius: "6px",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteParticipant(u.id, pName)}
                            style={{
                              padding: "6px 12px",
                              background: "rgba(239, 68, 68, 0.15)",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              color: "#fca5a5",
                              borderRadius: "6px",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: "#94a3b8" }}>No registered participants found in Firestore collection 'participants'.</p>
                )}
              </div>
            </div>
          )}


          {/* ADMINS TAB */}
          {activeTab === "admins" && (
            <div>
              <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "8px" }}>System Administrators</h1>
              <p style={{ color: "#94a3b8", fontSize: "0.95rem", marginBottom: "32px" }}>Authorized accounts with administrative access.</p>

              <div style={{ display: "grid", gap: "16px" }}>
                <div style={{ padding: "20px", background: "rgba(124, 58, 237, 0.1)", border: "1px solid rgba(124, 58, 237, 0.3)", borderRadius: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Jaiyansh</h4>
                  </div>
                  <span style={{ color: "#22c55e", fontWeight: 700, fontSize: "0.85rem" }}>Superadmin</span>
                </div>
                <div style={{ padding: "20px", background: "rgba(124, 58, 237, 0.1)", border: "1px solid rgba(124, 58, 237, 0.3)", borderRadius: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Abhinav</h4>
                  </div>
                  <span style={{ color: "#22c55e", fontWeight: 700, fontSize: "0.85rem" }}>Superadmin</span>
                </div>
              </div>
            </div>
          )}

          {/* TOOLS TAB */}
          {activeTab === "tools" && (
            <div>
              <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "8px" }}>Database Operations</h1>
              <p style={{ color: "#94a3b8", fontSize: "0.95rem", marginBottom: "32px" }}>Manage Firestore database initialization & data seeding.</p>

              <div style={{ background: "rgba(17, 20, 32, 0.7)", border: "1px solid rgba(124, 58, 237, 0.3)", borderRadius: "16px", padding: "32px", maxWidth: "500px" }}>
                <h3 style={{ margin: "0 0 12px", fontSize: "1.2rem", fontWeight: 700 }}>Seed Firestore Collections</h3>
                <p style={{ fontSize: "0.88rem", color: "#cbd5e1", lineHeight: 1.6, marginBottom: "24px" }}>
                  Runs initial seed operations to populate default events, user collections, leaderboard records, and administrator documents.
                </p>
                <SeedDatabaseButton />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CREATE / EDIT POLL MODAL */}
      {pollModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#0d111d",
              border: "1px solid rgba(124, 58, 237, 0.4)",
              borderRadius: "20px",
              padding: "32px",
              width: "100%",
              maxWidth: "540px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)",
            }}
          >
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 6px", color: "#f8fafc" }}>
              {editingPollId ? "✏️ Edit Poll" : "➕ Create New Poll"}
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 24px" }}>
              Configure question and selectable choices for interactive audience voting.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                  Poll Question
                </label>
                <input
                  type="text"
                  placeholder="e.g. Which event area are you most excited about?"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                  Poll Status
                </label>
                <select
                  value={pollStatus}
                  onChange={(e) => setPollStatus(e.target.value as any)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#161b2c",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                >
                  <option value="active">Active (Accepting Votes)</option>
                  <option value="closed">Closed (View Only)</option>
                </select>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1" }}>
                    Options / Choices
                  </label>
                  <button
                    type="button"
                    onClick={() => setPollOptions([...pollOptions, ""])}
                    style={{
                      background: "rgba(124, 58, 237, 0.2)",
                      border: "none",
                      color: "#c4b5fd",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    + Add Choice
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "200px", overflowY: "auto" }}>
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const updated = [...pollOptions];
                          updated[idx] = e.target.value;
                          setPollOptions(updated);
                        }}
                        style={{
                          flex: 1,
                          padding: "10px 12px",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(148, 163, 184, 0.2)",
                          borderRadius: "8px",
                          color: "#fff",
                          fontSize: "0.9rem",
                          outline: "none",
                        }}
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                          style={{
                            background: "rgba(239, 68, 68, 0.15)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            color: "#fca5a5",
                            borderRadius: "8px",
                            padding: "0 12px",
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "28px" }}>
              <button
                type="button"
                onClick={() => setPollModalOpen(false)}
                style={{
                  padding: "10px 18px",
                  background: "transparent",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  color: "#94a3b8",
                  borderRadius: "10px",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePoll}
                disabled={isSavingPoll}
                style={{
                  padding: "10px 22px",
                  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  border: "none",
                  color: "#fff",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  opacity: isSavingPoll ? 0.6 : 1,
                  boxShadow: "0 0 15px rgba(124, 58, 237, 0.4)",
                }}
              >
                {isSavingPoll ? "Saving..." : editingPollId ? "Update Poll" : "Create Poll"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT QUIZ MODAL */}
      {quizModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#0d111d",
              border: "1px solid rgba(236, 72, 153, 0.4)",
              borderRadius: "20px",
              padding: "32px",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)",
            }}
          >
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 6px", color: "#f8fafc" }}>
              {editingQuizId ? "✏️ Edit Quiz" : "➕ Create New Gaming Quiz"}
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 24px" }}>
              Define quiz title, time limit, and multiple-choice questions with answer key.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                  Quiz Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ultimate Valorant & VR Trivia Challenge"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                    Status
                  </label>
                  <select
                    value={quizStatus}
                    onChange={(e) => setQuizStatus(e.target.value as any)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#161b2c",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  >
                    <option value="active">Active (Playable)</option>
                    <option value="closed">Closed (Disabled)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                    Time Limit (Minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={quizTimeLimit}
                    onChange={(e) => setQuizTimeLimit(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Short description or guidelines for participants..."
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "0.9rem",
                    outline: "none",
                    resize: "none",
                  }}
                />
              </div>

              {/* Questions Builder */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#f472b6" }}>
                    Quiz Questions ({quizQuestions.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setQuizQuestions([
                        ...quizQuestions,
                        { id: `q_${Date.now()}`, question: "", options: ["", "", "", ""], correctAnswerIndex: 0, points: 10 },
                      ])
                    }
                    style={{
                      background: "rgba(236, 72, 153, 0.2)",
                      border: "1px solid rgba(236, 72, 153, 0.4)",
                      color: "#f472b6",
                      padding: "6px 14px",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    + Add Question
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {quizQuestions.map((q, qIdx) => (
                    <div
                      key={q.id || qIdx}
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "12px",
                        padding: "18px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#a78bfa" }}>
                          Question #{qIdx + 1}
                        </span>
                        {quizQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setQuizQuestions(quizQuestions.filter((_, i) => i !== qIdx))}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#fca5a5",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            🗑️ Remove Question
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="Question Prompt / Title..."
                        value={q.question}
                        onChange={(e) => {
                          const updated = [...quizQuestions];
                          updated[qIdx].question = e.target.value;
                          setQuizQuestions(updated);
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(148, 163, 184, 0.2)",
                          borderRadius: "8px",
                          color: "#fff",
                          fontSize: "0.9rem",
                          outline: "none",
                          marginBottom: "12px",
                        }}
                      />

                      {/* Options */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <input
                              type="radio"
                              name={`correct_${qIdx}`}
                              checked={q.correctAnswerIndex === oIdx}
                              onChange={() => {
                                const updated = [...quizQuestions];
                                updated[qIdx].correctAnswerIndex = oIdx;
                                setQuizQuestions(updated);
                              }}
                            />
                            <input
                              type="text"
                              placeholder={`Option ${oIdx + 1}`}
                              value={opt}
                              onChange={(e) => {
                                const updated = [...quizQuestions];
                                updated[qIdx].options[oIdx] = e.target.value;
                                setQuizQuestions(updated);
                              }}
                              style={{
                                flex: 1,
                                padding: "8px 10px",
                                background: "rgba(255, 255, 255, 0.04)",
                                border: q.correctAnswerIndex === oIdx ? "1px solid #4ade80" : "1px solid rgba(148, 163, 184, 0.15)",
                                borderRadius: "6px",
                                color: "#fff",
                                fontSize: "0.85rem",
                                outline: "none",
                              }}
                            />
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", color: "#94a3b8" }}>
                        <span>Radio dot indicates the correct answer.</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>Points:</span>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={q.points}
                            onChange={(e) => {
                              const updated = [...quizQuestions];
                              updated[qIdx].points = Number(e.target.value);
                              setQuizQuestions(updated);
                            }}
                            style={{
                              width: "60px",
                              padding: "4px 8px",
                              background: "rgba(255, 255, 255, 0.05)",
                              border: "1px solid rgba(148, 163, 184, 0.2)",
                              borderRadius: "6px",
                              color: "#fff",
                              fontSize: "0.8rem",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "28px" }}>
              <button
                type="button"
                onClick={() => setQuizModalOpen(false)}
                style={{
                  padding: "10px 18px",
                  background: "transparent",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  color: "#94a3b8",
                  borderRadius: "10px",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuiz}
                disabled={isSavingQuiz}
                style={{
                  padding: "10px 22px",
                  background: "linear-gradient(135deg, #ec4899, #be185d)",
                  border: "none",
                  color: "#fff",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  opacity: isSavingQuiz ? 0.6 : 1,
                  boxShadow: "0 0 15px rgba(236, 72, 153, 0.4)",
                }}
              >
                {isSavingQuiz ? "Saving..." : editingQuizId ? "Update Quiz" : "Create Quiz"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT EVENT MODAL */}
      {eventModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#0d111d",
              border: "1px solid rgba(59, 130, 246, 0.4)",
              borderRadius: "20px",
              padding: "32px",
              width: "100%",
              maxWidth: "560px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)",
            }}
          >
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 6px", color: "#f8fafc" }}>
              {editingEventId ? "✏️ Edit Event" : "➕ Create New Event"}
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 24px" }}>
              Configure event details, category, date, venue, and status for IceBreaking fest.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                  Event Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Beat Saber VR Championship"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                    Category
                  </label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#161b2c",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  >
                    <option value="Icebreaker Games">Icebreaker Games</option>
                    <option value="VR Arena">VR Arena</option>
                    <option value="PC Gaming">PC Gaming</option>
                    <option value="Console Gaming">Console Gaming</option>
                    <option value="Trivia & Quiz">Trivia & Quiz</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                    Status
                  </label>
                  <select
                    value={eventStatus}
                    onChange={(e) => setEventStatus(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#161b2c",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  >
                    <option value="live">Live Now</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                    Date & Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. aug 6, 2:30 pm"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                    Venue / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Auditorium Hall"
                    value={eventVenue}
                    onChange={(e) => setEventVenue(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Overview of rules and guidelines..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "0.9rem",
                    outline: "none",
                    resize: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "28px" }}>
              <button
                type="button"
                onClick={() => setEventModalOpen(false)}
                style={{
                  padding: "10px 18px",
                  background: "transparent",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  color: "#94a3b8",
                  borderRadius: "10px",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEvent}
                disabled={isSavingEvent}
                style={{
                  padding: "10px 22px",
                  background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                  border: "none",
                  color: "#fff",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  opacity: isSavingEvent ? 0.6 : 1,
                  boxShadow: "0 0 15px rgba(59, 130, 246, 0.4)",
                }}
              >
                {isSavingEvent ? "Saving..." : editingEventId ? "Update Event" : "Create Event"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PARTICIPANT EDIT / ADD MODAL */}
      {participantModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              background: "#0d111d",
              border: "1px solid rgba(124, 58, 237, 0.35)",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 0 40px rgba(124, 58, 237, 0.25)",
            }}
          >
            <h2 style={{ margin: "0 0 6px", fontSize: "1.3rem", fontWeight: 800, color: "#f8fafc" }}>
              {editingParticipantId ? "✏️ Edit Participant Details" : "➕ Add New Participant"}
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 24px" }}>
              {editingParticipantId
                ? "Update registration number, full name, or points for this participant."
                : "Manually add a participant registration record to Firestore."}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                  Registration Number (e.g. 25BCY10001)
                </label>
                <input
                  type="text"
                  value={editParticipantReg}
                  onChange={(e) => setEditParticipantReg(e.target.value.toUpperCase())}
                  placeholder="25BCY10001"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#161b2c",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={editParticipantName}
                  onChange={(e) => setEditParticipantName(e.target.value)}
                  placeholder="John Doe"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#161b2c",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                  Total Points / Score
                </label>
                <input
                  type="number"
                  value={editParticipantScore}
                  onChange={(e) => setEditParticipantScore(Number(e.target.value))}
                  placeholder="0"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#161b2c",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "28px" }}>
              <button
                type="button"
                onClick={() => setParticipantModalOpen(false)}
                style={{
                  padding: "10px 18px",
                  background: "transparent",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  color: "#94a3b8",
                  borderRadius: "10px",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveParticipant}
                disabled={isSavingParticipant}
                style={{
                  padding: "10px 22px",
                  background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
                  border: "none",
                  color: "#fff",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  opacity: isSavingParticipant ? 0.6 : 1,
                  boxShadow: "0 0 15px rgba(124, 58, 237, 0.4)",
                }}
              >
                {isSavingParticipant ? "Saving..." : editingParticipantId ? "Update Entry" : "Save Participant"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




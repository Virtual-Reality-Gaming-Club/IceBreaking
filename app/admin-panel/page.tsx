"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { checkIsAdmin, getAllAdmins, AdminUser } from "@/lib/adminAuth";
import { SeedDatabaseButton } from "@/components/SeedDatabaseButton";
import { collection, getDocs, onSnapshot, doc } from "firebase/firestore";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { VideoBackground } from "@/components/ui/VideoBackground";
import { ChevronDown, Brain } from "lucide-react";

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

import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { AdminConfirmModal } from "@/components/ui/admin-confirm-modal";

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
  const [activeTab, setActiveTab] = useState<"overview" | "leaderboard" | "events" | "polls" | "quizzes" | "users" | "admins" | "tools">("overview");

  // Global Settings State
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [globalQuizOpen, setGlobalQuizOpen] = useState(false);

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

  // Irreversible Action Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: React.ReactNode;
    confirmLabel?: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmLabel: "Delete",
    onConfirm: () => {},
  });

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

  // Real-time Dashboard Data Listeners
  useEffect(() => {
    if (!isAdmin) return;

    // 1. Participants Realtime
    const unsubParticipants = onSnapshot(collection(db, "participants"), (snap) => {
      const participantsData: ParticipantItem[] = [];
      snap.forEach((d) => participantsData.push({ id: d.id, ...d.data() } as ParticipantItem));
      setParticipantsList(participantsData);
      setStats(s => ({ ...s, totalUsers: snap.size }));
    });

    // 2. Events Realtime
    const unsubEvents = onSnapshot(collection(db, "events"), (snap) => {
      const eventsData: EventItem[] = [];
      snap.forEach((d) => eventsData.push({ id: d.id, ...d.data() } as EventItem));
      setEventsList(eventsData);
      setStats(s => ({ ...s, totalEvents: snap.size }));
    });

    // 3. Polls Realtime
    const unsubPolls = onSnapshot(collection(db, "polls"), (snap) => {
      const pollsData: any[] = [];
      snap.forEach((d) => pollsData.push({ id: d.id, ...d.data() }));
      setPollsList(pollsData);
    });

    // 4. Quizzes Realtime
    const unsubQuizzes = onSnapshot(collection(db, "quizzes"), (snap) => {
      const quizzesData: any[] = [];
      snap.forEach((d) => quizzesData.push({ id: d.id, ...d.data() }));
      setQuizzesList(quizzesData);
    });

    // 5. Registration Settings Realtime
    const unsubRegistration = onSnapshot(doc(db, "settings", "registration"), (docSnap) => {
      if (docSnap.exists()) {
        setRegistrationOpen(!!docSnap.data().isOpen);
      }
    });

    // 6. Global Quiz Toggle Realtime
    const unsubQuizToggle = onSnapshot(doc(db, "settings", "quiz"), (docSnap) => {
      if (docSnap.exists()) {
        setGlobalQuizOpen(!!docSnap.data().isOpen);
      }
    });

    // 7. Leaderboard Teams
    const unsubLeaderboard = onSnapshot(collection(db, "leaderboard"), (snap) => {
      setStats(s => ({ ...s, totalTeams: snap.size }));
    });
    
    // Admins
    getAllAdmins().then(admins => {
      setAdminsList(admins);
      setStats(s => ({ ...s, activeAdmins: admins.length > 0 ? admins.length : 2 }));
    });

    return () => {
      unsubParticipants();
      unsubEvents();
      unsubPolls();
      unsubQuizzes();
      unsubRegistration();
      unsubQuizToggle();
      unsubLeaderboard();
    };
  }, [isAdmin]);

  // Keep these as empty functions to prevent crashes from legacy manual refresh calls
  const fetchDashboardData = async () => {};

  const fetchRegistrationStatus = async () => {};
  const fetchEvents = async () => {};
  const fetchPolls = async () => {};
  const fetchQuizzes = async () => {};

  const handleToggleRegistration = async () => {
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      const nextState = !registrationOpen;
      await setDoc(doc(db, "settings", "registration"), {
        isOpen: nextState,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.error("Error toggling registration status:", err);
      alert("Failed to update registration status.");
    }
  };

  const handleToggleGlobalQuiz = async () => {
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "settings", "quiz"), {
        isOpen: !globalQuizOpen,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert(`Global Quiz is now ${!globalQuizOpen ? 'OPEN' : 'CLOSED'} for all users`);
    } catch (err) {
      console.error("Error toggling global quiz:", err);
      alert("Failed to toggle global quiz.");
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

  const handleDeletePoll = (poll: any) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete poll permanently?",
      description: (
        <p>
          This will permanently delete the poll <strong>&quot;{poll.question}&quot;</strong> and all associated votes. This action cannot be undone.
        </p>
      ),
      confirmLabel: "Delete Poll",
      onConfirm: async () => {
        try {
          const { doc, deleteDoc } = await import("firebase/firestore");
          await deleteDoc(doc(db, "polls", poll.id));
          fetchPolls();
        } catch (err) {
          console.error("Error deleting poll:", err);
        }
      },
    });
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

  const handleDeleteQuiz = (quiz: any) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete quiz permanently?",
      description: (
        <p>
          This will permanently delete <strong>&quot;{quiz.title}&quot;</strong> and all questions/responses. This action cannot be undone.
        </p>
      ),
      confirmLabel: "Delete Quiz",
      onConfirm: async () => {
        try {
          const { doc, deleteDoc } = await import("firebase/firestore");
          await deleteDoc(doc(db, "quizzes", quiz.id));
          fetchQuizzes();
        } catch (err) {
          console.error("Error deleting quiz:", err);
        }
      },
    });
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

  const handleDeleteParticipant = (participantId: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete participant permanently?",
      description: (
        <p>
          This will permanently delete participant entry <strong>&quot;{name || participantId}&quot;</strong> ({participantId}). This action cannot be undone.
        </p>
      ),
      confirmLabel: "Delete Participant",
      onConfirm: async () => {
        try {
          const { doc, deleteDoc } = await import("firebase/firestore");
          await deleteDoc(doc(db, "participants", participantId));
          fetchDashboardData();
        } catch (err) {
          console.error("Error deleting participant:", err);
          alert("Failed to delete participant entry.");
        }
      },
    });
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

  const handleDeleteEvent = (evt: any) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete event permanently?",
      description: (
        <p>
          This will permanently delete event <strong>&quot;{evt.title}&quot;</strong> and all associated data. This action cannot be undone.
        </p>
      ),
      confirmLabel: "Delete Event",
      onConfirm: async () => {
        try {
          const { doc, deleteDoc } = await import("firebase/firestore");
          await deleteDoc(doc(db, "events", evt.id));
          fetchDashboardData();
        } catch (err) {
          console.error("Error deleting event:", err);
        }
      },
    });
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
      <header className="min-h-[64px] sm:h-[72px] border-b border-violet-500/25 bg-[#0a0d18]/85 backdrop-blur-2xl px-4 sm:px-9 flex items-center justify-between sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(124,58,237,0.1)] flex-wrap gap-2 py-2 sm:py-0">
        <Link href="/" className="flex items-center gap-3.5 hover:opacity-90 transition-opacity no-underline">
          <Image
            src="/logo.png"
            alt="VRGC Logo"
            width={55}
            height={32}
            style={{ objectFit: "contain" }}
            priority
          />
          <div>
            <div className="group relative flex items-center justify-center rounded-full px-3.5 py-1 shadow-[inset_0_-8px_10px_#8fdfff1f] transition-shadow duration-500 ease-out hover:shadow-[inset_0_-5px_10px_#8fdfff3f] border border-violet-500/30 bg-slate-950/60">
              <span
                className="animate-gradient absolute inset-0 block h-full w-full rounded-[inherit] bg-gradient-to-r from-[#ffaa40]/50 via-[#9c40ff]/50 to-[#ffaa40]/50 bg-[length:300%_100%] p-[1px]"
                style={{
                  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "destination-out",
                  mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  maskComposite: "subtract",
                  WebkitClipPath: "padding-box",
                }}
              />
              <AnimatedGradientText className="text-sm font-extrabold tracking-wide">
                VRGC · VIT Bhopal
              </AnimatedGradientText>
            </div>
            <span style={{ fontSize: "0.72rem", color: "#a78bfa", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginTop: "2px", textAlign: "left" }}>
              IceBreaking 2026 Dashboard
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-5">
          {/* User Profile Avatar & Info */}
          <div className="flex items-center gap-2 sm:gap-3 bg-[#0f1423]/60 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-violet-500/25">
            <Avatar className="w-7 h-7 sm:w-10 sm:h-10">
              <AvatarImage
                src={user?.photoURL || undefined}
                alt={user?.displayName || "Admin Avatar"}
              />
              <AvatarFallback className="bg-violet-900 text-violet-200 font-bold text-xs sm:text-base">
                {(user?.displayName || user?.email || "A").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="text-left hidden xs:block sm:block">
              <p className="m-0 text-xs sm:text-sm font-extrabold text-slate-100 leading-tight">
                {user?.displayName
                  ? user.displayName.replace(/\b[0-9]{2}[A-Za-z]{3}[0-9]{5}\b/gi, "").trim()
                  : "Admin User"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold text-[10px] px-1.5 py-0">
                  👑 Admin
                </Badge>
              </div>
            </div>
          </div>

          <button
            onClick={async () => {
              await signOut(auth);
              router.push("/admin-panel/login");
            }}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold bg-red-500/15 text-red-300 border border-red-500/30 rounded-xl cursor-pointer hover:bg-red-500/30 hover:text-white transition-all shadow-sm"
          >
            🚪 Sign Out
          </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row min-h-[calc(100vh-72px)]">
        {/* Navigation Sidebar (Desktop vertical list & Mobile Dropdown menu) */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-violet-500/20 bg-slate-950/80 md:bg-slate-950/40 backdrop-blur-2xl p-3 md:p-5 flex flex-col gap-2 shrink-0 sticky top-[64px] sm:top-[72px] z-40">
          
          {/* Mobile Dropdown Select */}
          <div className="md:hidden relative w-full">
            <label className="text-[10px] uppercase font-bold text-violet-400 tracking-wider mb-1 block px-1">
              Navigate Section
            </label>
            <div className="relative">
              <select
                value={activeTab}
                onChange={(e) => {
                  const selectedVal = e.target.value;
                  if (selectedVal === "leaderboard") {
                    window.open("/leaderboard", "_blank");
                  } else {
                    setActiveTab(selectedVal as any);
                  }
                }}
                className="w-full appearance-none bg-slate-900/90 border border-violet-400/50 text-white text-xs font-bold py-2.5 pl-3.5 pr-10 rounded-xl outline-none backdrop-blur-xl shadow-lg focus:ring-2 focus:ring-violet-500"
              >
                <option value="overview">📊 Overview</option>
                <option value="leaderboard">🏆 Live Leaderboard ↗ (Opens New Tab)</option>
                <option value="events">🎮 Manage Events</option>
                <option value="polls">📊 Manage Polls</option>
                <option value="quizzes">🧠 Manage Quizzes</option>
                <option value="users">👥 Participants</option>
                <option value="admins">🛡️ Admin Roster</option>
                <option value="tools">⚙️ Database Tools</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-300 pointer-events-none" size={16} />
            </div>
          </div>

          {/* Desktop Navigation List */}
          <div className="hidden md:flex flex-col gap-2 w-full">
            {[
              { id: "overview", label: "📊 Overview" },
              { id: "leaderboard", label: "🏆 Live Leaderboard ↗", external: true },
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
                  onClick={() => {
                    if (item.external) {
                      window.open("/leaderboard", "_blank");
                    } else {
                      setActiveTab(item.id as any);
                    }
                  }}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-between ${
                    isActive
                      ? "bg-gradient-to-r from-violet-600/30 to-indigo-600/20 border border-violet-400/40 text-white shadow-[0_0_20px_rgba(124,58,237,0.25)]"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />}
                </button>
              );
            })}
          </div>

          <div className="mt-auto pt-4 border-t border-white/[0.08] hidden md:block">
            <Link
              href="/"
              className="text-violet-400 hover:text-violet-300 text-xs font-bold flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-all"
            >
              <span>← Return to Main Site</span>
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-8 md:p-11 max-w-[1250px] w-full mx-auto">
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "6px", letterSpacing: "-0.02em" }}>Dashboard Overview</h1>
              <p style={{ color: "#94a3b8", fontSize: "0.98rem", marginBottom: "36px" }}>
                Real-time operational metrics & platform controls for IceBreaking 2026.
              </p>

              {/* Event Registration Status Control Banner */}
              <Card className={`${registrationOpen ? "bg-emerald-950/20 border-emerald-500/30" : "bg-red-950/20 border-red-500/30"} shadow-xl mb-8 border backdrop-blur-xl`}>
                <CardContent className="p-6 flex flex-row items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-base font-black text-white">
                        📝 Event Registration Status:
                      </span>
                      <Badge className={registrationOpen ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold px-3 py-0.5 text-xs" : "bg-red-500/20 text-red-300 border-red-500/40 font-bold px-3 py-0.5 text-xs"}>
                        {registrationOpen ? "🟢 OPEN (Public Can Register)" : "🔒 CLOSED (Registration Locked)"}
                      </Badge>
                    </div>
                    <p className="text-slate-300 text-xs font-medium m-0">
                      {registrationOpen
                        ? "Users on the home page can click 'Register Now' to submit their details."
                        : "The home page will display '🔒 Registration is currently closed.'"}
                    </p>
                  </div>

                  <button
                    onClick={handleToggleRegistration}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-lg text-white ${registrationOpen ? "bg-red-600 hover:bg-red-500 shadow-red-600/30" : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"}`}
                  >
                    {registrationOpen ? "🔒 Close Registration" : "🟢 Open Registration"}
                  </button>
                </CardContent>
              </Card>

              {/* Metrics Grid — Ultra-concise on mobile */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-5 mb-6">
                {[
                  { label: "Participants", value: stats.totalUsers || 2, color: "#818cf8", accent: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30" },
                  { label: "Active Events", value: eventsList.length, color: "#38bdf8", accent: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
                  { label: "Active Polls", value: pollsList.length, color: "#fbbf24", accent: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
                  { label: "Active Quizzes", value: quizzesList.length, color: "#c084fc", accent: "bg-purple-500/15 text-purple-300 border-purple-500/30" },
                  { label: "Admins", value: stats.activeAdmins || 2, color: "#34d399", accent: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
                ].map((card, idx) => (
                  <Card key={idx} className="bg-white/[0.02] border-white/[0.08] shadow-[0_0_20px_rgba(0,0,0,0.3)] backdrop-blur-2xl relative overflow-hidden transition-all duration-300 hover:border-violet-400/50 ring-1 ring-white/[0.04] p-2.5 sm:p-5 flex flex-col justify-between">
                    <div>
                      <CardDescription className="text-slate-400 font-bold text-[9px] sm:text-xs uppercase tracking-wider truncate mb-0.5">{card.label}</CardDescription>
                      <CardTitle className="text-xl sm:text-3xl font-black text-white" style={{ color: card.color }}>
                        {card.value}
                      </CardTitle>
                    </div>
                    <div className="mt-1 sm:mt-2">
                      <Badge variant="outline" className={`${card.accent} font-bold text-[8px] sm:text-[11px] px-1.5 py-0 sm:py-0.5 whitespace-nowrap`}>
                        Live Data
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Registered System Admins Box */}
              <Card className="bg-white/[0.02] border-white/[0.08] shadow-2xl p-4 sm:p-6 backdrop-blur-2xl ring-1 ring-white/[0.04] overflow-hidden">
                <CardHeader className="px-0 pt-0 pb-4 sm:pb-6 border-b border-white/[0.08] flex flex-row items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-lg sm:text-xl font-black text-white">Registered Superadmins</CardTitle>
                    <CardDescription className="text-slate-400 mt-0.5 sm:mt-1 text-xs sm:text-sm">Verified administrator roster with full system privileges.</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-violet-500/15 text-violet-300 border-violet-500/40 px-2.5 sm:px-3.5 py-0.5 sm:py-1 font-bold text-[10px] sm:text-xs">
                    🛡️ 2 Active Admins
                  </Badge>
                </CardHeader>

                <CardContent className="px-0 pt-3 sm:pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
                    {[
                      { name: "Jaiyansh", email: "jaiyansh.25bcy10268@vitbhopal.ac.in", role: "Superadmin", initial: "J", bg: "from-violet-600 to-indigo-900" },
                      { name: "Abhinav Mishra", email: "abhinav.25bcy10254@vitbhopal.ac.in", role: "Superadmin", initial: "A", bg: "from-blue-600 to-indigo-900" },
                    ].map((admin, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-violet-400/40 transition-all shadow-lg backdrop-blur-md gap-2.5 overflow-hidden"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 w-full sm:w-auto">
                          <Avatar className="w-9 h-9 sm:w-12 sm:h-12 shrink-0">
                            <AvatarFallback className={`bg-gradient-to-br ${admin.bg} text-white font-black text-sm sm:text-lg border border-white/20`}>
                              {admin.initial}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <strong className="text-xs sm:text-base font-black text-white block truncate">{admin.name}</strong>
                            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold block mt-0.5 truncate">{admin.email}</span>
                          </div>
                        </div>

                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-extrabold px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs shrink-0 self-start sm:self-auto">
                          👑 {admin.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* LEADERBOARD TAB */}
          {activeTab === "leaderboard" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-4 pb-2">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight m-0">Live Leaderboard</h1>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Realtime participant score rankings & standings</p>
                </div>
                <Badge className="bg-violet-500/15 text-violet-300 border-violet-500/40 font-extrabold text-xs px-4 py-1.5 shadow-md backdrop-blur-md">
                  🏆 Total Ranked: {[...participantsList].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0)).length} Participants
                </Badge>
              </div>

              {/* Top 3 Podium Feature Cards */}
              {(() => {
                const sorted = [...participantsList].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
                const top1 = sorted[0];
                const top2 = sorted[1];
                const top3 = sorted[2];
                if (!top1) return null;

                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Rank 2 - Silver */}
                    {top2 ? (
                      <div className="bg-white/[0.03] border border-slate-300/30 rounded-3xl p-6 backdrop-blur-2xl flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden order-2 md:order-1 ring-1 ring-white/[0.05]">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-200 via-slate-300 to-slate-500 text-slate-950 font-black flex items-center justify-center text-base shadow-lg shadow-slate-400/20 mb-3">
                          🥈 #2
                        </div>
                        <h4 className="text-base font-black text-white mb-0.5 tracking-tight">{top2.fullName || top2.name}</h4>
                        <span className="text-xs font-mono text-slate-400 font-bold mb-3">{top2.registrationNumber || top2.id}</span>
                        <Badge className="bg-slate-300/20 text-slate-200 border-slate-300/40 font-black text-xs px-4 py-1">
                          {top2.totalScore || 0} PTS
                        </Badge>
                      </div>
                    ) : <div />}

                    {/* Rank 1 - Gold */}
                    <div className="bg-amber-500/10 border border-amber-400/50 rounded-3xl p-7 backdrop-blur-2xl flex flex-col items-center justify-center text-center shadow-[0_0_50px_rgba(245,158,11,0.2)] relative overflow-hidden order-1 md:order-2 ring-1 ring-amber-400/40 -translate-y-1">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 text-slate-950 font-black flex items-center justify-center text-xl shadow-xl shadow-amber-500/40 mb-3">
                        👑 #1
                      </div>
                      <h4 className="text-lg font-black text-amber-200 mb-0.5 tracking-tight">{top1.fullName || top1.name}</h4>
                      <span className="text-xs font-mono text-amber-400/80 font-bold mb-3">{top1.registrationNumber || top1.id}</span>
                      <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 border-amber-300 font-black text-xs px-4 py-1.5 shadow-lg shadow-amber-400/20">
                        {top1.totalScore || 0} PTS
                      </Badge>
                    </div>

                    {/* Rank 3 - Bronze */}
                    {top3 ? (
                      <div className="bg-white/[0.03] border border-amber-700/40 rounded-3xl p-6 backdrop-blur-2xl flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden order-3 ring-1 ring-white/[0.05]">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-amber-100 font-black flex items-center justify-center text-base shadow-lg shadow-amber-900/30 mb-3">
                          🥉 #3
                        </div>
                        <h4 className="text-base font-black text-white mb-0.5 tracking-tight">{top3.fullName || top3.name}</h4>
                        <span className="text-xs font-mono text-amber-600/80 font-bold mb-3">{top3.registrationNumber || top3.id}</span>
                        <Badge className="bg-amber-700/20 text-amber-300 border-amber-700/40 font-black text-xs px-4 py-1">
                          {top3.totalScore || 0} PTS
                        </Badge>
                      </div>
                    ) : <div />}
                  </div>
                );
              })()}

              <Card className="bg-white/[0.02] border-white/[0.08] shadow-2xl backdrop-blur-2xl p-6 ring-1 ring-white/[0.04] rounded-3xl">
                {[...participantsList].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0)).length > 0 ? (
                  <div className="space-y-3">
                    {[...participantsList]
                      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
                      .map((p, idx) => {
                        const rank = idx + 1;
                        const pName = p.fullName || p.name || "Participant";
                        const pReg = p.registrationNumber || p.id;
                        const score = p.totalScore || 0;

                        return (
                          <div
                            key={p.id}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all shadow-md flex-wrap gap-3 backdrop-blur-md ${
                              rank === 1
                                ? "bg-amber-500/10 border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                                : rank === 2
                                ? "bg-white/[0.04] border-slate-300/30"
                                : rank === 3
                                ? "bg-white/[0.03] border-amber-700/30"
                                : "bg-white/[0.02] border-white/[0.06] hover:border-violet-400/40"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                                  rank === 1
                                    ? "bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 shadow-md shadow-amber-400/30 ring-2 ring-amber-400/40"
                                    : rank === 2
                                    ? "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950 shadow-md"
                                    : rank === 3
                                    ? "bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-md"
                                    : "bg-white/[0.06] text-violet-300 border border-white/10"
                                }`}
                              >
                                #{rank}
                              </div>
                              <div>
                                <h4 className="text-base font-black text-white m-0 leading-snug">{pName}</h4>
                                <span className="text-xs font-mono text-violet-400 font-bold block mt-0.5">{pReg}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-xl font-black text-sky-400 block leading-none drop-shadow-[0_0_10px_rgba(56,189,248,0.3)]">{score}</span>
                              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">PTS</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-8">No participant scores found.</p>
                )}
              </Card>
            </div>
          )}

          {/* EVENTS TAB */}
          {activeTab === "events" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight m-0">Manage Events</h1>
                  <p className="text-slate-400 text-xs font-semibold mt-1">View, create, edit, or update status of IceBreaking event activities.</p>
                </div>
                <button
                  onClick={() => handleOpenEventModal()}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 self-start sm:self-auto"
                >
                  ➕ Create New Event
                </button>
              </div>

              <div className="grid gap-4">
                {eventsList.length > 0 ? (
                  eventsList.map((evt: any) => (
                    <Card key={evt.id} className="bg-slate-950/80 border-slate-800/80 shadow-xl backdrop-blur-xl transition-all hover:border-blue-500/40 p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 font-extrabold text-[10px] sm:text-[11px] px-2.5 py-0.5">
                              {evt.category || "General"}
                            </Badge>
                            <Badge className={evt.status === "live" || evt.status === "active" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-black text-[10px] sm:text-[11px]" : "bg-slate-800 text-slate-400 border-slate-700 font-bold text-[10px] sm:text-[11px]"}>
                              ● {(evt.status || "upcoming").toUpperCase()}
                            </Badge>
                          </div>
                          <h3 className="m-0 text-base sm:text-xl font-black text-white">{evt.title}</h3>
                          {evt.description && <p className="m-0 text-slate-400 text-xs sm:text-sm leading-relaxed">{evt.description}</p>}
                          <div className="flex items-center gap-4 text-xs text-slate-300 font-semibold flex-wrap">
                            {evt.date && <span>📅 {evt.date}</span>}
                            {evt.venue && <span>📍 {evt.venue}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                          <button
                            onClick={() => handleToggleEventStatus(evt)}
                            className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs transition-all text-center"
                          >
                            {evt.status === "live" || evt.status === "active" ? "Pause/Upcoming" : "Set Live"}
                          </button>
                          <button
                            onClick={() => handleOpenEventModal(evt)}
                            className="px-3 py-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 hover:bg-blue-500/25 font-bold text-xs transition-all"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(evt)}
                            className="px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 font-bold text-xs transition-all"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="bg-slate-950/60 border-dashed border-slate-800 p-10 text-center">
                    <p style={{ color: "#94a3b8", fontSize: "1rem", margin: "0 0 16px" }}>No events found in database.</p>
                    <button
                      onClick={() => handleOpenEventModal()}
                      className="bg-blue-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl"
                    >
                      Create First Event
                    </button>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* POLLS TAB */}
          {activeTab === "polls" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight m-0">Polls Management</h1>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Create, edit, toggle active status, or delete audience polls.</p>
                </div>
                <button
                  onClick={() => handleOpenPollModal()}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 self-start sm:self-auto"
                >
                  ➕ Create New Poll
                </button>
              </div>

              <div className="grid gap-4">
                {pollsList.length > 0 ? (
                  pollsList.map((poll) => {
                    const totalVotes = poll.options
                      ? poll.options.reduce((sum: number, o: any) => sum + (o.votes || 0), 0)
                      : poll.totalVotes || 0;

                    return (
                      <Card key={poll.id} className="bg-slate-950/80 border-slate-800/80 shadow-xl backdrop-blur-xl transition-all hover:border-violet-500/40 p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={poll.status === "active" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-black text-[10px] sm:text-[11px]" : "bg-red-500/15 text-red-400 border-red-500/30 font-black text-[10px] sm:text-[11px]"}>
                                {poll.status === "active" ? "🟢 Active Poll" : "🔴 Closed"}
                              </Badge>
                              <span className="text-xs text-slate-400 font-bold">Total Votes: {totalVotes}</span>
                            </div>
                            <h3 className="m-0 text-base sm:text-xl font-black text-white">
                              {poll.question}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                            <button
                              onClick={() => handleTogglePollStatus(poll)}
                              className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs transition-all text-center"
                            >
                              {poll.status === "active" ? "Pause/Close" : "Set Active"}
                            </button>
                            <button
                              onClick={() => handleOpenPollModal(poll)}
                              className="px-3 py-2 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 hover:bg-violet-500/25 font-bold text-xs transition-all"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeletePoll(poll)}
                              className="px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 font-bold text-xs transition-all"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>

                        {/* Animated & Colorful Bar Graph Results */}
                        <div className="space-y-3.5 mt-5 pt-4 border-t border-white/[0.08]">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            <span>Option Response breakdown</span>
                            <span className="text-violet-400">Total: {totalVotes} votes</span>
                          </div>

                          {poll.options?.map((opt: any, idx: number) => {
                            const votes = opt.votes || 0;
                            const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                            
                            // Distinct vibrant gradient palette for each option bar
                            const barGradients = [
                              "from-violet-600 via-indigo-500 to-cyan-400 shadow-[0_0_15px_rgba(139,92,246,0.4)]",
                              "from-pink-500 via-rose-500 to-amber-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]",
                              "from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]",
                              "from-amber-400 via-orange-500 to-red-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]",
                              "from-purple-500 via-fuchsia-500 to-pink-400 shadow-[0_0_15px_rgba(217,70,239,0.4)]",
                            ];
                            const currentGradient = barGradients[idx % barGradients.length];

                            return (
                              <div key={idx} className="bg-slate-900/80 p-3.5 rounded-2xl border border-white/[0.08] relative overflow-hidden backdrop-blur-md">
                                <div className="flex justify-between items-center text-xs sm:text-sm font-bold mb-2 z-10 relative">
                                  <span className="text-white flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center font-black text-[10px] text-violet-300">
                                      {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span>{opt.text}</span>
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400 text-xs font-semibold">{votes} votes</span>
                                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-violet-200 font-extrabold text-xs border border-white/10">
                                      {percentage}%
                                    </span>
                                  </div>
                                </div>

                                {/* Dynamic Animated Bar Graph */}
                                <div className="h-3 rounded-full bg-slate-950/80 overflow-hidden p-0.5 border border-white/[0.06] relative">
                                  <div
                                    className={`h-full bg-gradient-to-r ${currentGradient} rounded-full transition-all duration-1000 ease-out`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <Card className="bg-slate-950/60 border-dashed border-slate-800 p-10 text-center">
                    <p style={{ color: "#94a3b8", fontSize: "1rem", margin: "0 0 16px" }}>No active or created polls yet.</p>
                    <button
                      onClick={() => handleOpenPollModal()}
                      className="bg-violet-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl"
                    >
                      Create First Poll
                    </button>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* QUIZZES TAB */}
          {activeTab === "quizzes" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight m-0">Quiz Management</h1>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Easily toggle the static hardcoded quiz for all users.</p>
                </div>
              </div>

              <Card className="bg-slate-950/80 border-slate-800/80 shadow-xl backdrop-blur-xl p-6 sm:p-10 text-center max-w-2xl mx-auto">
                <div className="mb-6">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${globalQuizOpen ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'bg-red-500/20 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)]'}`}>
                    <Brain size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">Global Quiz Access</h3>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">
                    Toggle this to open or close the hardcoded local quiz for all active participants on the user side.
                  </p>
                </div>
                
                <button
                  onClick={handleToggleGlobalQuiz}
                  className={`px-8 py-4 rounded-xl font-black text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-3 w-full sm:w-auto mx-auto ${
                    globalQuizOpen
                      ? "bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30"
                  }`}
                >
                  {globalQuizOpen ? (
                    <>
                      <div className="text-rose-400">🔒</div>
                      <span>Close Quiz for Users</span>
                    </>
                  ) : (
                    <>
                      <div className="text-emerald-400">🔓</div>
                      <span>Open Quiz for Users</span>
                    </>
                  )}
                </button>
              </Card>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight m-0">Registered Participants</h1>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Manage event participant registrations, scores, and entries in Firestore.</p>
                </div>
                <button
                  onClick={() => handleOpenParticipantModal()}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 self-start sm:self-auto"
                >
                  ➕ Add New Participant
                </button>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-4 sm:p-6 backdrop-blur-2xl shadow-xl">
                {participantsList.length > 0 ? (
                  <div className="space-y-3">
                    {participantsList.map((u) => {
                      const pName = u.fullName || u.name || "Participant";
                      const pReg = u.registrationNumber || u.id;
                      return (
                        <div
                          key={u.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-violet-400/40 transition-all gap-3"
                        >
                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-white m-0 leading-snug">
                              {pName}
                            </h4>
                            <span className="text-[11px] sm:text-xs font-mono text-violet-400 font-semibold block mt-0.5">
                              Reg #: {pReg}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                            <Badge className="bg-violet-500/15 text-violet-300 border-violet-500/30 font-extrabold text-[10px] sm:text-xs px-2.5 sm:px-3 py-1">
                              ⭐ {u.totalScore || 0} PTS
                            </Badge>
                            <button
                              onClick={() => handleOpenParticipantModal(u)}
                              className="px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 hover:bg-sky-500/30 font-bold text-xs transition-all cursor-pointer"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteParticipant(u.id, pName)}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 font-bold text-xs transition-all cursor-pointer"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-6 text-xs sm:text-sm">No registered participants found in Firestore collection &apos;participants&apos;.</p>
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

      {/* HEROUI ALERT DIALOG FOR IRREVERSIBLE ADMIN ACTIONS */}
      <AdminConfirmModal
        isOpen={confirmModal.isOpen}
        onOpenChange={(open) => setConfirmModal((prev) => ({ ...prev, isOpen: open }))}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm}
      />
    </div>
  );
}




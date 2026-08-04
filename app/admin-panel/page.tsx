"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { checkIsAdmin, getAllAdmins, AdminUser } from "@/lib/adminAuth";
import { SeedDatabaseButton } from "@/components/SeedDatabaseButton";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

interface EventItem {
  id: string;
  title: string;
  category: string;
  status: string;
  registeredTeams?: number;
}

interface ParticipantItem {
  id: string;
  name: string;
  email: string;
  role: string;
  points?: number;
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
  const [recentUsers, setRecentUsers] = useState<ParticipantItem[]>([]);
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "events" | "users" | "admins" | "tools">("overview");

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

      // Load Dashboard Data
      fetchDashboardData();
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Users
      const usersSnap = await getDocs(collection(db, "users"));
      const usersData: ParticipantItem[] = [];
      usersSnap.forEach((docSnap) => {
        usersData.push({ id: docSnap.id, ...docSnap.data() } as ParticipantItem);
      });
      setRecentUsers(usersData.slice(0, 5));

      // 2. Fetch Events
      const eventsSnap = await getDocs(collection(db, "events"));
      const eventsData: EventItem[] = [];
      eventsSnap.forEach((docSnap) => {
        eventsData.push({ id: docSnap.id, ...docSnap.data() } as EventItem);
      });
      setEventsList(eventsData);

      // 3. Fetch Admins
      const adminsData = await getAllAdmins();
      setAdminsList(adminsData);

      // 4. Fetch Leaderboard / Teams count
      const leaderboardSnap = await getDocs(collection(db, "leaderboard"));

      setStats({
        totalUsers: usersSnap.size,
        totalEvents: eventsSnap.size,
        activeAdmins: adminsData.length > 0 ? adminsData.length : 2,
        totalTeams: leaderboardSnap.size,
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/admin-panel/login");
  };

  if (loading || isAdmin === null) {
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
        ⚡ Loading VRGC Admin Dashboard...
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div style={{ minHeight: "100vh", background: "#06070a", color: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
      {/* Top Navbar */}
      <header
        style={{
          height: "70px",
          borderBottom: "1px solid rgba(124, 58, 237, 0.2)",
          background: "rgba(10, 13, 24, 0.8)",
          backdropFilter: "blur(12px)",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #7c3aed, #4c1d95)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "1.1rem",
              boxShadow: "0 0 15px rgba(124, 58, 237, 0.4)",
            }}
          >
            V
          </div>
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>
              VRGC Admin Portal
            </h2>
            <span style={{ fontSize: "0.75rem", color: "#a78bfa", fontWeight: 600 }}>
              IceBreaking Gaming Fest
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: "#f1f5f9" }}>{user?.email}</p>
            <span style={{ fontSize: "0.72rem", color: "#22c55e", fontWeight: 700 }}>● Authorized Superadmin</span>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              padding: "8px 16px",
              fontSize: "0.82rem",
              fontWeight: 600,
              background: "rgba(239, 68, 68, 0.15)",
              color: "#fca5a5",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <div style={{ display: "flex", minHeight: "calc(100vh - 70px)" }}>
        {/* Sidebar */}
        <aside
          style={{
            width: "240px",
            borderRight: "1px solid rgba(148, 163, 184, 0.1)",
            background: "rgba(10, 13, 24, 0.5)",
            padding: "24px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {[
            { id: "overview", label: "📊 Overview", icon: "📊" },
            { id: "events", label: "🎮 Manage Events", icon: "🎮" },
            { id: "users", label: "👥 Participants", icon: "👥" },
            { id: "admins", label: "🛡️ Admin Roster", icon: "🛡️" },
            { id: "tools", label: "⚙️ Database Tools", icon: "⚙️" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "10px",
                border: "none",
                background: activeTab === item.id ? "rgba(124, 58, 237, 0.25)" : "transparent",
                color: activeTab === item.id ? "#c4b5fd" : "#94a3b8",
                fontWeight: activeTab === item.id ? 700 : 500,
                fontSize: "0.9rem",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {item.label}
            </button>
          ))}

          <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid rgba(148, 163, 184, 0.1)" }}>
            <Link href="/" style={{ color: "#a78bfa", fontSize: "0.85rem", textDecoration: "none" }}>
              ← Return to Main Site
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: "32px 40px", maxWidth: "1200px" }}>
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div>
              <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "8px" }}>Dashboard Overview</h1>
              <p style={{ color: "#94a3b8", fontSize: "0.95rem", marginBottom: "32px" }}>
                Real-time operational summary of the IceBreaking event platform.
              </p>

              {/* Metrics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "40px" }}>
                {[
                  { label: "Total Participants", value: stats.totalUsers || 2, change: "+100%", color: "#818cf8" },
                  { label: "Active Events", value: stats.totalEvents || 2, change: "Live", color: "#a78bfa" },
                  { label: "Tournament Teams", value: stats.totalTeams || 3, change: "Ranked", color: "#34d399" },
                  { label: "System Admins", value: stats.activeAdmins || 2, change: "Active", color: "#f472b6" },
                ].map((card, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "rgba(17, 20, 32, 0.7)",
                      border: "1px solid rgba(148, 163, 184, 0.12)",
                      borderRadius: "16px",
                      padding: "24px",
                    }}
                  >
                    <span style={{ fontSize: "0.85rem", color: "#94a3b8", fontWeight: 600 }}>{card.label}</span>
                    <div style={{ fontSize: "2.2rem", fontWeight: 900, color: card.color, margin: "8px 0 4px" }}>
                      {card.value}
                    </div>
                    <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 500 }}>Status: {card.change}</span>
                  </div>
                ))}
              </div>

              {/* Recent Activity Table */}
              <div style={{ background: "rgba(17, 20, 32, 0.7)", border: "1px solid rgba(148, 163, 184, 0.12)", borderRadius: "16px", padding: "28px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "20px" }}>Registered Admins & Access</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "rgba(124, 58, 237, 0.1)", borderRadius: "10px", border: "1px solid rgba(124, 58, 237, 0.2)" }}>
                    <div>
                      <strong>Jaiyansh</strong> (<code>jaiyansh.25bcy10268@vitbhopal.ac.in</code>)
                    </div>
                    <span style={{ color: "#34d399", fontWeight: 700, fontSize: "0.85rem" }}>Superadmin</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "rgba(124, 58, 237, 0.1)", borderRadius: "10px", border: "1px solid rgba(124, 58, 237, 0.2)" }}>
                    <div>
                      <strong>Abhinav</strong> (<code>abhinav.25bcy10254@vitbhopal.ac.in</code>)
                    </div>
                    <span style={{ color: "#34d399", fontWeight: 700, fontSize: "0.85rem" }}>Superadmin</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EVENTS TAB */}
          {activeTab === "events" && (
            <div>
              <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "8px" }}>Manage Events</h1>
              <p style={{ color: "#94a3b8", fontSize: "0.95rem", marginBottom: "32px" }}>View and update IceBreaking event activities.</p>
              
              <div style={{ display: "grid", gap: "16px" }}>
                {eventsList.length > 0 ? (
                  eventsList.map((evt) => (
                    <div key={evt.id} style={{ padding: "20px", background: "rgba(17, 20, 32, 0.7)", border: "1px solid rgba(148, 163, 184, 0.15)", borderRadius: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h3 style={{ margin: "0 0 6px", fontSize: "1.1rem", fontWeight: 700 }}>{evt.title}</h3>
                        <span style={{ fontSize: "0.8rem", background: "rgba(124, 58, 237, 0.2)", color: "#c4b5fd", padding: "4px 10px", borderRadius: "6px", fontWeight: 600 }}>
                          {evt.category}
                        </span>
                      </div>
                      <span style={{ color: "#34d399", fontWeight: 700, fontSize: "0.9rem" }}>● {evt.status.toUpperCase()}</span>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#94a3b8" }}>No events found. Run Database Seed in the Database Tools tab!</p>
                )}
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === "users" && (
            <div>
              <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "8px" }}>Registered Participants</h1>
              <p style={{ color: "#94a3b8", fontSize: "0.95rem", marginBottom: "32px" }}>User directory and gaming event registrations.</p>
              
              <div style={{ background: "rgba(17, 20, 32, 0.7)", border: "1px solid rgba(148, 163, 184, 0.12)", borderRadius: "16px", padding: "20px" }}>
                {recentUsers.length > 0 ? (
                  recentUsers.map((u) => (
                    <div key={u.id} style={{ display: "flex", justifyContent: "space-between", padding: "14px", borderBottom: "1px solid rgba(148, 163, 184, 0.1)" }}>
                      <div>
                        <strong>{u.name || u.id}</strong>
                        <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{u.email}</div>
                      </div>
                      <span style={{ color: "#a78bfa", fontWeight: 600, fontSize: "0.85rem" }}>Role: {u.role}</span>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#94a3b8" }}>No participant data yet.</p>
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
                    <h4 style={{ margin: "0 0 4px", fontSize: "1rem" }}>Jaiyansh</h4>
                    <code style={{ fontSize: "0.85rem", color: "#c4b5fd" }}>jaiyansh.25bcy10268@vitbhopal.ac.in</code>
                  </div>
                  <span style={{ color: "#22c55e", fontWeight: 700, fontSize: "0.85rem" }}>Superadmin</span>
                </div>
                <div style={{ padding: "20px", background: "rgba(124, 58, 237, 0.1)", border: "1px solid rgba(124, 58, 237, 0.3)", borderRadius: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: "0 0 4px", fontSize: "1rem" }}>Abhinav</h4>
                    <code style={{ fontSize: "0.85rem", color: "#c4b5fd" }}>abhinav.25bcy10254@vitbhopal.ac.in</code>
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
    </div>
  );
}

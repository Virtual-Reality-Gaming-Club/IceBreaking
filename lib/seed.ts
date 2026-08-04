import { db } from "./firebase";
import { doc, setDoc, collection, addDoc } from "firebase/firestore";

export async function seedFirestore() {
  console.log("🌱 Starting Firestore database seeding...");

  try {
    // 1. Seed Admins Collection
    const adminAccounts = [
      { email: "jaiyansh.25bcy10268@vitbhopal.ac.in", name: "Jaiyansh", role: "superadmin", active: true },
      { email: "abhinav.25bcy10254@vitbhopal.ac.in", name: "Abhinav", role: "superadmin", active: true },
    ];

    for (const admin of adminAccounts) {
      await setDoc(doc(db, "admins", admin.email), {
        ...admin,
        createdAt: new Date(),
      });
    }
    console.log("✅ 'admins' collection seeded.");

    // 2. Seed Sample Users Collection
    const sampleUsers = [
      { id: "25BCY10268", name: "Jaiyansh", email: "jaiyansh.25bcy10268@vitbhopal.ac.in", role: "superadmin", points: 1000 },
      { id: "25BCY10254", name: "Abhinav", email: "abhinav.25bcy10254@vitbhopal.ac.in", role: "superadmin", points: 1000 },
    ];

    for (const user of sampleUsers) {
      await setDoc(doc(db, "users", user.id), {
        ...user,
        createdAt: new Date(),
      });
    }
    console.log("✅ 'users' collection seeded.");

    // 3. Seed Events Collection
    const sampleEvents = [
      {
        title: "Valorant Showdown",
        category: "Esports",
        description: "5v5 Tactical Shooter Tournament",
        status: "live",
        maxTeams: 32,
        registeredTeams: 18,
      },
      {
        title: "VR Experience Zone",
        category: "Exhibition",
        description: "Immersive Beat Saber & Superhot VR challenges",
        status: "upcoming",
        maxTeams: 100,
        registeredTeams: 45,
      },
    ];

    for (const evt of sampleEvents) {
      await addDoc(collection(db, "events"), {
        ...evt,
        createdAt: new Date(),
      });
    }
    console.log("✅ 'events' collection seeded.");

    // 4. Seed Leaderboard Collection
    const sampleLeaderboard = [
      { teamId: "team_01", teamName: "CyberKnights", score: 1450, rank: 1 },
      { teamId: "team_02", teamName: "Pixel Pioneers", score: 1200, rank: 2 },
      { teamId: "team_03", teamName: "Vortex Gaming", score: 980, rank: 3 },
    ];

    for (const entry of sampleLeaderboard) {
      await setDoc(doc(db, "leaderboard", entry.teamId), {
        ...entry,
        lastUpdated: new Date(),
      });
    }
    console.log("✅ 'leaderboard' collection seeded.");

    return { success: true, message: "Firestore database & admin records seeded successfully!" };
  } catch (error: any) {
    console.error("❌ Error seeding Firestore:", error);
    return { success: false, error: error.message };
  }
}

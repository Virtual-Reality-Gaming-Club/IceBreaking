import { db } from "./firebase";
import { doc, setDoc, collection, addDoc } from "firebase/firestore";

export async function seedFirestore() {
  console.log("🌱 Starting Firestore database seeding...");

  try {
    const now = new Date().toISOString();

    // ─── 1. Seed Event Config ─────────────────────────────────────────────────
    await setDoc(doc(db, "event", "config"), {
      name: "IceBreaking 2026",
      description: "Welcome to IceBreaking 2026 organized by Virtual Reality & Gaming Club (VRGC).",
      date: "2026-08-15",
      time: "10:00",
      venue: "Auditorium / Lab Hall",
      features: {
        registration: true,
        polls: true,
        quiz: true,
        activities: true,
      },
      rules: [
        "Be respectful to all participants and organizers.",
        "Ensure your registration details are accurate.",
        "Have fun and engage in all icebreaking activities!",
      ],
      updatedAt: now,
    });
    console.log("✅ 'event/config' document seeded.");

    // ─── 2. Seed Participants Collection ──────────────────────────────────────
    const sampleParticipants = [
      {
        registrationNumber: "25BCY10001",
        fullName: "Abhinav Mishra",
        totalScore: 50,
        registeredAt: now,
        updatedAt: now,
      },
    ];

    for (const participant of sampleParticipants) {
      await setDoc(doc(db, "participants", participant.registrationNumber), participant);
    }
    console.log("✅ 'participants' collection seeded.");

    // ─── 3. Seed Scoring Rules Collection ────────────────────────────────────
    const sampleRules = [
      {
        id: "sample_rule_1",
        name: "Icebreaker Champion",
        pointValue: 50,
        category: "Main Event",
        isActive: true,
        createdAt: now,
      },
      {
        id: "sample_rule_2",
        name: "First Registration Bonus",
        pointValue: 10,
        category: "Registration",
        isActive: true,
        createdAt: now,
      },
    ];

    for (const rule of sampleRules) {
      await setDoc(doc(db, "scoringRules", rule.id), rule);
    }
    console.log("✅ 'scoringRules' collection seeded.");

    // ─── 4. Seed Score Entries Collection ─────────────────────────────────────
    await setDoc(doc(db, "scoreEntries", "sample_score_1"), {
      id: "sample_score_1",
      registrationNumber: "25BCY10001",
      participantName: "Abhinav Mishra",
      points: 50,
      ruleId: "sample_rule_1",
      ruleName: "Icebreaker Champion",
      awardedBy: "jaiyansh.25bcy10268@vitbhopal.ac.in",
      awardedAt: now,
    });
    console.log("✅ 'scoreEntries' collection seeded.");

    // ─── 5. Seed Polls Collection ─────────────────────────────────────────────
    await setDoc(doc(db, "polls", "sample_poll_1"), {
      id: "sample_poll_1",
      question: "Which event area are you most excited about?",
      status: "active",
      options: [
        { id: "opt1", text: "VR Gaming Arena", votes: 1 },
        { id: "opt2", text: "Web & Tech Showcase", votes: 0 },
        { id: "opt3", text: "Team Building Challenges", votes: 0 },
      ],
      createdAt: now,
      totalVotes: 1,
    });
    console.log("✅ 'polls' collection seeded.");

    // ─── 6. Seed Activity Logs Collection ────────────────────────────────────
    await setDoc(doc(db, "activityLogs", "sample_log_1"), {
      id: "sample_log_1",
      activity: "EVENT_UPDATED",
      description: "Initial database seed created successfully.",
      adminEmail: "jaiyansh.25bcy10268@vitbhopal.ac.in",
      timestamp: now,
    });
    console.log("✅ 'activityLogs' collection seeded.");

    return {
      success: true,
      message: "Firestore database seeded successfully with all collections!",
      collections: [
        "event/config", "participants", "scoringRules",
        "scoreEntries", "polls", "activityLogs",
      ],
    };
  } catch (error: any) {
    console.error("❌ Error seeding Firestore:", error);
    return { success: false, error: error.message };
  }
}

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

// Configured list of admin emails from .env.local (supports comma-separated emails)
const ENV_ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export interface AdminUser {
  email: string;
  name?: string;
  role: "superadmin" | "admin" | "moderator";
  addedBy?: string;
  active: boolean;
  createdAt?: any;
}

/**
 * Checks if a given user email or UID is an authorized admin.
 * Checks:
 * 1. Environment variable NEXT_PUBLIC_ADMIN_EMAILS (comma separated)
 * 2. Firestore `admins` collection document by email or UID
 * 3. Firestore `users` collection document with role == 'admin' or 'superadmin'
 */
export async function checkIsAdmin(email?: string | null, uid?: string | null): Promise<boolean> {
  if (!email && !uid) return false;

  const normalizedEmail = email?.toLowerCase();

  // 1. Check env variable list
  if (normalizedEmail && ENV_ADMIN_EMAILS.includes(normalizedEmail)) {
    return true;
  }

  try {
    // 2. Check Firestore 'admins' collection by email
    if (normalizedEmail) {
      const adminDoc = await getDoc(doc(db, "admins", normalizedEmail));
      if (adminDoc.exists() && adminDoc.data()?.active !== false) {
        return true;
      }
    }

    // 3. Check Firestore 'admins' collection by UID
    if (uid) {
      const uidDoc = await getDoc(doc(db, "admins", uid));
      if (uidDoc.exists() && uidDoc.data()?.active !== false) {
        return true;
      }
    }

    // 4. Fallback check 'users' collection for role attribute
    if (normalizedEmail) {
      const userDoc = await getDoc(doc(db, "users", normalizedEmail));
      if (userDoc.exists() && ["admin", "superadmin"].includes(userDoc.data()?.role)) {
        return true;
      }
    }
  } catch (error) {
    console.error("Error verifying admin status in Firestore:", error);
  }

  return false;
}

/**
 * Adds a new admin to the Firestore `admins` collection.
 */
export async function addAdminUser(email: string, name?: string, role: "admin" | "superadmin" = "admin", addedBy?: string) {
  const normalizedEmail = email.trim().toLowerCase();
  await setDoc(doc(db, "admins", normalizedEmail), {
    email: normalizedEmail,
    name: name || "",
    role,
    addedBy: addedBy || "system",
    active: true,
    createdAt: new Date(),
  });
}

/**
 * Fetches all registered admins from Firestore.
 */
export async function getAllAdmins(): Promise<AdminUser[]> {
  try {
    const snapshot = await getDocs(collection(db, "admins"));
    const admins: AdminUser[] = [];
    snapshot.forEach((docSnap) => {
      admins.push(docSnap.data() as AdminUser);
    });
    return admins;
  } catch (error) {
    console.error("Error fetching admins:", error);
    return [];
  }
}

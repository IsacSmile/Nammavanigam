import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export type UserRole = "user" | "business_owner" | "admin";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  return (user?.role as UserRole) || null;
}

export async function isAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === "admin";
}

export async function isBusinessOwnerOrAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === "business_owner" || role === "admin";
}

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      role: "user" | "business_owner" | "admin";
      status: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: number;
    role: "user" | "business_owner" | "admin";
    status: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    role: "user" | "business_owner" | "admin";
    status: string;
  }
}

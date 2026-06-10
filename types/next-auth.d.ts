import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: string;
      controlPlaneUrl?: string;
      authMode?: string;
    } & DefaultSession["user"];
    accessToken?: string;
  }

  interface User {
    id?: string;
    role?: string;
    controlPlaneUrl?: string;
    authMode?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    controlPlaneUrl?: string;
    authMode?: string;
    accessToken?: string;
    groups?: string[];
  }
}

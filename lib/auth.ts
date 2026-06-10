import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// OIDC configuration from environment
const oidcConfig = {
  issuer: process.env.AUTH_OIDC_ISSUER,
  clientId: process.env.AUTH_OIDC_CLIENT_ID,
  clientSecret: process.env.AUTH_OIDC_CLIENT_SECRET,
};

const providers = [
  CredentialsProvider({
    id: "basic",
    name: "Basic Auth",
    credentials: {
      username: { label: "Username", type: "text" },
      password: { label: "Password", type: "password" },
      controlPlaneUrl: { label: "Control Plane URL", type: "text" },
    },
    async authorize(credentials) {
      const username = credentials?.username as string | undefined;
      const password = credentials?.password as string | undefined;
      const controlPlaneUrl = credentials?.controlPlaneUrl as string | undefined;

      if (!username || !password || !controlPlaneUrl) {
        return null;
      }

      try {
        // Discover auth config from control plane
        await fetch(`${controlPlaneUrl}/auth/config`);

        // Validate credentials against control plane
        const response = await fetch(`${controlPlaneUrl}/healthz`, {
          headers: {
            Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
          },
        });

        if (!response.ok) {
          return null;
        }

        return {
          id: username,
          name: username,
          email: `${username}@minato.local`,
          role: "admin",
          controlPlaneUrl: controlPlaneUrl,
          authMode: "basic",
        };
      } catch {
        return null;
      }
    },
  }),
];

// Add OIDC provider if configured
// Note: In production, use a specific provider like keycloak, auth0, etc.
// or configure a custom OAuth provider
if (oidcConfig.issuer && oidcConfig.clientId) {
  // For now, we'll add a placeholder. In production, replace with specific provider
  console.log("OIDC configured but generic OIDC provider not yet implemented");
}

const {
  handlers: { GET, POST },
  auth: nextAuth,
  signIn,
  signOut,
} = NextAuth({
  providers,
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role;
        token.controlPlaneUrl = user.controlPlaneUrl;
        token.authMode = user.authMode;
      }

      // Handle OIDC sign in (when implemented)
      if (account?.provider === "oidc") {
        token.authMode = "oidc";
        token.accessToken = account.access_token;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.controlPlaneUrl = token.controlPlaneUrl as string;
        session.user.authMode = token.authMode as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});

export { GET, POST, signIn, signOut };

export async function auth() {
  if (process.env.E2E_TEST === "true") {
    return {
      user: {
        id: "e2e-user",
        name: "E2E User",
        email: "e2e@example.com",
        role: "admin",
        controlPlaneUrl: "http://localhost:8080",
        authMode: "basic",
      },
      accessToken: "e2e-test-token",
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }
  return nextAuth();
}
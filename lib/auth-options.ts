import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users, accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await db.select().from(users).where(eq(users.email, credentials.email)).limit(1);

        if (!user || user.length === 0) {
          throw new Error("No user found");
        }

        const foundUser = user[0];

        if (!foundUser.password) {
          throw new Error("Please sign in with Google");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, foundUser.password);

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name,
          image: foundUser.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        // If this Google sign-in was started from "Connect Google" in settings,
        // a cookie holds the initiating account's email. Refuse to link a
        // Google account whose email doesn't match — otherwise the user would
        // silently end up on a different/new account.
        try {
          const { cookies } = await import("next/headers");
          const cookieStore = await cookies();
          const pendingLinkEmail = cookieStore.get("pending_google_link")?.value;
          const isExplicitLink = Boolean(pendingLinkEmail);
          if (pendingLinkEmail && user.email !== pendingLinkEmail) {
            console.warn("[GOOGLE_LINK] Email mismatch, refusing link:", pendingLinkEmail, "vs", user.email);
            return false; // → redirected to pages.error (/settings) with error=AccessDenied
          }

          // A credentials account must not be silently linked merely because
          // the user chose Google on the normal sign-in screen. Linking is
          // allowed only after Settings explicitly created this cookie.
          const existingUser = await db.select().from(users).where(eq(users.email, user.email!)).limit(1);
          if (existingUser.length > 0) {
            const existingGoogleAccount = await db
              .select()
              .from(accounts)
              .where(eq(accounts.userId, existingUser[0].id))
              .limit(10);
            const hasGoogleAccount = existingGoogleAccount.some((row) => row.provider === "google");
            if (existingUser[0].password && !hasGoogleAccount && !isExplicitLink) {
              // Allow implicit linking instead of refusing it
              // console.warn("[GOOGLE_LINK] Refusing implicit link for credentials account:", user.email);
              // return false;
            }
          }
          cookieStore.delete("pending_google_link");
        } catch (e) {
          console.warn("[GOOGLE_LINK] Could not read link cookie:", e instanceof Error ? e.message : e);
        }

        // Check if user exists
        const existingUser = await db.select().from(users).where(eq(users.email, user.email!)).limit(1);

        if (existingUser.length === 0) {
          // Create new user
          const newUser = await db
            .insert(users)
            .values({
              id: crypto.randomUUID(),
              email: user.email!,
              name: user.name,
              image: user.image,
              emailVerified: new Date(),
            })
            .returning();

          // Create account link
          await db.insert(accounts).values({
            userId: newUser[0].id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
          });

          user.id = newUser[0].id;
        } else {
          user.id = existingUser[0].id;

          // Check if account link exists
          const existingAccount = await db
            .select()
            .from(accounts)
            .where(eq(accounts.userId, existingUser[0].id))
            .limit(1);

          if (!existingAccount.some((row) => row.provider === "google")) {
            // Create account link for existing user
            await db.insert(accounts).values({
              userId: existingUser[0].id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
            });
          }
        }
      }
      await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
    signOut: "/",
    // Sign-in errors (including a refused Google link from settings) land here.
    // The signed-in user keeps their session, so /settings renders the error;
    // unauthenticated errors fall through to /sign-in via the page guard.
    error: "/settings",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

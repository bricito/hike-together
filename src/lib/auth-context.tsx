import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;

  signInEmail: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null }>;

  signUpEmail: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{
    error: Error | null;
    needsConfirmation: boolean;
  }>;

  signInWithOAuth: (provider: "google" | "apple") => Promise<void>;

  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        import("@/lib/firebase").then(
          ({ initFirebase, requestFCMToken }) => {
            initFirebase();
            requestFCMToken();
          }
        );
      }

      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);

      if (data.session?.user) {
        import("@/lib/firebase").then(
          ({ initFirebase, requestFCMToken }) => {
            initFirebase();
            requestFCMToken();
          }
        );
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthCtx = {
    user,
    session,
    loading,

    signInEmail: async (email, password) => {
      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      return { error };
    },

    signUpEmail: async (
      email,
      password,
      fullName
    ) => {
      const redirectUrl =
        `${window.location.origin}/auth/callback`;

      const { data, error } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
            },
          },
        });

      return {
        error,
        needsConfirmation:
          !error && !data.session,
      };
    },

    signInWithOAuth: async (provider) => {
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo:
            `${window.location.origin}/auth/callback`,
        },
      });
    },

    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);

  if (!c) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return c;
}

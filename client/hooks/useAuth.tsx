'use client';

/**
 * Auth hook + provider. Wire supabase via your app-level client:
 *   import { supabase } from '@/lib/supabaseClient';
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import type { AuthUser, UserRole, UserStatus } from "@/lib/auth/types";

interface AuthContextType {
  currentUser: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserRole(userId: string): Promise<UserRole> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();
  return (data?.role as UserRole) ?? "user";
}

async function fetchProfile(userId: string): Promise<{
  name: string;
  email: string;
  status: UserStatus;
}> {
  const { data } = await supabase
    .from("profiles")
    .select("name, email, status")
    .eq("id", userId)
    .single();
  return {
    name: data?.name ?? "",
    email: data?.email ?? "",
    status: (data?.status as UserStatus) ?? "active",
  };
}

async function buildAuthUser(user: User): Promise<AuthUser> {
  const [role, profile] = await Promise.all([
    fetchUserRole(user.id),
    fetchProfile(user.id),
  ]);
  return {
    id: user.id,
    name: profile.name,
    email: profile.email,
    role,
    status: profile.status,
  };
}

const STATUS_MESSAGES: Record<string, string> = {
  blocked: "Your account has been blocked. Please contact support.",
  suspended: "Your account has been suspended. Please contact an administrator.",
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setTimeout(async () => {
            const authUser = await buildAuthUser(session.user);
            setCurrentUser(authUser);
            setLoading(false);
          }, 0);
        } else {
          setCurrentUser(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const authUser = await buildAuthUser(session.user);
        setCurrentUser(authUser);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    if (!data.user) return { success: false, error: "Login failed." };

    const profile = await fetchProfile(data.user.id);
    const msg = STATUS_MESSAGES[profile.status];
    if (msg) {
      await supabase.auth.signOut();
      return { success: false, error: msg };
    }

    return { success: true };
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: "user" },
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role ?? null,
        isAuthenticated: !!currentUser,
        loading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

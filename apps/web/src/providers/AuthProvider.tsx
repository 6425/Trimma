"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/config/supabase";
import { Session, User } from "@supabase/supabase-js";
import {
  AnalyticsEvent,
  identifyUser,
  resetAnalyticsUser,
  trackEvent,
} from "@/lib/analytics";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const identifiedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const syncAnalyticsIdentity = (nextUser: User | null, event?: string) => {
      if (nextUser) {
        if (identifiedUserIdRef.current !== nextUser.id) {
          identifyUser(nextUser.id, {
            email: nextUser.email,
            name:
              (typeof nextUser.user_metadata?.full_name === "string"
                ? nextUser.user_metadata.full_name
                : null) ||
              (typeof nextUser.user_metadata?.name === "string"
                ? nextUser.user_metadata.name
                : null),
            role:
              typeof nextUser.user_metadata?.role === "string"
                ? nextUser.user_metadata.role
                : null,
          });
          identifiedUserIdRef.current = nextUser.id;

          if (event === "SIGNED_IN") {
            trackEvent(AnalyticsEvent.UserLoggedIn, {
              provider: nextUser.app_metadata?.provider || "email",
            });
          } else if (event === "SIGNED_UP" || event === "USER_UPDATED") {
            // SIGNED_UP is not always emitted by GoTrue; treat first identify after signup flows via SIGNED_IN.
          }
        }
      } else if (identifiedUserIdRef.current) {
        if (event === "SIGNED_OUT") {
          trackEvent(AnalyticsEvent.UserLoggedOut);
        }
        resetAnalyticsUser();
        identifiedUserIdRef.current = null;
      }
    };

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (mounted) {
          if (error) {
            console.error("Auth session error:", error);
          } else {
            setSession(session);
            setUser(session?.user || null);
            syncAnalyticsIdentity(session?.user || null);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          console.error("Auth init exception:", err);
          setIsLoading(false);
        }
      }
    };

    void initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (mounted) {
          setSession(newSession);
          setUser(newSession?.user || null);
          setIsLoading(false);
          syncAnalyticsIdentity(newSession?.user || null, event);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

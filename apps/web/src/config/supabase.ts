import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials are not set. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

// Self-healing for stale or invalid session (e.g. after DB re-seeding)
if (typeof window !== 'undefined') {
  const clearStaleSession = () => {
    console.warn('Stale Supabase session detected. Self-healing by clearing auth storage...');
    
    // Safe collection and deletion of stale supabase localStorage tokens
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Clear supabase cookies to prevent backend/next.js session restoring
    document.cookie.split(";").forEach((c) => {
      const name = c.trim().split("=")[0];
      if (name.startsWith("sb-")) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
    
    // Clean internal memory and reset auth state
    supabase.auth.signOut().catch(() => {});
    
    // Prevent infinite reload loops: reload at most once
    const hasReloaded = sessionStorage.getItem('sb-auth-reloaded');
    if (!hasReloaded) {
      sessionStorage.setItem('sb-auth-reloaded', 'true');
      console.log('Reloading page to refresh guest state...');
      window.location.reload();
    } else {
      console.warn('Session clearing did not resolve stale session; skipping reload to prevent infinite loop.');
      sessionStorage.removeItem('sb-auth-reloaded');
    }
  };

  // Intercept and silence noisy refresh token warnings from Supabase Client in the browser console
  window.addEventListener('unhandledrejection', (event) => {
    const reasonMsg = event.reason ? String(event.reason.message || event.reason) : '';
    if (
      reasonMsg.includes('Refresh Token Not Found') || 
      reasonMsg.includes('Invalid Refresh Token') ||
      reasonMsg.includes('refresh_token')
    ) {
      event.preventDefault(); // Prevents console error logging completely
      clearStaleSession();
    }
  });

  supabase.auth.getSession().then(({ error }) => {
    if (error && (
      error.message.includes('Refresh Token Not Found') || 
      error.message.includes('Invalid Refresh Token') ||
      (error.status === 400 && error.message.includes('refresh_token'))
    )) {
      clearStaleSession();
    } else {
      // Clear reload flag on successful session retrieval
      sessionStorage.removeItem('sb-auth-reloaded');
    }
  }).catch(() => {
    // Silent catch
  });
}


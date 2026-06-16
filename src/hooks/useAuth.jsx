import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-react';
import { setAuthToken } from '../services/api';
import { getMyProfile } from '../services/user';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const clerkAuth = useClerkAuth();
  const clerkUser = useClerkUser();
  
  const [dbUser, setDbUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [hasNoAccess, setHasNoAccess] = useState(false);
  const [isBypass, setIsBypass] = useState(() => {
    return localStorage.getItem('auth_bypass') === 'true';
  });

  const loginBypass = () => {
    localStorage.setItem('auth_bypass', 'true');
    setIsBypass(true);
  };

  const logoutBypass = () => {
    localStorage.removeItem('auth_bypass');
    setIsBypass(false);
    setDbUser(null);
    setAuthToken(null);
    setHasNoAccess(false);
  };

  const handleSignOut = async () => {
    setHasNoAccess(false);
    if (isBypass) {
      logoutBypass();
    } else {
      await clerkAuth.signOut();
    }
  };

  // Sync session and fetch local database user details (roles, permissions)
  useEffect(() => {
    let active = true;

    // Reset hasNoAccess if Clerk is loaded but not signed in (and not bypassed)
    if (clerkAuth.isLoaded && !clerkAuth.isSignedIn && !isBypass) {
      setHasNoAccess(false);
    }

    const syncAuth = async () => {
      setAuthLoading(true);
      try {
        // If Clerk is loaded and the user IS signed in, always use the real token
        // regardless of any stale bypass flag in localStorage
        if (clerkAuth.isLoaded && clerkAuth.isSignedIn) {
          if (isBypass) {
            // Clear stale bypass — real Clerk session takes priority
            localStorage.removeItem('auth_bypass');
            setIsBypass(false);
          }
          // skipCache: true forces Clerk to always return a fresh, non-expired token
          const token = await clerkAuth.getToken({ skipCache: true });
          if (!token) {
            console.warn('[useAuth] Could not get a valid token');
            setAuthToken(null);
            if (active) setDbUser(null);
            return;
          }
          setAuthToken(token);
          const profile = await getMyProfile();
          if (active) {
            setDbUser(profile);
            setHasNoAccess(false); // Clear unauthorized status since sync succeeded
          }

        } else if (isBypass) {
          // Dev bypass mode: Use dummy token (only when Clerk is NOT signed in)
          setAuthToken('debug');
          const profile = await getMyProfile();
          if (active) {
            setDbUser(profile);
            setHasNoAccess(false);
          }

        } else if (clerkAuth.isLoaded && !clerkAuth.isSignedIn) {
          // Not logged in at all
          setAuthToken(null);
          if (active) {
            setDbUser(null);
            setHasNoAccess(false);
          }
        }
      } catch (err) {
        console.error('Failed to sync auth with backend:', err);
        // If bypass mode gets a 401, the backend bypass is OFF — clear the stale flag to stop the loop
        if (isBypass && err?.response?.status === 401) {
          console.warn('[useAuth] Backend rejected bypass token (ENABLE_DEV_BYPASS=False). Clearing stale bypass.');
          localStorage.removeItem('auth_bypass');
          setIsBypass(false);
        } else if (!isBypass && (err?.response?.status === 401 || err?.response?.status === 403)) {
          // Real Clerk session failed to authenticate with backend (explicit 401 or 403)
          console.warn('[useAuth] Backend rejected Clerk token with 401/403. Email has no access.');
          setAuthToken(null);
          if (active) setHasNoAccess(true);
        } else if (!isBypass) {
          console.error('[useAuth] Non-auth error during sync (e.g. server offline, network error, or Clerk token issue):', err);
          setAuthToken(null);
        }
        if (active) setDbUser(null);
      } finally {
        if (active) setAuthLoading(false);
      }
    };

    syncAuth();

    return () => { active = false; };
  }, [isBypass, clerkAuth.isLoaded, clerkAuth.isSignedIn]);

  const value = {
    isAuthenticated: !!dbUser,
    user: dbUser,
    clerkUser: clerkUser.user,
    loading: authLoading || (!isBypass && !clerkAuth.isLoaded),
    isBypass,
    loginBypass,
    signOut: handleSignOut,
    hasNoAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;

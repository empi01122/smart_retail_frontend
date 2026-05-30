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
  };

  const handleSignOut = async () => {
    if (isBypass) {
      logoutBypass();
    } else {
      await clerkAuth.signOut();
    }
  };

  // Sync session and fetch local database user details (roles, permissions)
  useEffect(() => {
    let active = true;

    const syncAuth = async () => {
      setAuthLoading(true);
      try {
        if (isBypass) {
          // Dev bypass mode: Use dummy token
          setAuthToken('debug');
          const profile = await getMyProfile();
          if (active) {
            setDbUser(profile);
          }
        } else if (clerkAuth.isLoaded && clerkAuth.isSignedIn) {
          // Normal Clerk flow
          const token = await clerkAuth.getToken();
          setAuthToken(token);
          const profile = await getMyProfile();
          if (active) {
            setDbUser(profile);
          }
        } else if (clerkAuth.isLoaded && !clerkAuth.isSignedIn) {
          // Not logged in
          setAuthToken(null);
          if (active) {
            setDbUser(null);
          }
        }
      } catch (err) {
        console.error('Failed to sync auth with backend:', err);
        // If profile fetch fails (e.g. backend offline or not registered), clear credentials
        if (active) {
          setDbUser(null);
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    };

    syncAuth();

    return () => {
      active = false;
    };
  }, [isBypass, clerkAuth.isLoaded, clerkAuth.isSignedIn]);

  const value = {
    isAuthenticated: !!dbUser,
    user: dbUser,
    clerkUser: clerkUser.user,
    loading: authLoading || (!isBypass && !clerkAuth.isLoaded),
    isBypass,
    loginBypass,
    signOut: handleSignOut,
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

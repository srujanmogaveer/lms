import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User, Student, Instructor, Admin } from '../types';
import { authService, mapProfileToUser } from '../services/authService';
import type { AuthSessionData } from '../services/authService';
import { supabase } from '../lib/supabase';
import { clearSenderProfileCache } from '../hooks/useChatRealtime';
import { preloadAdminPayments } from '../hooks/useAdminPayments';

interface AuthContextType {
  currentUser: User | Student | Instructor | Admin | null;
  rawProfile: AuthSessionData['user'] | null;
  role: 'student' | 'instructor' | 'admin';
  isAuthenticated: boolean;
  isAuthInitializing: boolean;
  isProfileLoading: boolean;
  isSavingProfile: boolean;
  isLoading: boolean;
  setRole: (role: 'student' | 'instructor' | 'admin') => void;
  login: (credentials: { email: string; password: string; role?: 'student' | 'instructor' | 'admin' }) => Promise<AuthSessionData>;
  signInWithGoogle: () => Promise<void>;
  registerStudent: (data: { fullName: string; email: string; password: string; phone?: string; termsAgreed: boolean }) => Promise<AuthSessionData>;
  registerInstructor: (data: { fullName: string; email: string; password: string; phone?: string; avatarUrl?: string; qualification?: string; experience?: string; specialization?: string; termsAgreed: boolean }) => Promise<AuthSessionData>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: any) => Promise<AuthSessionData['user']>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Synchronous module-level legacy cleanup ---
try {
  localStorage.removeItem('edusphere_raw_profile');
  localStorage.removeItem('edusphere_user');
} catch {
  // Ignore if localStorage is unavailable
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [role, setRoleState] = useState<'student' | 'instructor' | 'admin'>(() => {
    const savedRole = localStorage.getItem('edusphere_role') as 'student' | 'instructor' | 'admin';
    if (savedRole) return savedRole;
    return 'student';
  });

  const [currentUser, setCurrentUser] = useState<User | Student | Instructor | Admin | null>(null);
  const [rawProfile, setRawProfile] = useState<AuthSessionData['user'] | null>(null);
  const [isAuthInitializing, setIsAuthInitializing] = useState<boolean>(true);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(false);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState<boolean>(false);

  // Restore active user session from backend on mount or refresh
  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('supabase_access_token');
    const refreshToken = localStorage.getItem('supabase_refresh_token') || '';
    if (!token) return;

    // Ensure frontend Supabase instance is synchronized with current session
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session && token && refreshToken) {
        await supabase.auth.setSession({
          access_token: token,
          refresh_token: refreshToken,
        }).catch(() => null);
      }
    } catch {
      // Non-blocking sync
    }

    setIsProfileLoading(true);
    try {
      const res = await authService.getCurrentUser();
      if (res.success && res.data) {
        const userObj = mapProfileToUser(res.data);
        setCurrentUser(userObj);
        setRawProfile(res.data);
        if (userObj.role) {
          setRoleState(userObj.role);
          localStorage.setItem('edusphere_role', userObj.role);
          if (userObj.role === 'admin') {
            preloadAdminPayments(queryClient);
          }
        }
      }
    } catch {
      // If token expired, keep state safe
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  // Initial Auth Session Initialization Effect
  useEffect(() => {
    let isMounted = true;

    const initializeAuthSession = async () => {
      setIsAuthInitializing(true);
      try {
        // 1. Inspect existing Supabase session and local storage
        const { data: sessionData } = await supabase.auth.getSession();
        let session = sessionData?.session;

        const localAccessToken = localStorage.getItem('supabase_access_token');
        const localRefreshToken = localStorage.getItem('supabase_refresh_token') || '';

        // If client session is not active but tokens exist in storage, synchronize session
        if (!session && localAccessToken && localRefreshToken) {
          try {
            const { data: setRes, error: setErr } = await supabase.auth.setSession({
              access_token: localAccessToken,
              refresh_token: localRefreshToken,
            });
            if (!setErr && setRes?.session) {
              session = setRes.session;
            }
          } catch {
            // Non-blocking restore error
          }
        }

        const effectiveToken = session?.access_token || localAccessToken;

        if (effectiveToken) {
          localStorage.setItem('supabase_access_token', effectiveToken);
          if (session?.refresh_token) {
            localStorage.setItem('supabase_refresh_token', session.refresh_token);
          }

          setIsProfileLoading(true);
          try {
            const res = await authService.getCurrentUser();
            if (res.success && res.data && isMounted) {
              const userObj = mapProfileToUser(res.data);
              setCurrentUser(userObj);
              setRawProfile(res.data);
              if (userObj.role) {
                setRoleState(userObj.role);
                localStorage.setItem('edusphere_role', userObj.role);
                if (userObj.role === 'admin') {
                  preloadAdminPayments(queryClient);
                }
              }
            } else if (!res.success && isMounted) {
              // Token invalid or revoked
              localStorage.removeItem('supabase_access_token');
              localStorage.removeItem('supabase_refresh_token');
              localStorage.removeItem('edusphere_role');
              setCurrentUser(null);
              setRawProfile(null);
            }
          } catch (profileErr: any) {
            console.error('Failed to load profile on auth initialization:', profileErr);
            if (profileErr?.message?.includes('401') || profileErr?.message?.includes('Unauthorized')) {
              localStorage.removeItem('supabase_access_token');
              localStorage.removeItem('supabase_refresh_token');
              localStorage.removeItem('edusphere_role');
              if (isMounted) {
                setCurrentUser(null);
                setRawProfile(null);
              }
            }
          } finally {
            if (isMounted) {
              setIsProfileLoading(false);
            }
          }
        } else {
          // No existing session or token
          if (isMounted) {
            setCurrentUser(null);
            setRawProfile(null);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) {
          setIsAuthInitializing(false);
        }
      }
    };

    initializeAuthSession();

    // 2. Setup Supabase onAuthStateChange listener for background token refresh, oauth callback, and signout
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.access_token) {
          localStorage.setItem('supabase_access_token', session.access_token);
          if (session.refresh_token) {
            localStorage.setItem('supabase_refresh_token', session.refresh_token);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        clearSenderProfileCache();
        queryClient.clear();
        localStorage.removeItem('supabase_access_token');
        localStorage.removeItem('supabase_refresh_token');
        localStorage.removeItem('edusphere_user');
        localStorage.removeItem('edusphere_raw_profile');
        localStorage.removeItem('edusphere_role');
        if (isMounted) {
          setCurrentUser(null);
          setRawProfile(null);
        }
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const setRole = (newRole: 'student' | 'instructor' | 'admin') => {
    setRoleState(newRole);
    localStorage.setItem('edusphere_role', newRole);
  };

  const login = async (credentials: {
    email: string;
    password: string;
    role?: 'student' | 'instructor' | 'admin';
  }): Promise<AuthSessionData> => {
    setIsSubmittingAuth(true);
    try {
      const res = await authService.login(credentials);
      if (res.success && res.data) {
        if (res.data.session?.accessToken) {
          const accessToken = res.data.session.accessToken;
          const refreshToken = res.data.session.refreshToken || '';
          localStorage.setItem('supabase_access_token', accessToken);
          localStorage.setItem('supabase_refresh_token', refreshToken);

          // Synchronize Supabase browser client session
          if (refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            }).catch(() => null);
          }
        }
        const userObj = mapProfileToUser(res.data.user);
        setCurrentUser(userObj);
        setRawProfile(res.data.user);
        setRoleState(userObj.role);
        localStorage.setItem('edusphere_role', userObj.role);
        if (userObj.role === 'admin') {
          preloadAdminPayments(queryClient);
        }
        return res.data;
      }
      throw new Error(res.message || 'Login failed');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  /**
   * Start Google OAuth Flow specifically configured for Students
   */
  const signInWithGoogle = async (): Promise<void> => {
    setIsSubmittingAuth(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to start Google sign-in');
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const registerStudent = async (data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    termsAgreed: boolean;
  }): Promise<AuthSessionData> => {
    setIsSubmittingAuth(true);
    try {
      const res = await authService.registerStudent(data);
      if (res.success && res.data) {
        if (res.data.session?.accessToken) {
          const accessToken = res.data.session.accessToken;
          const refreshToken = res.data.session.refreshToken || '';
          localStorage.setItem('supabase_access_token', accessToken);
          localStorage.setItem('supabase_refresh_token', refreshToken);
          if (refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            }).catch(() => null);
          }
        }
        const userObj = mapProfileToUser(res.data.user);
        setCurrentUser(userObj);
        setRawProfile(res.data.user);
        setRoleState(userObj.role);
        return res.data;
      }
      throw new Error(res.message || 'Registration failed');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const registerInstructor = async (data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    avatarUrl?: string;
    qualification?: string;
    experience?: string;
    specialization?: string;
    termsAgreed: boolean;
  }): Promise<AuthSessionData> => {
    setIsSubmittingAuth(true);
    try {
      const res = await authService.registerInstructor(data);
      if (res.success && res.data) {
        if (res.data.session?.accessToken) {
          const accessToken = res.data.session.accessToken;
          const refreshToken = res.data.session.refreshToken || '';
          localStorage.setItem('supabase_access_token', accessToken);
          localStorage.setItem('supabase_refresh_token', refreshToken);
          if (refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            }).catch(() => null);
          }
        }
        const userObj = mapProfileToUser(res.data.user);
        setCurrentUser(userObj);
        setRawProfile(res.data.user);
        setRoleState(userObj.role);
        return res.data;
      }
      throw new Error(res.message || 'Application submission failed');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const logout = async () => {
    try {
      clearSenderProfileCache();
      queryClient.clear();
      await supabase.auth.signOut().catch(() => null);
      await authService.logout().catch(() => null);
    } finally {
      localStorage.removeItem('supabase_access_token');
      localStorage.removeItem('supabase_refresh_token');
      localStorage.removeItem('edusphere_user');
      localStorage.removeItem('edusphere_raw_profile');
      localStorage.removeItem('edusphere_role');
      setCurrentUser(null);
      setRawProfile(null);
    }
  };

  const updateProfile = async (payload: any): Promise<AuthSessionData['user']> => {
    setIsSavingProfile(true);
    try {
      const res = await authService.updateProfile(payload);
      if (res.success && res.data) {
        const userObj = mapProfileToUser(res.data);
        setCurrentUser(userObj);
        setRawProfile(res.data);
        if (userObj.role) {
          setRoleState(userObj.role);
          localStorage.setItem('edusphere_role', userObj.role);
        }
        return res.data;
      }
      throw new Error(res.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const updatePassword = async (newPassword: string): Promise<void> => {
    // 1. Check/restore active Supabase browser session
    const accessToken = localStorage.getItem('supabase_access_token');
    const refreshToken = localStorage.getItem('supabase_refresh_token') || '';

    let { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session && accessToken && refreshToken) {
      const { data: setSessionData, error: setSessionErr } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (setSessionErr) {
        throw new Error('Your session has expired. Please sign in again.');
      }
      sessionData = setSessionData;
    }

    if (!sessionData?.session) {
      throw new Error('Your session has expired. Please sign in again.');
    }

    // 2. Execute password update against Supabase Auth
    const { data: updateData, error: updateErr } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateErr) {
      throw new Error(updateErr.message || 'Failed to update password');
    }

    // 3. Keep local tokens synchronized if updated
    if (updateData?.user) {
      const { data: freshSession } = await supabase.auth.getSession();
      if (freshSession?.session?.access_token) {
        localStorage.setItem('supabase_access_token', freshSession.session.access_token);
        if (freshSession.session.refresh_token) {
          localStorage.setItem('supabase_refresh_token', freshSession.session.refresh_token);
        }
      }
    }
  };

  const isLoading = isAuthInitializing || isProfileLoading || isSubmittingAuth;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        rawProfile,
        role,
        isAuthenticated: Boolean(currentUser),
        isAuthInitializing,
        isProfileLoading,
        isSavingProfile,
        isLoading,
        setRole,
        login,
        signInWithGoogle,
        registerStudent,
        registerInstructor,
        logout,
        refreshProfile,
        updateProfile,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

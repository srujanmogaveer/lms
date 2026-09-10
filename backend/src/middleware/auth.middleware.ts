import { Request, Response, NextFunction } from 'express';
import { supabasePublic, supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/apiResponse';
import { UserRole } from '../types';
import { authService } from '../services/auth.service';

// Token session cache to avoid repeating remote supabase.auth.getUser() on every sub-request
interface CachedUserSession {
  user: any;
  profile: any;
  cachedAt: number;
}
const tokenCache = new Map<string, CachedUserSession>();
const TOKEN_CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

/**
 * Removes all token cache entries for a given userId.
 * Called by auth.service.updateProfile() after a successful DB update
 * so the next GET /auth/me returns the fresh profile instead of stale cached data.
 */
export const invalidateUserTokenCache = (userId: string): void => {
  for (const [token, session] of tokenCache.entries()) {
    if (session.user?.id === userId) {
      tokenCache.delete(token);
    }
  }
};

export const authenticateUser = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(ApiError.unauthorized('No authentication token provided'));
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    next(ApiError.unauthorized('Invalid authorization token format'));
    return;
  }

  try {
    const now = Date.now();
    const cached = tokenCache.get(token);
    if (cached && (now - cached.cachedAt) < TOKEN_CACHE_TTL_MS) {
      const role = (cached.profile?.role || cached.user.user_metadata?.role || 'student') as UserRole;
      req.user = {
        id: cached.user.id,
        email: cached.user.email || '',
        role,
        name: cached.profile?.fullName || cached.user.user_metadata?.full_name || cached.user.user_metadata?.name || 'EduSphere User',
        avatar: cached.profile?.avatarUrl || cached.user.user_metadata?.avatar_url || '',
        profile: cached.profile,
        rawSupabaseUser: cached.user,
      };
      return next();
    }

    // 1. Validate JWT via Supabase Auth
    let user: any = null;

    const { data: authData, error } = await supabasePublic.auth.getUser(token);
    if (!error && authData?.user) {
      user = authData.user;
    } else {
      // Try admin client verification as fallback for local dev tokens
      const { data: adminData } = await supabaseAdmin.auth.getUser(token);
      if (adminData?.user) {
        user = adminData.user;
      }
    }

    if (!user) {
      tokenCache.delete(token);
      next(ApiError.unauthorized(error?.message || 'Invalid or expired session token'));
      return;
    }

    // 2. Fetch full user profile from profiles table / auth service
    const profile = await authService.getCurrentUser(user.id, user);
    tokenCache.set(token, { user, profile, cachedAt: now });

    const role = (profile?.role || user.user_metadata?.role || 'student') as UserRole;

    req.user = {
      id: user.id,
      email: user.email || '',
      role,
      name: profile?.fullName || user.user_metadata?.full_name || user.user_metadata?.name || 'EduSphere User',
      avatar: profile?.avatarUrl || user.user_metadata?.avatar_url || '',
      profile,
      rawSupabaseUser: user,
    };

    next();
  } catch (err: any) {
    next(ApiError.unauthorized(err?.message || 'Authentication failed'));
  }
};

import React, { useState, useEffect } from 'react';

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  role?: 'student' | 'instructor' | 'admin' | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | string;
  className?: string;
  shape?: 'circle' | 'rounded' | 'square';
  alt?: string;
  showBorder?: boolean;
}

/**
 * Deterministic color palette for user initials
 */
const PALETTES = [
  'from-indigo-600 to-indigo-800 text-white',
  'from-purple-600 to-purple-800 text-white',
  'from-rose-600 to-rose-800 text-white',
  'from-emerald-600 to-emerald-800 text-white',
  'from-blue-600 to-blue-800 text-white',
  'from-amber-600 to-amber-800 text-white',
  'from-teal-600 to-teal-800 text-white',
  'from-violet-600 to-violet-800 text-white',
  'from-cyan-600 to-cyan-800 text-white',
];

export const getFirstLetter = (name?: string | null, email?: string | null): string => {
  if (name && name.trim().length > 0) {
    // Strip common prefixes like Dr., Prof., etc. if present
    const cleanName = name.replace(/^(dr\.|prof\.|mr\.|mrs\.|ms\.)\s+/i, '').trim();
    const firstChar = cleanName.charAt(0).toUpperCase();
    if (firstChar && /[A-Z0-9]/i.test(firstChar)) {
      return firstChar;
    }
  }

  if (email && email.trim().length > 0) {
    const firstEmailChar = email.trim().charAt(0).toUpperCase();
    if (firstEmailChar && /[A-Z0-9]/i.test(firstEmailChar)) {
      return firstEmailChar;
    }
  }

  return 'U';
};

/**
 * Detects if a URL is a dummy placeholder or invalid
 */
export const isPlaceholderAvatar = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string' || url.trim() === '') return true;
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.includes('photo-1534528741775-53994a69daeb') ||
    trimmed.includes('photo-1573496359142-b8d87734a5a2') ||
    trimmed.includes('photo-1507003211169-0a1dd7228f2d') ||
    trimmed.includes('photo-1580489944761-15a19d654956') ||
    trimmed.includes('photo-1500648767791-00dcc994a43e') ||
    trimmed.includes('photo-1517841905240-472988babdf9') ||
    trimmed.includes('photo-1494790108377-be9c29b29330') ||
    trimmed.includes('example.com')
  ) {
    return true;
  }
  return false;
};

const getDeterministicGradient = (str: string, role?: string): string => {
  if (role === 'admin') return 'from-rose-600 to-rose-800 text-white';
  if (role === 'instructor') return 'from-purple-600 to-purple-800 text-white';
  if (role === 'student') return 'from-indigo-600 to-indigo-800 text-white';

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTES.length;
  return PALETTES[index];
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  email,
  role,
  size = 'md',
  className = '',
  shape = 'circle',
  alt,
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initial = getFirstLetter(name, email);
  const isInvalidOrPlaceholder = !src || isPlaceholderAvatar(src) || hasError;

  // Size mapping
  const sizeClasses: Record<string, { container: string; text: string }> = {
    xs: { container: 'w-6 h-6', text: 'text-[10px]' },
    sm: { container: 'w-8 h-8', text: 'text-xs' },
    md: { container: 'w-9 h-9', text: 'text-xs' },
    lg: { container: 'w-10 h-10', text: 'text-sm' },
    xl: { container: 'w-16 h-16', text: 'text-xl' },
    '2xl': { container: 'w-20 h-20', text: 'text-2xl' },
    '3xl': { container: 'w-24 h-24', text: 'text-3xl' },
  };

  const selectedSize = sizeClasses[size] || { container: size, text: 'text-sm' };

  // Shape mapping
  const shapeClass =
    shape === 'circle' ? 'rounded-full' : shape === 'rounded' ? 'rounded-2xl' : 'rounded-lg';

  if (isInvalidOrPlaceholder) {
    const gradient = getDeterministicGradient(name || email || 'User', role);
    return (
      <div
        className={`${selectedSize.container} ${shapeClass} bg-gradient-to-tr ${gradient} flex items-center justify-center font-black select-none shrink-0 shadow-xs border border-white/20 dark:border-slate-700/50 ${className}`}
        title={name || email || 'User'}
        aria-label={name || email || 'User Avatar'}
      >
        <span className={`${selectedSize.text} uppercase tracking-wider leading-none`}>
          {initial}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || name || 'User Avatar'}
      onError={() => setHasError(true)}
      className={`${selectedSize.container} ${shapeClass} object-cover shrink-0 select-none ${className}`}
    />
  );
};

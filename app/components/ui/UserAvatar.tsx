/**
 * UserAvatar Component
 *
 * Displays user initials in a colored circle when no profile picture is available.
 * Color is deterministic based on userId hash for consistency.
 */

import { useMemo } from 'react';
import type { User } from '../../types';

interface UserAvatarProps {
  user: Pick<User, 'nickname' | 'id' | 'photoURL'>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Generate consistent color from userId
function hashStringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Enduco-inspired pastel colors
  const colors = [
    '#10B981', // Green 500
    '#F59E0B', // Amber 500
    '#3B82F6', // Blue 500
    '#8B5CF6', // Purple 500
    '#EC4899', // Pink 500
    '#14B8A6', // Teal 500
    '#F97316', // Orange 500
    '#6366F1', // Indigo 500
  ];

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// Extract initials from nickname
function getInitials(nickname: string): string {
  if (!nickname || nickname.trim().length === 0) {
    return '?';
  }

  const cleaned = nickname.trim();
  const words = cleaned.split(/\s+/);

  if (words.length === 1) {
    // Single word: take first 2 characters
    return cleaned.slice(0, 2).toUpperCase();
  }

  // Multiple words: take first character of first 2 words
  const first = words[0][0];
  const second = words[1][0];
  return (first + second).toUpperCase();
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-20 h-20 text-xl',
};

export function UserAvatar({ user, size = 'md', className = '' }: UserAvatarProps) {
  const initials = useMemo(() => getInitials(user.nickname), [user.nickname]);
  const backgroundColor = useMemo(() => hashStringToColor(user.id), [user.id]);

  // If user has photo URL, show image
  if (user.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt={user.nickname || 'User'}
        referrerPolicy="no-referrer"
        className={`${sizeClasses[size]} rounded-full border-2 border-white/20 object-cover ${className}`}
        onError={(e) => {
          // Fallback to initials if image fails to load
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  // Show initials with colored background
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white ${className}`}
      style={{ backgroundColor }}
      aria-label={`${user.nickname}'s avatar`}
    >
      {initials}
    </div>
  );
}

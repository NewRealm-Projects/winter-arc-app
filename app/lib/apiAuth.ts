import { NextResponse } from 'next/server';
import { stackServerApp } from '@/lib/stack';
import { getUserByStackId } from '@/app/services/userSyncService';

/**
 * Helper function to get authenticated user for API routes.
 * Returns both the Stack user and the local database user.
 *
 * @returns Object with user and localUser, or NextResponse with error
 */
export async function getAuthenticatedUser() {
  const user = await stackServerApp.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      user: null,
      localUser: null,
    };
  }

  const localUser = await getUserByStackId(user.id);

  if (!localUser) {
    return {
      error: NextResponse.json({ error: 'User not found in database' }, { status: 404 }),
      user,
      localUser: null,
    };
  }

  return {
    error: null,
    user,
    localUser,
  };
}

/**
 * ============================================================================
 * Auth API Service
 * ============================================================================
 * Handles user login and role registration.
 */

import { BASE_URL } from '../../constants/config';

export interface UserAccount {
  id: number;
  username: string;
  role: 'guest' | 'registered' | 'subscriber';
}

export async function loginApi(username: string, password?: string, role?: string): Promise<UserAccount> {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to authenticate user');
  }
  return await response.json();
}

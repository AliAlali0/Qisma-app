/**
 * ============================================================================
 * Players API Service
 * ============================================================================
 * Handles HTTP communication with the backend /api/players endpoints.
 */

import { BASE_URL } from '../../constants/config';
import { Player } from '../../types/player.types';

export async function getPlayersApi(): Promise<Player[]> {
  const response = await fetch(`${BASE_URL}/api/players`);
  if (!response.ok) {
    throw new Error('Failed to fetch players list from backend');
  }
  return await response.json();
}

export async function createPlayerApi(playerData: {
  name: string;
  rating: number;
  primary_position: string;
  secondary_positions?: string[];
  group_name?: string;
}): Promise<Player> {
  const response = await fetch(`${BASE_URL}/api/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(playerData),
  });
  if (!response.ok) {
    throw new Error('Failed to create new player');
  }
  return await response.json();
}

export async function updatePlayerApi(
  id: number | string,
  playerData: {
    name: string;
    rating: number;
    primary_position: string;
    secondary_positions?: string[];
    group_name?: string;
  }
): Promise<Player> {
  const response = await fetch(`${BASE_URL}/api/players/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(playerData),
  });
  if (!response.ok) {
    throw new Error('Failed to update player');
  }
  return await response.json();
}

export async function deletePlayerApi(id: number | string): Promise<boolean> {
  const response = await fetch(`${BASE_URL}/api/players/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete player');
  }
  const data = await response.json();
  return Boolean(data.success);
}

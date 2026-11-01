/**
 * ============================================================================
 * Matches API Service
 * ============================================================================
 * Handles HTTP communication with the backend /api/matches endpoints.
 */

import { BASE_URL } from '../../constants/config';
import { Match } from '../../types/match.types';
import { Player } from '../../types/player.types';

export async function getMatchesApi(): Promise<Match[]> {
  const response = await fetch(`${BASE_URL}/api/matches`);
  if (!response.ok) {
    throw new Error('Failed to fetch matches history from backend');
  }
  return await response.json();
}

export async function createMatchApi(matchData: {
  team_a_name: string;
  team_b_name: string;
  team_a_color: string;
  team_b_color: string;
  formation: string;
  team_a_players: Player[];
  team_b_players: Player[];
  team_a_score?: number | null;
  team_b_score?: number | null;
}): Promise<Match> {
  const response = await fetch(`${BASE_URL}/api/matches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(matchData),
  });
  if (!response.ok) {
    throw new Error('Failed to create match record');
  }
  return await response.json();
}

export async function updateMatchScoreApi(
  id: number | string,
  scoreData: {
    team_a_score?: number | null;
    team_b_score?: number | null;
    mvp_player_name?: string | null;
    apply_rating_boost?: boolean;
  }
): Promise<Match> {
  const response = await fetch(`${BASE_URL}/api/matches/${id}/score`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scoreData),
  });
  if (!response.ok) {
    throw new Error('Failed to update match score');
  }
  return await response.json();
}

export async function deleteMatchApi(id: number | string): Promise<boolean> {
  const response = await fetch(`${BASE_URL}/api/matches/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete match');
  }
  const data = await response.json();
  return Boolean(data.success);
}

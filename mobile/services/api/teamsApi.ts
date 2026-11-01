/**
 * ============================================================================
 * Teams API Service
 * ============================================================================
 * Handles HTTP communication with the backend /api/teams endpoints.
 */

import { BASE_URL } from '../../constants/config';
import { SavedTeam } from '../../types/team.types';
import { Player } from '../../types/player.types';

export async function getTeamsApi(): Promise<SavedTeam[]> {
  const response = await fetch(`${BASE_URL}/api/teams`);
  if (!response.ok) {
    throw new Error('Failed to fetch teams list from backend');
  }
  return await response.json();
}

export async function createTeamApi(teamData: {
  name: string;
  kit_color: string;
  defenders_count: number;
  midfielders_count: number;
  attackers_count: number;
  players_data?: Player[];
  tournament_name?: string | null;
}): Promise<SavedTeam> {
  const response = await fetch(`${BASE_URL}/api/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(teamData),
  });
  if (!response.ok) {
    throw new Error('Failed to create team');
  }
  return await response.json();
}

export async function updateTeamApi(
  id: number | string,
  teamData: {
    name?: string;
    kit_color?: string;
    defenders_count?: number;
    midfielders_count?: number;
    attackers_count?: number;
    players_data?: Player[];
  }
): Promise<SavedTeam> {
  const response = await fetch(`${BASE_URL}/api/teams/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(teamData),
  });
  if (!response.ok) {
    throw new Error('Failed to update team');
  }
  return await response.json();
}

export async function deleteTeamApi(id: number | string): Promise<boolean> {
  const response = await fetch(`${BASE_URL}/api/teams/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete team');
  }
  const data = await response.json();
  return Boolean(data.success);
}

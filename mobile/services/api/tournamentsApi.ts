/**
 * ============================================================================
 * Tournaments API Service
 * ============================================================================
 * Handles HTTP communication with the backend /api/tournaments endpoints.
 */

import { BASE_URL } from '../../constants/config';
import { Tournament, TournamentFixture, TournamentTeam } from '../../types/tournament.types';
import { Player } from '../../types/player.types';

export async function getTournamentsApi(): Promise<Tournament[]> {
  const response = await fetch(`${BASE_URL}/api/tournaments`);
  if (!response.ok) {
    throw new Error('Failed to fetch tournaments list from backend');
  }
  return await response.json();
}

export async function generateTournamentApi(tournamentData: {
  name: string;
  tournamentType: string;
  teamsCount: number;
  players: Player[];
}): Promise<Tournament> {
  const response = await fetch(`${BASE_URL}/api/tournaments/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tournamentData),
  });
  if (!response.ok) {
    throw new Error('Failed to generate tournament');
  }
  return await response.json();
}

export async function updateTournamentApi(
  id: number | string,
  updateData: {
    teams_data?: TournamentTeam[];
    fixtures_data?: TournamentFixture[];
    status?: string;
  }
): Promise<Tournament> {
  const response = await fetch(`${BASE_URL}/api/tournaments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });
  if (!response.ok) {
    throw new Error('Failed to update tournament fixtures');
  }
  return await response.json();
}

export async function deleteTournamentApi(id: number | string): Promise<boolean> {
  const response = await fetch(`${BASE_URL}/api/tournaments/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete tournament');
  }
  const data = await response.json();
  return Boolean(data.success);
}

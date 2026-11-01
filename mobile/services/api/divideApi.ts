/**
 * ============================================================================
 * Divide & Draft API Service
 * ============================================================================
 * Handles WhatsApp roster division and custom formation drafting.
 */

import { BASE_URL } from '../../constants/config';
import { Player } from '../../types/player.types';
import { FormationCounts } from '../../types/team.types';

export interface DivideResponse {
  teamA: Player[];
  teamB: Player[];
  totalExtracted: number;
  teamARatingTotal: number;
  teamBRatingTotal: number;
  analysisSource: string;
  wasRounded?: boolean;
}

export async function divideTeamsApi(rawText: string, userRole: string): Promise<DivideResponse> {
  const response = await fetch(`${BASE_URL}/api/divide-teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawText, userRole }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to analyze and divide teams');
  }
  return await response.json();
}

export async function draftBalanceApi(
  players: Player[],
  formation: FormationCounts
): Promise<DivideResponse> {
  const response = await fetch(`${BASE_URL}/api/draft-balance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ players, formation }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to balance draft players');
  }
  return await response.json();
}

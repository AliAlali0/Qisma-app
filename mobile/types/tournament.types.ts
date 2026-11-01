/**
 * ============================================================================
 * Tournament Type Definitions
 * ============================================================================
 * Defines types for tournament fixtures, standings, teams, and knockout stages.
 */

import { Player } from './player.types';

export type TournamentType = 'league' | 'knockout' | 'groups_knockout';

export interface TournamentFixture {
  matchId: string;
  stage: string;
  stageLabel: string;
  teamAId: string;
  teamAName: string;
  teamBId: string | null;
  teamBName: string;
  scoreA: number | null;
  scoreB: number | null;
  winnerId: string | null;
}

export interface TournamentTeam {
  teamId: string;
  name: string;
  color: string;
  players: Player[];
  ratingTotal: number;
}

export interface Tournament {
  id: number;
  user_id?: number;
  name: string;
  tournament_type: TournamentType;
  teams_count: number;
  teams_data: TournamentTeam[];
  fixtures_data: TournamentFixture[];
  status?: string;
  created_at: string;
}

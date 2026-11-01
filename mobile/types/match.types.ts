/**
 * ============================================================================
 * Match Type Definitions
 * ============================================================================
 * Defines types for match logs, formations, and score updates.
 */

import { Player } from './player.types';

export interface Match {
  id: number;
  user_id?: number;
  team_a_name: string;
  team_b_name: string;
  team_a_color: string;
  team_b_color: string;
  formation: string;
  team_a_score: number | null;
  team_b_score: number | null;
  mvp_player_name: string | null;
  ratings_applied?: boolean;
  team_a_players: Player[];
  team_b_players: Player[];
  created_at: string;
}

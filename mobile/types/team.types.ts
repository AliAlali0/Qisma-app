/**
 * ============================================================================
 * Team Type Definitions
 * ============================================================================
 * Defines types for saved squads, pitch slots, kit customization, and formations.
 */

import { Player } from './player.types';

export interface SavedTeam {
  id: number;
  user_id?: number;
  name: string;
  kit_color: string;
  defenders_count: number;
  midfielders_count: number;
  attackers_count: number;
  players_data: Player[];
  tournament_name?: string | null;
  created_at?: string;
}

export interface FormationCounts {
  def: number;
  mid: number;
  att: number;
}

export interface DraftSlot {
  id: string;
  slotIndex: number;
  team: 'A' | 'B';
  role: 'حارس' | 'دفاع' | 'وسط' | 'هجوم';
  lineIndex: number;
  player: Player | null;
}

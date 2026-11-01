/**
 * ============================================================================
 * Player Type Definitions
 * ============================================================================
 * Defines types and interfaces for pickup players, FUT attributes, and positions.
 */

export type Position = 'حارس' | 'دفاع' | 'وسط' | 'هجوم';

export interface Player {
  id?: number | string;
  name: string;
  rating: number;
  primary_position: Position;
  secondary_positions?: Position[];
  position?: Position;
  isGoalkeeper?: boolean;
  group_name?: string;
  matches_played?: number;
  wins?: number;
  mvp_count?: number;
  slotIndex?: number;
  isEmptySlot?: boolean;
}

export interface FutAttributes {
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
}

export interface FutGkAttributes {
  div: number;
  han: number;
  kic: number;
  ref: number;
  spe: number;
  pos: number;
}

export type FutTier = 'mvp' | 'gold_rare' | 'gold_common' | 'silver';

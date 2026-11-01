/**
 * ============================================================================
 * useMatches Hook (Business Logic & State for Match Hub)
 * ============================================================================
 * Decouples match history, scores recording, and MVP awards from UI screens.
 */

import { useState, useEffect, useCallback } from 'react';
import { Match } from '../types/match.types';
import { Player } from '../types/player.types';
import {
  getMatchesApi,
  createMatchApi,
  updateMatchScoreApi,
  deleteMatchApi,
} from '../services/api/matchesApi';

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMatchesApi();
      setMatches(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch match history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const addMatch = useCallback(
    async (matchData: {
      team_a_name: string;
      team_b_name: string;
      team_a_color: string;
      team_b_color: string;
      formation: string;
      team_a_players: Player[];
      team_b_players: Player[];
      team_a_score?: number | null;
      team_b_score?: number | null;
    }) => {
      try {
        const created = await createMatchApi(matchData);
        setMatches((prev) => [created, ...prev]);
        return created;
      } catch (err: any) {
        throw new Error(err.message || 'Failed to record match');
      }
    },
    []
  );

  const updateScore = useCallback(
    async (
      id: number | string,
      scoreData: {
        team_a_score?: number | null;
        team_b_score?: number | null;
        mvp_player_name?: string | null;
        apply_rating_boost?: boolean;
      }
    ) => {
      try {
        const updated = await updateMatchScoreApi(id, scoreData);
        setMatches((prev) => prev.map((m) => (m.id === id ? updated : m)));
        return updated;
      } catch (err: any) {
        throw new Error(err.message || 'Failed to update match score');
      }
    },
    []
  );

  const removeMatch = useCallback(async (id: number | string) => {
    try {
      await deleteMatchApi(id);
      setMatches((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete match');
    }
  }, []);

  return {
    matches,
    loading,
    error,
    fetchMatches,
    addMatch,
    updateScore,
    removeMatch,
  };
}

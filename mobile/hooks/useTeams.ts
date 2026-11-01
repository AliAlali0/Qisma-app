/**
 * ============================================================================
 * useTeams Hook (Business Logic & State for Saved Squads)
 * ============================================================================
 * Decouples team fetching, creating, and updating from UI screens.
 */

import { useState, useEffect, useCallback } from 'react';
import { SavedTeam } from '../types/team.types';
import { Player } from '../types/player.types';
import {
  getTeamsApi,
  createTeamApi,
  updateTeamApi,
  deleteTeamApi,
} from '../services/api/teamsApi';

export function useTeams() {
  const [teams, setTeams] = useState<SavedTeam[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTeamsApi();
      setTeams(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const addTeam = useCallback(
    async (teamData: {
      name: string;
      kit_color: string;
      defenders_count: number;
      midfielders_count: number;
      attackers_count: number;
      players_data?: Player[];
      tournament_name?: string | null;
    }) => {
      try {
        const created = await createTeamApi(teamData);
        setTeams((prev) => [created, ...prev]);
        return created;
      } catch (err: any) {
        throw new Error(err.message || 'Failed to add team');
      }
    },
    []
  );

  const editTeam = useCallback(
    async (
      id: number | string,
      teamData: {
        name?: string;
        kit_color?: string;
        defenders_count?: number;
        midfielders_count?: number;
        attackers_count?: number;
        players_data?: Player[];
      }
    ) => {
      try {
        const updated = await updateTeamApi(id, teamData);
        setTeams((prev) => prev.map((t) => (t.id === id ? updated : t)));
        return updated;
      } catch (err: any) {
        throw new Error(err.message || 'Failed to update team');
      }
    },
    []
  );

  const removeTeam = useCallback(async (id: number | string) => {
    try {
      await deleteTeamApi(id);
      setTeams((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete team');
    }
  }, []);

  return {
    teams,
    loading,
    error,
    fetchTeams,
    addTeam,
    editTeam,
    removeTeam,
  };
}

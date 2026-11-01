/**
 * ============================================================================
 * useTournaments Hook (Business Logic & State for Tournament Engine)
 * ============================================================================
 * Decouples tournament generation, schedule tracking, and fixtures from UI screens.
 */

import { useState, useEffect, useCallback } from 'react';
import { Tournament, TournamentFixture, TournamentTeam } from '../types/tournament.types';
import { Player } from '../types/player.types';
import {
  getTournamentsApi,
  generateTournamentApi,
  updateTournamentApi,
  deleteTournamentApi,
} from '../services/api/tournamentsApi';

export function useTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTournamentsApi();
      setTournaments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tournaments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const createTournament = useCallback(
    async (tournamentData: {
      name: string;
      tournamentType: string;
      teamsCount: number;
      players: Player[];
    }) => {
      try {
        const created = await generateTournamentApi(tournamentData);
        setTournaments((prev) => [created, ...prev]);
        setActiveTournament(created);
        return created;
      } catch (err: any) {
        throw new Error(err.message || 'Failed to create tournament');
      }
    },
    []
  );

  const updateFixtures = useCallback(
    async (
      id: number | string,
      updateData: {
        teams_data?: TournamentTeam[];
        fixtures_data?: TournamentFixture[];
        status?: string;
      }
    ) => {
      try {
        const updated = await updateTournamentApi(id, updateData);
        setTournaments((prev) => prev.map((t) => (t.id === id ? updated : t)));
        if (activeTournament && activeTournament.id === id) {
          setActiveTournament(updated);
        }
        return updated;
      } catch (err: any) {
        throw new Error(err.message || 'Failed to update tournament fixtures');
      }
    },
    [activeTournament]
  );

  const removeTournament = useCallback(
    async (id: number | string) => {
      try {
        await deleteTournamentApi(id);
        setTournaments((prev) => prev.filter((t) => t.id !== id));
        if (activeTournament && activeTournament.id === id) {
          setActiveTournament(null);
        }
      } catch (err: any) {
        throw new Error(err.message || 'Failed to delete tournament');
      }
    },
    [activeTournament]
  );

  return {
    tournaments,
    activeTournament,
    setActiveTournament,
    loading,
    error,
    fetchTournaments,
    createTournament,
    updateFixtures,
    removeTournament,
  };
}

/**
 * ============================================================================
 * usePlayers Hook (Business Logic & State for Player Management)
 * ============================================================================
 * Decouples player fetching, group filtering, and CRUD operations from UI screens.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Player } from '../types/player.types';
import {
  getPlayersApi,
  createPlayerApi,
  updatePlayerApi,
  deletePlayerApi,
} from '../services/api/playersApi';

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPlayersApi();
      setPlayers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch players');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const addPlayer = useCallback(
    async (playerData: {
      name: string;
      rating: number;
      primary_position: string;
      secondary_positions?: string[];
      group_name?: string;
    }) => {
      try {
        const created = await createPlayerApi(playerData);
        setPlayers((prev) => [created, ...prev]);
        return created;
      } catch (err: any) {
        throw new Error(err.message || 'Failed to add player');
      }
    },
    []
  );

  const editPlayer = useCallback(
    async (
      id: number | string,
      playerData: {
        name: string;
        rating: number;
        primary_position: string;
        secondary_positions?: string[];
        group_name?: string;
      }
    ) => {
      try {
        const updated = await updatePlayerApi(id, playerData);
        setPlayers((prev) => prev.map((p) => (p.id === id ? updated : p)));
        return updated;
      } catch (err: any) {
        throw new Error(err.message || 'Failed to update player');
      }
    },
    []
  );

  const removePlayer = useCallback(async (id: number | string) => {
    try {
      await deletePlayerApi(id);
      setPlayers((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete player');
    }
  }, []);

  const availableGroups = useMemo(() => {
    const groupsSet = new Set<string>();
    players.forEach((p) => {
      if (p.group_name && p.group_name.trim()) {
        groupsSet.add(p.group_name.trim());
      }
    });
    return ['الكل', ...Array.from(groupsSet)];
  }, [players]);

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      const matchesGroup =
        selectedGroup === 'الكل' || (p.group_name || 'عام') === selectedGroup;
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }, [players, selectedGroup, searchQuery]);

  return {
    players,
    filteredPlayers,
    loading,
    error,
    selectedGroup,
    setSelectedGroup,
    searchQuery,
    setSearchQuery,
    availableGroups,
    fetchPlayers,
    addPlayer,
    editPlayer,
    removePlayer,
  };
}

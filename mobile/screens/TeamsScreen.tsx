/**
 * ============================================================================
 * TeamsScreen (Pure Presentational UI Component)
 * ============================================================================
 * Displays saved teams, kit colors, player roster assignments, and team builders.
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import styles from '../styles';
import { KIT_COLORS } from '../constants/config';
import { getAlphabetTeamCode, getKitEmojiByHex } from '../utils/helpers';
import { SavedTeam } from '../types/team.types';
import { Player } from '../types/player.types';

export interface TeamsScreenProps {
  savedTeams: SavedTeam[];
  fetchSavedTeams: () => void;
  savedPlayers: Player[];
  onCreateTeam: (teamData: any) => Promise<any>;
  onUpdateTeam: (id: number | string, teamData: any) => Promise<any>;
  onDeleteTeam: (id: number | string) => Promise<any>;
  onUseTeamInMatch: (team: SavedTeam, halfSide: 'A' | 'B') => void;
}

export default function TeamsScreen({
  savedTeams,
  fetchSavedTeams,
  savedPlayers,
  onCreateTeam,
  onUpdateTeam,
  onDeleteTeam,
  onUseTeamInMatch,
}: TeamsScreenProps) {
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newTeamColor, setNewTeamColor] = useState<string>('#16A34A');
  const [editingTeamId, setEditingTeamId] = useState<number | string | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<(number | string)[]>([]);
  const [showPlayerPicker, setShowPlayerPicker] = useState<boolean>(false);
  const [playerFilterPos, setPlayerFilterPos] = useState<string>('الكل');
  const [playerFilterGroup, setPlayerFilterGroup] = useState<string>('الكل');
  const [playerSearchQuery, setPlayerSearchQuery] = useState<string>('');

  const nextAutoCode = getAlphabetTeamCode(savedTeams.length);

  const existingGroups = ['الكل', ...Array.from(new Set((savedPlayers || []).map((p) => p.group_name || 'عام')))];

  const togglePlayerSelection = (playerId: number | string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const selectedPlayersList = (savedPlayers || []).filter((p) =>
    selectedPlayerIds.includes(p.id!)
  );
  const gksCount = selectedPlayersList.filter((p) => p.primary_position === 'حارس').length;
  const defsCount = selectedPlayersList.filter((p) => p.primary_position === 'دفاع').length;
  const midsCount = selectedPlayersList.filter((p) => p.primary_position === 'وسط').length;
  const attsCount = selectedPlayersList.filter((p) => p.primary_position === 'هجوم').length;

  const handleSubmit = async () => {
    const chosenPlayers = selectedPlayersList.map((p) => ({
      name: p.name,
      rating: p.rating,
      position: p.primary_position || 'وسط',
      isGoalkeeper: p.primary_position === 'حارس',
    }));

    const defC = Math.max(defsCount, 2);
    const midC = Math.max(midsCount, 2);
    const attC = Math.max(attsCount, 1);

    if (editingTeamId) {
      await onUpdateTeam(editingTeamId, {
        name: newTeamName.trim() || undefined,
        kit_color: newTeamColor,
        defenders_count: defC,
        midfielders_count: midC,
        attackers_count: attC,
        players_data: chosenPlayers,
      });
      setEditingTeamId(null);
    } else {
      await onCreateTeam({
        name: newTeamName.trim(),
        kit_color: newTeamColor,
        defenders_count: defC,
        midfielders_count: midC,
        attackers_count: attC,
        players_data: chosenPlayers,
      });
    }

    setNewTeamName('');
    setSelectedPlayerIds([]);
    setShowPlayerPicker(false);
  };

  const handleEditClick = (team: SavedTeam) => {
    setEditingTeamId(team.id);
    setNewTeamName(team.name);
    setNewTeamColor(team.kit_color || '#16A34A');
    const existingPlayerNames = (team.players_data || []).map((p) => p.name);
    const matchedIds = (savedPlayers || [])
      .filter((p) => existingPlayerNames.includes(p.name))
      .map((p) => p.id!);
    setSelectedPlayerIds(matchedIds);
  };

  const cancelEdit = () => {
    setEditingTeamId(null);
    setNewTeamName('');
    setSelectedPlayerIds([]);
    setShowPlayerPicker(false);
  };

  const filteredPickerPlayers = (savedPlayers || []).filter((p) => {
    const matchPos =
      playerFilterPos === 'الكل' || p.primary_position === playerFilterPos;
    const matchGroup =
      playerFilterGroup === 'الكل' || (p.group_name || 'عام') === playerFilterGroup;
    const matchSearch =
      !playerSearchQuery.trim() ||
      p.name.toLowerCase().includes(playerSearchQuery.trim().toLowerCase());
    return matchPos && matchGroup && matchSearch;
  });

  return (
    <View>
      {/* Create / Edit Team Card */}
      <View style={styles.card}>
        <View style={styles.labelRow}>
          {editingTeamId && (
            <TouchableOpacity onPress={cancelEdit}>
              <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: 'bold' }}>
                ✖ إلغاء التعديل
              </Text>
            </TouchableOpacity>
          )}
          <Text style={styles.sectionHeaderTitle}>
            {editingTeamId ? '✏️ تعديل بيانات الفريق' : '🛡️ إنشاء وتخصيص فريق جديد'}
          </Text>
        </View>

        <Text style={styles.customTeamLabel}>اسم الفريق:</Text>
        <TextInput
          style={styles.customTeamInput}
          placeholder={`مثال: فريق ${nextAutoCode}`}
          value={newTeamName}
          onChangeText={setNewTeamName}
          textAlign="right"
        />

        <Text style={[styles.customTeamLabel, { marginTop: 12 }]}>
          قميص وشعار الفريق ({getKitEmojiByHex(newTeamColor)}):
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPaletteRow}>
          {KIT_COLORS.map((c) => (
            <TouchableOpacity
              key={c.hex}
              style={[
                styles.colorCircle,
                { backgroundColor: c.hex },
                newTeamColor === c.hex && styles.colorCircleSelected,
              ]}
              onPress={() => setNewTeamColor(c.hex)}
            >
              <Text style={{ fontSize: 14 }}>{c.emoji}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Players Selector Toggle */}
        <TouchableOpacity
          style={[styles.saveTeamMiniBtn, { marginTop: 14, alignSelf: 'stretch', alignItems: 'center' }]}
          onPress={() => setShowPlayerPicker(!showPlayerPicker)}
        >
          <Text style={styles.saveTeamMiniBtnText}>
            {showPlayerPicker
              ? '▲ إغلاق قائمة اختيار اللاعبين'
              : `👥 تحديد لاعبي الفريق (${selectedPlayerIds.length} لاعب مختار) ▼`}
          </Text>
        </TouchableOpacity>

        {/* Selected Players Counter */}
        {selectedPlayerIds.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              backgroundColor: '#ECFDF5',
              padding: 8,
              borderRadius: 8,
              marginTop: 8,
              borderWidth: 1,
              borderColor: '#A7F3D0',
            }}
          >
            <Text style={{ fontSize: 11, color: '#065F46' }}>🧤 حراس: {gksCount}</Text>
            <Text style={{ fontSize: 11, color: '#065F46' }}>🛡️ دفاع: {defsCount}</Text>
            <Text style={{ fontSize: 11, color: '#065F46' }}>⚙️ وسط: {midsCount}</Text>
            <Text style={{ fontSize: 11, color: '#065F46' }}>⚔️ هجوم: {attsCount}</Text>
          </View>
        )}

        {/* Player Picker Box */}
        {showPlayerPicker && (
          <View
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 10,
              padding: 10,
              marginTop: 10,
              borderWidth: 1,
              borderColor: '#E2E8F0',
            }}
          >
            <TextInput
              style={[styles.input, { marginVertical: 4, fontSize: 12 }]}
              placeholder="🔍 ابحث عن لاعب بالاسم..."
              value={playerSearchQuery}
              onChangeText={setPlayerSearchQuery}
              textAlign="right"
            />

            {/* Position filter */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: 6 }}>
              {['الكل', 'حارس', 'دفاع', 'وسط', 'هجوم'].map((pos) => (
                <TouchableOpacity
                  key={`pos-${pos}`}
                  style={[
                    styles.posChip,
                    playerFilterPos === pos && styles.posChipPrimaryActive,
                    { paddingHorizontal: 8, paddingVertical: 4 },
                  ]}
                  onPress={() => setPlayerFilterPos(pos)}
                >
                  <Text style={[styles.posChipText, playerFilterPos === pos && styles.posChipTextActive]}>
                    {pos}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Group filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {existingGroups.map((grp) => (
                  <TouchableOpacity
                    key={`grp-${grp}`}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: playerFilterGroup === grp ? '#16A34A' : '#CBD5E1',
                      backgroundColor: playerFilterGroup === grp ? '#DCFCE7' : '#FFFFFF',
                    }}
                    onPress={() => setPlayerFilterGroup(grp)}
                  >
                    <Text style={{ fontSize: 11, color: playerFilterGroup === grp ? '#15803D' : '#64748B' }}>
                      {grp}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Players list */}
            <View style={{ maxHeight: 220 }}>
              <ScrollView nestedScrollEnabled={true}>
                {filteredPickerPlayers.map((p) => {
                  const isSelected = selectedPlayerIds.includes(p.id!);
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 7,
                        paddingHorizontal: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: '#F1F5F9',
                        backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                      }}
                      onPress={() => togglePlayerSelection(p.id!)}
                    >
                      <Text style={{ fontSize: 14 }}>{isSelected ? '✅' : '⬜'}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 11, color: '#64748B' }}>⭐ {p.rating}</Text>
                        <Text style={{ fontSize: 11, color: '#0284C7', fontWeight: 'bold' }}>
                          [{p.primary_position}]
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1E293B' }}>{p.name}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        )}

        <TouchableOpacity style={[styles.primaryButton, { marginTop: 14 }]} onPress={handleSubmit}>
          <Text style={styles.primaryButtonText}>
            {editingTeamId ? '💾 حفظ التعديلات' : '➕ إضافة الفريق'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Saved Teams List */}
      <View style={styles.card}>
        <View style={styles.labelRow}>
          <TouchableOpacity onPress={fetchSavedTeams}>
            <Text style={{ fontSize: 11, color: '#0284C7', fontWeight: 'bold' }}>🔄 تحديث</Text>
          </TouchableOpacity>
          <Text style={styles.sectionHeaderTitle}>🛡️ الفرق المحفوظة ({savedTeams.length})</Text>
        </View>

        {savedTeams.length === 0 ? (
          <Text style={styles.emptyListText}>لا توجد فرق محفوظة بعد.</Text>
        ) : (
          savedTeams.map((team) => {
            const players = team.players_data || [];
            return (
              <View key={team.id} style={styles.savedTeamCard}>
                <View style={styles.savedTeamHeader}>
                  <View style={styles.playerActionsRow}>
                    <TouchableOpacity
                      style={styles.deleteIconBtn}
                      onPress={() =>
                        Alert.alert('حذف الفريق', `هل أنت متأكد من حذف ${team.name}؟`, [
                          { text: 'إلغاء', style: 'cancel' },
                          { text: 'حذف', style: 'destructive', onPress: () => onDeleteTeam(team.id) },
                        ])
                      }
                    >
                      <Text style={{ fontSize: 13 }}>🗑️</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.editIconBtn} onPress={() => handleEditClick(team)}>
                      <Text style={{ fontSize: 13 }}>✏️</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1E293B' }}>
                      {getKitEmojiByHex(team.kit_color || '#16A34A')} {team.name}
                    </Text>
                    <View
                      style={[styles.savedTeamColorBadge, { backgroundColor: team.kit_color || '#16A34A' }]}
                    />
                  </View>
                </View>

                {/* Team Details & Buttons */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginVertical: 6,
                  }}
                >
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={[styles.loadMatchBtn, { paddingHorizontal: 10 }]}
                      onPress={() => onUseTeamInMatch(team, 'B')}
                    >
                      <Text style={styles.loadMatchBtnText}>⬆ نصف الملعب B</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.loadMatchBtn, { paddingHorizontal: 10 }]}
                      onPress={() => onUseTeamInMatch(team, 'A')}
                    >
                      <Text style={styles.loadMatchBtnText}>⬇ نصف الملعب A</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={{ fontSize: 11, color: '#64748B' }}>
                    خطة: {team.defenders_count}-{team.midfielders_count}-{team.attackers_count}
                  </Text>
                </View>

                {/* Player names list if saved */}
                {players && players.length > 0 && (
                  <View
                    style={{
                      backgroundColor: '#F8FAFC',
                      padding: 8,
                      borderRadius: 8,
                      marginTop: 4,
                      borderWidth: 1,
                      borderColor: '#F1F5F9',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: 'bold',
                        color: '#065F46',
                        textAlign: 'right',
                        marginBottom: 4,
                      }}
                    >
                      👥 تشكيلة الفريق ({players.length} لاعب):
                    </Text>
                    <Text style={{ fontSize: 11, color: '#374151', textAlign: 'right', lineHeight: 18 }}>
                      {players
                        .map(
                          (p) =>
                            `${p.isGoalkeeper || p.position === 'حارس' ? '🧤 ' : ''}${p.name} (${p.rating})`
                        )
                        .join('  •  ')}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

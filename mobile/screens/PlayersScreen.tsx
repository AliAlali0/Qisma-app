/**
 * ============================================================================
 * PlayersScreen (Pure Presentational UI Component)
 * ============================================================================
 * Displays registered roster, multi-squad filtering, FUT card modal triggers,
 * and player creation/editing forms.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import styles from '../styles';
import { POSITIONS_LIST } from '../constants/config';
import FutCardModal from '../components/FutCardModal';
import { Player, Position } from '../types/player.types';

export interface PlayersScreenProps {
  editingPlayerId: number | string | null;
  playerRatingInput: string;
  setPlayerRatingInput: (rating: string) => void;
  playerNameInput: string;
  setPlayerNameInput: (name: string) => void;
  primaryPosInput: Position | string;
  secondaryPosInput: (Position | string)[];
  playerGroupInput: string;
  setPlayerGroupInput: (group: string) => void;
  handleSelectPrimaryPosition: (pos: Position | string) => void;
  handleToggleSecondaryPosition: (pos: Position | string) => void;
  resetPlayerForm: () => void;
  handleSavePlayer: () => void;
  savedPlayers: Player[];
  loadingPlayers: boolean;
  fetchSavedPlayers: () => void;
  handleDeletePlayer: (player: Player) => void;
  handleEditPlayerClick: (player: Player) => void;
}

export default function PlayersScreen({
  editingPlayerId,
  playerRatingInput,
  setPlayerRatingInput,
  playerNameInput,
  setPlayerNameInput,
  primaryPosInput,
  secondaryPosInput,
  playerGroupInput,
  setPlayerGroupInput,
  handleSelectPrimaryPosition,
  handleToggleSecondaryPosition,
  resetPlayerForm,
  handleSavePlayer,
  savedPlayers,
  loadingPlayers,
  fetchSavedPlayers,
  handleDeletePlayer,
  handleEditPlayerClick,
}: PlayersScreenProps) {
  const [futModalPlayer, setFutModalPlayer] = useState<Player | null>(null);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add group modal state
  const [addGroupModalVisible, setAddGroupModalVisible] = useState<boolean>(false);
  const [newGroupInputText, setNewGroupInputText] = useState<string>('');
  const [customGroups, setCustomGroups] = useState<string[]>([]);

  // Unique groups list
  const allExistingGroups = Array.from(
    new Set([
      'عام',
      '⚽ تمرين الحارة',
      '🏢 قروب الدوام',
      '🏆 دوري الاستراحة',
      ...customGroups,
      ...(savedPlayers || []).map((p) => p.group_name || 'عام'),
    ])
  );

  const groupFiltersList = ['الكل', ...allExistingGroups];

  const handleAddNewGroup = () => {
    if (!newGroupInputText || !newGroupInputText.trim()) {
      Alert.alert('تنبيه', 'الرجاء كتابة اسم المجموعة أولاً');
      return;
    }
    const cleanGroup = newGroupInputText.trim();
    if (!customGroups.includes(cleanGroup)) {
      setCustomGroups((prev) => [...prev, cleanGroup]);
    }
    setPlayerGroupInput(cleanGroup);
    setSelectedGroupFilter(cleanGroup);
    setNewGroupInputText('');
    setAddGroupModalVisible(false);
  };

  const filteredPlayers = (savedPlayers || []).filter((p) => {
    const pGroup = p.group_name || 'عام';
    const matchesGroup = selectedGroupFilter === 'الكل' || pGroup === selectedGroupFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matchesGroup && matchesSearch;
  });

  return (
    <View>
      {/* FUT Card Modal */}
      <FutCardModal
        visible={Boolean(futModalPlayer)}
        player={futModalPlayer}
        onClose={() => setFutModalPlayer(null)}
      />

      {/* Add New Group Modal */}
      <Modal
        visible={addGroupModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAddGroupModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentCard, { maxWidth: 360 }]}>
            <Text style={[styles.modalTitle, { fontSize: 18, marginBottom: 6 }]}>
              ➕ إضافة مجموعة / تمرين جديد
            </Text>
            <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginBottom: 16 }}>
              أنشئ مجموعة لتصنيف اللاعبين حسب تمارينك (مثلاً: تمرين الأربعاء، أصحاب العمل، دوري الحارة)
            </Text>

            <TextInput
              style={[
                styles.input,
                { textAlign: 'right', fontSize: 14, backgroundColor: '#F8FAFC', marginBottom: 14 },
              ]}
              placeholder="اكتب اسم المجموعة (مثال: 🔥 كلاسيكو الجمعة)"
              value={newGroupInputText}
              onChangeText={setNewGroupInputText}
              autoFocus={true}
            />

            {/* Quick emoji presets */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 18 }}>
              {['⚽', '🏢', '🔥', '🏆', '👟'].map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={{
                    backgroundColor: '#F1F5F9',
                    padding: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#CBD5E1',
                  }}
                  onPress={() => setNewGroupInputText((prev) => `${emoji} ${prev.replace(/^[^\w\s\u0600-\u06FF]+/g, '').trim()}`)}
                >
                  <Text style={{ fontSize: 16 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.modalCloseButton, { flex: 1, backgroundColor: '#E2E8F0' }]}
                onPress={() => setAddGroupModalVisible(false)}
              >
                <Text style={[styles.modalCloseButtonText, { color: '#475569' }]}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1, marginTop: 0 }]}
                onPress={handleAddNewGroup}
              >
                <Text style={styles.primaryButtonText}>✓ حفظ المجموعة</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add / Edit Player Card */}
      <View style={styles.card}>
        <View style={styles.labelRow}>
          {editingPlayerId && (
            <TouchableOpacity onPress={resetPlayerForm}>
              <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: 'bold' }}>
                ✖ إلغاء التعديل
              </Text>
            </TouchableOpacity>
          )}
          <Text style={styles.sectionHeaderTitle}>
            {editingPlayerId ? '✏️ تعديل بيانات اللاعب' : '➕ إضافة لاعب جديد للقائمة'}
          </Text>
        </View>

        <Text style={styles.label}>اسم اللاعب:</Text>
        <TextInput
          style={styles.input}
          placeholder="أدخل اسم اللاعب"
          value={playerNameInput}
          onChangeText={setPlayerNameInput}
          textAlign="right"
        />

        {/* Group Selector */}
        <View style={{ marginTop: 8, marginBottom: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <TouchableOpacity onPress={() => setAddGroupModalVisible(true)}>
              <Text style={{ fontSize: 11, color: '#0284C7', fontWeight: 'bold' }}>
                ➕ مجموعة جديدة
              </Text>
            </TouchableOpacity>
            <Text style={styles.label}>👥 مجموعة / تمرين اللاعب:</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
            <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 2 }}>
              {allExistingGroups.map((grp) => {
                const isSelected = (playerGroupInput || 'عام') === grp;
                return (
                  <TouchableOpacity
                    key={grp}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: isSelected ? '#16A34A' : '#CBD5E1',
                      backgroundColor: isSelected ? '#DCFCE7' : '#F8FAFC',
                    }}
                    onPress={() => setPlayerGroupInput(grp)}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: isSelected ? 'bold' : 'normal',
                        color: isSelected ? '#15803D' : '#475569',
                      }}
                    >
                      {grp}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <Text style={styles.label}>التقييم (Rating) من 40 إلى 99:</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: 85"
          keyboardType="numeric"
          value={playerRatingInput}
          onChangeText={setPlayerRatingInput}
          maxLength={2}
          textAlign="right"
        />

        <Text style={styles.label}>المركز الأساسي (إجباري):</Text>
        <View style={styles.positionsSelectorRow}>
          {POSITIONS_LIST.map((pos) => {
            const isSelected = primaryPosInput === pos;
            return (
              <TouchableOpacity
                key={`primary-${pos}`}
                style={[styles.posChip, isSelected && styles.posChipPrimaryActive]}
                onPress={() => handleSelectPrimaryPosition(pos)}
              >
                <Text style={[styles.posChipText, isSelected && styles.posChipTextActive]}>
                  {pos}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { marginTop: 10 }]}>المراكز الاحتياطية (اختياري):</Text>
        <View style={styles.positionsSelectorRow}>
          {POSITIONS_LIST.map((pos) => {
            const isSelected = secondaryPosInput.includes(pos);
            const isPrimary = primaryPosInput === pos;
            return (
              <TouchableOpacity
                key={`sec-${pos}`}
                disabled={isPrimary}
                style={[
                  styles.posChip,
                  isSelected && styles.posChipSecondaryActive,
                  isPrimary && styles.posChipDisabled,
                ]}
                onPress={() => handleToggleSecondaryPosition(pos)}
              >
                <Text
                  style={[
                    styles.posChipText,
                    isSelected && styles.posChipTextActive,
                    isPrimary && { color: '#9CA3AF' },
                  ]}
                >
                  {pos}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleSavePlayer}>
          <Text style={styles.primaryButtonText}>
            {editingPlayerId ? '💾 حفظ التعديلات' : '➕ إضافة اللاعب'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Roster & Squad Filter */}
      <View style={styles.card}>
        <View style={styles.labelRow}>
          <TouchableOpacity onPress={fetchSavedPlayers}>
            <Text style={{ fontSize: 11, color: '#0284C7', fontWeight: 'bold' }}>🔄 تحديث</Text>
          </TouchableOpacity>
          <Text style={styles.sectionHeaderTitle}>
            👥 قائمة اللاعبين المحفوظين ({filteredPlayers.length} من {savedPlayers.length})
          </Text>
        </View>

        {/* Search Bar */}
        <TextInput
          style={[styles.input, { marginVertical: 6, fontSize: 13 }]}
          placeholder="🔍 ابحث عن لاعب بالاسم..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          textAlign="right"
        />

        {/* Group Filter Chips */}
        <View style={{ marginBottom: 10 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
            <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 2 }}>
              {groupFiltersList.map((grp) => {
                const isSelected = selectedGroupFilter === grp;
                return (
                  <TouchableOpacity
                    key={`filter-${grp}`}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: isSelected ? '#0284C7' : '#E2E8F0',
                      backgroundColor: isSelected ? '#E0F2FE' : '#F8FAFC',
                    }}
                    onPress={() => setSelectedGroupFilter(grp)}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: isSelected ? 'bold' : 'normal',
                        color: isSelected ? '#0369A1' : '#64748B',
                      }}
                    >
                      {grp}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {loadingPlayers ? (
          <ActivityIndicator color="#1B4332" size="small" style={{ marginVertical: 15 }} />
        ) : filteredPlayers.length === 0 ? (
          <Text style={styles.emptyListText}>لا يوجد لاعبين مطابقين للبحث أو الفلتر.</Text>
        ) : (
          filteredPlayers.map((p) => (
            <View key={p.id} style={styles.savedPlayerCard}>
              <View style={styles.playerActionsRow}>
                <TouchableOpacity
                  style={styles.deleteIconBtn}
                  onPress={() => handleDeletePlayer(p)}
                >
                  <Text style={{ fontSize: 13 }}>🗑️</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.editIconBtn}
                  onPress={() => handleEditPlayerClick(p)}
                >
                  <Text style={{ fontSize: 13 }}>✏️</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.futCardIconBtn}
                  onPress={() => setFutModalPlayer(p)}
                >
                  <Text style={styles.futCardIconBtnText}>🎴 بطاقة FUT</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.savedPlayerPosBadge}>{p.primary_position}</Text>
                  <Text style={styles.savedPlayerName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>⭐ {p.rating}</Text>
                  </View>
                </View>

                {/* Group Badge and Secondary Positions */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <View
                    style={{
                      backgroundColor: p.group_name && p.group_name !== 'عام' ? '#E0F2FE' : '#F1F5F9',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: p.group_name && p.group_name !== 'عام' ? '#7DD3FC' : '#E2E8F0',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: 'bold',
                        color: p.group_name && p.group_name !== 'عام' ? '#0369A1' : '#64748B',
                      }}
                    >
                      🏷️ {p.group_name || 'عام'}
                    </Text>
                  </View>

                  {Array.isArray(p.secondary_positions) && p.secondary_positions.length > 0 && (
                    <Text style={styles.secondaryPositionsSubtext}>
                      🔄 احتياطي: {p.secondary_positions.join(' ، ')}
                    </Text>
                  )}
                </View>

                <View style={styles.playerStatsBadgesRow}>
                  <Text style={styles.playerStatMiniBadge}>🎮 لعب: {p.matches_played || 0}</Text>
                  <Text style={styles.playerStatMiniBadge}>🏆 فوز: {p.wins || 0}</Text>
                  <Text style={[styles.playerStatMiniBadge, { color: '#B45309' }]}>
                    🌟 MVP: {p.mvp_count || 0}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

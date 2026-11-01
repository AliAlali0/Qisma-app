import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import styles from '../styles';
import { POSITIONS_LIST } from '../constants/config';

export default function PlayersScreen({
  editingPlayerId,
  playerRatingInput,
  setPlayerRatingInput,
  playerNameInput,
  setPlayerNameInput,
  primaryPosInput,
  secondaryPosInput,
  handleSelectPrimaryPosition,
  handleToggleSecondaryPosition,
  resetPlayerForm,
  handleSavePlayer,
  savedPlayers,
  loadingPlayers,
  fetchSavedPlayers,
  handleDeletePlayer,
  handleEditPlayerClick,
}) {
  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.sectionHeaderTitle}>
          {editingPlayerId ? '✏️ تعديل بيانات اللاعب' : '➕ إضافة لاعب جديد للسجل'}
        </Text>

        <View style={styles.formRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.customTeamLabel}>⭐ التقييم (40-99):</Text>
            <TextInput
              style={styles.customTeamInput}
              keyboardType="numeric"
              maxLength={2}
              value={playerRatingInput}
              onChangeText={setPlayerRatingInput}
              textAlign="center"
            />
          </View>

          <View style={{ flex: 2.5 }}>
            <Text style={styles.customTeamLabel}>👤 اسم اللاعب:</Text>
            <TextInput
              style={styles.customTeamInput}
              placeholder="مثال: أحمد الصليح"
              placeholderTextColor="#999"
              value={playerNameInput}
              onChangeText={setPlayerNameInput}
              textAlign="right"
            />
          </View>
        </View>

        <Text style={styles.customTeamLabel}>🎯 المركز الأساسي (اختر واحداً):</Text>
        <View style={styles.positionsSelectorRow}>
          {POSITIONS_LIST.map((pos) => {
            const isSelected = primaryPosInput === pos;
            return (
              <TouchableOpacity
                key={`prim-${pos}`}
                style={[styles.posChip, isSelected && styles.posChipPrimaryActive]}
                onPress={() => handleSelectPrimaryPosition(pos)}
              >
                <Text style={[styles.posChipText, isSelected && styles.posChipTextActive]}>
                  {pos === 'حارس' ? '🧤 ' : ''}
                  {pos}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.customTeamLabel}>
          🔄 المراكز الاحتياطية (يمكنك اختيار أكثر من مركز):
        </Text>
        <View style={styles.positionsSelectorRow}>
          {POSITIONS_LIST.map((pos) => {
            const isPrimary = primaryPosInput === pos;
            const isSelected = secondaryPosInput.includes(pos);
            return (
              <TouchableOpacity
                key={`sec-${pos}`}
                disabled={isPrimary}
                style={[
                  styles.posChip,
                  isSelected && styles.posChipSecondaryActive,
                  isPrimary && { opacity: 0.35 },
                ]}
                onPress={() => handleToggleSecondaryPosition(pos)}
              >
                <Text
                  style={[
                    styles.posChipText,
                    isSelected && styles.posChipTextSecondaryActive,
                  ]}
                >
                  {isSelected ? '✓ ' : '+ '}
                  {pos}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.buttonRow}>
          {editingPlayerId && (
            <TouchableOpacity style={styles.clearButton} onPress={resetPlayerForm}>
              <Text style={styles.clearButtonText}>إلغاء</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.primaryButton} onPress={handleSavePlayer}>
            <Text style={styles.primaryButtonText}>
              {editingPlayerId ? '💾 حفظ التعديلات' : '➕ حفظ اللاعب في الداتابيس'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.labelRow}>
          <TouchableOpacity onPress={fetchSavedPlayers}>
            <Text style={{ fontSize: 11, color: '#0284C7', fontWeight: 'bold' }}>🔄 تحديث</Text>
          </TouchableOpacity>
          <Text style={styles.sectionHeaderTitle}>
            📋 سجل اللاعبين وإحصائياتهم ({savedPlayers.length})
          </Text>
        </View>

        {loadingPlayers ? (
          <ActivityIndicator color="#1B4332" size="small" style={{ marginVertical: 15 }} />
        ) : savedPlayers.length === 0 ? (
          <Text style={styles.emptyListText}>لا يوجد لاعبون محفوظون حالياً.</Text>
        ) : (
          savedPlayers.map((p) => (
            <View key={p.id} style={styles.savedPlayerItem}>
              <View style={styles.savedPlayerActions}>
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
              </View>

              <View style={styles.savedPlayerDetails}>
                <View style={styles.savedPlayerHeaderLine}>
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>أساسي: {p.primary_position}</Text>
                  </View>
                  <Text style={styles.savedPlayerName}>
                    {p.primary_position === 'حارس' ? '🧤 ' : ''}
                    {p.name}
                  </Text>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>⭐ {p.rating}</Text>
                  </View>
                </View>

                {Array.isArray(p.secondary_positions) && p.secondary_positions.length > 0 && (
                  <Text style={styles.secondaryPositionsSubtext}>
                    🔄 احتياطي: {p.secondary_positions.join(' ، ')}
                  </Text>
                )}

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
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import styles from '../styles';
import { POSITIONS_LIST } from '../constants/config';
import FutCardModal from '../components/FutCardModal';

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
}) {
  const [futModalPlayer, setFutModalPlayer] = useState(null);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');

  // استخراج قائمة المجموعات الفريدة من اللاعبين المسجلين
  const existingGroups = Array.from(
    new Set((savedPlayers || []).map((p) => p.group_name || 'عام'))
  );
  const groupFiltersList = ['الكل', ...existingGroups];

  const commonGroupSuggestions = ['عام', '⚽ تمرين الحارة', '🏢 قروب الدوام', '🏆 دوري الاستراحة'];

  // تصفية اللاعبين بحسب المجموعة والبحث
  const filteredPlayers = (savedPlayers || []).filter((p) => {
    const playerGroup = p.group_name || 'عام';
    const matchesGroup =
      selectedGroupFilter === 'الكل' || playerGroup === selectedGroupFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matchesGroup && matchesSearch;
  });

  return (
    <View>
      {/* مودال بطاقة فيفا FUT التفاعلية */}
      <FutCardModal
        visible={!!futModalPlayer}
        player={futModalPlayer}
        onClose={() => setFutModalPlayer(null)}
      />

      {/* نموذج إضافة أو تعديل لاعب */}
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

        {/* تحديد المجموعة / التمرين (Feature 6) */}
        <View style={{ marginTop: 6, marginBottom: 8 }}>
          <Text style={styles.customTeamLabel}>
            🏷️ المجموعة / التمرين (لتصنيف اللاعبين):
          </Text>
          <TextInput
            style={[styles.customTeamInput, { marginBottom: 6 }]}
            placeholder="مثال: تمرين الحارة أو قروب الدوام (أو اتركه عام)"
            placeholderTextColor="#999"
            value={playerGroupInput}
            onChangeText={setPlayerGroupInput}
            textAlign="right"
          />

          {/* وسوم اقتراحات سريعة للمجموعات */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
            {commonGroupSuggestions.map((sug) => (
              <TouchableOpacity
                key={`sug-${sug}`}
                style={{
                  backgroundColor: playerGroupInput === sug ? '#0F766E' : '#F1F5F9',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: playerGroupInput === sug ? '#0F766E' : '#CBD5E1',
                }}
                onPress={() => setPlayerGroupInput(sug)}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: 'bold',
                    color: playerGroupInput === sug ? '#FFFFFF' : '#475569',
                  }}
                >
                  {sug}
                </Text>
              </TouchableOpacity>
            ))}
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

      {/* سجل اللاعبين مع فلترة المجموعات وبطاقات FUT */}
      <View style={styles.card}>
        <View style={styles.labelRow}>
          <TouchableOpacity onPress={fetchSavedPlayers}>
            <Text style={{ fontSize: 11, color: '#0284C7', fontWeight: 'bold' }}>🔄 تحديث</Text>
          </TouchableOpacity>
          <Text style={styles.sectionHeaderTitle}>
            📋 سجل اللاعبين ({filteredPlayers.length} من {savedPlayers.length})
          </Text>
        </View>

        {/* شريط فلترة المجموعات المتعددة (Feature 6) */}
        <View style={{ marginVertical: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#475569', textAlign: 'right', marginBottom: 4 }}>
            🎯 اختر المجموعة لعرض لاعبيها:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {groupFiltersList.map((grp) => {
              const isActive = selectedGroupFilter === grp;
              return (
                <TouchableOpacity
                  key={`grp-filter-${grp}`}
                  style={{
                    backgroundColor: isActive ? '#0284C7' : '#F1F5F9',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: isActive ? '#0284C7' : '#CBD5E1',
                  }}
                  onPress={() => setSelectedGroupFilter(grp)}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: 'bold',
                      color: isActive ? '#FFFFFF' : '#334155',
                    }}
                  >
                    {grp === 'الكل' ? '🌐 كل المجموعات' : `🏷️ ${grp}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* بحث بالاسم */}
        <TextInput
          style={[styles.customTeamInput, { marginBottom: 10, backgroundColor: '#F8FAFC' }]}
          placeholder="🔍 ابحث عن اسم اللاعب..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          textAlign="right"
        />

        {loadingPlayers ? (
          <ActivityIndicator color="#1B4332" size="small" style={{ marginVertical: 15 }} />
        ) : filteredPlayers.length === 0 ? (
          <Text style={styles.emptyListText}>لا يوجد لاعبون مطابقون للاختيار.</Text>
        ) : (
          filteredPlayers.map((p) => (
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

                {/* زر بطاقة فيفا FUT التفاعلية (Feature 5) */}
                <TouchableOpacity
                  style={{
                    backgroundColor: '#FEF08A',
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: '#F59E0B',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                  }}
                  onPress={() => setFutModalPlayer(p)}
                >
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#78350F' }}>
                    🎴 FUT
                  </Text>
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

                {/* وسم المجموعة والمراكز الاحتياطية */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  {p.group_name && p.group_name !== 'عام' && (
                    <View
                      style={{
                        backgroundColor: '#E0F2FE',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                      }}
                    >
                      <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#0369A1' }}>
                        🏷️ {p.group_name}
                      </Text>
                    </View>
                  )}
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

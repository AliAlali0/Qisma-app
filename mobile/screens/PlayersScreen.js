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

  // نافذة إضافة مجموعة جديدة
  const [addGroupModalVisible, setAddGroupModalVisible] = useState(false);
  const [newGroupInputText, setNewGroupInputText] = useState('');
  const [customGroups, setCustomGroups] = useState([]);

  // قائمة بجميع المجموعات الفريدة (الافتراضية + المضافة يدوياً + من قاعدة البيانات)
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

  // اعتماد إضافة مجموعة جديدة
  const handleAddNewGroup = () => {
    const trimmed = newGroupInputText.trim();
    if (!trimmed) {
      Alert.alert('تنبيه', 'يرجى كتابة اسم للمجموعة أولاً');
      return;
    }
    if (!customGroups.includes(trimmed)) {
      setCustomGroups((prev) => [...prev, trimmed]);
    }
    setPlayerGroupInput(trimmed);
    setSelectedGroupFilter(trimmed);
    setNewGroupInputText('');
    setAddGroupModalVisible(false);
  };

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

      {/* مودال إنشاء مجموعة / تمرين جديد */}
      <Modal
        visible={addGroupModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddGroupModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: 320 }]}>
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity onPress={() => setAddGroupModalVisible(false)}>
                <Text style={styles.modalCloseText}>✖ إغلاق</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>🏷️ إضافة مجموعة جديدة</Text>
            </View>

            <Text style={{ fontSize: 11, color: '#4B5563', textAlign: 'right', marginBottom: 8 }}>
              أنشئ اسماً لمجموعتك أو تمرينك لتصنيف اللاعبين وفلترتهم بكل سهولة:
            </Text>

            <TextInput
              style={[styles.customTeamInput, { marginBottom: 8, backgroundColor: '#F8FAFC' }]}
              placeholder="مثال: تمرين الأربعاء أو شباب الحارة..."
              placeholderTextColor="#999"
              value={newGroupInputText}
              onChangeText={setNewGroupInputText}
              textAlign="right"
              autoFocus
            />

            {/* إيموجيات سريعة للاختيار المباشر */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 6, marginBottom: 12 }}>
              {['⚽', '🏢', '🏆', '🌟', '🛡️', '🔥'].map((em) => (
                <TouchableOpacity
                  key={`em-${em}`}
                  style={{
                    backgroundColor: '#F1F5F9',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: '#CBD5E1',
                  }}
                  onPress={() => setNewGroupInputText((prev) => `${em} ${prev.replace(/^[^\s]+\s*/, '')}`)}
                >
                  <Text style={{ fontSize: 14 }}>{em}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setNewGroupInputText('');
                  setAddGroupModalVisible(false);
                }}
              >
                <Text style={styles.clearButtonText}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryButton} onPress={handleAddNewGroup}>
                <Text style={styles.primaryButtonText}>➕ إضافة واعتماد المجموعة</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

        {/* تحديد واختيار المجموعة / التمرين مع زر إضافة مجموعة */}
        <View style={{ marginTop: 6, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#0F766E',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
              }}
              onPress={() => setAddGroupModalVisible(true)}
            >
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FFFFFF' }}>
                ➕ مجموعة جديدة
              </Text>
            </TouchableOpacity>

            <Text style={styles.customTeamLabel}>
              🏷️ المجموعة / التمرين (لتصنيف اللاعبين):
            </Text>
          </View>

          <TextInput
            style={[styles.customTeamInput, { marginBottom: 6 }]}
            placeholder="اكتب اسم المجموعة أو اختر من القائمة أدناه..."
            placeholderTextColor="#999"
            value={playerGroupInput}
            onChangeText={setPlayerGroupInput}
            textAlign="right"
          />

          {/* وسوم المجموعات المتاحة للاختيار السريع */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
          >
            {allExistingGroups.map((grp) => {
              const isSelected = (playerGroupInput || 'عام').trim() === grp;
              return (
                <TouchableOpacity
                  key={`form-grp-${grp}`}
                  style={{
                    backgroundColor: isSelected ? '#0F766E' : '#F1F5F9',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderColor: isSelected ? '#0F766E' : '#CBD5E1',
                  }}
                  onPress={() => setPlayerGroupInput(grp)}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: 'bold',
                      color: isSelected ? '#FFFFFF' : '#475569',
                    }}
                  >
                    {isSelected ? '✓ ' : ''}{grp}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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

        {/* شريط فلترة المجموعات مع زر إضافة مجموعة جديدة */}
        <View style={{ marginVertical: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#0F766E',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
              }}
              onPress={() => setAddGroupModalVisible(true)}
            >
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#FFFFFF' }}>
                ➕ مجموعة جديدة
              </Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#475569', textAlign: 'right' }}>
              🎯 اختر المجموعة لعرض لاعبيها:
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {groupFiltersList.map((grp) => {
              const isActive = selectedGroupFilter === grp;
              const count =
                grp === 'الكل'
                  ? savedPlayers.length
                  : savedPlayers.filter((p) => (p.group_name || 'عام') === grp).length;

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
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
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
                  {count > 0 && (
                    <View
                      style={{
                        backgroundColor: isActive ? '#FFFFFF' : '#CBD5E1',
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: 'bold',
                          color: isActive ? '#0284C7' : '#334155',
                        }}
                      >
                        {count}
                      </Text>
                    </View>
                  )}
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

                {/* زر بطاقة فيفا FUT التفاعلية */}
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

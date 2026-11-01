import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import styles from '../styles';
import { KIT_COLORS } from '../constants/config';
import { getAlphabetTeamCode, getKitEmojiByHex } from '../utils/helpers';

export default function TeamsScreen({
  savedTeams,
  fetchSavedTeams,
  savedPlayers,
  onCreateTeam,
  onUpdateTeam,
  onDeleteTeam,
  onUseTeamInMatch,
}) {
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#16A34A');
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [playerFilterPos, setPlayerFilterPos] = useState('الكل');
  const [playerFilterGroup, setPlayerFilterGroup] = useState('الكل');
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');

  const nextAutoCode = getAlphabetTeamCode(savedTeams.length);

  const existingGroups = ['الكل', ...new Set((savedPlayers || []).map((p) => p.group_name || 'عام'))];

  const togglePlayerSelection = (playerId) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  // إحصائيات اللاعبين المحددين للفريق حالياً
  const selectedPlayersList = (savedPlayers || []).filter((p) =>
    selectedPlayerIds.includes(p.id)
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

    // حساب أعداد المراكز تلقائياً بحسب اللاعبين المختارين
    const defC = Math.max(defsCount, 2);
    const midC = Math.max(midsCount, 2);
    const attC = Math.max(attsCount, 1);

    if (editingTeamId) {
      await onUpdateTeam(editingTeamId, {
        name: newTeamName.trim() || `فريق ${nextAutoCode}`,
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
    setPlayerSearchQuery('');
  };

  // نافذة تأكيد وتحديد موقع الفريق في الملعب (A أو B)
  const handleAssignToPitchPrompt = (team) => {
    Alert.alert(
      '🏟️ تعيين الفريق في الملعب',
      `اختر الخانة التي ترغب بتعيين "${team.name}" فيها:`,
      [
        {
          text: '🟢 الفريق الأول (A - أسفل)',
          onPress: () => onUseTeamInMatch(team, 'A'),
        },
        {
          text: '🔵 الفريق الثاني (B - أعلى)',
          onPress: () => onUseTeamInMatch(team, 'B'),
        },
        {
          text: 'إلغاء',
          style: 'cancel',
        },
      ]
    );
  };

  // فلترة قائمة اللاعبين للاختيار
  const filteredPlayers = (savedPlayers || []).filter((p) => {
    const matchesGroup =
      playerFilterGroup === 'الكل' || (p.group_name || 'عام') === playerFilterGroup;
    const matchesPos =
      playerFilterPos === 'الكل' || p.primary_position === playerFilterPos;
    const matchesSearch =
      !playerSearchQuery.trim() ||
      p.name.toLowerCase().includes(playerSearchQuery.trim().toLowerCase());
    return matchesGroup && matchesPos && matchesSearch;
  });

  return (
    <View>
      {/* نموذج إنشاء أو تعديل فريق */}
      <View style={styles.card}>
        <Text style={styles.sectionHeaderTitle}>
          {editingTeamId ? '✏️ تعديل بيانات الفريق' : '🛡️ إنشاء فريق جديد'}
        </Text>

        <Text style={styles.customTeamLabel}>
          🏷️ اسم الفريق (اتركه فارغاً ليُسمى تلقائياً: "فريق {nextAutoCode}"):
        </Text>
        <TextInput
          style={[styles.customTeamInput, { marginBottom: 10 }]}
          placeholder={`مثال: فريق الصقور (أو اتركه فارغاً لـ فريق ${nextAutoCode})`}
          placeholderTextColor="#999"
          value={newTeamName}
          onChangeText={setNewTeamName}
          textAlign="right"
        />

        <Text style={styles.customTeamLabel}>🎨 لون طقم الفريق:</Text>
        <View style={[styles.colorSwatchesRow, { justifyContent: 'flex-end', marginVertical: 8 }]}>
          {KIT_COLORS.map((c) => (
            <TouchableOpacity
              key={`team-scr-${c.hex}`}
              style={[
                styles.colorSwatchCircle,
                { backgroundColor: c.hex, width: 28, height: 28, borderRadius: 14 },
                newTeamColor === c.hex && styles.colorSwatchActive,
              ]}
              onPress={() => setNewTeamColor(c.hex)}
            />
          ))}
        </View>

        {/* ملخص وزر اختيار اللاعبين يدوياً */}
        <View style={{ marginTop: 10, marginBottom: 4 }}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor: showPlayerPicker ? '#0284C7' : '#0F766E',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
              },
            ]}
            onPress={() => setShowPlayerPicker(!showPlayerPicker)}
          >
            <Text style={styles.primaryButtonText}>
              👥 {showPlayerPicker ? 'إغلاق قائمة الاختيار ▲' : 'اختر تشكيلة اللاعبين يدوياً ▼'}
            </Text>
            {selectedPlayerIds.length > 0 && (
              <View
                style={{
                  backgroundColor: '#FEF08A',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1F2937' }}>
                  {selectedPlayerIds.length} لاعب
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* شريط الإحصائيات السريعة للتشكيلة المختارة */}
          {selectedPlayerIds.length > 0 && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                backgroundColor: '#ECFDF5',
                padding: 8,
                borderRadius: 8,
                marginTop: 6,
                borderWidth: 1,
                borderColor: '#A7F3D0',
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#065F46' }}>
                🧤 حراس: {gksCount}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#065F46' }}>
                🛡️ دفاع: {defsCount}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#065F46' }}>
                ⚙️ وسط: {midsCount}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#065F46' }}>
                ⚔️ هجوم: {attsCount}
              </Text>
            </View>
          )}
        </View>

        {/* قائمة اختيار اللاعبين اليدوية */}
        {showPlayerPicker && (
          <View
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 12,
              padding: 12,
              marginTop: 8,
              borderWidth: 1,
              borderColor: '#CBD5E1',
            }}
          >
            {/* بحث عن لاعب */}
            <TextInput
              style={[styles.customTeamInput, { marginBottom: 8, backgroundColor: '#FFFFFF' }]}
              placeholder="🔍 ابحث عن اسم اللاعب..."
              placeholderTextColor="#999"
              value={playerSearchQuery}
              onChangeText={setPlayerSearchQuery}
              textAlign="right"
            />

            {/* فلترة بحسب المجموعة إن وُجد أكثر من مجموعة */}
            {existingGroups.length > 2 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 8 }}
                contentContainerStyle={{ gap: 6 }}
              >
                {existingGroups.map((grp) => {
                  const isActive = playerFilterGroup === grp;
                  return (
                    <TouchableOpacity
                      key={`team-grp-${grp}`}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        backgroundColor: isActive ? '#0284C7' : '#F1F5F9',
                        borderWidth: 1,
                        borderColor: isActive ? '#0284C7' : '#CBD5E1',
                      }}
                      onPress={() => setPlayerFilterGroup(grp)}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: 'bold',
                          color: isActive ? '#FFFFFF' : '#475569',
                        }}
                      >
                        {grp === 'الكل' ? '🌐 كل المجموعات' : `🏷️ ${grp}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* أزرار فلترة المراكز + أزرار تحديد الكل */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    const allIds = (savedPlayers || []).map((p) => p.id);
                    if (selectedPlayerIds.length === allIds.length) {
                      setSelectedPlayerIds([]);
                    } else {
                      setSelectedPlayerIds(allIds);
                    }
                  }}
                >
                  <Text style={{ fontSize: 11, color: '#0284C7', fontWeight: 'bold' }}>
                    {selectedPlayerIds.length === (savedPlayers || []).length
                      ? '❌ إلغاء تحديد الكل'
                      : '✅ تحديد الكل'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', gap: 4 }}>
                {['الكل', 'حارس', 'دفاع', 'وسط', 'هجوم'].map((pos) => (
                  <TouchableOpacity
                    key={`pos-filter-${pos}`}
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor: playerFilterPos === pos ? '#0F766E' : '#E2E8F0',
                    }}
                    onPress={() => setPlayerFilterPos(pos)}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: 'bold',
                        color: playerFilterPos === pos ? '#FFFFFF' : '#475569',
                      }}
                    >
                      {pos}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* لستة اللاعبين للاختيار بالنقر */}
            <ScrollView nestedScrollEnabled style={{ maxHeight: 220 }}>
              {!savedPlayers || savedPlayers.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12, padding: 12 }}>
                  لا يوجد لاعبون مسجلون. يمكنك إضافة لاعبين من شاشة "👥 اللاعبين" أولاً.
                </Text>
              ) : filteredPlayers.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12, padding: 12 }}>
                  لا يوجد لاعب مطابق للبحث.
                </Text>
              ) : (
                filteredPlayers.map((p) => {
                  const isSelected = selectedPlayerIds.includes(p.id);
                  const isGk = p.primary_position === 'حارس';
                  return (
                    <TouchableOpacity
                      key={p.id}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        backgroundColor: isSelected ? '#E0F2FE' : '#FFFFFF',
                        borderRadius: 8,
                        marginBottom: 5,
                        borderWidth: 1.5,
                        borderColor: isSelected ? '#0284C7' : '#E2E8F0',
                      }}
                      onPress={() => togglePlayerSelection(p.id)}
                    >
                      <Text style={{ fontSize: 16 }}>{isSelected ? '☑️' : '⬜'}</Text>
                      <View style={{ flex: 1, alignItems: 'flex-end', marginRight: 10 }}>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1E293B' }}>
                          {isGk ? '🧤 ' : ''}{p.name}
                        </Text>
                        <Text style={{ fontSize: 10, color: '#64748B' }}>
                          {p.primary_position || 'وسط'} • ⭐ {p.rating}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        )}

        <View style={styles.buttonRow}>
          {editingTeamId && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setEditingTeamId(null);
                setNewTeamName('');
                setSelectedPlayerIds([]);
                setShowPlayerPicker(false);
                setPlayerSearchQuery('');
              }}
            >
              <Text style={styles.clearButtonText}>إلغاء</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
            <Text style={styles.primaryButtonText}>
              {editingTeamId
                ? '💾 حفظ تعديل الفريق'
                : `➕ إضافة الفريق (${newTeamName.trim() || `فريق ${nextAutoCode}`})`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* قائمة الأفرقة المحفوظة وأفرقة البطولات */}
      <View style={styles.card}>
        <View style={styles.labelRow}>
          <TouchableOpacity onPress={fetchSavedTeams}>
            <Text style={{ fontSize: 11, color: '#0284C7', fontWeight: 'bold' }}>🔄 تحديث</Text>
          </TouchableOpacity>
          <Text style={styles.sectionHeaderTitle}>
            🛡️ جميع الأفرقة المحفوظة ({savedTeams.length})
          </Text>
        </View>

        {savedTeams.length === 0 ? (
          <Text style={styles.emptyListText}>لا توجد أفرقة محفوظة حالياً.</Text>
        ) : (
          savedTeams.map((t) => {
            // استخراج آمن لقائمة لاعبي الفريق سواء كانت JSON أو Array
            let players = [];
            if (Array.isArray(t.players_data)) {
              players = t.players_data;
            } else if (typeof t.players_data === 'string') {
              try {
                players = JSON.parse(t.players_data);
              } catch (e) {
                players = [];
              }
            }

            return (
              <View
                key={t.id}
                style={[
                  styles.matchHistoryCard,
                  { borderRightWidth: 5, borderRightColor: t.kit_color || '#16A34A' },
                ]}
              >
                <View style={styles.matchHistoryHeader}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={styles.deleteIconBtn}
                      onPress={() => onDeleteTeam(t.id)}
                    >
                      <Text style={{ fontSize: 12 }}>🗑️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.editIconBtn}
                      onPress={() => {
                        setEditingTeamId(t.id);
                        setNewTeamName(t.name);
                        setNewTeamColor(t.kit_color || '#16A34A');
                        // تعبئة اللاعبين المحددين مسبقاً في نموذج التعديل
                        if (players.length > 0 && savedPlayers) {
                          const matchedIds = players
                            .map((tp) => {
                              const found = savedPlayers.find((sp) => sp.name === tp.name);
                              return found ? found.id : null;
                            })
                            .filter(Boolean);
                          setSelectedPlayerIds(matchedIds);
                          setShowPlayerPicker(true);
                        } else {
                          setSelectedPlayerIds([]);
                        }
                      }}
                    >
                      <Text style={{ fontSize: 12 }}>✏️</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.matchDateBadge}>
                    {t.tournament_name ? `🏆 ${t.tournament_name}` : '⚡ فريق مخصص'} • خطة ({t.defenders_count}-{t.midfielders_count}-{t.attackers_count})
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <TouchableOpacity
                    style={styles.saveTeamMiniBtn}
                    onPress={() => handleAssignToPitchPrompt(t)}
                  >
                    <Text style={styles.saveTeamMiniBtnText}>🏟️ تعيين كفريق في الملعب</Text>
                  </TouchableOpacity>

                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1F2937' }}>
                    {getKitEmojiByHex(t.kit_color, 'A')} {t.name}
                  </Text>
                </View>

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

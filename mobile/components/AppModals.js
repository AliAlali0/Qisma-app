import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import styles from '../styles';

export default function AppModals({
  // Modal 0: Auth
  authModalVisible,
  setAuthModalVisible,
  authUsernameInput,
  setAuthUsernameInput,
  authPasswordInput,
  setAuthPasswordInput,
  handleLoginSubmit,

  // Modal 1: Draft Slot Picker
  activeSlotForModal,
  setActiveSlotForModal,
  sortedForModal,
  assignPlayerToDraftSlot,
  clearSingleDraftSlot,
  setSelectedDraftSlotId,

  // Modal 2: Draft Auto-Balance Multi-Select
  multiSelectModalVisible,
  setMultiSelectModalVisible,
  selectedPlayerIdsForAuto,
  setSelectedPlayerIdsForAuto,
  savedPlayers,
  toggleSelectPlayerForAuto,
  handleAutoBalanceSelectedPlayers,
  draftLoading,

  // Modal 3: Match Score & MVP
  scoreModalMatch,
  setScoreModalMatch,
  modalScoreA,
  setModalScoreA,
  modalScoreB,
  setModalScoreB,
  selectedMvpName,
  setSelectedMvpName,
  applyRatingBoost,
  setApplyRatingBoost,
  matchParticipantsForMvp,
  handleSaveScore,

  // Modal 4: Tournament Players Selection
  tournamentPlayersModal,
  setTournamentPlayersModal,
  selectedPlayerIdsForTourney,
  setSelectedPlayerIdsForTourney,
  tournamentTeamsCount,
  toggleSelectPlayerForTourney,
  handleGenerateTournament,
  tourneyLoading,

  // Modal 5: Tournament Fixture Score
  tourneyScoreModalFixture,
  setTourneyScoreModalFixture,
  tourneyScoreA,
  setTourneyScoreA,
  tourneyScoreB,
  setTourneyScoreB,
  handleSaveTourneyFixtureScore,
}) {
  // حالات الفلترة والبحث للمجموعات (Multi-Squad Circles)
  const [autoModalGroup, setAutoModalGroup] = useState('الكل');
  const [autoModalSearch, setAutoModalSearch] = useState('');
  const [slotModalGroup, setSlotModalGroup] = useState('الكل');
  const [tourneyModalGroup, setTourneyModalGroup] = useState('الكل');
  const [tourneyModalSearch, setTourneyModalSearch] = useState('');

  // استخراج المجموعات الفريدة من قائمة اللاعبين
  const availableGroups = [
    'الكل',
    ...Array.from(new Set((savedPlayers || []).map((p) => p.group_name || 'عام'))),
  ];

  // تصفية اللاعبين لمودال التقسيم التكتيكي (Modal 2)
  const filteredAutoPlayers = (savedPlayers || []).filter((p) => {
    const playerGroup = p.group_name || 'عام';
    const matchesGroup = autoModalGroup === 'الكل' || playerGroup === autoModalGroup;
    const matchesSearch =
      !autoModalSearch.trim() ||
      p.name.toLowerCase().includes(autoModalSearch.trim().toLowerCase());
    return matchesGroup && matchesSearch;
  });

  // تصفية لاعبي خانات الملعب الفردية بحسب المجموعة (Modal 1)
  const filterBySlotGroup = (list = []) => {
    if (slotModalGroup === 'الكل') return list;
    return list.filter((p) => (p.group_name || 'عام') === slotModalGroup);
  };

  const slotPrimaryMatches = filterBySlotGroup(sortedForModal?.primaryMatches || []);
  const slotSecondaryMatches = filterBySlotGroup(sortedForModal?.secondaryMatches || []);
  const slotOtherPlayers = filterBySlotGroup(sortedForModal?.otherPlayers || []);

  // تصفية لاعبي البطولة بحسب المجموعة والبحث (Modal 4)
  const filteredTourneyPlayers = (savedPlayers || []).filter((p) => {
    const playerGroup = p.group_name || 'عام';
    const matchesGroup = tourneyModalGroup === 'الكل' || playerGroup === tourneyModalGroup;
    const matchesSearch =
      !tourneyModalSearch.trim() ||
      p.name.toLowerCase().includes(tourneyModalSearch.trim().toLowerCase());
    return matchesGroup && matchesSearch;
  });

  return (
    <>
      {/* Modal 0: نافذة تسجيل الدخول وترقية الحساب */}
      <Modal
        visible={authModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAuthModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: 360 }]}>
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity onPress={() => setAuthModalVisible(false)}>
                <Text style={styles.modalCloseText}>✖ إغلاق</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>🔐 حساب المستخدم والعضوية</Text>
            </View>

            <Text style={styles.customTeamLabel}>👤 اسم المستخدم:</Text>
            <TextInput
              style={[styles.customTeamInput, { marginBottom: 8 }]}
              value={authUsernameInput}
              onChangeText={setAuthUsernameInput}
              textAlign="right"
            />

            <Text style={styles.customTeamLabel}>🔑 كلمة المرور:</Text>
            <TextInput
              style={[styles.customTeamInput, { marginBottom: 12 }]}
              secureTextEntry
              value={authPasswordInput}
              onChangeText={setAuthPasswordInput}
              textAlign="right"
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleLoginSubmit}>
              <Text style={styles.primaryButtonText}>تسجيل الدخول / ترقية الحساب</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal 1: اختيار لاعب لمركز في شاشة من الصفر (مع فلترة المجموعات) */}
      <Modal
        visible={activeSlotForModal !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveSlotForModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity onPress={() => setActiveSlotForModal(null)}>
                <Text style={styles.modalCloseText}>✖ إغلاق</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                اختر لاعب لمركز: ({activeSlotForModal?.position})
              </Text>
            </View>

            {activeSlotForModal?.player && (
              <View style={styles.slotQuickActionsRow}>
                <TouchableOpacity
                  style={styles.clearSlotBtn}
                  onPress={() => clearSingleDraftSlot(activeSlotForModal)}
                >
                  <Text style={styles.clearSlotBtnText}>🗑️ تفريغ هذه الخانة</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.swapSlotBtn}
                  onPress={() => {
                    setSelectedDraftSlotId(activeSlotForModal.slotId);
                    setActiveSlotForModal(null);
                  }}
                >
                  <Text style={styles.swapSlotBtnText}>🔄 تبديل مكانه مع لاعب آخر</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* فلترة المجموعة لمركز الخانة إن وُجدت أكثر من مجموعة */}
            {availableGroups.length > 2 && (
              <View style={{ marginBottom: 8 }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 6 }}
                >
                  {availableGroups.map((grp) => {
                    const isActive = slotModalGroup === grp;
                    return (
                      <TouchableOpacity
                        key={`slot-grp-${grp}`}
                        style={{
                          backgroundColor: isActive ? '#0369A1' : '#F1F5F9',
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: isActive ? '#0369A1' : '#CBD5E1',
                        }}
                        onPress={() => setSlotModalGroup(grp)}
                      >
                        <Text
                          style={{
                            fontSize: 10,
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
            )}

            <ScrollView style={{ maxHeight: 380 }}>
              <Text style={styles.modalGroupHeaderPrimary}>
                🟢 المركز الأساسي ({activeSlotForModal?.position}) — ({slotPrimaryMatches.length})
              </Text>
              {slotPrimaryMatches.length === 0 ? (
                <Text style={styles.emptyModalSubtext}>
                  لا يوجد لاعبون متاحون بهذا المركز الأساسي
                </Text>
              ) : (
                slotPrimaryMatches.map((p) => (
                  <TouchableOpacity
                    key={`prim-pick-${p.id}`}
                    style={styles.modalPlayerItem}
                    onPress={() => assignPlayerToDraftSlot(p)}
                  >
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingText}>⭐ {p.rating}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.savedPlayerName}>{p.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        {p.group_name && p.group_name !== 'عام' && (
                          <Text style={{ fontSize: 9, color: '#0369A1', fontWeight: 'bold' }}>
                            🏷️ {p.group_name} •
                          </Text>
                        )}
                        <Text style={{ fontSize: 10, color: '#1B4332' }}>
                          أساسي: {p.primary_position}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}

              <Text style={styles.modalGroupHeaderSecondary}>
                🔵 المركز الاحتياطي ({activeSlotForModal?.position}) — ({slotSecondaryMatches.length})
              </Text>
              {slotSecondaryMatches.length === 0 ? (
                <Text style={styles.emptyModalSubtext}>
                  لا يوجد لاعبون متاحون بهذا المركز الاحتياطي
                </Text>
              ) : (
                slotSecondaryMatches.map((p) => (
                  <TouchableOpacity
                    key={`sec-pick-${p.id}`}
                    style={styles.modalPlayerItem}
                    onPress={() => assignPlayerToDraftSlot(p)}
                  >
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingText}>⭐ {p.rating}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.savedPlayerName}>{p.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        {p.group_name && p.group_name !== 'عام' && (
                          <Text style={{ fontSize: 9, color: '#0369A1', fontWeight: 'bold' }}>
                            🏷️ {p.group_name} •
                          </Text>
                        )}
                        <Text style={{ fontSize: 10, color: '#0369A1' }}>
                          أساسي: {p.primary_position} • احتياطي: {p.secondary_positions.join('، ')}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}

              {slotOtherPlayers.length > 0 && (
                <>
                  <Text style={styles.modalGroupHeaderOther}>
                    ⚪ بقية اللاعبين المتاحين ({slotOtherPlayers.length})
                  </Text>
                  {slotOtherPlayers.map((p) => (
                    <TouchableOpacity
                      key={`oth-pick-${p.id}`}
                      style={styles.modalPlayerItem}
                      onPress={() => assignPlayerToDraftSlot(p)}
                    >
                      <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>⭐ {p.rating}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.savedPlayerName}>{p.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          {p.group_name && p.group_name !== 'عام' && (
                            <Text style={{ fontSize: 9, color: '#0369A1', fontWeight: 'bold' }}>
                              🏷️ {p.group_name} •
                            </Text>
                          )}
                          <Text style={{ fontSize: 10, color: '#6B7280' }}>
                            أساسي: {p.primary_position}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal 2: اختيار لاعبين للتقسيم التكتيكي مع فلترة المجموعات المتقدمة */}
      <Modal
        visible={multiSelectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMultiSelectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity onPress={() => setMultiSelectModalVisible(false)}>
                <Text style={styles.modalCloseText}>✖ إغلاق</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                حدد اللاعبين الحاضرين ({selectedPlayerIdsForAuto.length})
              </Text>
            </View>

            {/* شريط فلترة المجموعات للتقسيم التكتيكي */}
            <View style={{ marginBottom: 6 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: 'bold',
                  color: '#475569',
                  textAlign: 'right',
                  marginBottom: 4,
                }}
              >
                👥 فلترة حسب المجموعة (Multi-Squad):
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6 }}
              >
                {availableGroups.map((grp) => {
                  const isActive = autoModalGroup === grp;
                  return (
                    <TouchableOpacity
                      key={`auto-grp-${grp}`}
                      style={{
                        backgroundColor: isActive ? '#0F766E' : '#F1F5F9',
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: isActive ? '#0F766E' : '#CBD5E1',
                      }}
                      onPress={() => setAutoModalGroup(grp)}
                    >
                      <Text
                        style={{
                          fontSize: 10,
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

            {/* بحث بالاسم داخل المودال */}
            <TextInput
              style={[styles.customTeamInput, { marginBottom: 6, backgroundColor: '#F8FAFC' }]}
              placeholder="🔍 ابحث عن اسم لاعب..."
              placeholderTextColor="#999"
              value={autoModalSearch}
              onChangeText={setAutoModalSearch}
              textAlign="right"
            />

            <View style={styles.slotQuickActionsRow}>
              <TouchableOpacity
                style={styles.clearSlotBtn}
                onPress={() => setSelectedPlayerIdsForAuto([])}
              >
                <Text style={styles.clearSlotBtnText}>إلغاء الكل</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.swapSlotBtn}
                onPress={() => {
                  const targetIds = filteredAutoPlayers.map((p) => p.id);
                  // إضافة لاعبي المجموعة المفلترة إلى القائمة المحددة
                  setSelectedPlayerIdsForAuto((prev) =>
                    Array.from(new Set([...prev, ...targetIds]))
                  );
                }}
              >
                <Text style={styles.swapSlotBtnText}>
                  ☑️ تحديد لاعبي {autoModalGroup === 'الكل' ? 'الكل' : autoModalGroup} ({filteredAutoPlayers.length})
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 330, marginVertical: 6 }}>
              {filteredAutoPlayers.map((p) => {
                const isChecked = selectedPlayerIdsForAuto.includes(p.id);
                return (
                  <TouchableOpacity
                    key={`auto-sel-${p.id}`}
                    style={[
                      styles.modalPlayerItem,
                      isChecked && { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
                    ]}
                    onPress={() => toggleSelectPlayerForAuto(p.id)}
                  >
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingText}>⭐ {p.rating}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.savedPlayerName}>{p.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          {p.group_name && p.group_name !== 'عام' && (
                            <Text style={{ fontSize: 9, color: '#0369A1', fontWeight: 'bold' }}>
                              🏷️ {p.group_name} •
                            </Text>
                          )}
                          <Text style={{ fontSize: 10, color: '#4B5563' }}>
                            أساسي: {p.primary_position}
                            {Array.isArray(p.secondary_positions) &&
                            p.secondary_positions.length > 0
                              ? ` | احتياطي: ${p.secondary_positions.join('، ')}`
                              : ''}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 16 }}>{isChecked ? '✅' : '⬜'}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.primaryButton, draftLoading && { opacity: 0.7 }]}
              onPress={handleAutoBalanceSelectedPlayers}
              disabled={draftLoading}
            >
              {draftLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  ⚖️ وزّع المختارين ({selectedPlayerIdsForAuto.length}) بالتساوي على الملعب
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal 3: إدخال النتيجة + اختيار نجم المباراة MVP وترقية التقييمات */}
      <Modal
        visible={scoreModalMatch !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setScoreModalMatch(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: 460 }]}>
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity onPress={() => setScoreModalMatch(null)}>
                <Text style={styles.modalCloseText}>✖ إغلاق</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>⚽ تسجيل النتيجة ونجم المباراة</Text>
            </View>

            <View style={styles.scoreInputsRow}>
              <View style={styles.scoreInputBox}>
                <Text style={styles.scoreInputLabel}>{scoreModalMatch?.team_b_name}</Text>
                <TextInput
                  style={styles.scoreTextInput}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="0"
                  value={modalScoreB}
                  onChangeText={setModalScoreB}
                  textAlign="center"
                />
              </View>

              <Text style={styles.scoreVsText}>ضد</Text>

              <View style={styles.scoreInputBox}>
                <Text style={styles.scoreInputLabel}>{scoreModalMatch?.team_a_name}</Text>
                <TextInput
                  style={styles.scoreTextInput}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="0"
                  value={modalScoreA}
                  onChangeText={setModalScoreA}
                  textAlign="center"
                />
              </View>
            </View>

            <Text style={[styles.customTeamLabel, { marginTop: 10 }]}>
              🌟 اختر نجم المباراة (MVP) من لاعبي اللقاء:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
              {matchParticipantsForMvp.map((name) => (
                <TouchableOpacity
                  key={`mvp-btn-${name}`}
                  style={[
                    styles.mvpSelectChip,
                    selectedMvpName === name && styles.mvpSelectChipActive,
                  ]}
                  onPress={() => setSelectedMvpName(name)}
                >
                  <Text
                    style={[
                      styles.mvpSelectChipText,
                      selectedMvpName === name && styles.mvpSelectChipTextActive,
                    ]}
                  >
                    ⭐ {name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.ratingBoostCheckboxRow}
              onPress={() => setApplyRatingBoost(!applyRatingBoost)}
            >
              <Text style={styles.ratingBoostCheckboxLabel}>
                ترقية تلقائية: (+2 للمنتصرين، +3 لـ MVP، -1 للخاسرين)
              </Text>
              <Text style={{ fontSize: 16 }}>{applyRatingBoost ? '✅' : '⬜'}</Text>
            </TouchableOpacity>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setModalScoreA('');
                  setModalScoreB('');
                  setSelectedMvpName('');
                }}
              >
                <Text style={styles.clearButtonText}>مسح</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryButton} onPress={handleSaveScore}>
                <Text style={styles.primaryButtonText}>💾 حفظ النتيجة والإحصائيات</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 4: اختيار اللاعبين المشاركين في البطولة مع فلترة المجموعات */}
      <Modal
        visible={tournamentPlayersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setTournamentPlayersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity onPress={() => setTournamentPlayersModal(false)}>
                <Text style={styles.modalCloseText}>✖ إغلاق</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                لاعبو البطولة ({selectedPlayerIdsForTourney.length}) لـ {tournamentTeamsCount} أفرقة
              </Text>
            </View>

            {/* فلترة المجموعة للبطولة */}
            <View style={{ marginBottom: 6 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: 'bold',
                  color: '#475569',
                  textAlign: 'right',
                  marginBottom: 4,
                }}
              >
                👥 فلترة حسب المجموعة:
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6 }}
              >
                {availableGroups.map((grp) => {
                  const isActive = tourneyModalGroup === grp;
                  return (
                    <TouchableOpacity
                      key={`tourney-grp-${grp}`}
                      style={{
                        backgroundColor: isActive ? '#B45309' : '#F1F5F9',
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: isActive ? '#B45309' : '#CBD5E1',
                      }}
                      onPress={() => setTourneyModalGroup(grp)}
                    >
                      <Text
                        style={{
                          fontSize: 10,
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

            {/* بحث بالاسم للبطولة */}
            <TextInput
              style={[styles.customTeamInput, { marginBottom: 6, backgroundColor: '#F8FAFC' }]}
              placeholder="🔍 ابحث عن اسم لاعب..."
              placeholderTextColor="#999"
              value={tourneyModalSearch}
              onChangeText={setTourneyModalSearch}
              textAlign="right"
            />

            <View style={styles.slotQuickActionsRow}>
              <TouchableOpacity
                style={styles.clearSlotBtn}
                onPress={() => setSelectedPlayerIdsForTourney([])}
              >
                <Text style={styles.clearSlotBtnText}>إلغاء الكل</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.swapSlotBtn}
                onPress={() => {
                  const targetIds = filteredTourneyPlayers.map((p) => p.id);
                  setSelectedPlayerIdsForTourney((prev) =>
                    Array.from(new Set([...prev, ...targetIds]))
                  );
                }}
              >
                <Text style={styles.swapSlotBtnText}>
                  ☑️ تحديد لاعبي {tourneyModalGroup === 'الكل' ? 'الكل' : tourneyModalGroup} ({filteredTourneyPlayers.length})
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 330, marginVertical: 6 }}>
              {filteredTourneyPlayers.map((p) => {
                const isChecked = selectedPlayerIdsForTourney.includes(p.id);
                return (
                  <TouchableOpacity
                    key={`tourney-sel-${p.id}`}
                    style={[
                      styles.modalPlayerItem,
                      isChecked && { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
                    ]}
                    onPress={() => toggleSelectPlayerForTourney(p.id)}
                  >
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingText}>⭐ {p.rating}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.savedPlayerName}>
                          {p.primary_position === 'حارس' ? '🧤 ' : ''}
                          {p.name}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          {p.group_name && p.group_name !== 'عام' && (
                            <Text style={{ fontSize: 9, color: '#B45309', fontWeight: 'bold' }}>
                              🏷️ {p.group_name} •
                            </Text>
                          )}
                          <Text style={{ fontSize: 10, color: '#4B5563' }}>
                            أساسي: {p.primary_position}
                            {Array.isArray(p.secondary_positions) &&
                            p.secondary_positions.length > 0
                              ? ` | احتياطي: ${p.secondary_positions.join('، ')}`
                              : ''}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 16 }}>{isChecked ? '✅' : '⬜'}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.primaryButton, tourneyLoading && { opacity: 0.7 }]}
              onPress={handleGenerateTournament}
              disabled={tourneyLoading}
            >
              {tourneyLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  🎲 اعتمد القرعة وقسّم ({selectedPlayerIdsForTourney.length}) لاعب على{' '}
                  {tournamentTeamsCount} أفرقة
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal 5: رصد نتيجة مباراة داخل البطولة */}
      <Modal
        visible={tourneyScoreModalFixture !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setTourneyScoreModalFixture(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: 310 }]}>
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity onPress={() => setTourneyScoreModalFixture(null)}>
                <Text style={styles.modalCloseText}>✖ إغلاق</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                🏆 {tourneyScoreModalFixture?.stageLabel || 'مباراة البطولة'}
              </Text>
            </View>

            <View style={styles.scoreInputsRow}>
              <View style={styles.scoreInputBox}>
                <Text style={styles.scoreInputLabel}>{tourneyScoreModalFixture?.teamBName}</Text>
                <TextInput
                  style={styles.scoreTextInput}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="0"
                  value={tourneyScoreB}
                  onChangeText={setTourneyScoreB}
                  textAlign="center"
                />
              </View>

              <Text style={styles.scoreVsText}>ضد</Text>

              <View style={styles.scoreInputBox}>
                <Text style={styles.scoreInputLabel}>{tourneyScoreModalFixture?.teamAName}</Text>
                <TextInput
                  style={styles.scoreTextInput}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="0"
                  value={tourneyScoreA}
                  onChangeText={setTourneyScoreA}
                  textAlign="center"
                />
              </View>
            </View>

            <View style={[styles.buttonRow, { marginTop: 15 }]}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setTourneyScoreA('');
                  setTourneyScoreB('');
                }}
              >
                <Text style={styles.clearButtonText}>مسح</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryButton} onPress={handleSaveTourneyFixtureScore}>
                <Text style={styles.primaryButtonText}>💾 رصد النتيجة وتحديث الترتيب</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

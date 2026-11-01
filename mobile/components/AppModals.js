import React from 'react';
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
              style={[styles.customTeamInput, { marginBottom: 14 }]}
              secureTextEntry
              value={authPasswordInput}
              onChangeText={setAuthPasswordInput}
              textAlign="right"
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: '#1B4332' }]}
                onPress={() => handleLoginSubmit('registered')}
              >
                <Text style={styles.primaryButtonText}>👑 دخول (مسجل)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: '#7C3AED' }]}
                onPress={() => handleLoginSubmit('subscriber')}
              >
                <Text style={styles.primaryButtonText}>💎 دخول (مشترك برو)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 1: اختيار لاعب لمركز في شاشة من الصفر */}
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

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.modalGroupHeaderPrimary}>
                🟢 المركز الأساسي ({activeSlotForModal?.position}) — (
                {sortedForModal.primaryMatches.length})
              </Text>
              {sortedForModal.primaryMatches.length === 0 ? (
                <Text style={styles.emptyModalSubtext}>
                  لا يوجد لاعبون متاحون بهذا المركز الأساسي
                </Text>
              ) : (
                sortedForModal.primaryMatches.map((p) => (
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
                      <Text style={{ fontSize: 10, color: '#1B4332' }}>
                        أساسي: {p.primary_position}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}

              <Text style={styles.modalGroupHeaderSecondary}>
                🔵 المركز الاحتياطي ({activeSlotForModal?.position}) — (
                {sortedForModal.secondaryMatches.length})
              </Text>
              {sortedForModal.secondaryMatches.length === 0 ? (
                <Text style={styles.emptyModalSubtext}>
                  لا يوجد لاعبون متاحون بهذا المركز الاحتياطي
                </Text>
              ) : (
                sortedForModal.secondaryMatches.map((p) => (
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
                      <Text style={{ fontSize: 10, color: '#0369A1' }}>
                        أساسي: {p.primary_position} • احتياطي: {p.secondary_positions.join('، ')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}

              {sortedForModal.otherPlayers.length > 0 && (
                <>
                  <Text style={styles.modalGroupHeaderOther}>
                    ⚪ بقية اللاعبين المتاحين ({sortedForModal.otherPlayers.length})
                  </Text>
                  {sortedForModal.otherPlayers.map((p) => (
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
                        <Text style={{ fontSize: 10, color: '#6B7280' }}>
                          أساسي: {p.primary_position}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal 2: اختيار لاعبين للتقسيم التلقائي (من الصفر) */}
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

            <View style={styles.slotQuickActionsRow}>
              <TouchableOpacity
                style={styles.clearSlotBtn}
                onPress={() => setSelectedPlayerIdsForAuto([])}
              >
                <Text style={styles.clearSlotBtnText}>إلغاء الكل</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.swapSlotBtn}
                onPress={() => setSelectedPlayerIdsForAuto(savedPlayers.map((p) => p.id))}
              >
                <Text style={styles.swapSlotBtnText}>☑️ تحديد الكل ({savedPlayers.length})</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380, marginVertical: 8 }}>
              {savedPlayers.map((p) => {
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
                        <Text style={{ fontSize: 10, color: '#4B5563' }}>
                          أساسي: {p.primary_position}
                          {Array.isArray(p.secondary_positions) &&
                          p.secondary_positions.length > 0
                            ? ` | احتياطي: ${p.secondary_positions.join('، ')}`
                            : ''}
                        </Text>
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

            <View style={styles.scoreInputContainer}>
              <View style={styles.scoreInputBox}>
                <Text style={styles.scoreInputLabel} numberOfLines={1}>
                  🔵 {scoreModalMatch?.team_b_name}
                </Text>
                <TextInput
                  style={styles.scoreInputField}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor="#999"
                  value={modalScoreB}
                  onChangeText={setModalScoreB}
                  textAlign="center"
                />
              </View>

              <Text style={styles.scoreVsText}>:</Text>

              <View style={styles.scoreInputBox}>
                <Text style={styles.scoreInputLabel} numberOfLines={1}>
                  🟢 {scoreModalMatch?.team_a_name}
                </Text>
                <TextInput
                  style={styles.scoreInputField}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor="#999"
                  value={modalScoreA}
                  onChangeText={setModalScoreA}
                  textAlign="center"
                />
              </View>
            </View>

            <Text style={styles.customTeamLabel}>🌟 اختر نجم المباراة (MVP +2 تقييم):</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginVertical: 6 }}
            >
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {matchParticipantsForMvp.map((p, idx) => {
                  const isMvp = selectedMvpName === p.name;
                  return (
                    <TouchableOpacity
                      key={`mvp-pick-${idx}`}
                      style={[
                        styles.posChip,
                        { paddingHorizontal: 10 },
                        isMvp && { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
                      ]}
                      onPress={() => setSelectedMvpName(isMvp ? '' : p.name)}
                    >
                      <Text
                        style={[
                          styles.posChipText,
                          isMvp && { color: '#B45309', fontWeight: 'bold' },
                        ]}
                      >
                        {isMvp ? '🌟 ' : ''}
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.boostToggleRow}
              onPress={() => setApplyRatingBoost(!applyRatingBoost)}
            >
              <Text style={styles.boostToggleText}>
                📈 زيادة تقييم الفائزين (+1) ونجم المباراة (+2) في السجل
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

      {/* Modal 4: اختيار اللاعبين المشاركين في البطولة */}
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

            <View style={styles.slotQuickActionsRow}>
              <TouchableOpacity
                style={styles.clearSlotBtn}
                onPress={() => setSelectedPlayerIdsForTourney([])}
              >
                <Text style={styles.clearSlotBtnText}>إلغاء الكل</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.swapSlotBtn}
                onPress={() => setSelectedPlayerIdsForTourney(savedPlayers.map((p) => p.id))}
              >
                <Text style={styles.swapSlotBtnText}>☑️ تحديد الكل ({savedPlayers.length})</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380, marginVertical: 8 }}>
              {savedPlayers.map((p) => {
                const isChecked = selectedPlayerIdsForTourney.includes(p.id);
                return (
                  <TouchableOpacity
                    key={`tourney-sel-${p.id}`}
                    style={[
                      styles.modalPlayerItem,
                      isChecked && { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
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
                        <Text style={{ fontSize: 10, color: '#4B5563' }}>
                          أساسي: {p.primary_position}
                          {Array.isArray(p.secondary_positions) &&
                          p.secondary_positions.length > 0
                            ? ` | احتياطي: ${p.secondary_positions.join('، ')}`
                            : ''}
                        </Text>
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
                🏆 نتيجة ({tourneyScoreModalFixture?.stageLabel})
              </Text>
            </View>

            <View style={styles.scoreInputContainer}>
              <View style={styles.scoreInputBox}>
                <Text style={styles.scoreInputLabel} numberOfLines={1}>
                  {tourneyScoreModalFixture?.teamBName}
                </Text>
                <TextInput
                  style={styles.scoreInputField}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor="#999"
                  value={tourneyScoreB}
                  onChangeText={setTourneyScoreB}
                  textAlign="center"
                />
              </View>

              <Text style={styles.scoreVsText}>:</Text>

              <View style={styles.scoreInputBox}>
                <Text style={styles.scoreInputLabel} numberOfLines={1}>
                  {tourneyScoreModalFixture?.teamAName}
                </Text>
                <TextInput
                  style={styles.scoreInputField}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor="#999"
                  value={tourneyScoreA}
                  onChangeText={setTourneyScoreA}
                  textAlign="center"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSaveTourneyFixtureScore}
            >
              <Text style={styles.primaryButtonText}>💾 اعتماد النتيجة وتحديث البطولة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
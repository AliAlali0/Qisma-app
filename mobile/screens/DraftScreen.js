import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import styles from '../styles';
import { getKitEmojiByHex, getDraftLines } from '../utils/helpers';
import { DraftSlotCard } from '../components/PlayerCard';
export default function DraftScreen({
  draftDefCount,
  draftMidCount,
  draftAttCount,
  updateFormationCounts,
  teamAName,
  setTeamAName,
  teamBName,
  setTeamBName,
  teamAColor,
  teamBColor,
  renderSubscriberTeamsCustomization,
  resetDraftPitch,
  selectedDraftGroup = 'الكل',
  setSelectedDraftGroup,
  savedPlayers = [],
  selectTopPlayersForFormation,
  setMultiSelectModalVisible,
  selectedDraftSlotId,
  setSelectedDraftSlotId,
  draftPitchRef,
  draftSlotsA,
  draftSlotsB,
  draftTeamATotal,
  draftTeamBTotal,
  handleDraftSlotPress,
  handleSaveCurrentMatch,
  handleShareDraftAsImage,
  handleShareDraftAsText,
}) {
  const draftLinesB = getDraftLines(draftSlotsB);
  const draftLinesA = getDraftLines(draftSlotsA);

  const availableGroups = ['الكل', ...Array.from(new Set((savedPlayers || []).map((p) => p.group_name || 'عام')))];

  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.sectionHeaderTitle}>
          📐 حدد خطة الملعب لكل فريق (بالإضافة لحارس مرمى 🧤):
        </Text>

        <View style={styles.formationCountersRow}>
          <View style={styles.formationCounterBox}>
            <Text style={styles.formationCounterLabel}>⚔️ الهجوم</Text>
            <View style={styles.counterControls}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() =>
                  updateFormationCounts(draftDefCount, draftMidCount, draftAttCount - 1)
                }
              >
                <Text style={styles.counterBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.counterValueText}>{draftAttCount}</Text>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() =>
                  updateFormationCounts(draftDefCount, draftMidCount, draftAttCount + 1)
                }
              >
                <Text style={styles.counterBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formationCounterBox}>
            <Text style={styles.formationCounterLabel}>⚙️ الوسط</Text>
            <View style={styles.counterControls}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() =>
                  updateFormationCounts(draftDefCount, draftMidCount - 1, draftAttCount)
                }
              >
                <Text style={styles.counterBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.counterValueText}>{draftMidCount}</Text>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() =>
                  updateFormationCounts(draftDefCount, draftMidCount + 1, draftAttCount)
                }
              >
                <Text style={styles.counterBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formationCounterBox}>
            <Text style={styles.formationCounterLabel}>🛡️ الدفاع</Text>
            <View style={styles.counterControls}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() =>
                  updateFormationCounts(draftDefCount - 1, draftMidCount, draftAttCount)
                }
              >
                <Text style={styles.counterBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.counterValueText}>{draftDefCount}</Text>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() =>
                  updateFormationCounts(draftDefCount + 1, draftMidCount, draftAttCount)
                }
              >
                <Text style={styles.counterBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.customTeamsRow}>
          <View style={styles.customTeamInputBox}>
            <Text style={styles.customTeamLabel}>
              {getKitEmojiByHex(teamBColor, 'B')} اسم الفريق الثاني:
            </Text>
            <TextInput
              style={styles.customTeamInput}
              value={teamBName}
              onChangeText={setTeamBName}
              textAlign="right"
            />
          </View>
          <View style={styles.customTeamInputBox}>
            <Text style={styles.customTeamLabel}>
              {getKitEmojiByHex(teamAColor, 'A')} اسم الفريق الأول:
            </Text>
            <TextInput
              style={styles.customTeamInput}
              value={teamAName}
              onChangeText={setTeamAName}
              textAlign="right"
            />
          </View>
        </View>

        {renderSubscriberTeamsCustomization()}

        {/* شريط فلترة المجموعة للتقسيم التكتيكي (Multi-Squad) */}
        <View style={{ marginVertical: 10, backgroundColor: '#F8FAFC', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' }}>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1B4332', textAlign: 'right', marginBottom: 6 }}>
            👥 فلترة لاعبي التقسيم التكتيكي بحسب المجموعة (Multi-Squad):
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {availableGroups.map((grp) => {
              const isSelected = selectedDraftGroup === grp;
              return (
                <TouchableOpacity
                  key={"draft-grp-" + grp}
                  style={{
                    backgroundColor: isSelected ? '#0F766E' : '#FFFFFF',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isSelected ? '#0F766E' : '#CBD5E1',
                  }}
                  onPress={() => setSelectedDraftGroup && setSelectedDraftGroup(grp)}
                >
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: isSelected ? '#FFFFFF' : '#334155' }}>
                    {grp === 'الكل' ? '🌐 كل المجموعات' : '🏷️ ' + grp}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.clearButton} onPress={resetDraftPitch}>
            <Text style={styles.clearButtonText}>تفريغ الملعب</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              selectTopPlayersForFormation && selectTopPlayersForFormation(selectedDraftGroup);
              setMultiSelectModalVisible(true);
            }}
          >
            <Text style={styles.primaryButtonText}>
              🤖 اختر وقسّم لاعبي ({selectedDraftGroup === 'الكل' ? 'الكل' : selectedDraftGroup})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoBanner}>
        <Text style={styles.infoText}>
          {selectedDraftSlotId
            ? '🔄 اضغط الآن على أي خانة أخرى في الملعب لتبديل مكان اللاعبين!'
            : '👆 اضغط على أي مركز في الملعب لاختيار لاعب • أو اضغط مطولاً للتبديل'}
        </Text>
      </View>

      <View style={styles.unifiedPitchWrapper}>
        <View ref={draftPitchRef} collapsable={false} style={styles.unifiedSoccerPitch}>
          <View style={styles.pitchCenterLine} />
          <View style={styles.pitchCenterCircle} />
          <View style={styles.pitchCenterSpot} />
          <View style={styles.topPenaltyArea} />
          <View style={styles.bottomPenaltyArea} />

          <View style={styles.pitchHalf}>
            <View style={[styles.teamHalfHeader, { borderColor: teamBColor, borderWidth: 1 }]}>
              <Text style={styles.teamHalfTitle}>
                {getKitEmojiByHex(teamBColor, 'B')} {teamBName} (⭐ {draftTeamBTotal})
              </Text>
            </View>
            <View style={styles.pitchRow}>
              {draftLinesB.gks.map((s) => (
                <DraftSlotCard
                  key={s.slotId}
                  slot={s}
                  teamAColor={teamAColor}
                  teamBColor={teamBColor}
                  selectedDraftSlotId={selectedDraftSlotId}
                  onSlotPress={handleDraftSlotPress}
                  onSelectForSwap={setSelectedDraftSlotId}
                />
              ))}
            </View>
            <View style={styles.pitchRow}>
              {draftLinesB.defs.map((s) => (
                <DraftSlotCard
                  key={s.slotId}
                  slot={s}
                  teamAColor={teamAColor}
                  teamBColor={teamBColor}
                  selectedDraftSlotId={selectedDraftSlotId}
                  onSlotPress={handleDraftSlotPress}
                  onSelectForSwap={setSelectedDraftSlotId}
                />
              ))}
            </View>
            <View style={styles.pitchRow}>
              {draftLinesB.mids.map((s) => (
                <DraftSlotCard
                  key={s.slotId}
                  slot={s}
                  teamAColor={teamAColor}
                  teamBColor={teamBColor}
                  selectedDraftSlotId={selectedDraftSlotId}
                  onSlotPress={handleDraftSlotPress}
                  onSelectForSwap={setSelectedDraftSlotId}
                />
              ))}
            </View>
            <View style={styles.pitchRow}>
              {draftLinesB.atts.map((s) => (
                <DraftSlotCard
                  key={s.slotId}
                  slot={s}
                  teamAColor={teamAColor}
                  teamBColor={teamBColor}
                  selectedDraftSlotId={selectedDraftSlotId}
                  onSlotPress={handleDraftSlotPress}
                  onSelectForSwap={setSelectedDraftSlotId}
                />
              ))}
            </View>
          </View>

          <View style={styles.pitchHalf}>
            <View style={styles.pitchRow}>
              {draftLinesA.atts.map((s) => (
                <DraftSlotCard
                  key={s.slotId}
                  slot={s}
                  teamAColor={teamAColor}
                  teamBColor={teamBColor}
                  selectedDraftSlotId={selectedDraftSlotId}
                  onSlotPress={handleDraftSlotPress}
                  onSelectForSwap={setSelectedDraftSlotId}
                />
              ))}
            </View>
            <View style={styles.pitchRow}>
              {draftLinesA.mids.map((s) => (
                <DraftSlotCard
                  key={s.slotId}
                  slot={s}
                  teamAColor={teamAColor}
                  teamBColor={teamBColor}
                  selectedDraftSlotId={selectedDraftSlotId}
                  onSlotPress={handleDraftSlotPress}
                  onSelectForSwap={setSelectedDraftSlotId}
                />
              ))}
            </View>
            <View style={styles.pitchRow}>
              {draftLinesA.defs.map((s) => (
                <DraftSlotCard
                  key={s.slotId}
                  slot={s}
                  teamAColor={teamAColor}
                  teamBColor={teamBColor}
                  selectedDraftSlotId={selectedDraftSlotId}
                  onSlotPress={handleDraftSlotPress}
                  onSelectForSwap={setSelectedDraftSlotId}
                />
              ))}
            </View>
            <View style={styles.pitchRow}>
              {draftLinesA.gks.map((s) => (
                <DraftSlotCard
                  key={s.slotId}
                  slot={s}
                  teamAColor={teamAColor}
                  teamBColor={teamBColor}
                  selectedDraftSlotId={selectedDraftSlotId}
                  onSlotPress={handleDraftSlotPress}
                  onSelectForSwap={setSelectedDraftSlotId}
                />
              ))}
            </View>
            <View
              style={[styles.teamHalfHeaderBottom, { borderColor: teamAColor, borderWidth: 1 }]}
            >
              <Text style={styles.teamHalfTitle}>
                {getKitEmojiByHex(teamAColor, 'A')} {teamAName} (⭐ {draftTeamATotal})
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.shareButtonsGroup}>
        <TouchableOpacity
          style={styles.saveMatchButton}
          onPress={() => handleSaveCurrentMatch('draft')}
        >
          <Text style={styles.shareImageButtonText}>💾 حفظ التشكيلة في سجل المباريات</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareImageButton} onPress={handleShareDraftAsImage}>
          <Text style={styles.shareImageButtonText}>📸 مشاركة تشكيلة الملعب كصورة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareTextButton} onPress={handleShareDraftAsText}>
          <Text style={styles.shareImageButtonText}>📝 مشاركة التشكيلة كتابة للواتساب</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
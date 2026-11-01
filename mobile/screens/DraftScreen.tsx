/**
 * ============================================================================
 * DraftScreen (Pure Presentational UI Component)
 * ============================================================================
 * Tactical Pitch board allowing organizers to pick custom formations (DEF, MID, ATT),
 * filter draft players by squad circles, and assign players to pitch slots.
 */

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import styles from '../styles';
import { getKitEmojiByHex, getDraftLines } from '../utils/helpers';
import { DraftSlotCard } from '../components/PlayerCard';
import { Player } from '../types/player.types';

export interface DraftScreenProps {
  draftDefCount: number;
  draftMidCount: number;
  draftAttCount: number;
  updateFormationCounts: (def: number, mid: number, att: number) => void;
  teamAName: string;
  setTeamAName: (name: string) => void;
  teamBName: string;
  setTeamBName: (name: string) => void;
  teamAColor: string;
  teamBColor: string;
  renderSubscriberTeamsCustomization: (currentScreen: string) => React.ReactNode;
  resetDraftPitch: () => void;
  selectedDraftGroup?: string;
  setSelectedDraftGroup: (group: string) => void;
  savedPlayers?: Player[];
  selectTopPlayersForFormation: (groupFilter?: string) => void;
  setMultiSelectModalVisible: (open: boolean) => void;
  selectedDraftSlotId: string | null;
  setSelectedDraftSlotId: (slotId: string | null) => void;
  draftPitchRef: React.RefObject<any>;
  draftSlotsA: any[];
  draftSlotsB: any[];
  draftTeamATotal: number;
  draftTeamBTotal: number;
  handleDraftSlotPress: (slot: any) => void;
  handleSaveCurrentMatch: (mode: string) => void;
  handleShareDraftAsImage: () => void;
  handleShareDraftAsText: () => void;
}

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
}: DraftScreenProps) {
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

        <Text style={styles.totalPitchPlayersText}>
          إجمالي لاعبي الفريق الواحد:{' '}
          <Text style={{ fontWeight: 'bold', color: '#1B4332' }}>
            {draftDefCount + draftMidCount + draftAttCount + 1} لاعبين (شامل الحارس)
          </Text>
        </Text>

        <View style={styles.teamNamesRow}>
          <View style={styles.teamNameCol}>
            <Text style={styles.teamNameLabel}>اسم الفريق الأول (B):</Text>
            <TextInput
              style={styles.teamNameInput}
              value={teamBName}
              onChangeText={setTeamBName}
              placeholder="فريق B"
              textAlign="right"
            />
          </View>
          <View style={styles.teamNameCol}>
            <Text style={styles.teamNameLabel}>اسم الفريق الثاني (A):</Text>
            <TextInput
              style={styles.teamNameInput}
              value={teamAName}
              onChangeText={setTeamAName}
              placeholder="فريق A"
              textAlign="right"
            />
          </View>
        </View>

        {renderSubscriberTeamsCustomization('draft')}

        <View style={{ marginVertical: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1E293B', textAlign: 'right', marginBottom: 4 }}>
            👥 اختر المجموعة لتقسيم التشكيلة منها:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 2 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {availableGroups.map((grp) => {
                const isSelected = selectedDraftGroup === grp;
                return (
                  <TouchableOpacity
                    key={"draft-grp-" + grp}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: isSelected ? '#16A34A' : '#CBD5E1',
                      backgroundColor: isSelected ? '#DCFCE7' : '#F8FAFC',
                    }}
                    onPress={() => setSelectedDraftGroup(grp)}
                  >
                    <Text
                      style={{
                        fontSize: 11,
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

        <View style={styles.draftButtonsRow}>
          <TouchableOpacity style={styles.resetDraftBtn} onPress={resetDraftPitch}>
            <Text style={styles.resetDraftBtnText}>🔄 تفريغ الملعب</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.autoPickBtn}
            onPress={() => selectTopPlayersForFormation(selectedDraftGroup)}
          >
            <Text style={styles.autoPickBtnText}>
              ⚡ ملء ذكي وتوازن تكتيكي {selectedDraftGroup !== 'الكل' ? `(${selectedDraftGroup})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.multiSelectBtn}
            onPress={() => setMultiSelectModalVisible(true)}
          >
            <Text style={styles.multiSelectBtnText}>👥 اختيار جماعي</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.resultsContainer}>
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>
            💡 اضغط على أي خانة فارغة لتعيين لاعب، أو اضغط على لاعبين للتبديل بينهما.
            {selectedDraftSlotId ? '\n🔄 تم تحديد لاعب للتبديل، اضغط على الخانة الأخرى الآن' : ''}
          </Text>
        </View>

        <View ref={draftPitchRef} collapsable={false} style={styles.pitchCard}>
          <View style={styles.pitchInner}>
            <View style={styles.centerLine} />
            <View style={styles.centerCircle} />
            <View style={styles.penaltyAreaTop} />
            <View style={styles.penaltyAreaBottom} />

            <View
              style={[styles.teamHalfHeaderTop, { borderColor: teamBColor, borderWidth: 1 }]}
            >
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

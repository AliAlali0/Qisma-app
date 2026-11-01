/**
 * ============================================================================
 * DivideScreen (Pure Presentational UI Component)
 * ============================================================================
 * Allows organizer to paste raw WhatsApp rosters, trigger AI division,
 * inspect balanced pitch view, and export results.
 */

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import styles from '../styles';
import { GUEST_TEMPLATE } from '../constants/config';
import { getKitEmojiByHex, getTeamLines } from '../utils/helpers';
import { PitchPlayerCard } from '../components/PlayerCard';
import { Player } from '../types/player.types';

export interface DivideScreenProps {
  userRole: string;
  isLoggedUser: boolean;
  rawText: string;
  setRawText: (text: string) => void;
  teamAName: string;
  setTeamAName: (name: string) => void;
  teamBName: string;
  setTeamBName: (name: string) => void;
  teamAColor: string;
  teamBColor: string;
  renderSubscriberTeamsCustomization: (currentScreen: string) => React.ReactNode;
  loading: boolean;
  handleClear: () => void;
  handleDivideTeams: () => void;
  teamA: any[];
  teamB: any[];
  analysisSource: string;
  totalExtracted: number;
  selectedPlayerId: string | null;
  activeTab: 'pitch' | 'list';
  setActiveTab: (tab: 'pitch' | 'list') => void;
  pitchRef: React.RefObject<any>;
  teamARatingTotal: number;
  teamBRatingTotal: number;
  handlePlayerPress: (player: any) => void;
  cyclePlayerPosition: (player: any) => void;
  handleSaveCurrentMatch: (mode: string) => void;
  handleShareAsImage: () => void;
  handleShareAsText: () => void;
}

export default function DivideScreen({
  userRole,
  isLoggedUser,
  rawText,
  setRawText,
  teamAName,
  setTeamAName,
  teamBName,
  setTeamBName,
  teamAColor,
  teamBColor,
  renderSubscriberTeamsCustomization,
  loading,
  handleClear,
  handleDivideTeams,
  teamA,
  teamB,
  analysisSource,
  totalExtracted,
  selectedPlayerId,
  activeTab,
  setActiveTab,
  pitchRef,
  teamARatingTotal,
  teamBRatingTotal,
  handlePlayerPress,
  cyclePlayerPosition,
  handleSaveCurrentMatch,
  handleShareAsImage,
  handleShareAsText,
}: DivideScreenProps) {
  const linesB = getTeamLines(teamB);
  const linesA = getTeamLines(teamA);

  return (
    <View>
      <View style={styles.card}>
        <View style={styles.labelRow}>
          {userRole === 'guest' ? (
            <TouchableOpacity
              style={styles.templateBadge}
              onPress={() => setRawText(GUEST_TEMPLATE)}
            >
              <Text style={styles.templateBadgeText}>📋 إدراج التمبلت الجاهز</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}
          <Text style={styles.label}>
            {userRole === 'guest'
              ? 'التزم بالتمبلت المخصص للضيف:'
              : 'الصق لستة الواتساب بأي صيغة:'}
          </Text>
        </View>

        <TextInput
          style={styles.textArea}
          placeholder="ألصق القائمة هنا..."
          value={rawText}
          onChangeText={setRawText}
          multiline
          numberOfLines={6}
          textAlign="right"
        />

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

        {renderSubscriberTeamsCustomization('divide')}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleDivideTeams}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {userRole === 'guest' ? '⚡ تقسيم تكتيكي سريع' : '🤖 تقسيم بالذكاء الاصطناعي'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleClear} disabled={loading}>
            <Text style={styles.secondaryButtonText}>مسح</Text>
          </TouchableOpacity>
        </View>
      </View>

      {teamA.length > 0 && (
        <View style={styles.resultsContainer}>
          <View
            style={[styles.infoBanner, analysisSource === 'local' && styles.infoBannerLocal]}
          >
            <Text style={[styles.infoText, analysisSource === 'local' && styles.infoTextLocal]}>
              {analysisSource === 'gemini'
                ? `✨ تم التحليل والموازنة بسحابة Google Gemini (${totalExtracted} لاعب)`
                : (analysisSource === 'llama' || analysisSource === 'ai')
                ? `🦙 تم التحليل والموازنة بنموذج Meta Llama 3.1 (${totalExtracted} لاعب)`
                : `⚡ تم التحليل عبر المحلل المحلي (${totalExtracted} لاعب)`}
              {selectedPlayerId ? '\n🔄 اضغط على أي لاعب آخر (أو حارس) لتبديل مكانيهما' : ''}
            </Text>
          </View>

          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'pitch' && styles.activeTab]}
              onPress={() => setActiveTab('pitch')}
            >
              <Text style={[styles.tabText, activeTab === 'pitch' && styles.activeTabText]}>
                🏟️ رسمة الملعب التكتيكي
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'list' && styles.activeTab]}
              onPress={() => setActiveTab('list')}
            >
              <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>
                📋 قوائم الفريقين
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'pitch' ? (
            <View ref={pitchRef} collapsable={false} style={styles.pitchCard}>
              <View style={styles.pitchInner}>
                <View style={styles.centerLine} />
                <View style={styles.centerCircle} />
                <View style={styles.penaltyAreaTop} />
                <View style={styles.penaltyAreaBottom} />

                <View
                  style={[styles.teamHalfHeaderTop, { borderColor: teamBColor, borderWidth: 1 }]}
                >
                  <Text style={styles.teamHalfTitle}>
                    {getKitEmojiByHex(teamBColor, 'B')} {teamBName} (⭐ {teamBRatingTotal})
                  </Text>
                </View>

                <View style={styles.pitchRow}>
                  {linesB.gks.map((p) => (
                    <PitchPlayerCard
                      key={p.uniqueId}
                      player={p}
                      teamAColor={teamAColor}
                      teamBColor={teamBColor}
                      selectedPlayerId={selectedPlayerId}
                      onPlayerPress={handlePlayerPress}
                      onCyclePosition={cyclePlayerPosition}
                    />
                  ))}
                </View>
                <View style={styles.pitchRow}>
                  {linesB.defs.map((p) => (
                    <PitchPlayerCard
                      key={p.uniqueId}
                      player={p}
                      teamAColor={teamAColor}
                      teamBColor={teamBColor}
                      selectedPlayerId={selectedPlayerId}
                      onPlayerPress={handlePlayerPress}
                      onCyclePosition={cyclePlayerPosition}
                    />
                  ))}
                </View>
                <View style={styles.pitchRow}>
                  {linesB.mids.map((p) => (
                    <PitchPlayerCard
                      key={p.uniqueId}
                      player={p}
                      teamAColor={teamAColor}
                      teamBColor={teamBColor}
                      selectedPlayerId={selectedPlayerId}
                      onPlayerPress={handlePlayerPress}
                      onCyclePosition={cyclePlayerPosition}
                    />
                  ))}
                </View>
                <View style={styles.pitchRow}>
                  {linesB.atts.map((p) => (
                    <PitchPlayerCard
                      key={p.uniqueId}
                      player={p}
                      teamAColor={teamAColor}
                      teamBColor={teamBColor}
                      selectedPlayerId={selectedPlayerId}
                      onPlayerPress={handlePlayerPress}
                      onCyclePosition={cyclePlayerPosition}
                    />
                  ))}
                </View>

                <View style={styles.pitchRow}>
                  {linesA.atts.map((p) => (
                    <PitchPlayerCard
                      key={p.uniqueId}
                      player={p}
                      teamAColor={teamAColor}
                      teamBColor={teamBColor}
                      selectedPlayerId={selectedPlayerId}
                      onPlayerPress={handlePlayerPress}
                      onCyclePosition={cyclePlayerPosition}
                    />
                  ))}
                </View>
                <View style={styles.pitchRow}>
                  {linesA.mids.map((p) => (
                    <PitchPlayerCard
                      key={p.uniqueId}
                      player={p}
                      teamAColor={teamAColor}
                      teamBColor={teamBColor}
                      selectedPlayerId={selectedPlayerId}
                      onPlayerPress={handlePlayerPress}
                      onCyclePosition={cyclePlayerPosition}
                    />
                  ))}
                </View>
                <View style={styles.pitchRow}>
                  {linesA.defs.map((p) => (
                    <PitchPlayerCard
                      key={p.uniqueId}
                      player={p}
                      teamAColor={teamAColor}
                      teamBColor={teamBColor}
                      selectedPlayerId={selectedPlayerId}
                      onPlayerPress={handlePlayerPress}
                      onCyclePosition={cyclePlayerPosition}
                    />
                  ))}
                </View>
                <View style={styles.pitchRow}>
                  {linesA.gks.map((p) => (
                    <PitchPlayerCard
                      key={p.uniqueId}
                      player={p}
                      teamAColor={teamAColor}
                      teamBColor={teamBColor}
                      selectedPlayerId={selectedPlayerId}
                      onPlayerPress={handlePlayerPress}
                      onCyclePosition={cyclePlayerPosition}
                    />
                  ))}
                </View>

                <View
                  style={[styles.teamHalfHeaderBottom, { borderColor: teamAColor, borderWidth: 1 }]}
                >
                  <Text style={styles.teamHalfTitle}>
                    {getKitEmojiByHex(teamAColor, 'A')} {teamAName} (⭐ {teamARatingTotal})
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.teamsHorizontalRow}>
              <View style={[styles.teamCard, styles.teamBCard, { borderLeftColor: teamBColor }]}>
                <Text style={[styles.teamTitleB, { color: teamBColor }]}>
                  {getKitEmojiByHex(teamBColor, 'B')} {teamBName} ({teamB.length})
                </Text>
                <Text style={styles.teamPower}>مجموع القوة: ⭐ {teamBRatingTotal}</Text>
                {teamB.map((player) => (
                  <View key={player.uniqueId} style={styles.playerRow}>
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingText}>{player.rating}</Text>
                    </View>
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerPosition}>({player.position})</Text>
                      <Text style={styles.playerName}>
                        {player.isGoalkeeper || player.position === 'حارس' ? '🧤 ' : ''}
                        {player.name}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={[styles.teamCard, styles.teamACard, { borderLeftColor: teamAColor }]}>
                <Text style={[styles.teamTitleA, { color: teamAColor }]}>
                  {getKitEmojiByHex(teamAColor, 'A')} {teamAName} ({teamA.length})
                </Text>
                <Text style={styles.teamPower}>مجموع القوة: ⭐ {teamARatingTotal}</Text>
                {teamA.map((player) => (
                  <View key={player.uniqueId} style={styles.playerRow}>
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingText}>{player.rating}</Text>
                    </View>
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerPosition}>({player.position})</Text>
                      <Text style={styles.playerName}>
                        {player.isGoalkeeper || player.position === 'حارس' ? '🧤 ' : ''}
                        {player.name}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {isLoggedUser ? (
            <View style={styles.shareButtonsGroup}>
              <TouchableOpacity
                style={styles.saveMatchButton}
                onPress={() => handleSaveCurrentMatch('divide')}
              >
                <Text style={styles.shareImageButtonText}>💾 حفظ التشكيلة في سجل المباريات</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareImageButton} onPress={handleShareAsImage}>
                <Text style={styles.shareImageButtonText}>📸 مشاركة تشكيلة الملعب كصورة</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareTextButton} onPress={handleShareAsText}>
                <Text style={styles.shareImageButtonText}>📝 مشاركة التشكيلة كتابة للواتساب</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.shareTextButton} onPress={handleShareAsText}>
              <Text style={styles.shareImageButtonText}>
                📝 مشاركة التشكيلة كتابة فقط (وضع الضيف)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import styles from '../styles';
import { GUEST_TEMPLATE } from '../constants/config';
import { getKitEmojiByHex, getTeamLines } from '../utils/helpers';
import { PitchPlayerCard } from '../components/PlayerCard';
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
}) {
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
          style={styles.textInput}
          multiline
          placeholder="الصق رسالة الواتساب هنا..."
          placeholderTextColor="#999"
          value={rawText}
          onChangeText={setRawText}
          textAlign="right"
        />

        {isLoggedUser && (
          <View style={styles.customTeamsRow}>
            <View style={styles.customTeamInputBox}>
              <Text style={styles.customTeamLabel}>
                {getKitEmojiByHex(teamBColor, 'B')} اسم الفريق الثاني:
              </Text>
              <TextInput
                style={styles.customTeamInput}
                value={teamBName}
                onChangeText={setTeamBName}
                placeholder="الفريق الثاني"
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
                placeholder="الفريق الأول"
                textAlign="right"
              />
            </View>
          </View>
        )}

        {renderSubscriberTeamsCustomization()}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear} disabled={loading}>
            <Text style={styles.clearButtonText}>مسح</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, loading && { opacity: 0.7 }]}
            onPress={handleDivideTeams}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FFF" size="small" />
                <Text style={styles.primaryButtonText}> جاري التوزيع...</Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>
                {userRole === 'guest' ? '⚡ قسّم بالمحلل المحلي' : '🤖 قسّم بالذكاء الاصطناعي'}
              </Text>
            )}
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
                🏟️ الملعب المتكامل
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'list' && styles.activeTab]}
              onPress={() => setActiveTab('list')}
            >
              <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>
                📋 القائمة التفصيلية
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'pitch' ? (
            <View style={styles.unifiedPitchWrapper}>
              <View ref={pitchRef} collapsable={false} style={styles.unifiedSoccerPitch}>
                <View style={styles.pitchCenterLine} />
                <View style={styles.pitchCenterCircle} />
                <View style={styles.pitchCenterSpot} />
                <View style={styles.topPenaltyArea} />
                <View style={styles.bottomPenaltyArea} />

                <View style={styles.pitchHalf}>
                  <View
                    style={[styles.teamHalfHeader, { borderColor: teamBColor, borderWidth: 1 }]}
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
                        teamKey="B"
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
                        teamKey="B"
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
                        teamKey="B"
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
                        teamKey="B"
                        teamAColor={teamAColor}
                        teamBColor={teamBColor}
                        selectedPlayerId={selectedPlayerId}
                        onPlayerPress={handlePlayerPress}
                        onCyclePosition={cyclePlayerPosition}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.pitchHalf}>
                  <View style={styles.pitchRow}>
                    {linesA.atts.map((p) => (
                      <PitchPlayerCard
                        key={p.uniqueId}
                        player={p}
                        teamKey="A"
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
                        teamKey="A"
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
                        teamKey="A"
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
                        teamKey="A"
                        teamAColor={teamAColor}
                        teamBColor={teamBColor}
                        selectedPlayerId={selectedPlayerId}
                        onPlayerPress={handlePlayerPress}
                        onCyclePosition={cyclePlayerPosition}
                      />
                    ))}
                  </View>

                  <View
                    style={[
                      styles.teamHalfHeaderBottom,
                      { borderColor: teamAColor, borderWidth: 1 },
                    ]}
                  >
                    <Text style={styles.teamHalfTitle}>
                      {getKitEmojiByHex(teamAColor, 'A')} {teamAName} (⭐ {teamARatingTotal})
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.pitchHintText}>
                💡 اضغط أي كرتين لتبديل مراكزهما (حتى مع الحارس) • اضغط اسم اللاعب لتغيير مركزه
              </Text>
            </View>
          ) : (
            <View style={styles.teamsColumnWrapper}>
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
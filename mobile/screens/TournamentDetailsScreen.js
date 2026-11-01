import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../styles';

export default function TournamentDetailsScreen({
  activeTournament,
  championTeam,
  tourneyStandings,
  handleAdvanceGroupToKnockout,
  handleOpenTourneyFixtureOnPitch,
  setTourneyScoreModalFixture,
  setTourneyScoreA,
  setTourneyScoreB,
  onBackToList,
  onGoToTeamsScreen,
}) {
  if (!activeTournament) {
    return (
      <View style={styles.card}>
        <Text style={styles.emptyListText}>لا توجد بطولة محددة حالياً.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onBackToList}>
          <Text style={styles.primaryButtonText}>🔙 العودة لقائمة البطولات</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      {/* شريط علوي للرجوع لقائمة البطولات أو شاشة الأفرقة */}
      <View style={[styles.card, { paddingVertical: 10 }]}>
        <View style={styles.labelRow}>
          <TouchableOpacity style={styles.swapSlotBtn} onPress={onBackToList}>
            <Text style={styles.swapSlotBtnText}>🔙 كل البطولات</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loadMatchBtn} onPress={onGoToTeamsScreen}>
            <Text style={styles.loadMatchBtnText}>🛡️ عرض الأفرقة في سجل التيمز</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.sectionHeaderTitle, { marginTop: 6 }]}>
          🏆 تفاصيل: {activeTournament.name}
        </Text>
      </View>

      {championTeam && (
        <View style={styles.championBanner}>
          <Text style={styles.championTitle}>
            👑 بطل {activeTournament.name}: {championTeam.name} 🏆
          </Text>
        </View>
      )}

      {/* الأفرقة المشاركة */}
      <View style={styles.card}>
        <Text style={styles.sectionHeaderTitle}>
          🛡️ الأفرقة المقسمة ({activeTournament.teams_data?.length || 0} أفرقة)
        </Text>

        <View style={styles.tourneyTeamsGrid}>
          {(activeTournament.teams_data || []).map((t) => (
            <View key={t.teamId} style={styles.tourneyTeamBox}>
              <View
                style={[
                  styles.tourneyTeamHeader,
                  { backgroundColor: t.color || '#1B4332' },
                ]}
              >
                <Text style={styles.tourneyTeamPower}>⭐ {t.ratingTotal}</Text>
                <Text style={styles.tourneyTeamTitle}>{t.name}</Text>
              </View>
              {(t.players || []).map((p, idx) => (
                <View key={`${t.teamId}-p-${idx}`} style={styles.tourneyPlayerLine}>
                  <Text style={styles.tourneyPlayerRating}>{p.rating}</Text>
                  <Text style={styles.tourneyPlayerName} numberOfLines={1}>
                    {p.isGoalkeeper || p.position === 'حارس' ? '🧤 ' : '• '}
                    {p.name}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* جدول النقاط */}
      {(activeTournament.tournament_type === 'league' ||
        activeTournament.tournament_type === 'groups_knockout') && (
        <View style={styles.card}>
          <Text style={styles.sectionHeaderTitle}>📊 جدول النقاط والترتيب</Text>
          <View style={styles.standingsHeaderRow}>
            <Text style={[styles.standingsCell, { fontWeight: 'bold' }]}>نقاط</Text>
            <Text style={styles.standingsCell}>فارق</Text>
            <Text style={styles.standingsCell}>خ</Text>
            <Text style={styles.standingsCell}>ت</Text>
            <Text style={styles.standingsCell}>ف</Text>
            <Text style={styles.standingsCell}>لعب</Text>
            <Text style={styles.standingsTeamCell}>الفريق</Text>
          </View>

          {tourneyStandings.map((row, idx) => (
            <View
              key={row.teamId}
              style={[
                styles.standingsDataRow,
                idx < 2 && { backgroundColor: '#ECFDF5' },
              ]}
            >
              <Text style={[styles.standingsCell, { fontWeight: 'bold', color: '#065F46' }]}>
                {row.points}
              </Text>
              <Text style={styles.standingsCell}>{row.gd}</Text>
              <Text style={styles.standingsCell}>{row.lost}</Text>
              <Text style={styles.standingsCell}>{row.drawn}</Text>
              <Text style={styles.standingsCell}>{row.won}</Text>
              <Text style={styles.standingsCell}>{row.played}</Text>
              <Text style={styles.standingsTeamCell} numberOfLines={1}>
                {idx + 1}. {row.name}
              </Text>
            </View>
          ))}

          {activeTournament.tournament_type === 'groups_knockout' && (
            <TouchableOpacity
              style={[styles.saveMatchButton, { marginTop: 10 }]}
              onPress={handleAdvanceGroupToKnockout}
            >
              <Text style={styles.shareImageButtonText}>
                ⚡ تأهيل المتصدرين وتوليد مباريات الإقصاء (نصف النهائي / النهائي)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* جدول المباريات */}
      <View style={styles.card}>
        <Text style={styles.sectionHeaderTitle}>
          ⚽ جدول مواجهات البطولة ({activeTournament.fixtures_data?.length || 0})
        </Text>

        {(activeTournament.fixtures_data || []).map((f) => {
          const hasScore = f.scoreA !== null && f.scoreB !== null;
          return (
            <View key={f.matchId} style={styles.matchHistoryCard}>
              <View style={styles.matchHistoryHeader}>
                {f.teamBId && (
                  <TouchableOpacity onPress={() => handleOpenTourneyFixtureOnPitch(f)}>
                    <Text style={{ fontSize: 11, color: '#065F46', fontWeight: 'bold' }}>
                      🏟️ عرض في الملعب
                    </Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.matchDateBadge}>{f.stageLabel}</Text>
              </View>

              <View style={styles.matchScoreBoard}>
                <View style={styles.teamScoreCol}>
                  <Text style={styles.teamScoreName} numberOfLines={1}>
                    {f.winnerId === f.teamBId ? '🏆 ' : ''}
                    {f.teamBName}
                  </Text>
                  <Text style={styles.teamScoreNum}>
                    {f.scoreB !== null ? f.scoreB : '—'}
                  </Text>
                </View>

                <Text style={styles.scoreVsText}>VS</Text>

                <View style={styles.teamScoreCol}>
                  <Text style={styles.teamScoreName} numberOfLines={1}>
                    {f.winnerId === f.teamAId ? '🏆 ' : ''}
                    {f.teamAName}
                  </Text>
                  <Text style={styles.teamScoreNum}>
                    {f.scoreA !== null ? f.scoreA : '—'}
                  </Text>
                </View>
              </View>

              {f.teamBId && (
                <TouchableOpacity
                  style={styles.setScoreBtn}
                  onPress={() => {
                    setTourneyScoreModalFixture(f);
                    setTourneyScoreA(f.scoreA !== null ? String(f.scoreA) : '');
                    setTourneyScoreB(f.scoreB !== null ? String(f.scoreB) : '');
                  }}
                >
                  <Text style={styles.setScoreBtnText}>
                    {hasScore ? '✏️ تعديل نتيجة المباراة' : '⚽ رصد نتيجة المباراة'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
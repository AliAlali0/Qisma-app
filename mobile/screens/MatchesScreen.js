import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import styles from '../styles';
import { getKitEmojiByHex } from '../utils/helpers';

export default function MatchesScreen({
  matchesList,
  loadingMatches,
  fetchMatchesList,
  handleDeleteMatch,
  handleLoadMatchToPitch,
  setScoreModalMatch,
  setModalScoreA,
  setModalScoreB,
  setSelectedMvpName,
  setApplyRatingBoost,
}) {
  return (
    <View>
      <View style={styles.card}>
        <View style={styles.labelRow}>
          <TouchableOpacity onPress={fetchMatchesList}>
            <Text style={{ fontSize: 11, color: '#0284C7', fontWeight: 'bold' }}>🔄 تحديث</Text>
          </TouchableOpacity>
          <Text style={styles.sectionHeaderTitle}>
            📜 سجل وأرشيف المباريات ({matchesList.length})
          </Text>
        </View>

        {loadingMatches ? (
          <ActivityIndicator color="#1B4332" size="small" style={{ marginVertical: 15 }} />
        ) : matchesList.length === 0 ? (
          <View style={{ alignItems: 'center', marginVertical: 20 }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🏟️</Text>
            <Text style={styles.emptyListText}>لا توجد مباريات محفوظة بعد.</Text>
          </View>
        ) : (
          matchesList.map((m) => {
            const hasScore = m.team_a_score !== null && m.team_b_score !== null;
            const dateStr = new Date(m.created_at).toLocaleDateString('ar-EG', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });

            return (
              <View key={m.id} style={styles.matchHistoryCard}>
                <View style={styles.matchHistoryHeader}>
                  <TouchableOpacity
                    style={styles.deleteIconBtn}
                    onPress={() => handleDeleteMatch(m)}
                  >
                    <Text style={{ fontSize: 12 }}>🗑️</Text>
                  </TouchableOpacity>
                  <Text style={styles.matchDateBadge}>
                    📅 {dateStr} • {m.formation} {m.ratings_applied ? '• 📈 مطورة' : ''}
                  </Text>
                </View>

                <View style={styles.matchScoreBoard}>
                  <View style={styles.teamScoreCol}>
                    <Text style={styles.teamScoreName} numberOfLines={1}>
                      {getKitEmojiByHex(m.team_b_color, 'B')} {m.team_b_name}
                    </Text>
                    <Text style={styles.teamScoreNum}>
                      {m.team_b_score !== null ? m.team_b_score : '—'}
                    </Text>
                  </View>

                  <Text style={styles.scoreVsText}>VS</Text>

                  <View style={styles.teamScoreCol}>
                    <Text style={styles.teamScoreName} numberOfLines={1}>
                      {getKitEmojiByHex(m.team_a_color, 'A')} {m.team_a_name}
                    </Text>
                    <Text style={styles.teamScoreNum}>
                      {m.team_a_score !== null ? m.team_a_score : '—'}
                    </Text>
                  </View>
                </View>

                {m.mvp_player_name && (
                  <View style={styles.mvpMatchBanner}>
                    <Text style={styles.mvpMatchBannerText}>
                      🌟 نجم المباراة (MVP): {m.mvp_player_name}
                    </Text>
                  </View>
                )}

                <View style={styles.matchCardActionsRow}>
                  <TouchableOpacity
                    style={styles.loadMatchBtn}
                    onPress={() => handleLoadMatchToPitch(m)}
                  >
                    <Text style={styles.loadMatchBtnText}>🏟️ فتح في الملعب</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.setScoreBtn}
                    onPress={() => {
                      setScoreModalMatch(m);
                      setModalScoreA(m.team_a_score !== null ? String(m.team_a_score) : '');
                      setModalScoreB(m.team_b_score !== null ? String(m.team_b_score) : '');
                      setSelectedMvpName(m.mvp_player_name || '');
                      setApplyRatingBoost(!m.ratings_applied);
                    }}
                  >
                    <Text style={styles.setScoreBtnText}>
                      {hasScore ? '✏️ النتيجة و MVP' : '⚽ رصد النتيجة و MVP'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}
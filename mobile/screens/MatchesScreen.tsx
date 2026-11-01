/**
 * ============================================================================
 * MatchesScreen (Pure Presentational UI Component)
 * ============================================================================
 * Displays recorded match archives, scores, and formation history.
 * Contains ZERO network or database logic - purely visual!
 */

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import styles from '../styles';
import { getKitEmojiByHex } from '../utils/helpers';
import { Match } from '../types/match.types';

export interface MatchesScreenProps {
  matchesList: Match[];
  loadingMatches: boolean;
  fetchMatchesList: () => void;
  handleDeleteMatch: (match: Match) => void;
  handleLoadMatchToPitch: (match: Match) => void;
  setScoreModalMatch: (match: Match | null) => void;
  setModalScoreA: (score: string) => void;
  setModalScoreB: (score: string) => void;
  setSelectedMvpName: (name: string) => void;
  setApplyRatingBoost: (boost: boolean) => void;
}

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
}: MatchesScreenProps) {
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
                      {getKitEmojiByHex(m.team_a_color || '#16A34A')} {m.team_a_name}
                    </Text>
                    <Text style={styles.teamScoreNum}>{hasScore ? m.team_a_score : '−'}</Text>
                  </View>

                  <Text style={styles.vsBadgeText}>VS</Text>

                  <View style={styles.teamScoreCol}>
                    <Text style={styles.teamScoreNum}>{hasScore ? m.team_b_score : '−'}</Text>
                    <Text style={styles.teamScoreName} numberOfLines={1}>
                      {m.team_b_name} {getKitEmojiByHex(m.team_b_color || '#2563EB')}
                    </Text>
                  </View>
                </View>

                {m.mvp_player_name ? (
                  <View style={styles.mvpBadgeRow}>
                    <Text style={styles.mvpBadgeText}>⭐ رجل المباراة: {m.mvp_player_name}</Text>
                  </View>
                ) : null}

                <View style={styles.matchHistoryActions}>
                  <TouchableOpacity
                    style={styles.loadMatchBtn}
                    onPress={() => handleLoadMatchToPitch(m)}
                  >
                    <Text style={styles.loadMatchBtnText}>🏟️ إنزال بالملعب</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.editScoreBtn}
                    onPress={() => {
                      setScoreModalMatch(m);
                      setModalScoreA(m.team_a_score !== null ? String(m.team_a_score) : '');
                      setModalScoreB(m.team_b_score !== null ? String(m.team_b_score) : '');
                      setSelectedMvpName(m.mvp_player_name || '');
                      setApplyRatingBoost(!m.ratings_applied);
                    }}
                  >
                    <Text style={styles.editScoreBtnText}>
                      {hasScore ? '✏️ تعديل النتيجة' : '⚽ تسجيل النتيجة'}
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

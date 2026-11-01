import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../styles';

export default function TournamentsListScreen({
  tournamentsHistory,
  onSelectTournament,
  onCreateNewTournament,
  onDeleteTournament,
}) {
  const getTypeLabel = (type) => {
    if (type === 'league') return '📊 دوري نقاط';
    if (type === 'knockout') return '⚔️ إقصاء مباشر';
    return '🔥 نقاط ثم إقصاء';
  };

  return (
    <View>
      <View style={styles.card}>
        <View style={styles.labelRow}>
          <TouchableOpacity
            style={styles.saveTeamMiniBtn}
            onPress={onCreateNewTournament}
          >
            <Text style={styles.saveTeamMiniBtnText}>➕ إنشاء بطولة جديدة</Text>
          </TouchableOpacity>
          <Text style={styles.sectionHeaderTitle}>
            🏆 جميع البطولات المنشأة ({tournamentsHistory.length})
          </Text>
        </View>

        {tournamentsHistory.length === 0 ? (
          <View style={{ alignItems: 'center', marginVertical: 24 }}>
            <Text style={{ fontSize: 34, marginBottom: 8 }}>🏆</Text>
            <Text style={styles.emptyListText}>لم تقم بإنشاء أي بطولة بعد.</Text>
            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: 12, paddingHorizontal: 20 }]}
              onPress={onCreateNewTournament}
            >
              <Text style={styles.primaryButtonText}>➕ أنشئ أول بطولة الآن</Text>
            </TouchableOpacity>
          </View>
        ) : (
          tournamentsHistory.map((t) => {
            const dateStr = new Date(t.created_at).toLocaleDateString('ar-EG', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <TouchableOpacity
                key={t.id}
                activeOpacity={0.85}
                style={styles.matchHistoryCard}
                onPress={() => onSelectTournament(t)}
              >
                <View style={styles.matchHistoryHeader}>
                  <TouchableOpacity
                    style={styles.deleteIconBtn}
                    onPress={() => onDeleteTournament(t.id)}
                  >
                    <Text style={{ fontSize: 12 }}>🗑️</Text>
                  </TouchableOpacity>
                  <Text style={styles.matchDateBadge}>
                    📅 {dateStr} • {getTypeLabel(t.tournament_type)}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 6,
                  }}
                >
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>
                      🛡️ {t.teams_data?.length || t.teams_count} أفرقة
                    </Text>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1B4332' }}>
                    🏆 {t.name}
                  </Text>
                </View>

                <View style={[styles.loadMatchBtn, { marginTop: 6 }]}>
                  <Text style={styles.loadMatchBtnText}>
                    📋 فتح تفاصيل البطولة والمباريات ◀
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </View>
  );
}
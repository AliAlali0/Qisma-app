import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import styles from '../styles';
import { getAlphabetTeamCode } from '../utils/helpers';

export default function CreateTournamentScreen({
  tournamentName,
  setTournamentName,
  tournamentType,
  setTournamentType,
  tournamentTeamsCountInput,
  setTournamentTeamsCountInput,
  savedPlayers,
  setSelectedPlayerIdsForTourney,
  setTournamentPlayersModal,
  onGoToTournamentsList,
}) {
  const parsedCount = Math.max(parseInt(tournamentTeamsCountInput, 10) || 2, 2);
  const previewNames = Array.from({ length: Math.min(parsedCount, 6) }, (_, i) =>
    `فريق ${getAlphabetTeamCode(i)}`
  ).join(' ، ');

  return (
    <View>
      <View style={styles.card}>
        <View style={styles.labelRow}>
          <TouchableOpacity onPress={onGoToTournamentsList}>
            <Text style={{ fontSize: 12, color: '#0284C7', fontWeight: 'bold' }}>
              🏆 عرض البطولات السابقة
            </Text>
          </TouchableOpacity>
          <Text style={styles.sectionHeaderTitle}>➕ إنشاء بطولة جديدة</Text>
        </View>

        <Text style={styles.customTeamLabel}>🏷️ اسم البطولة:</Text>
        <TextInput
          style={[styles.customTeamInput, { marginBottom: 12 }]}
          value={tournamentName}
          onChangeText={setTournamentName}
          placeholder="مثال: بطولة الجمعة الرمضانية"
          textAlign="right"
        />

        <Text style={styles.customTeamLabel}>⚙️ نظام البطولة (اختر النظام):</Text>
        <View style={styles.positionsSelectorRow}>
          <TouchableOpacity
            style={[
              styles.posChip,
              tournamentType === 'groups_knockout' && styles.posChipPrimaryActive,
            ]}
            onPress={() => setTournamentType('groups_knockout')}
          >
            <Text
              style={[
                styles.posChipText,
                tournamentType === 'groups_knockout' && styles.posChipTextActive,
              ]}
            >
              🔥 نقاط ثم إقصاء
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.posChip,
              tournamentType === 'knockout' && styles.posChipPrimaryActive,
            ]}
            onPress={() => setTournamentType('knockout')}
          >
            <Text
              style={[
                styles.posChipText,
                tournamentType === 'knockout' && styles.posChipTextActive,
              ]}
            >
              ⚔️ إقصاء
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.posChip,
              tournamentType === 'league' && styles.posChipPrimaryActive,
            ]}
            onPress={() => setTournamentType('league')}
          >
            <Text
              style={[
                styles.posChipText,
                tournamentType === 'league' && styles.posChipTextActive,
              ]}
            >
              📊 نقاط (دوري)
            </Text>
          </TouchableOpacity>
        </View>

        {/* إدخال عدد الفرق يدوياً */}
        <Text style={styles.customTeamLabel}>
          🚩 اكتب عدد الأفرقة المشاركة يدوياً (أي عدد تريده):
        </Text>
        <View style={styles.manualCountRow}>
          <TouchableOpacity
            style={styles.counterBtn}
            onPress={() =>
              setTournamentTeamsCountInput(String(Math.max(2, parsedCount - 1)))
            }
          >
            <Text style={styles.counterBtnText}>−</Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.customTeamInput, { flex: 1, textAlign: 'center', fontSize: 16 }]}
            keyboardType="numeric"
            value={String(tournamentTeamsCountInput)}
            onChangeText={setTournamentTeamsCountInput}
            placeholder="أدخل عدد الفرق (مثلاً 4 أو 5 أو 10)"
          />

          <TouchableOpacity
            style={styles.counterBtn}
            onPress={() => setTournamentTeamsCountInput(String(parsedCount + 1))}
          >
            <Text style={styles.counterBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 11, color: '#6B7280', textAlign: 'right', marginBottom: 12 }}>
          💡 سيتم تسمية الأفرقة تلقائياً بالحروف: ({previewNames}
          {parsedCount > 6 ? ` ... حتى فريق ${getAlphabetTeamCode(parsedCount - 1)}` : ''}) وحفظها في شاشة الأفرقة.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            setSelectedPlayerIdsForTourney(savedPlayers.map((p) => p.id));
            setTournamentPlayersModal(true);
          }}
        >
          <Text style={styles.primaryButtonText}>
            🎲 اختر اللاعبين وابدأ القرعة لـ ({parsedCount}) أفرقة
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
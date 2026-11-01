import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import styles from '../styles';
import { KIT_COLORS } from '../constants/config';
import { getAlphabetTeamCode, getKitEmojiByHex } from '../utils/helpers';

export default function TeamsScreen({
  savedTeams,
  fetchSavedTeams,
  onCreateTeam,
  onUpdateTeam,
  onDeleteTeam,
  onUseTeamInMatch,
}) {
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#16A34A');
  const [editingTeamId, setEditingTeamId] = useState(null);

  const nextAutoCode = getAlphabetTeamCode(savedTeams.length);

  const handleSubmit = async () => {
    if (editingTeamId) {
      await onUpdateTeam(editingTeamId, {
        name: newTeamName.trim() || `فريق ${nextAutoCode}`,
        kit_color: newTeamColor,
      });
      setEditingTeamId(null);
    } else {
      // إذا ترك الاسم فارغاً، السيرفر والواجهة يسميانه تلقائياً: فريق A, B ... Z, AA
      await onCreateTeam({
        name: newTeamName.trim(),
        kit_color: newTeamColor,
      });
    }
    setNewTeamName('');
  };

  return (
    <View>
      {/* نموذج إنشاء أو تعديل فريق */}
      <View style={styles.card}>
        <Text style={styles.sectionHeaderTitle}>
          {editingTeamId ? '✏️ تعديل بيانات الفريق' : '🛡️ إنشاء فريق جديد'}
        </Text>

        <Text style={styles.customTeamLabel}>
          🏷️ اسم الفريق (اتركه فارغاً ليُسمى تلقائياً: "فريق {nextAutoCode}"):
        </Text>
        <TextInput
          style={[styles.customTeamInput, { marginBottom: 10 }]}
          placeholder={`مثال: فريق الصقور (أو اتركه فارغاً لـ فريق ${nextAutoCode})`}
          placeholderTextColor="#999"
          value={newTeamName}
          onChangeText={setNewTeamName}
          textAlign="right"
        />

        <Text style={styles.customTeamLabel}>🎨 لون طقم الفريق:</Text>
        <View style={[styles.colorSwatchesRow, { justifyContent: 'flex-end', marginVertical: 8 }]}>
          {KIT_COLORS.map((c) => (
            <TouchableOpacity
              key={`team-scr-${c.hex}`}
              style={[
                styles.colorSwatchCircle,
                { backgroundColor: c.hex, width: 28, height: 28, borderRadius: 14 },
                newTeamColor === c.hex && styles.colorSwatchActive,
              ]}
              onPress={() => setNewTeamColor(c.hex)}
            />
          ))}
        </View>

        <View style={styles.buttonRow}>
          {editingTeamId && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setEditingTeamId(null);
                setNewTeamName('');
              }}
            >
              <Text style={styles.clearButtonText}>إلغاء</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
            <Text style={styles.primaryButtonText}>
              {editingTeamId
                ? '💾 حفظ تعديل الفريق'
                : `➕ إضافة الفريق (${newTeamName.trim() || `فريق ${nextAutoCode}`})`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* قائمة الأفرقة (تشمل أفرقة البطولات والأفرقة المخصصة) */}
      <View style={styles.card}>
        <View style={styles.labelRow}>
          <TouchableOpacity onPress={fetchSavedTeams}>
            <Text style={{ fontSize: 11, color: '#0284C7', fontWeight: 'bold' }}>🔄 تحديث</Text>
          </TouchableOpacity>
          <Text style={styles.sectionHeaderTitle}>
            🛡️ جميع الأفرقة المحفوظة وأفرقة البطولات ({savedTeams.length})
          </Text>
        </View>

        {savedTeams.length === 0 ? (
          <Text style={styles.emptyListText}>لا توجد أفرقة محفوظة حالياً.</Text>
        ) : (
          savedTeams.map((t) => {
            const players = Array.isArray(t.players_data) ? t.players_data : [];
            return (
              <View
                key={t.id}
                style={[
                  styles.matchHistoryCard,
                  { borderRightWidth: 5, borderRightColor: t.kit_color || '#16A34A' },
                ]}
              >
                <View style={styles.matchHistoryHeader}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={styles.deleteIconBtn}
                      onPress={() => onDeleteTeam(t.id)}
                    >
                      <Text style={{ fontSize: 12 }}>🗑️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.editIconBtn}
                      onPress={() => {
                        setEditingTeamId(t.id);
                        setNewTeamName(t.name);
                        setNewTeamColor(t.kit_color || '#16A34A');
                      }}
                    >
                      <Text style={{ fontSize: 12 }}>✏️</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.matchDateBadge}>
                    {t.tournament_name ? `🏆 ${t.tournament_name}` : '⚡ فريق مخصص'} • خطة ({t.defenders_count}-{t.midfielders_count}-{t.attackers_count})
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <TouchableOpacity
                    style={styles.saveTeamMiniBtn}
                    onPress={() => onUseTeamInMatch(t)}
                  >
                    <Text style={styles.saveTeamMiniBtnText}>🏟️ تعيين كفريق في الملعب</Text>
                  </TouchableOpacity>

                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1F2937' }}>
                    {getKitEmojiByHex(t.kit_color, 'A')} {t.name}
                  </Text>
                </View>

                {players.length > 0 && (
                  <View
                    style={{
                      backgroundColor: '#F8FAFC',
                      padding: 8,
                      borderRadius: 8,
                      marginTop: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: 'bold',
                        color: '#065F46',
                        textAlign: 'right',
                        marginBottom: 4,
                      }}
                    >
                      👥 تشكيلة الفريق ({players.length} لاعب):
                    </Text>
                    <Text style={{ fontSize: 11, color: '#374151', textAlign: 'right' }}>
                      {players
                        .map(
                          (p) =>
                            `${p.isGoalkeeper || p.position === 'حارس' ? '🧤 ' : ''}${p.name} (${p.rating})`
                        )
                        .join('  •  ')}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}
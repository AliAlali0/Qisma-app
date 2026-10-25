import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Share,
  StatusBar,
  ActivityIndicator,
} from 'react-native';

const API_URL = 'http://192.168.8.2:3000/api/divide-teams';

export default function App() {
  const [rawText, setRawText] = useState('');
  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);
  const [totalExtracted, setTotalExtracted] = useState(0);
  const [goalkeepersCount, setGoalkeepersCount] = useState(0);
  const [wasRounded, setWasRounded] = useState(false);
  const [teamARatingTotal, setTeamARatingTotal] = useState(0);
  const [teamBRatingTotal, setTeamBRatingTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleDivideTeams = async () => {
    if (!rawText.trim()) {
      Alert.alert('تنبيه', 'الرجاء لصق لستة الواتساب أولاً!');
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        Alert.alert('خطأ', data.error || 'حدث خطأ أثناء التحليل');
        setLoading(false);
        return;
      }

      setTeamA(data.teamA);
      setTeamB(data.teamB);
      setTotalExtracted(data.totalExtracted);
      setGoalkeepersCount(data.goalkeepersCount);
      setWasRounded(data.wasRounded);
      setTeamARatingTotal(data.teamARatingTotal);
      setTeamBRatingTotal(data.teamBRatingTotal);
    } catch (error) {
      clearTimeout(timeoutId);
      Alert.alert(
        '❌ فشل الاتصال',
        `تأكد أن سيرفر الباك إند شغال (docker compose up أو node server.js).\nالخطأ: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleShareToWhatsApp = async () => {
    if (teamA.length === 0) return;

    const formatPlayer = (p, i) => `${i + 1}- ${p.name} ${p.isGoalkeeper ? '🧤(حارس)' : ''} [⭐${p.rating}]`;
    const teamAText = teamA.map(formatPlayer).join('\n');
    const teamBText = teamB.map(formatPlayer).join('\n');

    const message = `⚽ *تشكيلة قِسمه المتوازنة (AI & Ratings)* ⚽\n\n🟢 *الفريق الأول (مجموع القوة: ${teamARatingTotal}):*\n${teamAText}\n\n🔵 *الفريق الثاني (مجموع القوة: ${teamBRatingTotal}):*\n${teamBText}`;

    try {
      await Share.share({ message });
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء المشاركة');
    }
  };

  const handleClear = () => {
    setRawText('');
    setTeamA([]);
    setTeamB([]);
    setTotalExtracted(0);
    setGoalkeepersCount(0);
    setWasRounded(false);
    setTeamARatingTotal(0);
    setTeamBRatingTotal(0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B4332" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.title}>⚽ تطبيق قِسمه (الذكاء المتوازن)</Text>
          <Text style={styles.subtitle}>تحليل اللستة، كشف الحراس، وموازنة القوة بالريت (1-99)</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>الصق لستة الواتساب (يمكنك كتابة التقييمات بجانب الأسماء مثل: أحمد 90):</Text>
          <TextInput
            style={styles.textInput}
            multiline
            placeholder="مثال:&#10;١- أحمد (90)&#10;٢- محمد (85)&#10;..."
            placeholderTextColor="#999"
            value={rawText}
            onChangeText={setRawText}
            textAlign="right"
          />

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
                  <Text style={styles.primaryButtonText}> جاري موازنة الفرق...</Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>⚖️ قسّم ووازن الفرق بالـ AI</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {teamA.length > 0 && (
          <View style={styles.resultsContainer}>
            <View style={styles.infoBanner}>
              <Text style={styles.infoText}>
                🤖 تم تحليل ({totalExtracted}) لاعب (منهم {goalkeepersCount} حراس 🧤)
                {wasRounded ? '\n(تمت موازنة العدد الفردي تلقائياً)' : ''}
              </Text>
            </View>

            <View style={styles.teamsWrapper}>
              {/* الفريق الثاني */}
              <View style={[styles.teamCard, styles.teamBCard]}>
                <Text style={styles.teamTitleB}>🔵 الفريق الثاني ({teamB.length})</Text>
                <Text style={styles.teamPower}>قوة الفريق: ⭐ {teamBRatingTotal}</Text>
                {teamB.map((player, index) => (
                  <View
                    key={index}
                    style={[styles.playerRow, player.isGoalkeeper && styles.gkHighlight]}
                  >
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>
                        {player.isGoalkeeper ? '🧤 ' : ''}
                        {player.name}
                      </Text>
                      <Text style={styles.playerPosition}>({player.position})</Text>
                    </View>
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingText}>{player.rating}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* الفريق الأول */}
              <View style={[styles.teamCard, styles.teamACard]}>
                <Text style={styles.teamTitleA}>🟢 الفريق الأول ({teamA.length})</Text>
                <Text style={styles.teamPower}>قوة الفريق: ⭐ {teamARatingTotal}</Text>
                {teamA.map((player, index) => (
                  <View
                    key={index}
                    style={[styles.playerRow, player.isGoalkeeper && styles.gkHighlight]}
                  >
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>
                        {player.isGoalkeeper ? '🧤 ' : ''}
                        {player.name}
                      </Text>
                      <Text style={styles.playerPosition}>({player.position})</Text>
                    </View>
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingText}>{player.rating}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.shareButton} onPress={handleShareToWhatsApp}>
              <Text style={styles.shareButtonText}>📤 إرسال التشكيلة المتوازنة للواتساب</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: {
    backgroundColor: '#1B4332',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#D8F3DC', textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    marginBottom: 16,
  },
  label: { fontSize: 14, fontWeight: 'bold', color: '#1B4332', marginBottom: 10, textAlign: 'right' },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 12,
    padding: 12,
    height: 160,
    textAlignVertical: 'top',
    fontSize: 15,
    color: '#212529',
    marginBottom: 14,
  },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  primaryButton: {
    flex: 3,
    backgroundColor: '#2D6A4F',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  clearButton: {
    flex: 1,
    backgroundColor: '#FFE3E3',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: { color: '#C92A2A', fontSize: 15, fontWeight: 'bold' },
  resultsContainer: { marginTop: 4 },
  infoBanner: {
    backgroundColor: '#D8F3DC',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#95D5B2',
  },
  infoText: { color: '#1B4332', fontWeight: 'bold', textAlign: 'center', fontSize: 13, lineHeight: 20 },
  teamsWrapper: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 16 },
  teamCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    elevation: 2,
    borderTopWidth: 5,
  },
  teamACard: { borderTopColor: '#2D6A4F' },
  teamBCard: { borderTopColor: '#1D3557' },
  teamTitleA: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D6A4F',
    textAlign: 'center',
    marginBottom: 4,
  },
  teamTitleB: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1D3557',
    textAlign: 'center',
    marginBottom: 4,
  },
  teamPower: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E0A96D',
    textAlign: 'center',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F3F5',
  },
  playerInfo: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  playerName: { fontSize: 13, color: '#343A40', textAlign: 'right', fontWeight: '500' },
  playerPosition: { fontSize: 11, color: '#868E96', marginLeft: 4 },
  ratingBadge: {
    backgroundColor: '#E9ECEF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  ratingText: { fontSize: 11, fontWeight: 'bold', color: '#495057' },
  gkHighlight: {
    backgroundColor: '#FFF3BF',
    borderRadius: 6,
  },
  shareButton: {
    backgroundColor: '#25D366',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  shareButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
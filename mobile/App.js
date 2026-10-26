import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const API_URL = 'http://192.168.8.2:3000/api/divide-teams';

// دالة تنظيف الأسماء من أي كلمات تقييم أو مراكز أو أرقام (تعمل على العربي والإنجليزي 100%)
function cleanPlayerName(raw) {
  if (!raw) return 'لاعب';
  let str = String(raw)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/🧤|⚽|🔥|⭐|🏟️|🟢|🔵/g, ' ')
    .replace(/[0-9٠-٩]+/g, ' ')
    .replace(/[\-\–\—\/\\.,،:()\[\]{}+*]/g, ' ');

  const stopWords = new Set([
    'ممتاز', 'اسطورة', 'أسطورة', 'متفوق', 'فنان', 'حريقة', 'محترف', 'لعيب',
    'كويس', 'جيد', 'مجتهد', 'مرتب', 'متوسط', 'يمشي', 'الليلة', 'الحال', 'عادي',
    'فاشل', 'تكملة', 'عدد', 'ضعيف', 'تعبان', 'جدا', 'جداً',
    'حارس', 'مرمى', 'دفاع', 'مدافع', 'وسط', 'محور', 'هجوم', 'مهاجم', 'صانع', 'ظهير',
    'gk', 'st', 'cm', 'cb', 'احتياط', 'انتظار', 'سبير',
  ]);

  const words = str
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0 && !stopWords.has(w.toLowerCase()));

  return words.join(' ') || 'لاعب';
}

// تجهيز وتوزيع اللاعبين على خطوط الملعب مع تنظيف أسمائهم
function prepareTeamForPitch(team) {
  const updated = team.map((p, index) => {
    const cleaned = cleanPlayerName(p.name);
    const isGk = Boolean(p.isGoalkeeper) || p.position === 'حارس';
    return {
      ...p,
      name: cleaned,
      isGoalkeeper: isGk,
      position: isGk ? 'حارس' : p.position || 'وسط',
      uniqueId:
        p.uniqueId ||
        `p-${index}-${cleaned.replace(/\s+/g, '')}-${Math.random().toString(36).substring(2, 7)}`,
    };
  });

  // تأكد من وجود حارس واحد عند بداية التقسيم
  let gks = updated.filter((p) => p.isGoalkeeper || p.position === 'حارس');
  if (gks.length === 0 && updated.length > 0) {
    updated[0].position = 'حارس';
    updated[0].isGoalkeeper = true;
  }

  // توزيع تلقائي للمراكز (دفاع - وسط - هجوم) إذا كان الكل "وسط"
  const outfield = updated.filter((p) => !p.isGoalkeeper && p.position !== 'حارس');
  const defs = outfield.filter((p) => p.position === 'دفاع');
  const atts = outfield.filter((p) => p.position === 'هجوم');
  const mids = outfield.filter((p) => p.position === 'وسط');

  if (outfield.length >= 3 && (defs.length === 0 || atts.length === 0)) {
    const totalOut = outfield.length;
    const targetDef = Math.max(1, Math.round(totalOut * 0.4));
    const targetAtt = Math.max(1, Math.round(totalOut * 0.25));

    let currentDef = defs.length;
    let currentAtt = atts.length;

    for (let p of mids) {
      if (currentDef < targetDef) {
        p.position = 'دفاع';
        currentDef++;
      } else if (currentAtt < targetAtt) {
        p.position = 'هجوم';
        currentAtt++;
      }
    }
  }

  return updated;
}

export default function App() {
  const [rawText, setRawText] = useState('');
  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);
  const [totalExtracted, setTotalExtracted] = useState(0);
  const [goalkeepersCount, setGoalkeepersCount] = useState(0);
  const [wasRounded, setWasRounded] = useState(false);
  const [teamARatingTotal, setTeamARatingTotal] = useState(0);
  const [teamBRatingTotal, setTeamBRatingTotal] = useState(0);
  const [analysisSource, setAnalysisSource] = useState('ai');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pitch');
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  const pitchRef = useRef();

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

      const balancedTeamA = prepareTeamForPitch(data.teamA || []);
      const balancedTeamB = prepareTeamForPitch(data.teamB || []);

      setTeamA(balancedTeamA);
      setTeamB(balancedTeamB);
      setTotalExtracted(data.totalExtracted || 0);
      setGoalkeepersCount(data.goalkeepersCount || 0);
      setWasRounded(data.wasRounded || false);
      setTeamARatingTotal(balancedTeamA.reduce((s, p) => s + p.rating, 0));
      setTeamBRatingTotal(balancedTeamB.reduce((s, p) => s + p.rating, 0));
      setAnalysisSource(data.analysisSource || 'ai');
      setSelectedPlayerId(null);
      setActiveTab('pitch');
    } catch (error) {
      clearTimeout(timeoutId);
      Alert.alert('❌ فشل الاتصال', `تأكد أن سيرفر الباك إند شغال.\nالخطأ: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const recalculateTotals = (newA, newB) => {
    const sumA = newA.reduce((s, p) => s + p.rating, 0);
    const sumB = newB.reduce((s, p) => s + p.rating, 0);
    setTeamARatingTotal(sumA);
    setTeamBRatingTotal(sumB);
  };

  // تبديل لاعبين (يتبادلون الفريق + المركز في الملعب بما في ذلك الحارس!)
  const handlePlayerPress = (clickedPlayerId) => {
    if (!selectedPlayerId) {
      setSelectedPlayerId(clickedPlayerId);
    } else {
      if (selectedPlayerId === clickedPlayerId) {
        setSelectedPlayerId(null);
        return;
      }

      let newA = [...teamA];
      let newB = [...teamB];

      let idxA1 = newA.findIndex((p) => p.uniqueId === selectedPlayerId);
      let idxB1 = newB.findIndex((p) => p.uniqueId === selectedPlayerId);
      let idxA2 = newA.findIndex((p) => p.uniqueId === clickedPlayerId);
      let idxB2 = newB.findIndex((p) => p.uniqueId === clickedPlayerId);

      let player1 = idxA1 !== -1 ? newA[idxA1] : newB[idxB1];
      let player2 = idxA2 !== -1 ? newA[idxA2] : newB[idxB2];

      // تبادل المراكز ومهام الحراسة بين اللاعبين ليأخذ كل واحد مكان الآخر في الملعب
      const swappedPlayer1 = {
        ...player1,
        position: player2.position,
        isGoalkeeper: player2.isGoalkeeper || player2.position === 'حارس',
      };
      const swappedPlayer2 = {
        ...player2,
        position: player1.position,
        isGoalkeeper: player1.isGoalkeeper || player1.position === 'حارس',
      };

      if (idxA1 !== -1) newA[idxA1] = swappedPlayer2;
      else newB[idxB1] = swappedPlayer2;

      if (idxA2 !== -1) newA[idxA2] = swappedPlayer1;
      else newB[idxB2] = swappedPlayer1;

      setTeamA(newA);
      setTeamB(newB);
      recalculateTotals(newA, newB);
      setSelectedPlayerId(null);
    }
  };

  // تغيير مركز اللاعب عند الضغط على اسمه تحت الكرت (أو ضغطة مطولة على الكرت)
  const cyclePlayerPosition = (targetTeamKey, uniqueId) => {
    const positionsOrder = ['وسط', 'دفاع', 'هجوم', 'حارس'];
    let newA = [...teamA];
    let newB = [...teamB];

    let targetList = targetTeamKey === 'A' ? newA : newB;
    let idx = targetList.findIndex((p) => p.uniqueId === uniqueId);
    if (idx === -1) return;

    let player = { ...targetList[idx] };
    let currentPos = player.isGoalkeeper ? 'حارس' : player.position;
    let nextPosIdx = (positionsOrder.indexOf(currentPos) + 1) % positionsOrder.length;
    let nextPos = positionsOrder[nextPosIdx];

    // إذا حولناه إلى حارس وكان هناك حارس موجود، نضع الحارس القديم في مركز هذا اللاعب
    if (nextPos === 'حارس') {
      let existingGkIdx = targetList.findIndex(
        (p, i) => (p.isGoalkeeper || p.position === 'حارس') && i !== idx
      );
      if (existingGkIdx !== -1) {
        targetList[existingGkIdx] = {
          ...targetList[existingGkIdx],
          position: currentPos === 'حارس' ? 'دفاع' : currentPos,
          isGoalkeeper: false,
        };
      }
    }

    player.position = nextPos;
    player.isGoalkeeper = nextPos === 'حارس';
    targetList[idx] = player;

    setTeamA(newA);
    setTeamB(newB);
    recalculateTotals(newA, newB);
  };

  const handleShareAsImage = async () => {
    try {
      if (!pitchRef.current) return;
      const uri = await captureRef(pitchRef, {
        format: 'png',
        quality: 1,
      });

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'مشاركة تشكيلة قِسمه',
        utt: 'public.png',
      });
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء تصوير التشكيلة: ' + error.message);
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
    setSelectedPlayerId(null);
  };

  const getFifaPosCode = (pos) => {
    if (pos === 'حارس') return 'GK';
    if (pos === 'دفاع') return 'CB';
    if (pos === 'هجوم') return 'ST';
    return 'CM';
  };

  const getCardStyleByRating = (rating, isGk) => {
    if (isGk) return { bg: '#F97316', border: '#FED7AA', text: '#FFFFFF' };
    if (rating >= 85) return { bg: '#EAB308', border: '#FEF08A', text: '#1F2937' };
    if (rating >= 72) return { bg: '#CBD5E1', border: '#F8FAFC', text: '#1E293B' };
    return { bg: '#B45309', border: '#FDE68A', text: '#FFFFFF' };
  };

  const renderFifaCard = (player, teamKey) => {
    const isGk = player.position === 'حارس' || player.isGoalkeeper;
    const cardTheme = getCardStyleByRating(player.rating, isGk);
    const posCode = getFifaPosCode(isGk ? 'حارس' : player.position);
    const kitEmoji = isGk ? '🧤' : teamKey === 'A' ? '🟢' : '🔵';
    const isSelected = selectedPlayerId === player.uniqueId;

    return (
      <View key={player.uniqueId} style={styles.fifaPlayerWrapper}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handlePlayerPress(player.uniqueId)}
          onLongPress={() => cyclePlayerPosition(teamKey, player.uniqueId)}
          style={[
            styles.fifaCardBody,
            { backgroundColor: cardTheme.bg, borderColor: cardTheme.border },
            isSelected && styles.selectedCardForSwap,
          ]}
        >
          <View style={styles.fifaCardTopRow}>
            <View style={styles.fifaRatingCol}>
              <Text style={[styles.fifaRatingNum, { color: cardTheme.text }]}>{player.rating}</Text>
              <Text style={[styles.fifaPosCode, { color: cardTheme.text }]}>{posCode}</Text>
            </View>
            <Text style={styles.fifaKitIcon}>{kitEmoji}</Text>
          </View>
          <View style={styles.fifaCardInnerLine} />
        </TouchableOpacity>

        <TouchableOpacity
          hitSlop={{ top: 4, bottom: 8, left: 6, right: 6 }}
          onPress={() => cyclePlayerPosition(teamKey, player.uniqueId)}
          style={[styles.fifaNamePlate, isSelected && styles.selectedNamePlate]}
        >
          <Text style={styles.fifaPlayerName} numberOfLines={1}>
            {player.name}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getTeamLines = (team) => {
    const gks = team.filter((p) => p.position === 'حارس' || p.isGoalkeeper);
    const defs = team.filter((p) => !p.isGoalkeeper && p.position === 'دفاع');
    const mids = team.filter((p) => !p.isGoalkeeper && p.position === 'وسط');
    const atts = team.filter((p) => !p.isGoalkeeper && p.position === 'هجوم');
    return { gks, defs, mids, atts };
  };

  const linesB = getTeamLines(teamB);
  const linesA = getTeamLines(teamA);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B4332" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.title}>⚽ تطبيق قِسمه</Text>
          <Text style={styles.subtitle}>ملعب فيفا • تبديل الحراس والمراكز • أسماء صافية</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>الصق لستة الواتساب هنا:</Text>
          <TextInput
            style={styles.textInput}
            multiline
            placeholder="الصق رسالة الواتساب هنا..."
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
                  <Text style={styles.primaryButtonText}> جاري التوزيع...</Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>⚡ قسّم واعرض الملعب</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {teamA.length > 0 && (
          <View style={styles.resultsContainer}>
            
            <View
              style={[
                styles.infoBanner,
                analysisSource === 'local' && styles.infoBannerLocal,
              ]}
            >
              <Text
                style={[
                  styles.infoText,
                  analysisSource === 'local' && styles.infoTextLocal,
                ]}
              >
                {analysisSource === 'ai'
                  ? `🤖 تم التحليل بالذكاء الاصطناعي (${totalExtracted} لاعب)`
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

                  {/* ===== النصف العلوي: الفريق الثاني (🔵) ===== */}
                  <View style={styles.pitchHalf}>
                    <View style={styles.teamHalfHeader}>
                      <Text style={styles.teamHalfTitle}>🔵 الفريق الثاني (⭐ {teamBRatingTotal})</Text>
                    </View>

                    <View style={styles.pitchRow}>
                      {linesB.gks.map((p) => renderFifaCard(p, 'B'))}
                    </View>
                    <View style={styles.pitchRow}>
                      {linesB.defs.map((p) => renderFifaCard(p, 'B'))}
                    </View>
                    <View style={styles.pitchRow}>
                      {linesB.mids.map((p) => renderFifaCard(p, 'B'))}
                    </View>
                    <View style={styles.pitchRow}>
                      {linesB.atts.map((p) => renderFifaCard(p, 'B'))}
                    </View>
                  </View>

                  {/* ===== النصف السفلي: الفريق الأول (🟢) ===== */}
                  <View style={styles.pitchHalf}>
                    <View style={styles.pitchRow}>
                      {linesA.atts.map((p) => renderFifaCard(p, 'A'))}
                    </View>
                    <View style={styles.pitchRow}>
                      {linesA.mids.map((p) => renderFifaCard(p, 'A'))}
                    </View>
                    <View style={styles.pitchRow}>
                      {linesA.defs.map((p) => renderFifaCard(p, 'A'))}
                    </View>
                    <View style={styles.pitchRow}>
                      {linesA.gks.map((p) => renderFifaCard(p, 'A'))}
                    </View>

                    <View style={styles.teamHalfHeaderBottom}>
                      <Text style={styles.teamHalfTitle}>🟢 الفريق الأول (⭐ {teamARatingTotal})</Text>
                    </View>
                  </View>

                </View>

                <Text style={styles.pitchHintText}>
                  💡 اضغط أي كرتين لتبديل مراكزهما (حتى مع الحارس) • اضغط اسم اللاعب لتغيير مركزه
                </Text>
              </View>
            ) : (
              /* 📋 القائمة التفصيلية للفريقين */
              <View style={styles.teamsColumnWrapper}>
                <View style={[styles.teamCard, styles.teamBCard]}>
                  <Text style={styles.teamTitleB}>🔵 الفريق الثاني ({teamB.length})</Text>
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

                <View style={[styles.teamCard, styles.teamACard]}>
                  <Text style={styles.teamTitleA}>🟢 الفريق الأول ({teamA.length})</Text>
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

            <TouchableOpacity style={styles.shareImageButton} onPress={handleShareAsImage}>
              <Text style={styles.shareImageButtonText}>📸 مشاركة تشكيلة الملعب كصورة</Text>
            </TouchableOpacity>

          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  scrollContent: { padding: 12, paddingBottom: 30 },
  header: {
    backgroundColor: '#1B4332',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 17, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 2 },
  subtitle: { fontSize: 11, color: '#D8F3DC', textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    elevation: 2,
    marginBottom: 10,
  },
  label: { fontSize: 12, fontWeight: 'bold', color: '#1B4332', marginBottom: 6, textAlign: 'right' },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 10,
    padding: 10,
    height: 80,
    textAlignVertical: 'top',
    fontSize: 13,
    color: '#212529',
    marginBottom: 10,
  },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  primaryButton: {
    flex: 3,
    backgroundColor: '#2D6A4F',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  clearButton: {
    flex: 1,
    backgroundColor: '#FFE3E3',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: { color: '#C92A2A', fontSize: 14, fontWeight: 'bold' },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  resultsContainer: { marginTop: 2 },
  infoBanner: {
    backgroundColor: '#D8F3DC',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#95D5B2',
  },
  infoBannerLocal: { backgroundColor: '#FFF3BF', borderColor: '#FCC419' },
  infoText: { color: '#1B4332', fontWeight: 'bold', textAlign: 'center', fontSize: 11, lineHeight: 16 },
  infoTextLocal: { color: '#856404' },
  tabRow: { flexDirection: 'row', marginBottom: 8, gap: 6 },
  tabButton: {
    flex: 1,
    backgroundColor: '#E9ECEF',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: { backgroundColor: '#1B4332' },
  tabText: { fontSize: 12, fontWeight: 'bold', color: '#495057' },
  activeTabText: { color: '#FFFFFF' },

  unifiedPitchWrapper: { marginBottom: 10 },
  unifiedSoccerPitch: {
    backgroundColor: '#1E5631',
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  pitchCenterLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 1,
  },
  pitchCenterCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 60,
    height: 60,
    marginTop: -30,
    marginLeft: -30,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    zIndex: 1,
  },
  pitchCenterSpot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 5,
    height: 5,
    marginTop: -2.5,
    marginLeft: -2.5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
    zIndex: 2,
  },
  topPenaltyArea: {
    position: 'absolute',
    top: 0,
    left: '28%',
    width: '44%',
    height: 38,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    zIndex: 1,
  },
  bottomPenaltyArea: {
    position: 'absolute',
    bottom: 0,
    left: '28%',
    width: '44%',
    height: 38,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    zIndex: 1,
  },
  pitchHalf: {
    flex: 1,
    paddingVertical: 4,
    justifyContent: 'space-around',
    zIndex: 5,
  },
  teamHalfHeader: { alignItems: 'center', marginBottom: 2 },
  teamHalfHeaderBottom: { alignItems: 'center', marginTop: 2 },
  teamHalfTitle: { color: '#D8F3DC', fontSize: 11, fontWeight: 'bold' },
  pitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginVertical: 2,
  },

  fifaPlayerWrapper: {
    alignItems: 'center',
    marginHorizontal: 3,
    width: 66,
  },
  fifaCardBody: {
    width: 54,
    height: 54,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 13,
    borderWidth: 1.5,
    paddingHorizontal: 4,
    paddingTop: 3,
    justifyContent: 'space-between',
    elevation: 3,
  },
  selectedCardForSwap: {
    borderWidth: 2.5,
    borderColor: '#38BDF8',
    backgroundColor: '#38BDF8',
  },
  fifaCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fifaRatingCol: { alignItems: 'center' },
  fifaRatingNum: { fontSize: 12, fontWeight: '900', lineHeight: 13 },
  fifaPosCode: { fontSize: 8, fontWeight: 'bold' },
  fifaKitIcon: { fontSize: 14 },
  fifaCardInnerLine: { height: 1.5, backgroundColor: 'rgba(0,0,0,0.2)', marginBottom: 2 },
  fifaNamePlate: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#EAB308',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 3,
    marginTop: 2,
    width: 64,
    alignItems: 'center',
  },
  selectedNamePlate: { backgroundColor: '#0284C7', borderColor: '#FFFFFF' },
  fifaPlayerName: { color: '#FFFFFF', fontSize: 9, fontWeight: 'bold', textAlign: 'center' },
  pitchHintText: { fontSize: 10, color: '#495057', textAlign: 'center', marginTop: 4, fontWeight: '500' },

  teamsColumnWrapper: { flexDirection: 'column', gap: 10, marginBottom: 10 },
  teamCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    elevation: 2,
    borderTopWidth: 5,
  },
  teamACard: { borderTopColor: '#2D6A4F' },
  teamBCard: { borderTopColor: '#1D3557' },
  teamTitleA: { fontSize: 13, fontWeight: 'bold', color: '#2D6A4F', textAlign: 'right', marginBottom: 1 },
  teamTitleB: { fontSize: 13, fontWeight: 'bold', color: '#1D3557', textAlign: 'right', marginBottom: 1 },
  teamPower: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D97706',
    textAlign: 'right',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F3F5',
  },
  playerInfo: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 6 },
  playerName: { fontSize: 12, color: '#1F2937', textAlign: 'right', fontWeight: 'bold' },
  playerPosition: { fontSize: 10, color: '#6B7280' },
  ratingBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingText: { fontSize: 11, fontWeight: 'bold', color: '#374151' },
  
  shareImageButton: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 6,
    elevation: 2,
  },
  shareImageButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
});
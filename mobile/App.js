import React, { useState, useRef, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Share,
  StatusBar,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as ScreenCapture from 'expo-screen-capture';

import styles from './styles';
import {
  API_URL,
  PLAYERS_API_URL,
  DRAFT_BALANCE_URL,
  MATCHES_API_URL,
  TOURNAMENTS_API_URL,
  TEAMS_API_URL,
  AUTH_API_URL,
  KIT_COLORS,
  GUEST_TEMPLATE,
} from './constants/config';
import {
  prepareTeamForPitch,
  createEmptyFormationSlots,
  computeTournamentStandings,
  getKitEmojiByHex,
} from './utils/helpers';

import HeaderBar from './components/HeaderBar';
import AppModals from './components/AppModals';

// الشاشات
import HomeScreen from './screens/HomeScreen';
import CreateTournamentScreen from './screens/CreateTournamentScreen';
import TournamentsListScreen from './screens/TournamentsListScreen';
import TournamentDetailsScreen from './screens/TournamentDetailsScreen';
import TeamsScreen from './screens/TeamsScreen';
import MatchesScreen from './screens/MatchesScreen';
import PlayersScreen from './screens/PlayersScreen';
import DraftScreen from './screens/DraftScreen';
import DivideScreen from './screens/DivideScreen';

export default function App() {
  const [userRole, setUserRole] = useState('guest');
  const [currentUsername, setCurrentUsername] = useState('admin');
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authUsernameInput, setAuthUsernameInput] = useState('admin');
  const [authPasswordInput, setAuthPasswordInput] = useState('1234');

  // الواجهة الافتراضية هي القائمة الرئيسية 'home'
  const [mainScreen, setMainScreen] = useState('home');
  const [screenHistory, setScreenHistory] = useState([]);

  // دالة التنقل مع حفظ السجل للرجوع
  const navigateTo = (screen) => {
    setScreenHistory((prev) => [...prev, mainScreen]);
    setMainScreen(screen);
  };

  // دالة الرجوع للشاشة السابقة
  const goBack = () => {
    setScreenHistory((prev) => {
      if (prev.length === 0) {
        setMainScreen('home');
        return [];
      }
      const newHistory = [...prev];
      const previousScreen = newHistory.pop();
      setMainScreen(previousScreen);
      return newHistory;
    });
  };

  const [teamAName, setTeamAName] = useState('فريق A');
  const [teamBName, setTeamBName] = useState('فريق B');
  const [teamAColor, setTeamAColor] = useState('#16A34A');
  const [teamBColor, setTeamBColor] = useState('#2563EB');
  const [savedTeams, setSavedTeams] = useState([]);

  const [rawText, setRawText] = useState(GUEST_TEMPLATE);
  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);
  const [totalExtracted, setTotalExtracted] = useState(0);
  const [teamARatingTotal, setTeamARatingTotal] = useState(0);
  const [teamBRatingTotal, setTeamBRatingTotal] = useState(0);
  const [analysisSource, setAnalysisSource] = useState('local');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pitch');
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  const [savedPlayers, setSavedPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [playerRatingInput, setPlayerRatingInput] = useState('80');
  const [primaryPosInput, setPrimaryPosInput] = useState('وسط');
  const [secondaryPosInput, setSecondaryPosInput] = useState([]);

  const [draftDefCount, setDraftDefCount] = useState(2);
  const [draftMidCount, setDraftMidCount] = useState(2);
  const [draftAttCount, setDraftAttCount] = useState(1);
  const [draftSlotsA, setDraftSlotsA] = useState(() => createEmptyFormationSlots('A', 2, 2, 1));
  const [draftSlotsB, setDraftSlotsB] = useState(() => createEmptyFormationSlots('B', 2, 2, 1));
  const [activeSlotForModal, setActiveSlotForModal] = useState(null);
  const [selectedDraftSlotId, setSelectedDraftSlotId] = useState(null);
  const [multiSelectModalVisible, setMultiSelectModalVisible] = useState(false);
  const [selectedPlayerIdsForAuto, setSelectedPlayerIdsForAuto] = useState([]);
  const [draftLoading, setDraftLoading] = useState(false);

  const [matchesList, setMatchesList] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [scoreModalMatch, setScoreModalMatch] = useState(null);
  const [modalScoreA, setModalScoreA] = useState('');
  const [modalScoreB, setModalScoreB] = useState('');
  const [selectedMvpName, setSelectedMvpName] = useState('');
  const [applyRatingBoost, setApplyRatingBoost] = useState(true);

  const [tournamentName, setTournamentName] = useState('بطولة قِسمه الكبرى 🏆');
  const [tournamentType, setTournamentType] = useState('groups_knockout');
  const [tournamentTeamsCountInput, setTournamentTeamsCountInput] = useState('4');
  const [tournamentPlayersModal, setTournamentPlayersModal] = useState(false);
  const [selectedPlayerIdsForTourney, setSelectedPlayerIdsForTourney] = useState([]);
  const [activeTournament, setActiveTournament] = useState(null);
  const [tournamentsHistory, setTournamentsHistory] = useState([]);
  const [tourneyLoading, setTourneyLoading] = useState(false);
  const [tourneyScoreModalFixture, setTourneyScoreModalFixture] = useState(null);
  const [tourneyScoreA, setTourneyScoreA] = useState('');
  const [tourneyScoreB, setTourneyScoreB] = useState('');

  const pitchRef = useRef();
  const draftPitchRef = useRef();

  const isLoggedUser = userRole === 'registered' || userRole === 'subscriber';
  const isSubscriber = userRole === 'subscriber';
  const parsedTournamentTeamsCount = Math.max(parseInt(tournamentTeamsCountInput, 10) || 2, 2);

  useEffect(() => {
    let subscription;
    const updateScreenProtection = async () => {
      try {
        if (userRole === 'guest') {
          await ScreenCapture.preventScreenCaptureAsync();
          subscription = ScreenCapture.addScreenshotListener(() => {
            Alert.alert('🚫 تصوير الشاشة غير متاح للضيف', 'سجّل دخولك لتصوير التشكيلة!');
          });
        } else {
          await ScreenCapture.allowScreenCaptureAsync();
        }
      } catch (err) {}
    };
    updateScreenProtection();
    return () => {
      if (subscription) subscription.remove();
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, [userRole]);

  useEffect(() => {
    if (isLoggedUser) {
      fetchSavedPlayers();
      fetchMatchesList();
      fetchTournamentsList();
      fetchSavedTeams();
    }
  }, [userRole]);

  const fetchSavedPlayers = async () => {
    setLoadingPlayers(true);
    try {
      const res = await fetch(PLAYERS_API_URL);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setSavedPlayers(data);
    } catch (err) {
    } finally {
      setLoadingPlayers(false);
    }
  };

  const fetchSavedTeams = async () => {
    try {
      const res = await fetch(TEAMS_API_URL);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setSavedTeams(data);
    } catch (err) {}
  };

  const fetchMatchesList = async () => {
    setLoadingMatches(true);
    try {
      const res = await fetch(MATCHES_API_URL);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setMatchesList(data);
    } catch (err) {
    } finally {
      setLoadingMatches(false);
    }
  };

  const fetchTournamentsList = async () => {
    try {
      const res = await fetch(TOURNAMENTS_API_URL);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setTournamentsHistory(data);
        if (data.length > 0 && !activeTournament) setActiveTournament(data[0]);
      }
    } catch (err) {}
  };

  const handleLoginSubmit = async (chosenRole) => {
    try {
      const res = await fetch(AUTH_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUsernameInput,
          password: authPasswordInput,
          role: chosenRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUsername(data.username);
        setUserRole(data.role);
        setAuthModalVisible(false);
      }
    } catch (err) {
      setUserRole(chosenRole);
      setAuthModalVisible(false);
    }
  };

  const handleCreateTeamRecord = async (payload) => {
    try {
      const res = await fetch(TEAMS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.name,
          kit_color: payload.kit_color,
          defenders_count: payload.defenders_count !== undefined ? payload.defenders_count : draftDefCount,
          midfielders_count: payload.midfielders_count !== undefined ? payload.midfielders_count : draftMidCount,
          attackers_count: payload.attackers_count !== undefined ? payload.attackers_count : draftAttCount,
          players_data: payload.players_data || [],
        }),
      });
      if (res.ok) await fetchSavedTeams();
    } catch (err) {}
  };

  const handleUpdateTeamRecord = async (teamId, payload) => {
    try {
      const res = await fetch(`${TEAMS_API_URL}/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) await fetchSavedTeams();
    } catch (err) {}
  };

  const handleDeleteTeamRecord = async (teamId) => {
    try {
      await fetch(`${TEAMS_API_URL}/${teamId}`, { method: 'DELETE' });
      setSavedTeams((prev) => prev.filter((t) => t.id !== teamId));
    } catch (err) {}
  };

  const handleSavePresetTeam = async (teamKey) => {
    const nameToSave = teamKey === 'A' ? teamAName : teamBName;
    const colorToSave = teamKey === 'A' ? teamAColor : teamBColor;
    await handleCreateTeamRecord({ name: nameToSave, kit_color: colorToSave });
    Alert.alert('✅ تم حفظ الفريق', 'تم حفظ الفريق في شاشة الأفرقة (Teams)!');
  };

  const applyPresetTeam = (preset, targetTeamKey = 'A') => {
    // 1. استخراج وتحليل بيانات اللاعبين بأمان (سواء جاءت كمصفوفة أو كنص JSON)
    let players = [];
    if (Array.isArray(preset.players_data)) {
      players = [...preset.players_data];
    } else if (typeof preset.players_data === 'string') {
      try {
        const parsed = JSON.parse(preset.players_data);
        if (Array.isArray(parsed)) players = parsed;
      } catch (e) {
        players = [];
      }
    }

    // تطبيع بيانات اللاعبين
    const cleanPlayers = players.map((p, idx) => {
      const pos = p.position || p.primary_position || 'وسط';
      const isGk = Boolean(p.isGoalkeeper) || pos === 'حارس' || pos === 'GK';
      let normPos = 'وسط';
      if (isGk) normPos = 'حارس';
      else if (pos === 'دفاع' || pos === 'CB') normPos = 'دفاع';
      else if (pos === 'هجوم' || pos === 'ST') normPos = 'هجوم';

      return {
        ...p,
        id: p.id || `p-preset-${idx}-${p.name}`,
        name: p.name || `لاعب ${idx + 1}`,
        rating: Number(p.rating) >= 40 ? Math.round(Number(p.rating)) : isGk ? 80 : 75,
        position: normPos,
        isGoalkeeper: isGk,
      };
    });

    let gks = cleanPlayers.filter((p) => p.isGoalkeeper);
    let defs = cleanPlayers.filter((p) => !p.isGoalkeeper && p.position === 'دفاع');
    let mids = cleanPlayers.filter((p) => !p.isGoalkeeper && p.position === 'وسط');
    let atts = cleanPlayers.filter((p) => !p.isGoalkeeper && p.position === 'هجوم');

    // إذا لم يكن هناك حارس وكان هناك لاعبين، نجعل الأول حارساً
    if (gks.length === 0 && cleanPlayers.length > 0) {
      const first = { ...cleanPlayers[0], isGoalkeeper: true, position: 'حارس' };
      gks = [first];
      defs = defs.filter((p) => p !== cleanPlayers[0]);
      mids = mids.filter((p) => p !== cleanPlayers[0]);
      atts = atts.filter((p) => p !== cleanPlayers[0]);
    }

    // حساب عدد المراكز بحيث يتسع لجميع اللاعبين المختارين
    const dCount = Math.max(defs.length, Number(preset.defenders_count) || draftDefCount, 1);
    const mCount = Math.max(mids.length, Number(preset.midfielders_count) || draftMidCount, 1);
    const aCount = Math.max(atts.length, Number(preset.attackers_count) || draftAttCount, 1);

    setDraftDefCount(dCount);
    setDraftMidCount(mCount);
    setDraftAttCount(aCount);

    // بناء الخانات للفريق المستهدف وتعبئتها باللاعبين
    const filledSlots = [];
    filledSlots.push({
      slotId: `${targetTeamKey}-GK-0`,
      teamKey: targetTeamKey,
      position: 'حارس',
      isGoalkeeper: true,
      player: gks[0] || null,
    });

    for (let i = 0; i < dCount; i++) {
      filledSlots.push({
        slotId: `${targetTeamKey}-DEF-${i}`,
        teamKey: targetTeamKey,
        position: 'دفاع',
        isGoalkeeper: false,
        player: defs[i] || null,
      });
    }

    for (let i = 0; i < mCount; i++) {
      filledSlots.push({
        slotId: `${targetTeamKey}-MID-${i}`,
        teamKey: targetTeamKey,
        position: 'وسط',
        isGoalkeeper: false,
        player: mids[i] || null,
      });
    }

    for (let i = 0; i < aCount; i++) {
      filledSlots.push({
        slotId: `${targetTeamKey}-ATT-${i}`,
        teamKey: targetTeamKey,
        position: 'هجوم',
        isGoalkeeper: false,
        player: atts[i] || null,
      });
    }

    // إعادة ضبط أو مواءمة خانات الفريق الآخر لتتوافق مع عدد المراكز الجديد
    const otherTeamKey = targetTeamKey === 'A' ? 'B' : 'A';
    const rebuildOtherTeam = (oldSlots) => {
      const existingGk = oldSlots.find((s) => s.position === 'حارس')?.player || null;
      const existingDefs = oldSlots.filter((s) => s.position === 'دفاع' && s.player).map((s) => s.player);
      const existingMids = oldSlots.filter((s) => s.position === 'وسط' && s.player).map((s) => s.player);
      const existingAtts = oldSlots.filter((s) => s.position === 'هجوم' && s.player).map((s) => s.player);

      const slots = [];
      slots.push({
        slotId: `${otherTeamKey}-GK-0`,
        teamKey: otherTeamKey,
        position: 'حارس',
        isGoalkeeper: true,
        player: existingGk,
      });
      for (let i = 0; i < dCount; i++) {
        slots.push({
          slotId: `${otherTeamKey}-DEF-${i}`,
          teamKey: otherTeamKey,
          position: 'دفاع',
          isGoalkeeper: false,
          player: existingDefs[i] || null,
        });
      }
      for (let i = 0; i < mCount; i++) {
        slots.push({
          slotId: `${otherTeamKey}-MID-${i}`,
          teamKey: otherTeamKey,
          position: 'وسط',
          isGoalkeeper: false,
          player: existingMids[i] || null,
        });
      }
      for (let i = 0; i < aCount; i++) {
        slots.push({
          slotId: `${otherTeamKey}-ATT-${i}`,
          teamKey: otherTeamKey,
          position: 'هجوم',
          isGoalkeeper: false,
          player: existingAtts[i] || null,
        });
      }
      return slots;
    };

    if (targetTeamKey === 'A') {
      setTeamAName(preset.name);
      setTeamAColor(preset.kit_color || '#16A34A');
      setDraftSlotsA(filledSlots);
      setDraftSlotsB((prev) => rebuildOtherTeam(prev));
    } else {
      setTeamBName(preset.name);
      setTeamBColor(preset.kit_color || '#2563EB');
      setDraftSlotsB(filledSlots);
      setDraftSlotsA((prev) => rebuildOtherTeam(prev));
    }

    setSelectedDraftSlotId(null);
  };

  const toggleSelectPlayerForTourney = (id) => {
    setSelectedPlayerIdsForTourney((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // إنشاء البطولة ثم الانتقال تلقائياً إلى شاشة تفاصيل البطولة + تحديث سجل الأفرقة
  const handleGenerateTournament = async () => {
    const chosenPlayers = savedPlayers.filter((p) => selectedPlayerIdsForTourney.includes(p.id));
    if (chosenPlayers.length < parsedTournamentTeamsCount) {
      Alert.alert(
        'تنبيه',
        `اخترت ${parsedTournamentTeamsCount} أفرقة، يرجى تحديد ${parsedTournamentTeamsCount} لاعبين على الأقل!`
      );
      return;
    }

    setTourneyLoading(true);
    try {
      const res = await fetch(`${TOURNAMENTS_API_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tournamentName.trim() || 'بطولة قِسمه 🏆',
          tournamentType,
          teamsCount: parsedTournamentTeamsCount,
          players: chosenPlayers,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('خطأ', data.error || 'فشل إنشاء البطولة');
        return;
      }

      setActiveTournament(data);
      setTournamentsHistory((prev) => [data, ...prev.filter((t) => t.id !== data.id)]);
      setTournamentPlayersModal(false);
      await fetchSavedTeams(); // تحديث سجل الأفرقة لأن أفرقة البطولة انحفظت هناك تلقائياً

      // نقل المستخدم مباشرة إلى شاشة تفاصيل البطولة الجديدة
      navigateTo('tournament_details');
    } catch (err) {
      Alert.alert('خطأ اتصال', 'تعذر الاتصال بالسيرفر');
    } finally {
      setTourneyLoading(false);
    }
  };

  const handleDeleteTournament = async (tourneyId) => {
    try {
      await fetch(`${TOURNAMENTS_API_URL}/${tourneyId}`, { method: 'DELETE' });
      setTournamentsHistory((prev) => prev.filter((t) => t.id !== tourneyId));
      if (activeTournament?.id === tourneyId) setActiveTournament(null);
    } catch (err) {}
  };

  const handleSaveTourneyFixtureScore = async () => {
    if (!activeTournament || !tourneyScoreModalFixture) return;
    const sA = tourneyScoreA.trim() === '' ? null : Number(tourneyScoreA);
    const sB = tourneyScoreB.trim() === '' ? null : Number(tourneyScoreB);

    if (tourneyScoreModalFixture.stage !== 'group' && sA !== null && sB !== null && sA === sB) {
      Alert.alert('مباراة إقصائية!', 'في خروج المغلوب لا يمكن التعادل، حدد الفائز!');
      return;
    }

    let updatedFixtures = (activeTournament.fixtures_data || []).map((f) => {
      if (f.matchId !== tourneyScoreModalFixture.matchId) return f;
      let winnerId =
        sA !== null && sB !== null ? (sA > sB ? f.teamAId : sB > sA ? f.teamBId : null) : null;
      return { ...f, scoreA: sA, scoreB: sB, winnerId };
    });

    const koRoundMatches = updatedFixtures.filter(
      (f) => f.stage === 'knockout_r1' || f.stage === 'knockout_bye'
    );
    const hasFinalAlready = updatedFixtures.some((f) => f.stage === 'final');

    if (
      koRoundMatches.length >= 2 &&
      !hasFinalAlready &&
      koRoundMatches.every((f) => f.winnerId !== null)
    ) {
      const winnersIds = koRoundMatches.map((f) => f.winnerId);
      const teamsMap = {};
      (activeTournament.teams_data || []).forEach((t) => (teamsMap[t.teamId] = t.name));

      for (let i = 0; i < winnersIds.length; i += 2) {
        if (i + 1 < winnersIds.length) {
          updatedFixtures.push({
            matchId: `FINAL-${Date.now()}-${i}`,
            stage: 'final',
            stageLabel: winnersIds.length === 2 ? '🏆 المباراة النهائية' : 'الدور الإقصائي المتقدم',
            teamAId: winnersIds[i],
            teamAName: teamsMap[winnersIds[i]] || 'المتأهل 1',
            teamBId: winnersIds[i + 1],
            teamBName: teamsMap[winnersIds[i + 1]] || 'المتأهل 2',
            scoreA: null,
            scoreB: null,
            winnerId: null,
          });
        }
      }
    }

    try {
      const res = await fetch(`${TOURNAMENTS_API_URL}/${activeTournament.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixtures_data: updatedFixtures }),
      });
      const updatedTourney = await res.json();
      if (res.ok) {
        setActiveTournament(updatedTourney);
        setTournamentsHistory((prev) =>
          prev.map((t) => (t.id === updatedTourney.id ? updatedTourney : t))
        );
        setTourneyScoreModalFixture(null);
      }
    } catch (err) {}
  };

  const handleAdvanceGroupToKnockout = async () => {
    if (!activeTournament) return;
    const standings = computeTournamentStandings(
      activeTournament.teams_data || [],
      activeTournament.fixtures_data || []
    );
    if (
      (activeTournament.fixtures_data || []).some(
        (f) => f.stage === 'knockout_r1' || f.stage === 'final'
      )
    ) {
      Alert.alert('تنبيه', 'تم توليد مرحلة الإقصاء مسبقاً!');
      return;
    }

    let newKoFixtures = [];
    if (standings.length >= 4) {
      newKoFixtures = [
        {
          matchId: `KO-SF1-${Date.now()}`,
          stage: 'knockout_r1',
          stageLabel: '🔥 نصف النهائي 1 (الأول × الرابع)',
          teamAId: standings[0].teamId,
          teamAName: standings[0].name,
          teamBId: standings[3].teamId,
          teamBName: standings[3].name,
          scoreA: null,
          scoreB: null,
          winnerId: null,
        },
        {
          matchId: `KO-SF2-${Date.now() + 1}`,
          stage: 'knockout_r1',
          stageLabel: '🔥 نصف النهائي 2 (الثاني × الثالث)',
          teamAId: standings[1].teamId,
          teamAName: standings[1].name,
          teamBId: standings[2].teamId,
          teamBName: standings[2].name,
          scoreA: null,
          scoreB: null,
          winnerId: null,
        },
      ];
    } else if (standings.length >= 2) {
      newKoFixtures = [
        {
          matchId: `FINAL-${Date.now()}`,
          stage: 'final',
          stageLabel: '🏆 المباراة النهائية (الأول × الثاني)',
          teamAId: standings[0].teamId,
          teamAName: standings[0].name,
          teamBId: standings[1].teamId,
          teamBName: standings[1].name,
          scoreA: null,
          scoreB: null,
          winnerId: null,
        },
      ];
    }

    const updatedFixtures = [...(activeTournament.fixtures_data || []), ...newKoFixtures];
    try {
      const res = await fetch(`${TOURNAMENTS_API_URL}/${activeTournament.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixtures_data: updatedFixtures }),
      });
      const updatedTourney = await res.json();
      if (res.ok) setActiveTournament(updatedTourney);
    } catch (err) {}
  };

  const handleOpenTourneyFixtureOnPitch = (fixture) => {
    if (!activeTournament || !fixture.teamBId) return;
    const teams = activeTournament.teams_data || [];
    const tA = teams.find((t) => t.teamId === fixture.teamAId);
    const tB = teams.find((t) => t.teamId === fixture.teamBId);
    if (!tA || !tB) return;

    setTeamAName(tA.name);
    setTeamBName(tB.name);
    setTeamAColor(tA.color || '#16A34A');
    setTeamBColor(tB.color || '#2563EB');
    const balancedA = prepareTeamForPitch(tA.players || []);
    const balancedB = prepareTeamForPitch(tB.players || []);
    setTeamA(balancedA);
    setTeamB(balancedB);
    setTotalExtracted(balancedA.length + balancedB.length);
    setTeamARatingTotal(balancedA.reduce((s, p) => s + p.rating, 0));
    setTeamBRatingTotal(balancedB.reduce((s, p) => s + p.rating, 0));
    navigateTo('divide');
    setActiveTab('pitch');
  };

  const handleSaveCurrentMatch = async (sourceType) => {
    const teamAPlayersToSave =
      sourceType === 'divide' ? teamA : draftSlotsA.filter((s) => s.player).map((s) => s.player);
    const teamBPlayersToSave =
      sourceType === 'divide' ? teamB : draftSlotsB.filter((s) => s.player).map((s) => s.player);
    if (teamAPlayersToSave.length === 0 && teamBPlayersToSave.length === 0) return;

    try {
      const res = await fetch(MATCHES_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_a_name: teamAName,
          team_b_name: teamBName,
          team_a_color: teamAColor,
          team_b_color: teamBColor,
          formation:
            sourceType === 'divide'
              ? 'لستة واتساب'
              : `${draftDefCount}-${draftMidCount}-${draftAttCount}`,
          team_a_players: teamAPlayersToSave,
          team_b_players: teamBPlayersToSave,
        }),
      });
      if (res.ok) {
        await fetchMatchesList();
        Alert.alert('✅ تم الحفظ', 'تم حفظ التشكيلة في سجل المباريات!');
      }
    } catch (err) {}
  };

  const handleSaveScore = async () => {
    if (!scoreModalMatch) return;
    try {
      const res = await fetch(`${MATCHES_API_URL}/${scoreModalMatch.id}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_a_score: modalScoreA.trim() === '' ? null : Number(modalScoreA),
          team_b_score: modalScoreB.trim() === '' ? null : Number(modalScoreB),
          mvp_player_name: selectedMvpName || null,
          apply_rating_boost: applyRatingBoost,
        }),
      });
      if (res.ok) {
        await fetchMatchesList();
        await fetchSavedPlayers();
        setScoreModalMatch(null);
      }
    } catch (err) {}
  };

  const handleDeleteMatch = async (match) => {
    await fetch(`${MATCHES_API_URL}/${match.id}`, { method: 'DELETE' });
    setMatchesList((prev) => prev.filter((m) => m.id !== match.id));
  };

  const handleLoadMatchToPitch = (match) => {
    setTeamAName(match.team_a_name || 'فريق A');
    setTeamBName(match.team_b_name || 'فريق B');
    setTeamAColor(match.team_a_color || '#16A34A');
    setTeamBColor(match.team_b_color || '#2563EB');
    const balancedA = prepareTeamForPitch(match.team_a_players || []);
    const balancedB = prepareTeamForPitch(match.team_b_players || []);
    setTeamA(balancedA);
    setTeamB(balancedB);
    setTotalExtracted(balancedA.length + balancedB.length);
    setTeamARatingTotal(balancedA.reduce((s, p) => s + p.rating, 0));
    setTeamBRatingTotal(balancedB.reduce((s, p) => s + p.rating, 0));
    navigateTo('divide');
    setActiveTab('pitch');
  };

  const updateFormationCounts = (newDef, newMid, newAtt) => {
    const d = Math.min(Math.max(newDef, 1), 8);
    const m = Math.min(Math.max(newMid, 1), 8);
    const a = Math.min(Math.max(newAtt, 1), 8);
    setDraftDefCount(d);
    setDraftMidCount(m);
    setDraftAttCount(a);

    const rebuildSlots = (teamKey, oldSlots) => {
      const oldGks = oldSlots.filter((s) => s.position === 'حارس' && s.player).map((s) => s.player);
      const oldDefs = oldSlots.filter((s) => s.position === 'دفاع' && s.player).map((s) => s.player);
      const oldMids = oldSlots.filter((s) => s.position === 'وسط' && s.player).map((s) => s.player);
      const oldAtts = oldSlots.filter((s) => s.position === 'هجوم' && s.player).map((s) => s.player);

      const slots = [
        {
          slotId: `${teamKey}-GK-0`,
          teamKey,
          position: 'حارس',
          isGoalkeeper: true,
          player: oldGks[0] || null,
        },
      ];
      for (let i = 0; i < d; i++)
        slots.push({
          slotId: `${teamKey}-DEF-${i}`,
          teamKey,
          position: 'دفاع',
          isGoalkeeper: false,
          player: oldDefs[i] || null,
        });
      for (let i = 0; i < m; i++)
        slots.push({
          slotId: `${teamKey}-MID-${i}`,
          teamKey,
          position: 'وسط',
          isGoalkeeper: false,
          player: oldMids[i] || null,
        });
      for (let i = 0; i < a; i++)
        slots.push({
          slotId: `${teamKey}-ATT-${i}`,
          teamKey,
          position: 'هجوم',
          isGoalkeeper: false,
          player: oldAtts[i] || null,
        });
      return slots;
    };

    setDraftSlotsA((prev) => rebuildSlots('A', prev));
    setDraftSlotsB((prev) => rebuildSlots('B', prev));
    setSelectedDraftSlotId(null);
  };

  const resetDraftPitch = () => {
    setDraftSlotsA(createEmptyFormationSlots('A', draftDefCount, draftMidCount, draftAttCount));
    setDraftSlotsB(createEmptyFormationSlots('B', draftDefCount, draftMidCount, draftAttCount));
    setSelectedDraftSlotId(null);
  };

  const getSortedPlayersForPosition = (targetPosition) => {
    const usedIds = new Set();
    [...draftSlotsA, ...draftSlotsB].forEach((s) => s.player?.id && usedIds.add(s.player.id));
    const currentId = activeSlotForModal?.player?.id;
    const available = savedPlayers.filter((p) => !usedIds.has(p.id) || p.id === currentId);

    return {
      primaryMatches: available.filter((p) => p.primary_position === targetPosition),
      secondaryMatches: available.filter(
        (p) =>
          p.primary_position !== targetPosition &&
          Array.isArray(p.secondary_positions) &&
          p.secondary_positions.includes(targetPosition)
      ),
      otherPlayers: available.filter(
        (p) =>
          p.primary_position !== targetPosition &&
          (!Array.isArray(p.secondary_positions) ||
            !p.secondary_positions.includes(targetPosition))
      ),
    };
  };

  const assignPlayerToDraftSlot = (playerObj) => {
    if (!activeSlotForModal) return;
    const { slotId, teamKey } = activeSlotForModal;
    const updater = (slots) =>
      slots.map((s) => (s.slotId === slotId ? { ...s, player: playerObj } : s));
    if (teamKey === 'A') setDraftSlotsA(updater);
    else setDraftSlotsB(updater);
    setActiveSlotForModal(null);
  };

  const clearSingleDraftSlot = (slot) => {
    const updater = (slots) =>
      slots.map((s) => (s.slotId === slot.slotId ? { ...s, player: null } : s));
    if (slot.teamKey === 'A') setDraftSlotsA(updater);
    else setDraftSlotsB(updater);
    setActiveSlotForModal(null);
  };

  const handleDraftSlotPress = (slot) => {
    if (selectedDraftSlotId) {
      if (selectedDraftSlotId !== slot.slotId) {
        const allSlots = [...draftSlotsA, ...draftSlotsB];
        const firstSlot = allSlots.find((s) => s.slotId === selectedDraftSlotId);
        if (firstSlot) {
          const p1 = firstSlot.player;
          const p2 = slot.player;
          const updateList = (list) =>
            list.map((s) =>
              s.slotId === firstSlot.slotId
                ? { ...s, player: p2 }
                : s.slotId === slot.slotId
                ? { ...s, player: p1 }
                : s
            );
          setDraftSlotsA(updateList);
          setDraftSlotsB(updateList);
        }
      }
      setSelectedDraftSlotId(null);
      return;
    }
    setActiveSlotForModal(slot);
  };

  const handleAutoBalanceSelectedPlayers = async () => {
    const chosenPlayers = savedPlayers.filter((p) => selectedPlayerIdsForAuto.includes(p.id));
    if (chosenPlayers.length < 2) return;
    setDraftLoading(true);
    try {
      const res = await fetch(DRAFT_BALANCE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          players: chosenPlayers,
          formation: { def: draftDefCount, mid: draftMidCount, att: draftAttCount },
        }),
      });
      const data = await res.json();
      if (!res.ok) return;

      const teamAList = data.teamA || [];
      const teamBList = data.teamB || [];
      const actualDefCount = Math.max(
        1,
        teamAList.filter((p) => !p.isGoalkeeper && p.position === 'دفاع').length,
        teamBList.filter((p) => !p.isGoalkeeper && p.position === 'دفاع').length
      );
      const actualMidCount = Math.max(
        1,
        teamAList.filter((p) => !p.isGoalkeeper && p.position === 'وسط').length,
        teamBList.filter((p) => !p.isGoalkeeper && p.position === 'وسط').length
      );
      const actualAttCount = Math.max(
        1,
        teamAList.filter((p) => !p.isGoalkeeper && p.position === 'هجوم').length,
        teamBList.filter((p) => !p.isGoalkeeper && p.position === 'هجوم').length
      );

      setDraftDefCount(actualDefCount);
      setDraftMidCount(actualMidCount);
      setDraftAttCount(actualAttCount);

      const fillTeamSlots = (teamKey, teamPlayers, dCount, mCount, aCount) => {
        const gks = teamPlayers.filter((p) => p.isGoalkeeper || p.position === 'حارس');
        const defs = teamPlayers.filter((p) => !p.isGoalkeeper && p.position === 'دفاع');
        const mids = teamPlayers.filter((p) => !p.isGoalkeeper && p.position === 'وسط');
        const atts = teamPlayers.filter((p) => !p.isGoalkeeper && p.position === 'هجوم');
        const slots = [
          {
            slotId: `${teamKey}-GK-0`,
            teamKey,
            position: 'حارس',
            isGoalkeeper: true,
            player: gks[0] || null,
          },
        ];
        for (let i = 0; i < dCount; i++)
          slots.push({
            slotId: `${teamKey}-DEF-${i}`,
            teamKey,
            position: 'دفاع',
            isGoalkeeper: false,
            player: defs[i] || null,
          });
        for (let i = 0; i < mCount; i++)
          slots.push({
            slotId: `${teamKey}-MID-${i}`,
            teamKey,
            position: 'وسط',
            isGoalkeeper: false,
            player: mids[i] || null,
          });
        for (let i = 0; i < aCount; i++)
          slots.push({
            slotId: `${teamKey}-ATT-${i}`,
            teamKey,
            position: 'هجوم',
            isGoalkeeper: false,
            player: atts[i] || null,
          });
        return slots;
      };

      setDraftSlotsA(fillTeamSlots('A', teamAList, actualDefCount, actualMidCount, actualAttCount));
      setDraftSlotsB(fillTeamSlots('B', teamBList, actualDefCount, actualMidCount, actualAttCount));
      setMultiSelectModalVisible(false);
    } catch (err) {
    } finally {
      setDraftLoading(false);
    }
  };

  const draftTeamATotal = draftSlotsA.reduce(
    (sum, s) => sum + (s.player ? Number(s.player.rating) : 0),
    0
  );
  const draftTeamBTotal = draftSlotsB.reduce(
    (sum, s) => sum + (s.player ? Number(s.player.rating) : 0),
    0
  );

  const handleShareDraftAsImage = async () => {
    if (!draftPitchRef.current) return;
    const uri = await captureRef(draftPitchRef, { format: 'png', quality: 1 });
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'مشاركة تشكيلة قِسمه' });
  };

  const handleShareDraftAsText = async () => {
    const filledA = draftSlotsA.filter((s) => s.player);
    const filledB = draftSlotsB.filter((s) => s.player);
    const formatSlot = (s, idx) =>
      `${idx + 1}- ${s.position === 'حارس' ? '🧤 ' : ''}${s.player.name} (${s.position})`;
    const message =
      `⚽ *تشكيلة قِسمه* ⚽\n\n` +
      `${getKitEmojiByHex(teamAColor, 'A')} *${teamAName} (⭐ ${draftTeamATotal}):*\n${filledA
        .map(formatSlot)
        .join('\n')}\n\n` +
      `${getKitEmojiByHex(teamBColor, 'B')} *${teamBName} (⭐ ${draftTeamBTotal}):*\n${filledB
        .map(formatSlot)
        .join('\n')}`;
    await Share.share({ message });
  };

  const resetPlayerForm = () => {
    setEditingPlayerId(null);
    setPlayerNameInput('');
    setPlayerRatingInput('80');
    setPrimaryPosInput('وسط');
    setSecondaryPosInput([]);
  };

  const handleSavePlayer = async () => {
    if (!playerNameInput.trim()) return;
    const isEditing = editingPlayerId !== null;
    const url = isEditing ? `${PLAYERS_API_URL}/${editingPlayerId}` : PLAYERS_API_URL;
    const res = await fetch(url, {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: playerNameInput.trim(),
        rating: Number(playerRatingInput) || 75,
        primary_position: primaryPosInput,
        secondary_positions: secondaryPosInput,
      }),
    });
    if (res.ok) {
      await fetchSavedPlayers();
      resetPlayerForm();
    }
  };

  const handleDeletePlayer = async (player) => {
    await fetch(`${PLAYERS_API_URL}/${player.id}`, { method: 'DELETE' });
    setSavedPlayers((prev) => prev.filter((p) => p.id !== player.id));
  };

  const handleDivideTeams = async () => {
    if (!rawText.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText, userRole }),
      });
      const data = await response.json();
      if (response.ok) {
        const balancedA = prepareTeamForPitch(data.teamA || []);
        const balancedB = prepareTeamForPitch(data.teamB || []);
        setTeamA(balancedA);
        setTeamB(balancedB);
        setTotalExtracted(data.totalExtracted || 0);
        setTeamARatingTotal(balancedA.reduce((s, p) => s + p.rating, 0));
        setTeamBRatingTotal(balancedB.reduce((s, p) => s + p.rating, 0));
        setAnalysisSource(userRole === 'guest' ? 'local' : data.analysisSource || 'ai');
        setActiveTab('pitch');
        if (isLoggedUser) fetchSavedPlayers();
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerPress = (clickedPlayerId) => {
    if (!selectedPlayerId) {
      setSelectedPlayerId(clickedPlayerId);
      return;
    }
    if (selectedPlayerId !== clickedPlayerId) {
      let newA = [...teamA],
        newB = [...teamB];
      let idxA1 = newA.findIndex((p) => p.uniqueId === selectedPlayerId),
        idxB1 = newB.findIndex((p) => p.uniqueId === selectedPlayerId);
      let idxA2 = newA.findIndex((p) => p.uniqueId === clickedPlayerId),
        idxB2 = newB.findIndex((p) => p.uniqueId === clickedPlayerId);
      let p1 = idxA1 !== -1 ? newA[idxA1] : newB[idxB1],
        p2 = idxA2 !== -1 ? newA[idxA2] : newB[idxB2];

      const swap1 = {
        ...p1,
        position: p2.position,
        isGoalkeeper: p2.isGoalkeeper || p2.position === 'حارس',
      };
      const swap2 = {
        ...p2,
        position: p1.position,
        isGoalkeeper: p1.isGoalkeeper || p1.position === 'حارس',
      };
      if (idxA1 !== -1) newA[idxA1] = swap2;
      else newB[idxB1] = swap2;
      if (idxA2 !== -1) newA[idxA2] = swap1;
      else newB[idxB2] = swap1;
      setTeamA(newA);
      setTeamB(newB);
      setTeamARatingTotal(newA.reduce((s, p) => s + p.rating, 0));
      setTeamBRatingTotal(newB.reduce((s, p) => s + p.rating, 0));
    }
    setSelectedPlayerId(null);
  };

  const cyclePlayerPosition = (targetTeamKey, uniqueId) => {
    const order = ['وسط', 'دفاع', 'هجوم', 'حارس'];
    let newA = [...teamA],
      newB = [...teamB];
    let list = targetTeamKey === 'A' ? newA : newB;
    let idx = list.findIndex((p) => p.uniqueId === uniqueId);
    if (idx === -1) return;
    let curPos = list[idx].isGoalkeeper ? 'حارس' : list[idx].position;
    let nextPos = order[(order.indexOf(curPos) + 1) % order.length];
    list[idx] = { ...list[idx], position: nextPos, isGoalkeeper: nextPos === 'حارس' };
    setTeamA(newA);
    setTeamB(newB);
  };

  const renderSubscriberTeamsCustomization = () => {
    if (!isSubscriber) return null;
    return (
      <View style={styles.subscriberBox}>
        <View style={styles.labelRow}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              style={styles.saveTeamMiniBtn}
              onPress={() => handleSavePresetTeam('B')}
            >
              <Text style={styles.saveTeamMiniBtnText}>💾 حفظ فريق 2</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveTeamMiniBtn}
              onPress={() => handleSavePresetTeam('A')}
            >
              <Text style={styles.saveTeamMiniBtnText}>💾 حفظ فريق 1</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subscriberBoxTitle}>💎 تخصيص الأطقم والفرق المحفوظة:</Text>
        </View>
        <View style={styles.kitColorsContainer}>
          <View style={styles.kitColorColumn}>
            <View style={styles.colorSwatchesRow}>
              {KIT_COLORS.map((c) => (
                <TouchableOpacity
                  key={`B-${c.hex}`}
                  style={[
                    styles.colorSwatchCircle,
                    { backgroundColor: c.hex },
                    teamBColor === c.hex && styles.colorSwatchActive,
                  ]}
                  onPress={() => setTeamBColor(c.hex)}
                />
              ))}
            </View>
          </View>
          <View style={styles.kitColorColumn}>
            <View style={styles.colorSwatchesRow}>
              {KIT_COLORS.map((c) => (
                <TouchableOpacity
                  key={`A-${c.hex}`}
                  style={[
                    styles.colorSwatchCircle,
                    { backgroundColor: c.hex },
                    teamAColor === c.hex && styles.colorSwatchActive,
                  ]}
                  onPress={() => setTeamAColor(c.hex)}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const tourneyStandings = activeTournament
    ? computeTournamentStandings(
        activeTournament.teams_data || [],
        activeTournament.fixtures_data || []
      )
    : [];
  const finalMatchObj = (activeTournament?.fixtures_data || []).find(
    (f) => f.stage === 'final' && f.winnerId
  );
  const championTeam = finalMatchObj
    ? (activeTournament?.teams_data || []).find((t) => t.teamId === finalMatchObj.winnerId)
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B4332" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <HeaderBar
          userRole={userRole}
          currentUsername={currentUsername}
          onOpenAuthModal={() => setAuthModalVisible(true)}
          onSwitchRole={(r) => {
            setUserRole(r);
            setMainScreen('home');
            setScreenHistory([]);
          }}
          mainScreen={mainScreen}
          onGoHome={() => { setMainScreen('home'); setScreenHistory([]); }}
          onGoBack={goBack}
          canGoBack={screenHistory.length > 0}
        />

        {mainScreen === 'home' ? (
          <HomeScreen
            userRole={userRole}
            onNavigate={(scr) => navigateTo(scr)}
            playersCount={savedPlayers.length}
            teamsCount={savedTeams.length}
            matchesCount={matchesList.length}
            tournamentsCount={tournamentsHistory.length}
          />
        ) : isLoggedUser && mainScreen === 'tournament_create' ? (
          <CreateTournamentScreen
            tournamentName={tournamentName}
            setTournamentName={setTournamentName}
            tournamentType={tournamentType}
            setTournamentType={setTournamentType}
            tournamentTeamsCountInput={tournamentTeamsCountInput}
            setTournamentTeamsCountInput={setTournamentTeamsCountInput}
            savedPlayers={savedPlayers}
            setSelectedPlayerIdsForTourney={setSelectedPlayerIdsForTourney}
            setTournamentPlayersModal={setTournamentPlayersModal}
            onGoToTournamentsList={() => navigateTo('tournaments_list')}
          />
        ) : isLoggedUser && mainScreen === 'tournaments_list' ? (
          <TournamentsListScreen
            tournamentsHistory={tournamentsHistory}
            onSelectTournament={(t) => {
              setActiveTournament(t);
              navigateTo('tournament_details');
            }}
            onCreateNewTournament={() => navigateTo('tournament_create')}
            onDeleteTournament={handleDeleteTournament}
          />
        ) : isLoggedUser && mainScreen === 'tournament_details' ? (
          <TournamentDetailsScreen
            activeTournament={activeTournament}
            championTeam={championTeam}
            tourneyStandings={tourneyStandings}
            handleAdvanceGroupToKnockout={handleAdvanceGroupToKnockout}
            handleOpenTourneyFixtureOnPitch={handleOpenTourneyFixtureOnPitch}
            setTourneyScoreModalFixture={setTourneyScoreModalFixture}
            setTourneyScoreA={setTourneyScoreA}
            setTourneyScoreB={setTourneyScoreB}
            onBackToList={() => goBack()}
            onGoToTeamsScreen={() => navigateTo('teams')}
          />
        ) : isLoggedUser && mainScreen === 'teams' ? (
          <TeamsScreen
            savedTeams={savedTeams}
            fetchSavedTeams={fetchSavedTeams}
            savedPlayers={savedPlayers}
            onCreateTeam={handleCreateTeamRecord}
            onUpdateTeam={handleUpdateTeamRecord}
            onDeleteTeam={handleDeleteTeamRecord}
            onUseTeamInMatch={(t, targetKey = 'A') => {
              applyPresetTeam(t, targetKey);
              navigateTo('draft');
            }}
          />
        ) : isLoggedUser && mainScreen === 'matches' ? (
          <MatchesScreen
            matchesList={matchesList}
            loadingMatches={loadingMatches}
            fetchMatchesList={fetchMatchesList}
            handleDeleteMatch={handleDeleteMatch}
            handleLoadMatchToPitch={handleLoadMatchToPitch}
            setScoreModalMatch={setScoreModalMatch}
            setModalScoreA={setModalScoreA}
            setModalScoreB={setModalScoreB}
            setSelectedMvpName={setSelectedMvpName}
            setApplyRatingBoost={setApplyRatingBoost}
          />
        ) : isLoggedUser && mainScreen === 'players' ? (
          <PlayersScreen
            editingPlayerId={editingPlayerId}
            playerRatingInput={playerRatingInput}
            setPlayerRatingInput={setPlayerRatingInput}
            playerNameInput={playerNameInput}
            setPlayerNameInput={setPlayerNameInput}
            primaryPosInput={primaryPosInput}
            secondaryPosInput={secondaryPosInput}
            handleSelectPrimaryPosition={(pos) => {
              setPrimaryPosInput(pos);
              setSecondaryPosInput((p) => p.filter((x) => x !== pos));
            }}
            handleToggleSecondaryPosition={(pos) =>
              setSecondaryPosInput((p) =>
                p.includes(pos) ? p.filter((x) => x !== pos) : [...p, pos]
              )
            }
            resetPlayerForm={resetPlayerForm}
            handleSavePlayer={handleSavePlayer}
            savedPlayers={savedPlayers}
            loadingPlayers={loadingPlayers}
            fetchSavedPlayers={fetchSavedPlayers}
            handleDeletePlayer={handleDeletePlayer}
            handleEditPlayerClick={(p) => {
              setEditingPlayerId(p.id);
              setPlayerNameInput(p.name);
              setPlayerRatingInput(String(p.rating));
              setPrimaryPosInput(p.primary_position);
              setSecondaryPosInput(p.secondary_positions || []);
            }}
          />
        ) : isLoggedUser && mainScreen === 'draft' ? (
          <DraftScreen
            draftDefCount={draftDefCount}
            draftMidCount={draftMidCount}
            draftAttCount={draftAttCount}
            updateFormationCounts={updateFormationCounts}
            teamAName={teamAName}
            setTeamAName={setTeamAName}
            teamBName={teamBName}
            setTeamBName={setTeamBName}
            teamAColor={teamAColor}
            teamBColor={teamBColor}
            renderSubscriberTeamsCustomization={renderSubscriberTeamsCustomization}
            resetDraftPitch={resetDraftPitch}
            selectTopPlayersForFormation={() =>
              setSelectedPlayerIdsForAuto(
                savedPlayers
                  .slice(0, (1 + draftDefCount + draftMidCount + draftAttCount) * 2)
                  .map((p) => p.id)
              )
            }
            setMultiSelectModalVisible={setMultiSelectModalVisible}
            selectedDraftSlotId={selectedDraftSlotId}
            setSelectedDraftSlotId={setSelectedDraftSlotId}
            draftPitchRef={draftPitchRef}
            draftSlotsA={draftSlotsA}
            draftSlotsB={draftSlotsB}
            draftTeamATotal={draftTeamATotal}
            draftTeamBTotal={draftTeamBTotal}
            handleDraftSlotPress={handleDraftSlotPress}
            handleSaveCurrentMatch={handleSaveCurrentMatch}
            handleShareDraftAsImage={handleShareDraftAsImage}
            handleShareDraftAsText={handleShareDraftAsText}
          />
        ) : (
          <DivideScreen
            userRole={userRole}
            isLoggedUser={isLoggedUser}
            rawText={rawText}
            setRawText={setRawText}
            teamAName={teamAName}
            setTeamAName={setTeamAName}
            teamBName={teamBName}
            setTeamBName={setTeamBName}
            teamAColor={teamAColor}
            teamBColor={teamBColor}
            renderSubscriberTeamsCustomization={renderSubscriberTeamsCustomization}
            loading={loading}
            handleClear={() => {
              setRawText('');
              setTeamA([]);
              setTeamB([]);
            }}
            handleDivideTeams={handleDivideTeams}
            teamA={teamA}
            teamB={teamB}
            analysisSource={analysisSource}
            totalExtracted={totalExtracted}
            selectedPlayerId={selectedPlayerId}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            pitchRef={pitchRef}
            teamARatingTotal={teamARatingTotal}
            teamBRatingTotal={teamBRatingTotal}
            handlePlayerPress={handlePlayerPress}
            cyclePlayerPosition={cyclePlayerPosition}
            handleSaveCurrentMatch={handleSaveCurrentMatch}
            handleShareAsImage={async () => {
              const uri = await captureRef(pitchRef, { format: 'png', quality: 1 });
              await Sharing.shareAsync(uri);
            }}
            handleShareAsText={async () => {
              const fmt = (p, i) => `${i + 1}- ${p.name} (${p.position})`;
              await Share.share({
                message: `${teamAName}:\n${teamA
                  .map(fmt)
                  .join('\n')}\n\n${teamBName}:\n${teamB.map(fmt).join('\n')}`,
              });
            }}
          />
        )}

        <AppModals
          authModalVisible={authModalVisible}
          setAuthModalVisible={setAuthModalVisible}
          authUsernameInput={authUsernameInput}
          setAuthUsernameInput={setAuthUsernameInput}
          authPasswordInput={authPasswordInput}
          setAuthPasswordInput={setAuthPasswordInput}
          handleLoginSubmit={handleLoginSubmit}
          activeSlotForModal={activeSlotForModal}
          setActiveSlotForModal={setActiveSlotForModal}
          sortedForModal={
            activeSlotForModal
              ? getSortedPlayersForPosition(activeSlotForModal.position)
              : { primaryMatches: [], secondaryMatches: [], otherPlayers: [] }
          }
          assignPlayerToDraftSlot={assignPlayerToDraftSlot}
          clearSingleDraftSlot={clearSingleDraftSlot}
          setSelectedDraftSlotId={setSelectedDraftSlotId}
          multiSelectModalVisible={multiSelectModalVisible}
          setMultiSelectModalVisible={setMultiSelectModalVisible}
          selectedPlayerIdsForAuto={selectedPlayerIdsForAuto}
          setSelectedPlayerIdsForAuto={setSelectedPlayerIdsForAuto}
          savedPlayers={savedPlayers}
          toggleSelectPlayerForAuto={(id) =>
            setSelectedPlayerIdsForAuto((p) =>
              p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
            )
          }
          handleAutoBalanceSelectedPlayers={handleAutoBalanceSelectedPlayers}
          draftLoading={draftLoading}
          scoreModalMatch={scoreModalMatch}
          setScoreModalMatch={setScoreModalMatch}
          modalScoreA={modalScoreA}
          setModalScoreA={setModalScoreA}
          modalScoreB={modalScoreB}
          setModalScoreB={setModalScoreB}
          selectedMvpName={selectedMvpName}
          setSelectedMvpName={setSelectedMvpName}
          applyRatingBoost={applyRatingBoost}
          setApplyRatingBoost={setApplyRatingBoost}
          matchParticipantsForMvp={
            scoreModalMatch
              ? [
                  ...(scoreModalMatch.team_a_players || []),
                  ...(scoreModalMatch.team_b_players || []),
                ]
              : []
          }
          handleSaveScore={handleSaveScore}
          tournamentPlayersModal={tournamentPlayersModal}
          setTournamentPlayersModal={setTournamentPlayersModal}
          selectedPlayerIdsForTourney={selectedPlayerIdsForTourney}
          setSelectedPlayerIdsForTourney={setSelectedPlayerIdsForTourney}
          tournamentTeamsCount={parsedTournamentTeamsCount}
          toggleSelectPlayerForTourney={toggleSelectPlayerForTourney}
          handleGenerateTournament={handleGenerateTournament}
          tourneyLoading={tourneyLoading}
          tourneyScoreModalFixture={tourneyScoreModalFixture}
          setTourneyScoreModalFixture={setTourneyScoreModalFixture}
          tourneyScoreA={tourneyScoreA}
          setTourneyScoreA={setTourneyScoreA}
          tourneyScoreB={tourneyScoreB}
          setTourneyScoreB={setTourneyScoreB}
          handleSaveTourneyFixtureScore={handleSaveTourneyFixtureScore}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
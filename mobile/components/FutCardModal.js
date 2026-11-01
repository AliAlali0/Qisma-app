import React, { useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { getPositionCode } from '../utils/helpers';

const { width } = Dimensions.get('window');

export default function FutCardModal({ visible, player, onClose }) {
  const cardRef = useRef();

  if (!player) return null;

  const rating = Number(player.rating) || 75;
  const isGk = player.primary_position === 'حارس' || player.isGoalkeeper;
  const posCode = getPositionCode(player.primary_position || (isGk ? 'حارس' : 'وسط'));
  const mvpCount = Number(player.mvp_count) || 0;
  const matches = Number(player.matches_played) || 0;
  const wins = Number(player.wins) || 0;
  const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
  const groupTag = player.group_name || 'عام';

  // تحديد نوع ومظهر البطاقة (Tier)
  const isMvpSpecial = mvpCount > 0;
  const isGoldRare = rating >= 85;
  const isGold = rating >= 75 && rating < 85;

  let theme = {
    bg: '#1E293B',
    cardBorder: '#CBD5E1',
    innerBorder: '#94A3B8',
    textMain: '#F8FAFC',
    textAccent: '#38BDF8',
    badgeBg: '#334155',
    tierName: 'SILVER 🥈',
  };

  if (isMvpSpecial) {
    theme = {
      bg: '#18122B',
      cardBorder: '#F59E0B',
      innerBorder: '#D97706',
      textMain: '#FEF08A',
      textAccent: '#FBBF24',
      badgeBg: '#3B185F',
      tierName: '🌟 MVP IN-FORM 🌟',
    };
  } else if (isGoldRare) {
    theme = {
      bg: '#2A1E00',
      cardBorder: '#F59E0B',
      innerBorder: '#FBBF24',
      textMain: '#FEF08A',
      textAccent: '#F59E0B',
      badgeBg: '#78350F',
      tierName: 'GOLD RARE ⭐',
    };
  } else if (isGold) {
    theme = {
      bg: '#261F13',
      cardBorder: '#D97706',
      innerBorder: '#B45309',
      textMain: '#FDE68A',
      textAccent: '#FCD34D',
      badgeBg: '#451A03',
      tierName: 'GOLD COMMON ⭐',
    };
  }

  // حساب خصائص فيفا الستة الواقعية بناءً على التقييم والمركز
  const base = rating;
  let stat1Label = 'PAC', stat1Val = Math.min(99, Math.round(base * (posCode === 'ST' ? 1.05 : posCode === 'CB' ? 0.88 : 0.95)));
  let stat2Label = 'SHO', stat2Val = Math.min(99, Math.round(base * (posCode === 'ST' ? 1.08 : posCode === 'CM' ? 0.92 : 0.65)));
  let stat3Label = 'PAS', stat3Val = Math.min(99, Math.round(base * (posCode === 'CM' ? 1.06 : posCode === 'ST' ? 0.88 : 0.78)));
  let stat4Label = 'DRI', stat4Val = Math.min(99, Math.round(base * (posCode === 'CM' || posCode === 'ST' ? 1.02 : 0.75)));
  let stat5Label = 'DEF', stat5Val = Math.min(99, Math.round(base * (posCode === 'CB' ? 1.10 : posCode === 'CM' ? 0.85 : 0.50)));
  let stat6Label = 'PHY', stat6Val = Math.min(99, Math.round(base * (posCode === 'CB' ? 1.05 : 0.92)));

  if (isGk) {
    stat1Label = 'DIV'; stat1Val = Math.min(99, Math.round(base * 1.02));
    stat2Label = 'HAN'; stat2Val = Math.min(99, Math.round(base * 0.98));
    stat3Label = 'KIC'; stat3Val = Math.min(99, Math.round(base * 0.90));
    stat4Label = 'REF'; stat4Val = Math.min(99, Math.round(base * 1.06));
    stat5Label = 'SPE'; stat5Val = Math.min(99, Math.round(base * 0.65));
    stat6Label = 'POS'; stat6Val = Math.min(99, Math.round(base * 1.01));
  }

  const handleShareCard = async () => {
    try {
      if (!cardRef.current) return;
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
      });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `بطاقة ${player.name} - قِسمة FUT`,
      });
    } catch (err) {
      Alert.alert('خطأ', 'تعذر مشاركة البطاقة');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={futStyles.backdrop}>
        <View style={futStyles.container}>
          {/* البطاقة ذاتها التي سيتم التقاطها كصورة */}
          <View
            ref={cardRef}
            collapsable={false}
            style={[
              futStyles.cardShield,
              {
                backgroundColor: theme.bg,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            {/* إطار داخلي زخرفي */}
            <View style={[futStyles.innerShield, { borderColor: theme.innerBorder }]}>
              {/* شريط نوع البطاقة في الأعلى */}
              <View style={[futStyles.tierBadge, { backgroundColor: theme.badgeBg }]}>
                <Text style={[futStyles.tierText, { color: theme.textAccent }]}>
                  {theme.tierName}
                </Text>
              </View>

              {/* الجزء العلوي: التقييم والمركز وشعار المجموعة */}
              <View style={futStyles.topRow}>
                <View style={futStyles.ratingCol}>
                  <Text style={[futStyles.ratingNumber, { color: theme.textMain }]}>
                    {rating}
                  </Text>
                  <Text style={[futStyles.posCode, { color: theme.textAccent }]}>
                    {posCode}
                  </Text>
                  <Text style={futStyles.flagEmoji}>🇸🇦</Text>
                </View>

                {/* صورة أو أيقونة اللاعب التكتيكية */}
                <View style={futStyles.avatarContainer}>
                  <View style={[futStyles.avatarGlow, { borderColor: theme.textAccent }]}>
                    <Text style={futStyles.avatarEmoji}>
                      {isGk ? '🧤' : posCode === 'ST' ? '⚡' : posCode === 'CB' ? '🛡️' : '⚙️'}
                    </Text>
                  </View>
                </View>

                {/* وسم المجموعة */}
                <View style={futStyles.groupTagContainer}>
                  <Text style={[futStyles.groupTagText, { color: theme.textAccent }]}>
                    {groupTag}
                  </Text>
                  <Text style={futStyles.ballEmoji}>⚽</Text>
                </View>
              </View>

              {/* شريط اسم اللاعب */}
              <View style={[futStyles.nameRibbon, { borderColor: theme.cardBorder }]}>
                <Text style={[futStyles.playerName, { color: theme.textMain }]} numberOfLines={1}>
                  {player.name}
                </Text>
                <Text style={[futStyles.subRoleText, { color: theme.textAccent }]}>
                  {player.primary_position}
                  {Array.isArray(player.secondary_positions) && player.secondary_positions.length > 0
                    ? ` / ${player.secondary_positions.join(' - ')}`
                    : ''}
                </Text>
              </View>

              {/* خط فاصل */}
              <View style={[futStyles.divider, { backgroundColor: theme.innerBorder }]} />

              {/* خصائص فيفا الستة */}
              <View style={futStyles.statsGrid}>
                <View style={futStyles.statCol}>
                  <View style={futStyles.statRow}>
                    <Text style={[futStyles.statVal, { color: theme.textMain }]}>{stat1Val}</Text>
                    <Text style={[futStyles.statLbl, { color: theme.textAccent }]}>{stat1Label}</Text>
                  </View>
                  <View style={futStyles.statRow}>
                    <Text style={[futStyles.statVal, { color: theme.textMain }]}>{stat2Val}</Text>
                    <Text style={[futStyles.statLbl, { color: theme.textAccent }]}>{stat2Label}</Text>
                  </View>
                  <View style={futStyles.statRow}>
                    <Text style={[futStyles.statVal, { color: theme.textMain }]}>{stat3Val}</Text>
                    <Text style={[futStyles.statLbl, { color: theme.textAccent }]}>{stat3Label}</Text>
                  </View>
                </View>

                <View style={[futStyles.verticalDivider, { backgroundColor: theme.innerBorder }]} />

                <View style={futStyles.statCol}>
                  <View style={futStyles.statRow}>
                    <Text style={[futStyles.statVal, { color: theme.textMain }]}>{stat4Val}</Text>
                    <Text style={[futStyles.statLbl, { color: theme.textAccent }]}>{stat4Label}</Text>
                  </View>
                  <View style={futStyles.statRow}>
                    <Text style={[futStyles.statVal, { color: theme.textMain }]}>{stat5Val}</Text>
                    <Text style={[futStyles.statLbl, { color: theme.textAccent }]}>{stat5Label}</Text>
                  </View>
                  <View style={futStyles.statRow}>
                    <Text style={[futStyles.statVal, { color: theme.textMain }]}>{stat6Val}</Text>
                    <Text style={[futStyles.statLbl, { color: theme.textAccent }]}>{stat6Label}</Text>
                  </View>
                </View>
              </View>

              {/* إحصائيات الواقع في ملاعب الحواري */}
              <View style={[futStyles.pickupStatsBar, { backgroundColor: theme.badgeBg }]}>
                <Text style={[futStyles.pickupStatText, { color: theme.textMain }]}>
                  🎮 {matches} لعب • 🏆 {wins} فوز ({winRate}%)
                </Text>
                {mvpCount > 0 && (
                  <Text style={[futStyles.pickupMvpText, { color: '#FBBF24' }]}>
                    🌟 {mvpCount} MVP
                  </Text>
                )}
              </View>

              {/* التوقيع السفلي للبطاقة */}
              <View style={futStyles.cardFooter}>
                <Text style={[futStyles.watermark, { color: theme.textAccent }]}>
                  ⚽ QISMAH ULTIMATE TEAM 🏆
                </Text>
              </View>
            </View>
          </View>

          {/* أزرار التحكم أسفل النافذة */}
          <View style={futStyles.actionButtonsRow}>
            <TouchableOpacity style={futStyles.closeBtn} onPress={onClose}>
              <Text style={futStyles.closeBtnText}>✖️ إغلاق</Text>
            </TouchableOpacity>

            <TouchableOpacity style={futStyles.shareBtn} onPress={handleShareCard}>
              <Text style={futStyles.shareBtnText}>📸 حفظ ومشاركة البطاقة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const futStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    alignItems: 'center',
    width: '100%',
  },
  cardShield: {
    width: Math.min(width - 40, 320),
    borderRadius: 22,
    borderWidth: 3.5,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 20,
  },
  innerShield: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'flex-start',
    paddingHorizontal: 6,
  },
  ratingCol: {
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 38,
  },
  posCode: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  flagEmoji: {
    fontSize: 16,
    marginTop: 4,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  avatarGlow: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  groupTagContainer: {
    alignItems: 'center',
  },
  groupTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    maxWidth: 70,
    textAlign: 'center',
  },
  ballEmoji: {
    fontSize: 14,
    marginTop: 4,
  },
  nameRibbon: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  subRoleText: {
    fontSize: 10,
    marginTop: 1,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    width: '85%',
    marginVertical: 8,
    opacity: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  statCol: {
    flex: 1,
    gap: 3,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '900',
    width: 24,
    textAlign: 'right',
  },
  statLbl: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  verticalDivider: {
    width: 1,
    height: '100%',
    marginHorizontal: 10,
    opacity: 0.4,
  },
  pickupStatsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  pickupStatText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  pickupMvpText: {
    fontSize: 10,
    fontWeight: '900',
  },
  cardFooter: {
    marginTop: 8,
  },
  watermark: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    opacity: 0.8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: Math.min(width - 40, 320),
  },
  closeBtn: {
    flex: 1,
    backgroundColor: '#374151',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#F3F4F6',
    fontWeight: 'bold',
    fontSize: 13,
  },
  shareBtn: {
    flex: 2,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});

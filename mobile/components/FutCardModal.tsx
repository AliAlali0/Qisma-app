/**
 * ============================================================================
 * FutCardModal (FIFA Ultimate Team / EA FC Style Card Generator)
 * ============================================================================
 * Renders an authentic FUT player card with dynamic tiers (MVP In-Form, Gold Rare,
 * Gold Common, Silver), calculates authentic 6 attributes, and exports high-res images.
 */

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
import { Player } from '../types/player.types';

const { width } = Dimensions.get('window');

export interface FutCardModalProps {
  visible: boolean;
  player: Player | null;
  onClose: () => void;
}

export default function FutCardModal({ visible, player, onClose }: FutCardModalProps) {
  const cardRef = useRef<any>(null);

  if (!player) return null;

  const rating = Number(player.rating) || 75;
  const isGk = player.primary_position === 'حارس' || player.isGoalkeeper;
  const posCode = getPositionCode(player.primary_position || (isGk ? 'حارس' : 'وسط'));
  const mvpCount = Number(player.mvp_count) || 0;
  const matches = Number(player.matches_played) || 0;
  const wins = Number(player.wins) || 0;
  const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
  const groupTag = player.group_name || 'عام';

  // Card Tiers
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
      textMain: '#FEF9C3',
      textAccent: '#F59E0B',
      badgeBg: '#451A03',
      tierName: 'GOLD RARE ⭐',
    };
  } else if (isGold) {
    theme = {
      bg: '#2D2305',
      cardBorder: '#D97706',
      innerBorder: '#B45309',
      textMain: '#FEF3C7',
      textAccent: '#D97706',
      badgeBg: '#3F2507',
      tierName: 'GOLD COMMON',
    };
  }

  // 6 Authentic FUT Attributes Calculation
  let attributes: { label: string; val: number }[] = [];
  if (isGk) {
    attributes = [
      { label: 'DIV', val: Math.min(99, Math.round(rating * 1.02)) },
      { label: 'REF', val: Math.min(99, Math.round(rating * 1.04)) },
      { label: 'HAN', val: Math.min(99, Math.round(rating * 0.98)) },
      { label: 'SPE', val: Math.min(99, Math.round(rating * 0.85)) },
      { label: 'KIC', val: Math.min(99, Math.round(rating * 0.95)) },
      { label: 'POS', val: Math.min(99, Math.round(rating * 1.01)) },
    ];
  } else if (player.primary_position === 'هجوم') {
    attributes = [
      { label: 'PAC', val: Math.min(99, Math.round(rating * 1.03)) },
      { label: 'DRI', val: Math.min(99, Math.round(rating * 1.02)) },
      { label: 'SHO', val: Math.min(99, Math.round(rating * 1.05)) },
      { label: 'DEF', val: Math.min(99, Math.round(rating * 0.55)) },
      { label: 'PAS', val: Math.min(99, Math.round(rating * 0.88)) },
      { label: 'PHY', val: Math.min(99, Math.round(rating * 0.90)) },
    ];
  } else if (player.primary_position === 'دفاع') {
    attributes = [
      { label: 'PAC', val: Math.min(99, Math.round(rating * 0.92)) },
      { label: 'DRI', val: Math.min(99, Math.round(rating * 0.78)) },
      { label: 'SHO', val: Math.min(99, Math.round(rating * 0.58)) },
      { label: 'DEF', val: Math.min(99, Math.round(rating * 1.06)) },
      { label: 'PAS', val: Math.min(99, Math.round(rating * 0.82)) },
      { label: 'PHY', val: Math.min(99, Math.round(rating * 1.04)) },
    ];
  } else {
    attributes = [
      { label: 'PAC', val: Math.min(99, Math.round(rating * 0.96)) },
      { label: 'DRI', val: Math.min(99, Math.round(rating * 1.01)) },
      { label: 'SHO', val: Math.min(99, Math.round(rating * 0.84)) },
      { label: 'DEF', val: Math.min(99, Math.round(rating * 0.85)) },
      { label: 'PAS', val: Math.min(99, Math.round(rating * 1.03)) },
      { label: 'PHY', val: Math.min(99, Math.round(rating * 0.91)) },
    ];
  }

  const handleShareCard = async () => {
    try {
      if (!cardRef.current) return;
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
      });
      await Sharing.shareAsync(uri);
    } catch (err: any) {
      Alert.alert('خطأ', 'فشل تصدير صورة البطاقة: ' + err.message);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={futStyles.modalOverlay}>
        {/* The FUT Card Canvas */}
        <View
          ref={cardRef}
          collapsable={false}
          style={[
            futStyles.cardContainer,
            { backgroundColor: theme.bg, borderColor: theme.cardBorder },
          ]}
        >
          {/* Top Banner Tier */}
          <View style={[futStyles.tierBadge, { backgroundColor: theme.badgeBg }]}>
            <Text style={[futStyles.tierBadgeText, { color: theme.textAccent }]}>
              {theme.tierName}
            </Text>
          </View>

          {/* Top Row: Rating, Pos, Avatar, Nation/Club */}
          <View style={futStyles.cardHeaderRow}>
            <View style={futStyles.ratingPosCol}>
              <Text style={[futStyles.ratingNumber, { color: theme.textMain }]}>{rating}</Text>
              <Text style={[futStyles.posText, { color: theme.textAccent }]}>{posCode}</Text>
              <View style={futStyles.miniDivider} />
              <Text style={futStyles.squadIconEmoji}>🇸🇦</Text>
              <Text style={futStyles.squadIconEmoji}>{isGk ? '🧤' : '⚽'}</Text>
            </View>

            {/* Central Player Avatar */}
            <View style={futStyles.avatarContainer}>
              <View style={[futStyles.avatarCircle, { borderColor: theme.innerBorder }]}>
                <Text style={futStyles.avatarEmoji}>{isGk ? '🧤' : '🏃'}</Text>
              </View>
              {groupTag !== 'عام' && (
                <View style={[futStyles.squadTagBadge, { backgroundColor: theme.badgeBg }]}>
                  <Text style={[futStyles.squadTagText, { color: theme.textAccent }]} numberOfLines={1}>
                    🏷️ {groupTag}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Player Name Banner */}
          <View style={[futStyles.nameBanner, { borderColor: theme.innerBorder }]}>
            <Text style={[futStyles.playerNameText, { color: theme.textMain }]} numberOfLines={1}>
              {player.name}
            </Text>
          </View>

          {/* FIFA 6 Attributes Grid */}
          <View style={futStyles.attributesGrid}>
            <View style={futStyles.attrColumn}>
              <View style={futStyles.attrRow}>
                <Text style={[futStyles.attrVal, { color: theme.textMain }]}>
                  {attributes[0].val}
                </Text>
                <Text style={[futStyles.attrLabel, { color: theme.textAccent }]}>
                  {attributes[0].label}
                </Text>
              </View>
              <View style={futStyles.attrRow}>
                <Text style={[futStyles.attrVal, { color: theme.textMain }]}>
                  {attributes[2].val}
                </Text>
                <Text style={[futStyles.attrLabel, { color: theme.textAccent }]}>
                  {attributes[2].label}
                </Text>
              </View>
              <View style={futStyles.attrRow}>
                <Text style={[futStyles.attrVal, { color: theme.textMain }]}>
                  {attributes[4].val}
                </Text>
                <Text style={[futStyles.attrLabel, { color: theme.textAccent }]}>
                  {attributes[4].label}
                </Text>
              </View>
            </View>

            <View style={[futStyles.gridDivider, { backgroundColor: theme.innerBorder }]} />

            <View style={futStyles.attrColumn}>
              <View style={futStyles.attrRow}>
                <Text style={[futStyles.attrVal, { color: theme.textMain }]}>
                  {attributes[1].val}
                </Text>
                <Text style={[futStyles.attrLabel, { color: theme.textAccent }]}>
                  {attributes[1].label}
                </Text>
              </View>
              <View style={futStyles.attrRow}>
                <Text style={[futStyles.attrVal, { color: theme.textMain }]}>
                  {attributes[3].val}
                </Text>
                <Text style={[futStyles.attrLabel, { color: theme.textAccent }]}>
                  {attributes[3].label}
                </Text>
              </View>
              <View style={futStyles.attrRow}>
                <Text style={[futStyles.attrVal, { color: theme.textMain }]}>
                  {attributes[5].val}
                </Text>
                <Text style={[futStyles.attrLabel, { color: theme.textAccent }]}>
                  {attributes[5].label}
                </Text>
              </View>
            </View>
          </View>

          {/* Real World Pickup Stats Bar */}
          <View style={[futStyles.pickupStatsBar, { backgroundColor: theme.badgeBg }]}>
            <Text style={[futStyles.pickupStatText, { color: theme.textMain }]}>
              🎮 لعب: {matches}
            </Text>
            <Text style={[futStyles.pickupStatText, { color: '#4ADE80' }]}>
              🏆 فوز: {wins} ({winRate}%)
            </Text>
            {mvpCount > 0 && (
              <Text style={[futStyles.pickupMvpText, { color: '#FACC15' }]}>
                ⭐ MVP: {mvpCount}
              </Text>
            )}
          </View>

          {/* Bottom Card Brand Watermark */}
          <View style={futStyles.cardFooter}>
            <Text style={[futStyles.watermark, { color: theme.innerBorder }]}>
              ⚽ QISMAH ULTIMATE TEAM
            </Text>
          </View>
        </View>

        {/* Modal Action Controls */}
        <View style={futStyles.actionButtonsRow}>
          <TouchableOpacity style={futStyles.closeBtn} onPress={onClose}>
            <Text style={futStyles.closeBtnText}>✕ إغلاق</Text>
          </TouchableOpacity>

          <TouchableOpacity style={futStyles.shareBtn} onPress={handleShareCard}>
            <Text style={futStyles.shareBtnText}>📸 تصدير ومشاركة البطاقة</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const futStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  cardContainer: {
    width: Math.min(width - 40, 320),
    borderRadius: 22,
    borderWidth: 3,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 6,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  ratingPosCol: {
    alignItems: 'center',
    width: 50,
  },
  ratingNumber: {
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 38,
  },
  posText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: -2,
  },
  miniDivider: {
    width: 24,
    height: 1.5,
    backgroundColor: '#64748B',
    marginVertical: 4,
    opacity: 0.6,
  },
  squadIconEmoji: {
    fontSize: 14,
    marginTop: 2,
  },
  avatarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 48,
  },
  squadTagBadge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
  },
  squadTagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  nameBanner: {
    width: '100%',
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    paddingVertical: 6,
    marginVertical: 10,
    alignItems: 'center',
  },
  playerNameText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  attributesGrid: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  attrColumn: {
    flex: 1,
    gap: 4,
  },
  attrRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  attrVal: {
    fontSize: 15,
    fontWeight: '900',
    minWidth: 22,
    textAlign: 'right',
  },
  attrLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 26,
    textAlign: 'left',
  },
  gridDivider: {
    width: 1.5,
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

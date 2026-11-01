/**
 * ============================================================================
 * PlayerCard Components (PitchPlayerCard & DraftSlotCard)
 * ============================================================================
 * Visual pitch cards rendering player rating, kit emoji, and positions.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../styles';
import {
  getPositionCode,
  getCardStyleByRating,
  getKitEmojiByHex,
} from '../utils/helpers';

export interface PitchPlayerCardProps {
  player: any;
  teamKey?: 'A' | 'B';
  teamAColor: string;
  teamBColor: string;
  selectedPlayerId: string | null;
  onPlayerPress: (playerId: string) => void;
  onCyclePosition: (teamKey?: 'A' | 'B', playerId?: string) => void;
}

export function PitchPlayerCard({
  player,
  teamKey,
  teamAColor,
  teamBColor,
  selectedPlayerId,
  onPlayerPress,
  onCyclePosition,
}: PitchPlayerCardProps) {
  const isGk = player.position === 'حارس' || player.isGoalkeeper;
  const cardTheme = getCardStyleByRating(player.rating, isGk);
  const posCode = getPositionCode(isGk ? 'حارس' : player.position);
  const kitEmoji = isGk
    ? '🧤'
    : teamKey === 'A'
    ? getKitEmojiByHex(teamAColor, 'A')
    : getKitEmojiByHex(teamBColor, 'B');
  const isSelected = selectedPlayerId === player.uniqueId;

  return (
    <View style={styles.pitchPlayerWrapper}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onPlayerPress(player.uniqueId)}
        onLongPress={() => onCyclePosition(teamKey, player.uniqueId)}
        style={[
          styles.playerCardBody,
          { backgroundColor: cardTheme.bg, borderColor: cardTheme.border },
          isSelected && styles.selectedCardForSwap,
        ]}
      >
        <View style={styles.playerCardTopRow}>
          <View style={styles.playerRatingCol}>
            <Text style={[styles.playerRatingNum, { color: cardTheme.text }]}>{player.rating}</Text>
            <Text style={[styles.playerPosCode, { color: cardTheme.text }]}>{posCode}</Text>
          </View>
          <Text style={styles.playerKitIcon}>{kitEmoji}</Text>
        </View>
        <View style={styles.playerCardInnerLine} />
      </TouchableOpacity>

      <TouchableOpacity
        hitSlop={{ top: 4, bottom: 8, left: 6, right: 6 }}
        onPress={() => onCyclePosition(teamKey, player.uniqueId)}
        style={[styles.playerNamePlate, isSelected && styles.selectedNamePlate]}
      >
        <Text style={styles.playerCardName} numberOfLines={1}>
          {player.name}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export interface DraftSlotCardProps {
  slot: any;
  teamAColor: string;
  teamBColor: string;
  selectedDraftSlotId: string | null;
  onSlotPress: (slot: any) => void;
  onSelectForSwap: (slotId: string) => void;
}

export function DraftSlotCard({
  slot,
  teamAColor,
  teamBColor,
  selectedDraftSlotId,
  onSlotPress,
  onSelectForSwap,
}: DraftSlotCardProps) {
  const isGk = slot.position === 'حارس';
  const posCode = getPositionCode(slot.position);
  const isSelectedForSwap = selectedDraftSlotId === slot.slotId;

  if (!slot.player) {
    return (
      <View style={styles.pitchPlayerWrapper}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onSlotPress(slot)}
          style={[
            styles.emptyDraftCardBody,
            isGk && { borderColor: '#F97316' },
            isSelectedForSwap && styles.selectedCardForSwap,
          ]}
        >
          <Text style={styles.emptyDraftPlus}>＋</Text>
          <Text style={styles.emptyDraftPosCode}>{posCode}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onSlotPress(slot)} style={styles.emptyDraftNamePlate}>
          <Text style={styles.emptyDraftNameText}>اختر {slot.position}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const p = slot.player;
  const cardTheme = getCardStyleByRating(p.rating, isGk);
  const kitEmoji = isGk
    ? '🧤'
    : slot.teamKey === 'A'
    ? getKitEmojiByHex(teamAColor, 'A')
    : getKitEmojiByHex(teamBColor, 'B');

  return (
    <View style={styles.pitchPlayerWrapper}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onSlotPress(slot)}
        onLongPress={() => onSelectForSwap(slot.slotId)}
        style={[
          styles.playerCardBody,
          { backgroundColor: cardTheme.bg, borderColor: cardTheme.border },
          isSelectedForSwap && styles.selectedCardForSwap,
        ]}
      >
        <View style={styles.playerCardTopRow}>
          <View style={styles.playerRatingCol}>
            <Text style={[styles.playerRatingNum, { color: cardTheme.text }]}>{p.rating}</Text>
            <Text style={[styles.playerPosCode, { color: cardTheme.text }]}>{posCode}</Text>
          </View>
          <Text style={styles.playerKitIcon}>{kitEmoji}</Text>
        </View>
        <View style={styles.playerCardInnerLine} />
      </TouchableOpacity>

      <TouchableOpacity
        hitSlop={{ top: 4, bottom: 8, left: 6, right: 6 }}
        onPress={() => onSlotPress(slot)}
        style={[styles.playerNamePlate, isSelectedForSwap && styles.selectedNamePlate]}
      >
        <Text style={styles.playerCardName} numberOfLines={1}>
          {p.name}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

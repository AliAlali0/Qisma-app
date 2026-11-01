/**
 * ============================================================================
 * HomeScreen (Pure Presentational UI Component)
 * ============================================================================
 * 2-Column Grid Dashboard for quick navigation across Qismah features.
 */

import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import styles from '../styles';

export interface HomeScreenProps {
  userRole: string;
  onNavigate: (screenKey: string) => void;
  playersCount: number;
  teamsCount: number;
  matchesCount: number;
  tournamentsCount: number;
}

export default function HomeScreen({
  userRole,
  onNavigate,
  playersCount,
  teamsCount,
  matchesCount,
  tournamentsCount,
}: HomeScreenProps) {
  const isLoggedUser = userRole === 'registered' || userRole === 'subscriber';

  const menuItems = [
    {
      key: 'divide',
      icon: '⚡',
      title: 'تقسيم اللستة',
      subtitle: 'لصق لستة الواتساب وتوزيع الفريقين',
      badge: 'متاح للجميع',
      locked: false,
      color: '#1B4332',
    },
    {
      key: 'draft',
      icon: '🎮',
      title: 'التقسيم التكتيكي',
      subtitle: 'تحديد الخطة واختيار اللاعبين بالمركز',
      badge: 'للمسجلين',
      locked: !isLoggedUser,
      color: '#0F766E',
    },
    {
      key: 'tournament_create',
      icon: '➕',
      title: 'بطولة جديدة',
      subtitle: 'دوري نقاط أو إقصاء • قرعة عشوائية',
      badge: 'جديد 🏆',
      locked: !isLoggedUser,
      color: '#B45309',
    },
    {
      key: 'tournaments_list',
      icon: '🏆',
      title: 'سجل البطولات',
      subtitle: 'استعراض البطولات ومتابعة النتائج',
      badge: `${tournamentsCount} بطولة`,
      locked: !isLoggedUser,
      color: '#D97706',
    },
    {
      key: 'teams',
      icon: '🛡️',
      title: 'الأفرقة',
      subtitle: 'جميع الفرق المنشأة والمخصصة',
      badge: `${teamsCount} فريق`,
      locked: !isLoggedUser,
      color: '#7C3AED',
    },
    {
      key: 'players',
      icon: '👥',
      title: 'اللاعبين',
      subtitle: 'إضافة وتعديل اللاعبين والمراكز',
      badge: `${playersCount} لاعب`,
      locked: !isLoggedUser,
      color: '#0369A1',
    },
    {
      key: 'matches',
      icon: '📜',
      title: 'أرشيف المباريات',
      subtitle: 'سجل النتائج واختيار نجم المباراة',
      badge: `${matchesCount} مباراة`,
      locked: !isLoggedUser,
      color: '#1D4ED8',
    },
  ];

  const handlePressCard = (item: typeof menuItems[0]) => {
    if (item.locked) {
      Alert.alert(
        '🔒 ميزة للمسجلين فقط',
        'قم بالتبديل إلى وضع "👑 مسجل" أو "💎 مشترك برو" في أعلى الشاشة لفتح جميع القوائم!'
      );
      return;
    }
    onNavigate(item.key);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionHeaderTitle}>🏠 القائمة الرئيسية — اختر القسم:</Text>

      <View style={styles.homeGridContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.key}
            activeOpacity={0.85}
            style={[
              styles.homeGridCard,
              { borderTopColor: item.color },
              item.locked && { opacity: 0.55 },
            ]}
            onPress={() => handlePressCard(item)}
          >
            <Text style={styles.homeGridIcon}>{item.icon}</Text>
            <Text style={styles.homeGridTitle}>{item.title}</Text>
            <Text style={styles.homeGridSubtitle}>{item.subtitle}</Text>
            <View style={[styles.homeGridBadge, { backgroundColor: item.color }]}>
              <Text style={styles.homeGridBadgeText}>
                {item.locked ? '🔒 مقفل' : item.badge}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

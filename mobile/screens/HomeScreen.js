import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import styles from '../styles';

export default function HomeScreen({
  userRole,
  onNavigate,
  playersCount,
  teamsCount,
  matchesCount,
  tournamentsCount,
}) {
  const isLoggedUser = userRole === 'registered' || userRole === 'subscriber';

  const menuItems = [
    {
      key: 'divide',
      icon: '⚡',
      title: 'تقسيم اللستة النصية',
      subtitle: 'لصق لستة الواتساب وتوزيع الفريقين مع الملعب التفاعلي',
      badge: 'متاح للجميع',
      locked: false,
      color: '#1B4332',
    },
    {
      key: 'draft',
      icon: '🎮',
      title: 'التقسيم من الصفر (التكتيكي)',
      subtitle: 'تحديد الخطة واختيار اللاعبين بالمركز الأساسي والاحتياطي',
      badge: 'للمسجلين',
      locked: !isLoggedUser,
      color: '#0F766E',
    },
    {
      key: 'tournament_create',
      icon: '➕',
      title: 'إنشاء بطولة جديدة',
      subtitle: 'اختيار يدوي لعدد الفرق • دوري نقاط أو إقصاء • قرعة عشوائية',
      badge: 'جديد 🏆',
      locked: !isLoggedUser,
      color: '#B45309',
    },
    {
      key: 'tournaments_list',
      icon: '🏆',
      title: 'سجل البطولات المحفوظة',
      subtitle: 'استعراض جميع البطولات التي تم إنشاؤها ومتابعة نتائجها',
      badge: `${tournamentsCount} بطولة`,
      locked: !isLoggedUser,
      color: '#D97706',
    },
    {
      key: 'teams',
      icon: '🛡️',
      title: 'سجل الأفرقة (Teams)',
      subtitle: 'جميع الفرق المنشأة في البطولات والفرق المخصصة (A, B..Z, AA)',
      badge: `${teamsCount} فريق`,
      locked: !isLoggedUser,
      color: '#7C3AED',
    },
    {
      key: 'players',
      icon: '👥',
      title: 'سجل وإدارة اللاعبين',
      subtitle: 'إضافة وتعديل اللاعبين، المراكز الاحتياطية، وإحصائيات الفوز',
      badge: `${playersCount} لاعب`,
      locked: !isLoggedUser,
      color: '#0369A1',
    },
    {
      key: 'matches',
      icon: '📜',
      title: 'أرشيف ونتائج المباريات',
      subtitle: 'سجل المباريات السابقة، رصد النتائج، واختيار نجم المباراة MVP',
      badge: `${matchesCount} مباراة`,
      locked: !isLoggedUser,
      color: '#1D4ED8',
    },
  ];

  const handlePressCard = (item) => {
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
              styles.homeMenuCard,
              { borderRightColor: item.color },
              item.locked && { opacity: 0.6 },
            ]}
            onPress={() => handlePressCard(item)}
          >
            <View style={styles.homeCardLeftCol}>
              <View style={[styles.homeBadgePill, { backgroundColor: item.color }]}>
                <Text style={styles.homeBadgeText}>
                  {item.locked ? '🔒 مقفل' : item.badge}
                </Text>
              </View>
              <Text style={styles.homeCardArrow}>◀</Text>
            </View>

            <View style={styles.homeCardRightCol}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.homeCardTitle}>{item.title}</Text>
                <Text style={styles.homeCardIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.homeCardSubtitle}>{item.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
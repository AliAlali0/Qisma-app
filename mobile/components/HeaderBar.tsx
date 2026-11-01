/**
 * ============================================================================
 * HeaderBar Component (TypeScript UI Component)
 * ============================================================================
 * App top navigation bar displaying user role switcher, back button, and home trigger.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../styles';

export interface HeaderBarProps {
  userRole: string;
  currentUsername: string;
  onOpenAuthModal: () => void;
  onSwitchRole: (role: string) => void;
  mainScreen: string;
  onGoHome: () => void;
  onGoBack: () => void;
  canGoBack: boolean;
}

export default function HeaderBar({
  userRole,
  currentUsername,
  onOpenAuthModal,
  onSwitchRole,
  mainScreen,
  onGoHome,
  onGoBack,
  canGoBack,
}: HeaderBarProps) {
  return (
    <View style={styles.header}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
          alignItems: 'center',
          marginBottom: 4,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity style={styles.accountBadgeBtn} onPress={onOpenAuthModal}>
            <Text style={styles.accountBadgeText}>
              🔐 {userRole === 'guest' ? 'دخول' : currentUsername}
            </Text>
          </TouchableOpacity>

          {mainScreen !== 'home' && canGoBack && (
            <TouchableOpacity style={styles.backHeaderBtn} onPress={onGoBack}>
              <Text style={styles.backHeaderBtnText}>▶ رجوع</Text>
            </TouchableOpacity>
          )}

          {mainScreen !== 'home' && (
            <TouchableOpacity style={styles.homeHeaderBtn} onPress={onGoHome}>
              <Text style={styles.homeHeaderBtnText}>🏠 الرئيسية</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.title}>⚽ تطبيق قِسمه</Text>
      </View>

      <Text style={styles.subtitle}>
        {userRole === 'guest'
          ? 'وضع الضيف: تقسيم بالتمبلت • مشاركة كتابية • منع الكبتشر 🔒'
          : userRole === 'registered'
          ? 'وضع المسجل: بطولات 🏆 • أفرقة • مباريات • تقسيم من الصفر 🔓'
          : 'وضع المشترك برو 💎: أطقم مخصصة • ترقية التقييمات و MVP • كامل المزايا'}
      </Text>

      <View style={styles.roleSwitchContainer}>
        <TouchableOpacity
          style={[
            styles.roleSwitchBtn,
            userRole === 'subscriber' && styles.roleSwitchBtnSubscriberActive,
          ]}
          onPress={() => onSwitchRole('subscriber')}
        >
          <Text
            style={[
              styles.roleSwitchText,
              userRole === 'subscriber' && styles.roleSwitchTextActive,
            ]}
          >
            💎 مشترك برو
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleSwitchBtn,
            userRole === 'registered' && styles.roleSwitchBtnActive,
          ]}
          onPress={() => onSwitchRole('registered')}
        >
          <Text
            style={[
              styles.roleSwitchText,
              userRole === 'registered' && styles.roleSwitchTextActive,
            ]}
          >
            👑 مسجل
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleSwitchBtn, userRole === 'guest' && styles.roleSwitchBtnActive]}
          onPress={() => onSwitchRole('guest')}
        >
          <Text
            style={[
              styles.roleSwitchText,
              userRole === 'guest' && styles.roleSwitchTextActive,
            ]}
          >
            👤 ضيف
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

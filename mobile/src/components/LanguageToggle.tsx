/*
** EPITECH PROJECT, 2026
** AREA
** File description:
** LanguageToggle
*/

import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {colors, spacing, typography} from '../theme';
import {useLanguage} from '../context/LanguageContext';
import {Language} from '../i18n/translations';

type LanguageToggleProps = {
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

const options: {code: Language; labelKey: string}[] = [
  {code: 'fr', labelKey: 'language.option.fr'},
  {code: 'en', labelKey: 'language.option.en'},
];

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  compact = false,
  style,
}) => {
  const {language, setLanguage, t} = useLanguage();

  return (
    <View style={[styles.container, compact && styles.compactContainer, style]}>
      {!compact && <Text style={styles.label}>{t('language.title')}</Text>}
      <View style={styles.toggle}>
        {options.map(option => {
          const isActive = language === option.code;
          return (
            <TouchableOpacity
              key={option.code}
              style={[styles.option, isActive && styles.optionActive]}
              accessibilityRole="button"
              accessibilityState={{selected: isActive}}
              onPress={() => setLanguage(option.code)}>
              <Text
                style={[
                  styles.optionText,
                  isActive && styles.optionTextActive,
                ]}>
                {t(option.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  compactContainer: {
    justifyContent: 'center',
  },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  toggle: {
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
    backgroundColor: colors.surfaceMuted,
  },
  option: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
  },
  optionActive: {
    backgroundColor: colors.primary,
  },
  optionText: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  optionTextActive: {
    color: colors.background,
  },
});

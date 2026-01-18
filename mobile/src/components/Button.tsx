import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import {spacing, typography} from '../theme';
import {useAccessibility} from '../context/AccessibilityContext';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...props
}) => {
  const {colors} = useAccessibility();

  const getButtonStyle = () => {
    switch (variant) {
      case 'danger':
        return {
          backgroundColor: colors.error,
          borderColor: '#f87171',
          shadowColor: 'rgba(239, 68, 68, 0.45)',
        };
      case 'secondary':
        return {
          backgroundColor: colors.accent,
          borderColor: colors.primary,
          shadowColor: colors.glow,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: colors.primary,
          shadowColor: colors.glow,
        };
      default:
        return {
          backgroundColor: colors.primaryStrong,
          borderColor: colors.accent,
          shadowColor: colors.glow,
        };
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return {color: colors.primary};
      default:
        return {color: colors.text};
    }
  };

  const spinnerColor = variant === 'outline' ? colors.primaryStrong : colors.text;

  const baseButtonStyle = {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 48,
    borderWidth: 1,
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  };

  const disabledStyle = disabled ? {opacity: 0.5} : {};

  return (
    <TouchableOpacity
      style={[
        baseButtonStyle,
        getButtonStyle(),
        disabledStyle,
        style,
      ]}
      disabled={disabled || loading}
      {...props}>
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text style={[styles.text, getTextStyle()]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  text: {
    ...typography.button,
    fontWeight: '600',
  },
});

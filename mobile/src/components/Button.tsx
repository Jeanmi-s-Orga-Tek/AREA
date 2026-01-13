import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import {colors, spacing, typography} from '../theme';

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
  const getButtonStyle = () => {
    switch (variant) {
      case 'danger':
        return styles.dangerButton;
      case 'secondary':
        return styles.secondaryButton;
      case 'outline':
        return styles.outlineButton;
      default:
        return styles.primaryButton;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.outlineText;
      default:
        return styles.buttonText;
    }
  };

  const spinnerColor = variant === 'outline' ? colors.primaryStrong : colors.text;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        disabled && styles.disabled,
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
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderWidth: 1,
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButton: {
    backgroundColor: colors.primaryStrong,
    borderColor: colors.accent,
    shadowColor: colors.glow,
  },
  secondaryButton: {
    backgroundColor: colors.accent,
    borderColor: colors.primary,
    shadowColor: colors.glow,
  },
  dangerButton: {
    backgroundColor: colors.error,
    borderColor: '#f87171',
    shadowColor: 'rgba(239, 68, 68, 0.45)',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    shadowOpacity: 0.15,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...typography.button,
  },
  buttonText: {
    color: colors.background,
  },
  outlineText: {
    color: colors.primary,
  },
});

import React from 'react';
import {View, StyleSheet, ViewProps} from 'react-native';
import {spacing} from '../theme';
import {useAccessibility} from '../context/AccessibilityContext';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({children, style, ...props}) => {
  const {colors} = useAccessibility();

  const cardStyle = {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  };

  return (
    <View style={[cardStyle, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({});

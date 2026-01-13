import React, {useMemo} from 'react';
import {Dimensions, StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {colors, spacing} from '../theme';

type Star = {
  id: string;
  top: number;
  left: number;
  size: number;
  opacity: number;
};

type StarFieldProps = {
  children?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  padding?: number;
};

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const generateStars = (count: number): Star[] =>
  Array.from({length: count}, (_, idx) => ({
    id: `star-${idx}-${Math.random().toString(16).slice(2, 6)}`,
    top: Math.random() * SCREEN_HEIGHT,
    left: Math.random() * SCREEN_WIDTH,
    size: 1 + Math.random() * 2.4,
    opacity: 0.25 + Math.random() * 0.55,
  }));

export const StarField: React.FC<StarFieldProps> = ({
  children,
  contentStyle,
  padding = spacing.lg,
}) => {
  const stars = useMemo(() => generateStars(90), []);

  return (
    <View style={styles.container}>
      <View style={styles.background} />
      <View pointerEvents="none" style={styles.starLayer}>
        {stars.map(star => (
          <View
            key={star.id}
            style={[
              styles.star,
              {
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                opacity: star.opacity,
              },
            ]}
          />
        ))}
        <View style={styles.glow} />
      </View>
      <View style={[styles.content, {padding}, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
  },
  starLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#fff',
    shadowColor: '#cbd5f5',
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  content: {
    flex: 1,
  },
});

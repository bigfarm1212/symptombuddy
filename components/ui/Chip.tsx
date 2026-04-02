import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Animated,
  Easing,
  TouchableOpacityProps,
} from 'react-native';
import { ThemedText } from './ThemedText';
import Colors from '@/constants/Colors';

interface ChipProps extends Omit<TouchableOpacityProps, 'onPress'> {
  label: string;
  selected?: boolean;
  onPress?: (selected: boolean) => void;
  size?: 'sm' | 'md';
  color?: string;
}

export function Chip({
  label,
  selected = false,
  onPress,
  size = 'md',
  color = Colors.primary,
  style,
  ...props
}: ChipProps) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.08,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    onPress?.(!selected);
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[
          styles.chip,
          size === 'sm' ? styles.chipSm : styles.chipMd,
          selected
            ? { backgroundColor: color, borderColor: color }
            : styles.chipUnselected,
          style,
        ]}
        {...props}
      >
        <ThemedText
          variant="chip"
          color={selected ? '#fff' : Colors.textSecondary}
          style={styles.label}
        >
          {label}
        </ThemedText>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 100,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    margin: 4,
  },
  chipMd: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSm: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipUnselected: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  label: {
    fontWeight: '500',
  },
});

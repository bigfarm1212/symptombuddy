import React from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import Colors from '@/constants/Colors';

interface ThemedCardProps extends ViewProps {
  variant?: 'default' | 'ai' | 'alert' | 'amber' | 'primary' | 'flat';
  padding?: number;
}

export function ThemedCard({
  variant = 'default',
  padding = 16,
  style,
  children,
  ...props
}: ThemedCardProps) {
  return (
    <View style={[styles.base, styles[variant], { padding }, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  default: {
    backgroundColor: Colors.surface,
  },
  ai: {
    backgroundColor: Colors.ai,
  },
  alert: {
    backgroundColor: Colors.alertLight,
    borderWidth: 1,
    borderColor: Colors.alert + '30',
  },
  amber: {
    backgroundColor: Colors.amberLight,
    borderWidth: 1,
    borderColor: Colors.amber + '30',
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  flat: {
    backgroundColor: Colors.surface,
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

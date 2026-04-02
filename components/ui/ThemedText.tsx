import React from 'react';
import { StyleSheet, Text, TextStyle, TextProps } from 'react-native';
import Colors from '@/constants/Colors';

interface ThemedTextProps extends TextProps {
  variant?: 'display' | 'section' | 'body' | 'caption' | 'chip' | 'label';
  color?: string;
  bold?: boolean;
  semibold?: boolean;
}

export function ThemedText({
  variant = 'body',
  color,
  bold,
  semibold,
  style,
  ...props
}: ThemedTextProps) {
  return (
    <Text
      style={[styles.base, styles[variant], color ? { color } : null, bold ? { fontWeight: '700' } : null, semibold ? { fontWeight: '600' } : null, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: Colors.text,
    fontFamily: undefined, // uses system font (SF Pro / Roboto)
  },
  display: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: Colors.text,
  },
  section: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    color: Colors.text,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: Colors.textMuted,
  },
  chip: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    color: Colors.textSecondary,
  },
});

export const colors = {
  primary: '#ffaf84',
  secondary: '#fdf6c4',
  accent: '#fbab85',
  background: '#f8f9fb',
  text: '#2f2f2f',
  muted: '#6b6b6b',
  border: '#d7d7d7',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
};

import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const paperTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    tertiary: colors.accent,
    background: colors.background,
    surface: '#ffffff',
    onSurface: colors.text,
    outline: colors.border,
  },
};

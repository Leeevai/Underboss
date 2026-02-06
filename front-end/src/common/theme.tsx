import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =============================================================================
// COLOR DEFINITIONS
// =============================================================================

/**
 * Primary brand colors - Underboss identity
 */
export const BRAND = {
  primary: '#4867BB',      // Main brand blue
  primaryLight: '#6B8DD9',
  primaryDark: '#2D4A8A',
  secondary: '#1A202C',    // Dark navy/black
  secondaryLight: '#2D3748',
  accent: '#48BB78',       // Success green
  accentLight: '#68D391',
  warning: '#ECC94B',
  error: '#E53E3E',
  errorLight: '#FC8181',
} as const;

/**
 * Light theme colors
 */
export const LIGHT_COLORS = {
  // Backgrounds
  background: '#F7FAFC',
  backgroundSecondary: '#FFFFFF',
  backgroundTertiary: '#EDF2F7',
  card: '#FFFFFF',
  
  // Text
  text: '#1A202C',
  textSecondary: '#4A5568',
  textTertiary: '#718096',
  textMuted: '#A0AEC0',
  textInverse: '#FFFFFF',
  
  // Borders
  border: '#E2E8F0',
  borderLight: '#EDF2F7',
  borderDark: '#CBD5E0',
  
  // Interactive
  primary: BRAND.primary,
  primaryLight: BRAND.primaryLight,
  primaryDark: BRAND.primaryDark,
  secondary: BRAND.secondary,
  
  // Status
  success: BRAND.accent,
  successLight: '#C6F6D5',
  warning: BRAND.warning,
  warningLight: '#FEFCBF',
  error: BRAND.error,
  errorLight: '#FED7D7',
  
  // Components
  headerBg: '#FFFFFF',
  headerText: '#1A202C',
  headerBorder: '#F0F0F0',
  tabBarBg: '#FFFFFF',
  tabBarActive: BRAND.primary,
  tabBarInactive: '#A0AEC0',
  inputBg: '#FAFBFC',
  inputBorder: '#E2E8F0',
  inputText: '#2D3748',
  inputPlaceholder: '#A0AEC0',
  buttonPrimaryBg: BRAND.primary,
  buttonPrimaryText: '#FFFFFF',
  buttonSecondaryBg: '#FFFFFF',
  buttonSecondaryText: BRAND.primary,
  buttonSecondaryBorder: BRAND.primary,
  chipBg: '#F7FAFC',
  chipText: '#4A5568',
  chipActiveBg: BRAND.primary,
  chipActiveText: '#FFFFFF',
  
  // Shadows (for iOS)
  shadow: '#000000',
} as const;

/**
 * Dark theme colors
 */
export const DARK_COLORS = {
  // Backgrounds
  background: '#0D1117',
  backgroundSecondary: '#161B22',
  backgroundTertiary: '#21262D',
  card: '#161B22',
  
  // Text
  text: '#F0F6FC',
  textSecondary: '#C9D1D9',
  textTertiary: '#8B949E',
  textMuted: '#6E7681',
  textInverse: '#0D1117',
  
  // Borders
  border: '#30363D',
  borderLight: '#21262D',
  borderDark: '#484F58',
  
  // Interactive
  primary: '#58A6FF',
  primaryLight: '#79B8FF',
  primaryDark: '#388BFD',
  secondary: '#C9D1D9',
  
  // Status
  success: '#3FB950',
  successLight: '#238636',
  warning: '#D29922',
  warningLight: '#9E6A03',
  error: '#F85149',
  errorLight: '#DA3633',
  
  // Components
  headerBg: '#161B22',
  headerText: '#F0F6FC',
  headerBorder: '#30363D',
  tabBarBg: '#161B22',
  tabBarActive: '#58A6FF',
  tabBarInactive: '#6E7681',
  inputBg: '#0D1117',
  inputBorder: '#30363D',
  inputText: '#C9D1D9',
  inputPlaceholder: '#6E7681',
  buttonPrimaryBg: '#238636',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondaryBg: '#21262D',
  buttonSecondaryText: '#C9D1D9',
  buttonSecondaryBorder: '#30363D',
  chipBg: '#21262D',
  chipText: '#8B949E',
  chipActiveBg: '#388BFD',
  chipActiveText: '#FFFFFF',
  
  // Shadows
  shadow: '#000000',
} as const;

// Create a type that represents the structure but allows different color values
export type ThemeColors = {
  [K in keyof typeof LIGHT_COLORS]: string;
};

// =============================================================================
// SPACING & SIZING
// =============================================================================

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  title: 28,
} as const;

export const FONT_WEIGHT = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

// =============================================================================
// HEADER & TAB BAR CONSTANTS
// =============================================================================

export const HEADER_HEIGHT = 56;
export const HEADER_HEIGHT_WITH_STATUS = 100;
export const TAB_BAR_HEIGHT = 60;

// =============================================================================
// THEME CONTEXT
// =============================================================================

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  isDark: boolean;
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@underboss_theme_mode';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  // Save theme preference
  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  // Determine if dark mode should be active
  const isDark = mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');

  // Get current colors based on theme
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  // Toggle between light and dark (not system)
  const toggleTheme = () => {
    setMode(isDark ? 'light' : 'dark');
  };

  // Update status bar
  useEffect(() => {
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
  }, [isDark]);

  if (!isLoaded) {
    return null; // Or a loading indicator
  }

  return (
    <ThemeContext.Provider value={{ isDark, mode, colors, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to access theme context
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Hook to get current colors
 */
export const useColors = (): ThemeColors => {
  const { colors } = useTheme();
  return colors;
};

/**
 * Hook to check if dark mode is active
 */
export const useIsDark = (): boolean => {
  const { isDark } = useTheme();
  return isDark;
};

// =============================================================================
// STYLE HELPERS
// =============================================================================

/**
 * Create shadow style for cards/elevated elements
 */
export const createShadow = (elevation: number = 3, isDark: boolean = false) => ({
  shadowColor: isDark ? '#000' : '#000',
  shadowOffset: { width: 0, height: elevation / 2 },
  shadowOpacity: isDark ? 0.3 : 0.1,
  shadowRadius: elevation,
  elevation: elevation,
});

/**
 * Create default header style
 */
export const createHeaderStyle = (colors: ThemeColors, isDark: boolean) => ({
  flexDirection: 'row' as const,
  height: HEADER_HEIGHT,
  backgroundColor: colors.headerBg,
  alignItems: 'center' as const,
  paddingHorizontal: SPACING.lg,
  borderBottomWidth: 1,
  borderBottomColor: colors.headerBorder,
  ...createShadow(3, isDark),
});

/**
 * Create default screen container style
 */
export const createScreenStyle = (colors: ThemeColors) => ({
  flex: 1,
  backgroundColor: colors.background,
});

/**
 * Create card style
 */
export const createCardStyle = (colors: ThemeColors, isDark: boolean) => ({
  backgroundColor: colors.card,
  borderRadius: RADIUS.lg,
  padding: SPACING.lg,
  ...createShadow(2, isDark),
});

/**
 * Create section style (for grouped content)
 */
export const createSectionStyle = (colors: ThemeColors) => ({
  backgroundColor: colors.card,
  borderRadius: RADIUS.lg,
  marginHorizontal: SPACING.lg,
  marginTop: SPACING.lg,
  padding: SPACING.lg,
  borderWidth: 1,
  borderColor: colors.border,
});

/**
 * Create input style
 */
export const createInputStyle = (colors: ThemeColors) => ({
  backgroundColor: colors.inputBg,
  borderWidth: 1,
  borderColor: colors.inputBorder,
  borderRadius: RADIUS.md,
  paddingHorizontal: SPACING.md,
  paddingVertical: SPACING.md,
  fontSize: FONT_SIZE.md,
  color: colors.inputText,
});

/**
 * Create primary button style
 */
export const createPrimaryButtonStyle = (colors: ThemeColors) => ({
  backgroundColor: colors.buttonPrimaryBg,
  borderRadius: RADIUS.md,
  paddingVertical: SPACING.lg,
  paddingHorizontal: SPACING.xl,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
});

/**
 * Create secondary button style
 */
export const createSecondaryButtonStyle = (colors: ThemeColors) => ({
  backgroundColor: colors.buttonSecondaryBg,
  borderWidth: 1,
  borderColor: colors.buttonSecondaryBorder,
  borderRadius: RADIUS.md,
  paddingVertical: SPACING.lg,
  paddingHorizontal: SPACING.xl,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
});

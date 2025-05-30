import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { StyleSheet } from 'react-native';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2196F3',
    primaryContainer: '#E3F2FD',
    secondary: '#4CAF50',
    secondaryContainer: '#E8F5E8',
    tertiary: '#FF9800',
    tertiaryContainer: '#FFF3E0',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    background: '#FAFAFA',
    error: '#F44336',
    errorContainer: '#FFEBEE',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#1976D2',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#2E7D32',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#E65100',
    onSurface: '#212121',
    onSurfaceVariant: '#757575',
    onBackground: '#212121',
    onError: '#FFFFFF',
    onErrorContainer: '#C62828',
    outline: '#BDBDBD',
    outlineVariant: '#E0E0E0',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#303030',
    inverseOnSurface: '#F5F5F5',
    inversePrimary: '#90CAF9',
    elevation: {
      level0: 'transparent',
      level1: '#F8F9FA',
      level2: '#F1F3F4',
      level3: '#E8EAED',
      level4: '#E3E5E8',
      level5: '#DADCE0',
    },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#90CAF9',
    primaryContainer: '#1565C0',
    secondary: '#81C784',
    secondaryContainer: '#388E3C',
    tertiary: '#FFB74D',
    tertiaryContainer: '#F57C00',
    surface: '#121212',
    surfaceVariant: '#1E1E1E',
    background: '#000000',
    error: '#EF5350',
    errorContainer: '#B71C1C',
    onPrimary: '#0D47A1',
    onPrimaryContainer: '#E3F2FD',
    onSecondary: '#1B5E20',
    onSecondaryContainer: '#E8F5E8',
    onTertiary: '#E65100',
    onTertiaryContainer: '#FFF3E0',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#BDBDBD',
    onBackground: '#FFFFFF',
    onError: '#FFFFFF',
    onErrorContainer: '#FFCDD2',
    outline: '#616161',
    outlineVariant: '#424242',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#F5F5F5',
    inverseOnSurface: '#303030',
    inversePrimary: '#2196F3',
    elevation: {
      level0: 'transparent',
      level1: '#1E1E1E',
      level2: '#232323',
      level3: '#252525',
      level4: '#272727',
      level5: '#2C2C2C',
    },
  },
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
  },
  button: {
    borderRadius: 8,
    marginVertical: 4,
  },
  multiButton: {
    height: 120,
    borderRadius: 60,
    marginVertical: 20,
    elevation: 8,
  },
  weeklyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  weeklyGridItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteItem: {
    marginVertical: 4,
    borderRadius: 8,
    padding: 12,
  },
  weatherWidget: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  statisticsTable: {
    borderRadius: 8,
    marginVertical: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  section: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCenter: {
    textAlign: 'center',
  },
  textBold: {
    fontWeight: 'bold',
  },
  textSmall: {
    fontSize: 12,
  },
  textMedium: {
    fontSize: 14,
  },
  textLarge: {
    fontSize: 16,
  },
  textXLarge: {
    fontSize: 20,
  },
  marginSmall: {
    margin: 4,
  },
  marginMedium: {
    margin: 8,
  },
  marginLarge: {
    margin: 16,
  },
  paddingSmall: {
    padding: 4,
  },
  paddingMedium: {
    padding: 8,
  },
  paddingLarge: {
    padding: 16,
  },
});

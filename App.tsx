import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PaperProvider, ActivityIndicator } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppProvider, useApp } from './src/contexts/AppContext';
import { lightTheme, darkTheme } from './src/constants/themes';
import { t } from './src/i18n';
import { RootStackParamList, TabParamList } from './src/types';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { TabBarIcon } from './src/components/OptimizedIconButton';
import { initializeIconPreloader } from './src/services/iconPreloader';

// Screens
import { HomeScreen } from './src/screens/HomeScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ShiftManagementScreen } from './src/screens/ShiftManagementScreen';
import { AddEditShiftScreen } from './src/screens/AddEditShiftScreen';
import { NotesScreen } from './src/screens/NotesScreen';
import { NoteDetailScreen } from './src/screens/NoteDetailScreen';
import { StatisticsScreen } from './src/screens/StatisticsScreen';
import { WeatherDetailScreen } from './src/screens/WeatherDetailScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  const { state } = useApp();
  const theme = state.settings?.theme === 'dark' ? darkTheme : lightTheme;
  const currentLanguage = state.settings?.language || 'vi';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap;

          switch (route.name) {
            case 'HomeTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'ShiftsTab':
              iconName = focused ? 'clock' : 'clock-outline';
              break;
            case 'NotesTab':
              iconName = focused ? 'note-text' : 'note-text-outline';
              break;
            case 'StatisticsTab':
              iconName = focused ? 'chart-line' : 'chart-line-variant';
              break;
            case 'SettingsTab':
              iconName = focused ? 'cog' : 'cog-outline';
              break;
            default:
              iconName = 'circle';
          }

          // ✅ Sử dụng TabBarIcon được tối ưu thay vì MaterialCommunityIcons trực tiếp
          return <TabBarIcon focused={focused} color={color} size={size} iconName={iconName} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 1,
          elevation: 8,
          height: 75, // Tăng chiều cao từ 60 lên 75
          paddingBottom: 16, // Tăng padding bottom từ 8 lên 16 để tạo khoảng cách với đáy
          paddingTop: 12, // Tăng padding top từ 8 lên 12 để cân bằng
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 4, // Thêm margin bottom cho text để tạo khoảng cách với đáy
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: t(currentLanguage, 'navigation.home'),
        }}
      />
      <Tab.Screen
        name="ShiftsTab"
        component={ShiftManagementScreen}
        options={{
          tabBarLabel: t(currentLanguage, 'navigation.shifts'),
        }}
      />
      <Tab.Screen
        name="NotesTab"
        component={NotesScreen}
        options={{
          tabBarLabel: t(currentLanguage, 'navigation.notes'),
        }}
      />
      <Tab.Screen
        name="StatisticsTab"
        component={StatisticsScreen}
        options={{
          tabBarLabel: t(currentLanguage, 'navigation.statistics'),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: t(currentLanguage, 'navigation.settings'),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { state } = useApp();

  const theme = state.settings?.theme === 'dark' ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <StatusBar style={state.settings?.theme === 'dark' ? 'light' : 'dark'} />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="ShiftManagement" component={ShiftManagementScreen} />
          <Stack.Screen name="AddEditShift" component={AddEditShiftScreen} />
          <Stack.Screen name="NoteDetail" component={NoteDetailScreen} />
          <Stack.Screen name="WeatherDetail" component={WeatherDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

/**
 * ✅ Loading Screen component hiển thị khi đang preload icons
 */
function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#6200ee" />
      <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
        Đang tải icons...
      </Text>
    </View>
  );
}

/**
 * ✅ App with Icon Preloader
 */
function AppWithPreloader() {
  const [isIconsReady, setIsIconsReady] = useState(false);

  useEffect(() => {
    const preloadIcons = async () => {
      try {
        await initializeIconPreloader();
        setIsIconsReady(true);
      } catch (error) {
        console.error('❌ Error preloading icons:', error);
        // Vẫn cho phép app chạy ngay cả khi preload thất bại
        setIsIconsReady(true);
      }
    };

    preloadIcons();
  }, []);

  if (!isIconsReady) {
    return <LoadingScreen />;
  }

  return <AppNavigator />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppProvider>
          <AppWithPreloader />
        </AppProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

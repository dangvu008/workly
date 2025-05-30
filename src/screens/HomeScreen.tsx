import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, IconButton, useTheme, Button, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useApp } from '../contexts/AppContext';
import { MultiFunctionButton, SimpleMultiFunctionButton } from '../components/MultiFunctionButton';
import { WeeklyStatusGrid } from '../components/WeeklyStatusGrid';
import { WeatherWidget } from '../components/WeatherWidget';
import { AttendanceHistory } from '../components/AttendanceHistory';
import { commonStyles } from '../constants/themes';
import { TabParamList, RootStackParamList } from '../types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { workManager } from '../services/workManager';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'HomeTab'>,
  StackNavigationProp<RootStackParamList>
>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export function HomeScreen({ navigation }: HomeScreenProps) {
  const theme = useTheme();
  const { state, actions } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        actions.refreshButtonState(),
        actions.refreshWeeklyStatus(),
        actions.refreshWeatherData(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getAttendanceHistory = () => {
    // Only show history if within active window
    if (!state.timeDisplayInfo?.shouldShowHistory) {
      return [];
    }

    const todayStatus = state.todayStatus;

    if (!todayStatus) {
      return [];
    }

    const history = [];

    if (todayStatus.vaoLogTime) {
      history.push({
        action: 'Chấm công vào',
        time: format(new Date(todayStatus.vaoLogTime), 'HH:mm:ss'),
        icon: '📥',
      });
    }

    if (todayStatus.raLogTime) {
      history.push({
        action: 'Chấm công ra',
        time: format(new Date(todayStatus.raLogTime), 'HH:mm:ss'),
        icon: '📤',
      });
    }

    return history;
  };

  const [topNotes, setTopNotes] = React.useState<any[]>([]);

  // Load priority notes using workManager
  const loadTopNotes = async () => {
    try {
      const count = state.settings?.notesDisplayCount || 3;
      const priorityNotes = await workManager.getPriorityNotes(state.notes, count);
      setTopNotes(priorityNotes);
    } catch (error) {
      console.error('Error loading top notes:', error);
      setTopNotes([]);
    }
  };

  // Load top notes when notes or settings change
  React.useEffect(() => {
    loadTopNotes();
  }, [state.notes, state.settings?.notesDisplayCount, state.activeShift]);

  const attendanceHistory = getAttendanceHistory();

  if (state.isLoading) {
    return (
      <SafeAreaView style={[commonStyles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[commonStyles.centerContent, { flex: 1 }]}>
          <Text>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={[commonStyles.header, styles.header]}>
          <View>
            <Text style={[styles.dateTime, { color: theme.colors.onBackground }]}>
              {format(currentTime, 'EEEE, dd/MM', { locale: vi })}
            </Text>
            <Text style={[styles.time, { color: theme.colors.onBackground }]}>
              {format(currentTime, 'HH:mm')}
            </Text>
          </View>
          <IconButton
            icon="cog"
            size={24}
            iconColor={theme.colors.onBackground}
            onPress={() => navigation.navigate('SettingsTab')}
          />
        </View>

        {/* Weather Widget */}
        <WeatherWidget onPress={() => navigation.navigate('WeatherDetail')} />

        {/* Active Shift */}
        <Card style={[commonStyles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.shiftHeader}>
              <Text style={[styles.shiftTitle, { color: theme.colors.onSurface }]}>
                Ca làm việc hiện tại
              </Text>
              <IconButton
                icon="pencil"
                size={20}
                iconColor={theme.colors.primary}
                onPress={() => navigation.navigate('ShiftsTab')}
              />
            </View>
            <Text style={[styles.shiftName, { color: theme.colors.primary }]}>
              {state.activeShift?.name || 'Chưa chọn ca'}
            </Text>
            {state.activeShift && (
              <Text style={[styles.shiftTime, { color: theme.colors.onSurface }]}>
                {state.activeShift.startTime} - {state.activeShift.endTime}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Multi-Function Button - Only show if within active window */}
        {state.timeDisplayInfo?.shouldShowButton && (
          state.settings?.multiButtonMode === 'simple' ? (
            <SimpleMultiFunctionButton />
          ) : (
            <MultiFunctionButton />
          )
        )}

        {/* Attendance History - Show below Multi-Function Button */}
        {state.timeDisplayInfo?.shouldShowButton && (
          <AttendanceHistory />
        )}

        {/* Time Display Info for debugging */}
        {state.timeDisplayInfo && !state.timeDisplayInfo.shouldShowButton && (
          <Card style={[commonStyles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Card.Content>
              <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
                {state.timeDisplayInfo.currentPhase === 'inactive' &&
                  `Nút sẽ hiện lại sau ${Math.floor(state.timeDisplayInfo.timeUntilNextReset / 60)}h ${state.timeDisplayInfo.timeUntilNextReset % 60}m`
                }
                {state.timeDisplayInfo.currentPhase === 'after_work' &&
                  'Đã kết thúc ca làm việc'
                }
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Attendance History */}
        {attendanceHistory.length > 0 && (
          <Card style={[commonStyles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Lịch sử hôm nay
              </Text>
              {attendanceHistory.map((item, index) => (
                <View key={index} style={styles.historyItem}>
                  <Text style={styles.historyIcon}>{item.icon}</Text>
                  <Text style={[styles.historyAction, { color: theme.colors.onSurface }]}>
                    {item.action}
                  </Text>
                  <Text style={[styles.historyTime, { color: theme.colors.onSurfaceVariant }]}>
                    {item.time}
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Weekly Status Grid */}
        <WeeklyStatusGrid onDayPress={(date) => {
          // Could navigate to day detail or show more info
          console.log('Day pressed:', date);
        }} />

        {/* Notes Section */}
        <Card style={[commonStyles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.notesHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Ghi chú sắp tới
              </Text>
              <IconButton
                icon="format-list-bulleted"
                size={20}
                iconColor={theme.colors.primary}
                onPress={() => navigation.navigate('NotesTab')}
              />
            </View>

            {topNotes.length > 0 ? (
              <>
                {topNotes.map((note, index) => (
                  <View key={note.id}>
                    <View style={styles.noteItem}>
                      <View style={styles.noteContent}>
                        {note.isPriority && (
                          <Text style={styles.priorityIcon}>⭐</Text>
                        )}
                        <View style={styles.noteText}>
                          <Text
                            style={[styles.noteTitle, { color: theme.colors.onSurface }]}
                            numberOfLines={1}
                          >
                            {note.title}
                          </Text>
                          <Text
                            style={[styles.noteDescription, { color: theme.colors.onSurfaceVariant }]}
                            numberOfLines={2}
                          >
                            {note.content}
                          </Text>
                          {note.reminderDateTime && (
                            <Text style={[styles.noteReminder, { color: theme.colors.primary }]}>
                              Nhắc lúc: {format(new Date(note.reminderDateTime), 'dd/MM HH:mm')}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.noteActions}>
                        <IconButton
                          icon="pencil"
                          size={16}
                          iconColor={theme.colors.primary}
                          onPress={() => navigation.navigate('NoteDetail', { noteId: note.id })}
                        />
                        <IconButton
                          icon="delete"
                          size={16}
                          iconColor={theme.colors.error}
                          onPress={() => actions.deleteNote(note.id)}
                        />
                      </View>
                    </View>
                    {index < topNotes.length - 1 && <Divider />}
                  </View>
                ))}
              </>
            ) : (
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                Không có ghi chú nào
              </Text>
            )}

            <Button
              mode="outlined"
              onPress={() => navigation.navigate('NoteDetail', {})}
              style={styles.addNoteButton}
              icon="plus"
            >
              Thêm ghi chú
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 8,
  },
  dateTime: {
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  time: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  shiftName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  shiftTime: {
    fontSize: 14,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  historyIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  historyAction: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  historyTime: {
    fontSize: 12,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteItem: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  noteContent: {
    flex: 1,
    flexDirection: 'row',
  },
  priorityIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  noteText: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  noteDescription: {
    fontSize: 12,
    marginBottom: 4,
  },
  noteReminder: {
    fontSize: 11,
    fontWeight: '500',
  },
  noteActions: {
    flexDirection: 'row',
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 16,
  },
  addNoteButton: {
    marginTop: 12,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

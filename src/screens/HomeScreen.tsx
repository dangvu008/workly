import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
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
  const [expandedNotes, setExpandedNotes] = React.useState<Set<string>>(new Set());

  // Get upcoming notes with reminder info
  const getUpcomingNotes = () => {
    const now = new Date();
    const notesWithReminders = state.notes.filter(note => {
      // Has specific reminder time
      if (note.reminderDateTime) {
        const reminderTime = new Date(note.reminderDateTime);
        return reminderTime > now;
      }

      // Has shift-based reminders
      if (note.associatedShiftIds && note.associatedShiftIds.length > 0) {
        return true; // Always show shift-based notes as they have recurring reminders
      }

      return false;
    });

    // Sort by reminder priority: specific times first (by time), then shift-based
    const sortedNotes = notesWithReminders.sort((a, b) => {
      if (a.reminderDateTime && b.reminderDateTime) {
        return new Date(a.reminderDateTime).getTime() - new Date(b.reminderDateTime).getTime();
      }
      if (a.reminderDateTime && !b.reminderDateTime) return -1;
      if (!a.reminderDateTime && b.reminderDateTime) return 1;

      // Both are shift-based, sort by priority then by updated time
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return sortedNotes.slice(0, 3); // Show max 3 notes
  };

  // Load upcoming notes
  const loadTopNotes = async () => {
    try {
      const upcomingNotes = getUpcomingNotes();
      setTopNotes(upcomingNotes);
    } catch (error) {
      console.error('Error loading top notes:', error);
      setTopNotes([]);
    }
  };

  // Load top notes when notes or settings change
  React.useEffect(() => {
    loadTopNotes();
  }, [state.notes, state.settings?.notesDisplayCount, state.activeShift]);

  // Helper function to format reminder info
  const formatReminderInfo = (note: any): string => {
    // Specific reminder time
    if (note.reminderDateTime) {
      try {
        const reminderDate = new Date(note.reminderDateTime);
        const now = new Date();
        const diffMs = reminderDate.getTime() - now.getTime();

        if (diffMs < 0) {
          return 'Đã qua';
        } else if (diffMs < 24 * 60 * 60 * 1000) {
          return `Hôm nay ${format(reminderDate, 'HH:mm')}`;
        } else if (diffMs < 7 * 24 * 60 * 60 * 1000) {
          return format(reminderDate, 'EEEE HH:mm', { locale: vi });
        } else {
          return format(reminderDate, 'dd/MM/yyyy HH:mm');
        }
      } catch (error) {
        return 'Lỗi thời gian';
      }
    }

    // Shift-based reminders
    if (note.associatedShiftIds && note.associatedShiftIds.length > 0) {
      const associatedShifts = state.shifts.filter(shift =>
        note.associatedShiftIds!.includes(shift.id)
      );

      if (associatedShifts.length === 0) {
        return 'Ca đã bị xóa';
      }

      const shiftNames = associatedShifts.map(shift => shift.name).join(', ');
      return `Theo ca: ${shiftNames}`;
    }

    return '';
  };

  // Toggle note expansion
  const toggleNoteExpansion = (noteId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  // Handle note deletion with confirmation
  const handleDeleteNote = (note: any) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có muốn xóa ghi chú "${note.title}" không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await actions.deleteNote(note.id);
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa ghi chú.');
            }
          }
        }
      ]
    );
  };

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
                Ghi Chú Sắp Tới
              </Text>
              <IconButton
                icon="menu"
                size={20}
                iconColor={theme.colors.primary}
                onPress={() => navigation.navigate('NotesTab')}
              />
            </View>

            {topNotes.length > 0 ? (
              <>
                {topNotes.map((note, index) => {
                  const isExpanded = expandedNotes.has(note.id);
                  const reminderInfo = formatReminderInfo(note);

                  return (
                    <View key={note.id}>
                      <TouchableOpacity
                        style={styles.noteItem}
                        onPress={() => toggleNoteExpansion(note.id)}
                        activeOpacity={0.7}
                      >
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
                              numberOfLines={isExpanded ? undefined : 2}
                            >
                              {note.content}
                            </Text>
                            {reminderInfo && (
                              <Text style={[styles.noteReminder, { color: theme.colors.primary }]}>
                                Nhắc: {reminderInfo}
                              </Text>
                            )}
                          </View>
                        </View>
                        <View style={styles.noteActions}>
                          <IconButton
                            icon="pencil"
                            size={16}
                            iconColor={theme.colors.primary}
                            onPress={(e) => {
                              e.stopPropagation();
                              navigation.navigate('NoteDetail', { noteId: note.id });
                            }}
                          />
                          <IconButton
                            icon="delete"
                            size={16}
                            iconColor={theme.colors.error}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note);
                            }}
                          />
                        </View>
                      </TouchableOpacity>
                      {index < topNotes.length - 1 && <Divider />}
                    </View>
                  );
                })}
              </>
            ) : (
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                Không có ghi chú sắp tới
              </Text>
            )}

            <Button
              mode="outlined"
              onPress={() => navigation.navigate('NoteDetail', {})}
              style={styles.addNoteButton}
              icon="plus"
            >
              Thêm Ghi Chú
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

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
import { commonStyles } from '../constants/themes';
import { RootStackParamList } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

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
    // This would show today's attendance logs
    // For now, we'll show a simple status
    const today = format(new Date(), 'yyyy-MM-dd');
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

  const getTopNotes = () => {
    const count = state.settings?.notesDisplayCount || 3;
    
    // Sort notes by priority and reminder time
    const sortedNotes = [...state.notes]
      .filter(note => {
        // Show notes with upcoming reminders or priority notes
        if (note.isPriority) return true;
        if (note.reminderDateTime) {
          const reminderTime = new Date(note.reminderDateTime);
          const now = new Date();
          const timeDiff = reminderTime.getTime() - now.getTime();
          return timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000; // Next 24 hours
        }
        return false;
      })
      .sort((a, b) => {
        // Priority notes first
        if (a.isPriority && !b.isPriority) return -1;
        if (!a.isPriority && b.isPriority) return 1;
        
        // Then by reminder time
        if (a.reminderDateTime && b.reminderDateTime) {
          return new Date(a.reminderDateTime).getTime() - new Date(b.reminderDateTime).getTime();
        }
        if (a.reminderDateTime && !b.reminderDateTime) return -1;
        if (!a.reminderDateTime && b.reminderDateTime) return 1;
        
        // Finally by updated time
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

    return sortedNotes.slice(0, count);
  };

  const attendanceHistory = getAttendanceHistory();
  const topNotes = getTopNotes();

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
            onPress={() => navigation.navigate('Settings')}
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
                onPress={() => navigation.navigate('ShiftManagement')}
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

        {/* Multi-Function Button */}
        {state.settings?.multiButtonMode === 'simple' ? (
          <SimpleMultiFunctionButton />
        ) : (
          <MultiFunctionButton />
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
                onPress={() => navigation.navigate('Notes')}
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
              onPress={() => navigation.navigate('NoteDetail')}
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
});

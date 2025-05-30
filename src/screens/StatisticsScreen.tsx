import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Card,
  IconButton,
  useTheme,
  DataTable,
  Button,
  Menu
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useApp } from '../contexts/AppContext';
import { WEEKLY_STATUS } from '../constants';
import { TabParamList, RootStackParamList } from '../types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type StatisticsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'StatisticsTab'>,
  StackNavigationProp<RootStackParamList>
>;

interface StatisticsScreenProps {
  navigation: StatisticsScreenNavigationProp;
}

type TimePeriod = 'week' | 'month' | 'custom';

export function StatisticsScreen({ navigation }: StatisticsScreenProps) {
  const theme = useTheme();
  const { state } = useApp();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [periodMenuVisible, setPeriodMenuVisible] = useState(false);

  const getDateRange = () => {
    const now = new Date();

    switch (timePeriod) {
      case 'week':
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
          label: 'Tuần này'
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: 'Tháng này'
        };
      default:
        return {
          start: subWeeks(now, 4),
          end: now,
          label: '4 tuần qua'
        };
    }
  };

  const getFilteredData = () => {
    const { start, end } = getDateRange();
    const filtered = [];

    const current = new Date(start);
    while (current <= end) {
      const dateString = format(current, 'yyyy-MM-dd');
      const status = state.weeklyStatus[dateString];

      if (status) {
        filtered.push({
          date: dateString,
          dayName: format(current, 'EEE', { locale: vi }),
          ...status
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return filtered;
  };

  const calculateSummary = () => {
    const data = getFilteredData();

    const summary = {
      totalDays: data.length,
      completedDays: data.filter(d => d.status === 'completed').length,
      lateDays: data.filter(d => d.status === 'late').length,
      earlyDays: data.filter(d => d.status === 'early').length,
      absentDays: data.filter(d => d.status === 'absent').length,
      totalStandardHours: data.reduce((sum, d) => sum + d.standardHoursScheduled, 0),
      totalOtHours: data.reduce((sum, d) => sum + d.otHoursScheduled, 0),
      totalSundayHours: data.reduce((sum, d) => sum + d.sundayHoursScheduled, 0),
      totalNightHours: data.reduce((sum, d) => sum + d.nightHoursScheduled, 0),
      totalHours: data.reduce((sum, d) => sum + d.totalHoursScheduled, 0),
      totalLateMinutes: data.reduce((sum, d) => sum + d.lateMinutes, 0),
      totalEarlyMinutes: data.reduce((sum, d) => sum + d.earlyMinutes, 0),
    };

    return summary;
  };

  const formatHours = (hours: number): string => {
    return `${hours.toFixed(1)}h`;
  };

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusIcon = (status: string): string => {
    return WEEKLY_STATUS[status as keyof typeof WEEKLY_STATUS]?.icon || '❓';
  };

  const data = getFilteredData();
  const summary = calculateSummary();
  const { label } = getDateRange();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={{ width: 48 }} />
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          Thống kê
        </Text>
        <Menu
          visible={periodMenuVisible}
          onDismiss={() => setPeriodMenuVisible(false)}
          anchor={
            <IconButton
              icon="calendar"
              size={24}
              onPress={() => setPeriodMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setTimePeriod('week');
              setPeriodMenuVisible(false);
            }}
            title="Tuần này"
          />
          <Menu.Item
            onPress={() => {
              setTimePeriod('month');
              setPeriodMenuVisible(false);
            }}
            title="Tháng này"
          />
          <Menu.Item
            onPress={() => {
              setTimePeriod('custom');
              setPeriodMenuVisible(false);
            }}
            title="4 tuần qua"
          />
        </Menu>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Period Info */}
        <Card style={[styles.card, { backgroundColor: theme.colors.primaryContainer }]}>
          <Card.Content>
            <Text style={[styles.periodTitle, { color: theme.colors.onPrimaryContainer }]}>
              {label}
            </Text>
            <Text style={[styles.periodSubtitle, { color: theme.colors.onPrimaryContainer }]}>
              {format(getDateRange().start, 'dd/MM/yyyy')} - {format(getDateRange().end, 'dd/MM/yyyy')}
            </Text>
          </Card.Content>
        </Card>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.summaryContent}>
              <Text style={[styles.summaryNumber, { color: theme.colors.primary }]}>
                {summary.totalDays}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurface }]}>
                Tổng ngày
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.summaryContent}>
              <Text style={[styles.summaryNumber, { color: theme.colors.secondary }]}>
                {summary.completedDays}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurface }]}>
                Hoàn thành
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.summaryContent}>
              <Text style={[styles.summaryNumber, { color: theme.colors.tertiary }]}>
                {formatHours(summary.totalHours)}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurface }]}>
                Tổng giờ
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.summaryContent}>
              <Text style={[styles.summaryNumber, { color: theme.colors.error }]}>
                {summary.lateDays}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurface }]}>
                Đi muộn
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Hours Breakdown */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Phân loại giờ làm việc
            </Text>

            <View style={styles.hoursBreakdown}>
              <View style={styles.hoursItem}>
                <Text style={[styles.hoursLabel, { color: theme.colors.onSurface }]}>
                  Giờ HC:
                </Text>
                <Text style={[styles.hoursValue, { color: theme.colors.primary }]}>
                  {formatHours(summary.totalStandardHours)}
                </Text>
              </View>

              <View style={styles.hoursItem}>
                <Text style={[styles.hoursLabel, { color: theme.colors.onSurface }]}>
                  Giờ OT:
                </Text>
                <Text style={[styles.hoursValue, { color: theme.colors.secondary }]}>
                  {formatHours(summary.totalOtHours)}
                </Text>
              </View>

              <View style={styles.hoursItem}>
                <Text style={[styles.hoursLabel, { color: theme.colors.onSurface }]}>
                  Giờ CN:
                </Text>
                <Text style={[styles.hoursValue, { color: theme.colors.tertiary }]}>
                  {formatHours(summary.totalSundayHours)}
                </Text>
              </View>

              <View style={styles.hoursItem}>
                <Text style={[styles.hoursLabel, { color: theme.colors.onSurface }]}>
                  Giờ đêm:
                </Text>
                <Text style={[styles.hoursValue, { color: theme.colors.outline }]}>
                  {formatHours(summary.totalNightHours)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Detailed Table */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Chi tiết theo ngày
            </Text>

            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Ngày</DataTable.Title>
                <DataTable.Title>Thứ</DataTable.Title>
                <DataTable.Title numeric>Giờ HC</DataTable.Title>
                <DataTable.Title numeric>Giờ OT</DataTable.Title>
                <DataTable.Title>TT</DataTable.Title>
              </DataTable.Header>

              {data.slice(0, 10).map((item) => (
                <DataTable.Row key={item.date}>
                  <DataTable.Cell>
                    {format(new Date(item.date), 'dd/MM')}
                  </DataTable.Cell>
                  <DataTable.Cell>
                    {item.dayName}
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    {item.standardHoursScheduled.toFixed(1)}
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    {item.otHoursScheduled.toFixed(1)}
                  </DataTable.Cell>
                  <DataTable.Cell>
                    {getStatusIcon(item.status)}
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>

            {data.length > 10 && (
              <Text style={[styles.moreDataText, { color: theme.colors.onSurfaceVariant }]}>
                Và {data.length - 10} ngày khác...
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Export Button */}
        <Button
          mode="outlined"
          onPress={() => {
            // TODO: Implement export functionality
            Alert.alert('Thông báo', 'Tính năng xuất báo cáo sẽ được triển khai trong phiên bản tiếp theo.');
          }}
          style={styles.exportButton}
          icon="download"
        >
          Xuất báo cáo
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
  },
  periodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  periodSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  summaryCard: {
    width: '48%',
    marginVertical: 4,
    borderRadius: 12,
    elevation: 2,
  },
  summaryContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  hoursBreakdown: {
    gap: 12,
  },
  hoursItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hoursLabel: {
    fontSize: 14,
  },
  hoursValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  moreDataText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  exportButton: {
    marginVertical: 16,
  },
});

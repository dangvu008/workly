import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { format } from 'date-fns';
import { useApp } from '../contexts/AppContext';
import { ManualStatusUpdateModal } from './ManualStatusUpdateModal';
import { workManager } from '../services/workManager';

export function ModalTestButton() {
  const theme = useTheme();
  const { state, actions } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [testDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleStatusUpdate = async (status: any) => {
    try {
      console.log('🧪 Test status update:', status);
      await workManager.setManualWorkStatus(testDate, status);
      await actions.refreshWeeklyStatus();
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  };

  const handleTimeEdit = async (checkInTime: string, checkOutTime: string) => {
    try {
      console.log('🧪 Test time edit:', checkInTime, checkOutTime);
      await workManager.updateAttendanceTime(testDate, checkInTime, checkOutTime);
      await actions.refreshWeeklyStatus();
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  };

  const handleRecalculate = async () => {
    try {
      console.log('🧪 Test recalculate');
      await workManager.recalculateFromAttendanceLogs(testDate);
      await actions.refreshWeeklyStatus();
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  };

  const handleClearManual = async () => {
    try {
      console.log('🧪 Test clear manual');
      await workManager.clearManualStatusAndRecalculate(testDate);
      await actions.refreshWeeklyStatus();
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  };

  return (
    <>
      <Card style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Modal Test
          </Text>
          
          <Text style={[styles.info, { color: theme.colors.onSurfaceVariant }]}>
            Test date: {testDate}
          </Text>
          
          <Text style={[styles.info, { color: theme.colors.onSurfaceVariant }]}>
            Modal visible: {modalVisible ? 'true' : 'false'}
          </Text>
          
          <Text style={[styles.info, { color: theme.colors.onSurfaceVariant }]}>
            Has active shift: {state.activeShift ? 'true' : 'false'}
          </Text>
          
          <Button
            mode="contained"
            onPress={() => {
              console.log('🧪 Opening test modal');
              setModalVisible(true);
            }}
            style={styles.button}
          >
            Open Modal Test
          </Button>
        </Card.Content>
      </Card>

      <ManualStatusUpdateModal
        visible={modalVisible}
        onDismiss={() => {
          console.log('🧪 Closing test modal');
          setModalVisible(false);
        }}
        date={testDate}
        currentStatus={state.weeklyStatus[testDate] || null}
        shift={state.activeShift}
        onStatusUpdate={handleStatusUpdate}
        onTimeEdit={handleTimeEdit}
        onRecalculateFromLogs={handleRecalculate}
        onClearManualStatus={handleClearManual}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  info: {
    fontSize: 12,
    marginBottom: 4,
  },
  button: {
    marginTop: 12,
  },
});

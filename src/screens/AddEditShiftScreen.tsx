import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Switch,
  Card,
  IconButton,
  useTheme,
  Chip,
  HelperText
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../contexts/AppContext';
import { Shift } from '../types';
import { RootStackParamList } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { t } from '../i18n';

type AddEditShiftScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddEditShift'>;

interface AddEditShiftScreenProps {
  navigation: AddEditShiftScreenNavigationProp;
  route: {
    params?: {
      shiftId?: string;
      applyImmediately?: boolean;
    };
  };
}

export function AddEditShiftScreen({ navigation, route }: AddEditShiftScreenProps) {
  const theme = useTheme();
  const { state, actions } = useApp();

  const shiftId = route.params?.shiftId;
  const applyImmediately = route.params?.applyImmediately || false;
  const isEditing = !!shiftId;

  const existingShift = isEditing ? state.shifts.find(s => s.id === shiftId) : null;

  // Lấy ngôn ngữ hiện tại để sử dụng cho i18n
  const currentLanguage = state.settings?.language || 'vi';

  const [formData, setFormData] = useState({
    name: '',
    startTime: '08:00',
    endTime: '17:00',
    officeEndTime: '17:00',
    breakMinutes: 60,
    showPunch: false,
    departureTime: '07:30',
    isNightShift: false,
    workDays: [1, 2, 3, 4, 5], // Monday to Friday
    applyNow: applyImmediately,
  });

  // Validation errors
  const [errors, setErrors] = useState({
    name: '',
    workDays: '',
    breakMinutes: '',
  });

  // Status messages
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | '';
    message: string;
  }>({ type: '', message: '' });

  useEffect(() => {
    if (existingShift) {
      setFormData({
        name: existingShift.name,
        startTime: existingShift.startTime,
        endTime: existingShift.endTime,
        officeEndTime: existingShift.officeEndTime,
        breakMinutes: existingShift.breakMinutes,
        showPunch: existingShift.showPunch,
        departureTime: existingShift.departureTime,
        isNightShift: existingShift.isNightShift,
        workDays: existingShift.workDays,
        applyNow: false,
      });
    }
  }, [existingShift]);

  const handleWorkDayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter(d => d !== day)
        : [...prev.workDays, day].sort()
    }));
    // Clear work days error when user makes changes
    setErrors(prev => ({ ...prev, workDays: '' }));
  };

  // Helper functions to clear errors on input change
  const handleNameChange = (text: string) => {
    setFormData(prev => ({ ...prev, name: text }));
    setErrors(prev => ({ ...prev, name: '' }));
  };

  const handleBreakMinutesChange = (value: number) => {
    setFormData(prev => ({ ...prev, breakMinutes: value }));
    setErrors(prev => ({ ...prev, breakMinutes: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors = {
      name: '',
      workDays: '',
      breakMinutes: '',
    };

    let isValid = true;

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = t(currentLanguage, 'shifts.validation.nameRequired');
      isValid = false;
    }

    // Work days validation
    if (formData.workDays.length === 0) {
      newErrors.workDays = t(currentLanguage, 'shifts.validation.workDaysRequired');
      isValid = false;
    }

    // Break minutes validation
    if (formData.breakMinutes < 0 || formData.breakMinutes > 480) {
      newErrors.breakMinutes = t(currentLanguage, 'shifts.validation.breakMinutesInvalid');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setStatusMessage({ type: '', message: '' }); // Clear previous status

      const shiftData: Shift = {
        id: isEditing ? shiftId! : `shift_${Date.now()}`,
        name: formData.name.trim(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        officeEndTime: formData.officeEndTime,
        breakMinutes: formData.breakMinutes,
        showPunch: formData.showPunch,
        departureTime: formData.departureTime,
        isNightShift: formData.isNightShift,
        workDays: formData.workDays,
      };

      if (isEditing) {
        await actions.updateShift(shiftId!, shiftData);
        setStatusMessage({ type: 'success', message: t(currentLanguage, 'shifts.successUpdated') });
      } else {
        await actions.addShift(shiftData, formData.applyNow);
        setStatusMessage({
          type: 'success',
          message: formData.applyNow
            ? t(currentLanguage, 'shifts.successCreatedAndApplied')
            : t(currentLanguage, 'shifts.successCreated')
        });
      }

      // Auto navigate back after 2 seconds
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error) {
      setStatusMessage({ type: 'error', message: t(currentLanguage, 'shifts.errorSave') });
    }
  };

  const handleReset = () => {
    if (isEditing && existingShift) {
      setFormData({
        name: existingShift.name,
        startTime: existingShift.startTime,
        endTime: existingShift.endTime,
        officeEndTime: existingShift.officeEndTime,
        breakMinutes: existingShift.breakMinutes,
        showPunch: existingShift.showPunch,
        departureTime: existingShift.departureTime,
        isNightShift: existingShift.isNightShift,
        workDays: existingShift.workDays,
        applyNow: false,
      });
    } else {
      setFormData({
        name: '',
        startTime: '08:00',
        endTime: '17:00',
        officeEndTime: '17:00',
        breakMinutes: 60,
        showPunch: false,
        departureTime: '07:30',
        isNightShift: false,
        workDays: [1, 2, 3, 4, 5],
        applyNow: applyImmediately,
      });
    }
  };

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          {isEditing ? t(currentLanguage, 'shifts.editShiftTitle') : t(currentLanguage, 'shifts.createNew')}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Basic Info */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {t(currentLanguage, 'common.basicInfo')}
            </Text>

            <TextInput
              label={`${t(currentLanguage, 'shifts.shiftName')} *`}
              value={formData.name}
              onChangeText={handleNameChange}
              style={styles.input}
              mode="outlined"
              error={!!errors.name}
            />
            <HelperText type="error" visible={!!errors.name}>
              {errors.name}
            </HelperText>

            <View style={styles.row}>
              <TextInput
                label={t(currentLanguage, 'shifts.startTime')}
                value={formData.startTime}
                onChangeText={(text) => setFormData(prev => ({ ...prev, startTime: text }))}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                placeholder="HH:MM"
              />
              <TextInput
                label={t(currentLanguage, 'shifts.endTime')}
                value={formData.endTime}
                onChangeText={(text) => setFormData(prev => ({ ...prev, endTime: text }))}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                placeholder="HH:MM"
              />
            </View>

            <TextInput
              label={t(currentLanguage, 'shifts.officeEndTime')}
              value={formData.officeEndTime}
              onChangeText={(text) => setFormData(prev => ({ ...prev, officeEndTime: text }))}
              style={styles.input}
              mode="outlined"
              placeholder="HH:MM"
            />

            <TextInput
              label={t(currentLanguage, 'shifts.departureTime')}
              value={formData.departureTime}
              onChangeText={(text) => setFormData(prev => ({ ...prev, departureTime: text }))}
              style={styles.input}
              mode="outlined"
              placeholder="HH:MM"
            />

            <TextInput
              label={t(currentLanguage, 'shifts.breakMinutes')}
              value={formData.breakMinutes.toString()}
              onChangeText={(text) => handleBreakMinutesChange(parseInt(text) || 0)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              error={!!errors.breakMinutes}
            />
            <HelperText type="error" visible={!!errors.breakMinutes}>
              {errors.breakMinutes}
            </HelperText>
          </Card.Content>
        </Card>

        {/* Work Days */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {t(currentLanguage, 'shifts.workDays')} *
            </Text>

            <View style={styles.daysContainer}>
              {dayNames.map((day, index) => (
                <Chip
                  key={index}
                  mode={formData.workDays.includes(index) ? 'flat' : 'outlined'}
                  selected={formData.workDays.includes(index)}
                  onPress={() => handleWorkDayToggle(index)}
                  style={styles.dayChip}
                >
                  {day}
                </Chip>
              ))}
            </View>

            <HelperText type="error" visible={!!errors.workDays}>
              {errors.workDays}
            </HelperText>
          </Card.Content>
        </Card>

        {/* Options */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {t(currentLanguage, 'shifts.options')}
            </Text>

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: theme.colors.onSurface }]}>
                {t(currentLanguage, 'shifts.night')}
              </Text>
              <Switch
                value={formData.isNightShift}
                onValueChange={(value) => setFormData(prev => ({ ...prev, isNightShift: value }))}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: theme.colors.onSurface }]}>
                {t(currentLanguage, 'modals.punchButton')}
              </Text>
              <Switch
                value={formData.showPunch}
                onValueChange={(value) => setFormData(prev => ({ ...prev, showPunch: value }))}
              />
            </View>

            {!isEditing && (
              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: theme.colors.onSurface }]}>
                  {t(currentLanguage, 'shifts.applyNow')}
                </Text>
                <Switch
                  value={formData.applyNow}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, applyNow: value }))}
                />
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Status Messages */}
        {statusMessage.message && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text style={[
                styles.statusMessage,
                {
                  color: statusMessage.type === 'success'
                    ? theme.colors.primary
                    : theme.colors.error
                }
              ]}>
                {statusMessage.message}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={handleReset}
            style={styles.actionButton}
          >
            {t(currentLanguage, 'modals.reset')}
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.actionButton}
          >
            {isEditing ? t(currentLanguage, 'common.edit') : t(currentLanguage, 'shifts.addShift')}
          </Button>
        </View>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 32,
  },
  actionButton: {
    flex: 0.48,
  },
  statusMessage: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 8,
  },
});

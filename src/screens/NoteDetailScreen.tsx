import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Switch,
  Card,
  IconButton,
  useTheme,
  Chip,
  Checkbox,
  HelperText
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Note } from '../types';
import { RootStackParamList } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

type NoteDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'NoteDetail'>;

interface NoteDetailScreenProps {
  navigation: NoteDetailScreenNavigationProp;
  route: {
    params?: {
      noteId?: string;
    };
  };
}

export function NoteDetailScreen({ navigation, route }: NoteDetailScreenProps) {
  const theme = useTheme();
  const { state, actions } = useApp();

  const noteId = route.params?.noteId;
  const isEditing = !!noteId;
  const existingNote = isEditing ? state.notes.find(n => n.id === noteId) : null;

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isPriority: false,
    hasReminder: false,
    reminderDateTime: new Date(),
    associatedShiftIds: [] as string[],
    reminderDays: [] as number[], // 0-6 (Sunday-Saturday) for manual day selection
    useShiftSchedule: true, // true = follow shift schedule, false = manual days
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({
    title: '',
    content: '',
    reminderTime: '',
    reminderDays: '',
    duplicate: '',
  });

  useEffect(() => {
    if (existingNote) {
      setFormData({
        title: existingNote.title,
        content: existingNote.content,
        isPriority: existingNote.isPriority,
        hasReminder: !!existingNote.reminderDateTime,
        reminderDateTime: existingNote.reminderDateTime ? new Date(existingNote.reminderDateTime) : new Date(),
        associatedShiftIds: existingNote.associatedShiftIds || [],
        reminderDays: [], // Will be populated based on shift schedule or manual selection
        useShiftSchedule: (existingNote.associatedShiftIds?.length || 0) > 0,
      });
    }
  }, [existingNote]);

  // Constants for days of week
  const DAYS_OF_WEEK = [
    { value: 1, label: 'T2', fullName: 'Thứ Hai' },
    { value: 2, label: 'T3', fullName: 'Thứ Ba' },
    { value: 3, label: 'T4', fullName: 'Thứ Tư' },
    { value: 4, label: 'T5', fullName: 'Thứ Năm' },
    { value: 5, label: 'T6', fullName: 'Thứ Sáu' },
    { value: 6, label: 'T7', fullName: 'Thứ Bảy' },
    { value: 0, label: 'CN', fullName: 'Chủ Nhật' },
  ];

  const handleShiftToggle = (shiftId: string) => {
    setFormData(prev => ({
      ...prev,
      associatedShiftIds: prev.associatedShiftIds.includes(shiftId)
        ? prev.associatedShiftIds.filter(id => id !== shiftId)
        : [...prev.associatedShiftIds, shiftId],
      useShiftSchedule: true, // Auto-enable shift schedule when selecting shifts
    }));
    // Clear errors when user makes changes
    setErrors(prev => ({ ...prev, reminderDays: '' }));
  };

  const handleDayToggle = (dayValue: number) => {
    setFormData(prev => ({
      ...prev,
      reminderDays: prev.reminderDays.includes(dayValue)
        ? prev.reminderDays.filter(d => d !== dayValue)
        : [...prev.reminderDays, dayValue].sort(),
    }));
    // Clear errors when user makes changes
    setErrors(prev => ({ ...prev, reminderDays: '' }));
  };

  const checkDuplicateNote = (title: string, content: string): boolean => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    return state.notes.some(note =>
      note.id !== noteId && // Exclude current note when editing
      note.title.trim().toLowerCase() === trimmedTitle.toLowerCase() &&
      note.content.trim().toLowerCase() === trimmedContent.toLowerCase()
    );
  };

  const validateForm = (): boolean => {
    const newErrors = {
      title: '',
      content: '',
      reminderTime: '',
      reminderDays: '',
      duplicate: '',
    };

    let isValid = true;

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề là bắt buộc';
      isValid = false;
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Tiêu đề không được vượt quá 100 ký tự';
      isValid = false;
    }

    // Content validation
    if (!formData.content.trim()) {
      newErrors.content = 'Nội dung là bắt buộc';
      isValid = false;
    } else if (formData.content.trim().length > 300) {
      newErrors.content = 'Nội dung không được vượt quá 300 ký tự';
      isValid = false;
    }

    // Duplicate check
    if (formData.title.trim() && formData.content.trim()) {
      if (checkDuplicateNote(formData.title, formData.content)) {
        newErrors.duplicate = 'Đã tồn tại ghi chú với tiêu đề và nội dung giống hệt';
        isValid = false;
      }
    }

    // Reminder validation
    if (formData.hasReminder) {
      const now = new Date();
      const reminderTime = new Date(formData.reminderDateTime);

      if (reminderTime <= now) {
        newErrors.reminderTime = 'Thời gian nhắc nhở phải trong tương lai';
        isValid = false;
      }

      // Day selection validation
      if (!formData.useShiftSchedule) {
        if (formData.reminderDays.length === 0) {
          newErrors.reminderDays = 'Vui lòng chọn ít nhất một ngày trong tuần';
          isValid = false;
        }
      } else if (formData.associatedShiftIds.length === 0) {
        newErrors.reminderDays = 'Vui lòng chọn ít nhất một ca làm việc hoặc chuyển sang chọn ngày thủ công';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const confirmMessage = isEditing
      ? `Bạn có muốn lưu các thay đổi cho ghi chú "${formData.title.trim()}" không?`
      : `Bạn có muốn tạo ghi chú mới "${formData.title.trim()}" không?`;

    Alert.alert(
      'Xác nhận',
      confirmMessage,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: isEditing ? 'Lưu' : 'Tạo',
          onPress: async () => {
            try {
              const noteData: Note = {
                id: isEditing ? noteId! : `note_${Date.now()}`,
                title: formData.title.trim(),
                content: formData.content.trim(),
                isPriority: formData.isPriority,
                reminderDateTime: formData.hasReminder ? formData.reminderDateTime.toISOString() : undefined,
                associatedShiftIds: formData.associatedShiftIds.length > 0 ? formData.associatedShiftIds : undefined,
                createdAt: existingNote?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              if (isEditing) {
                await actions.updateNote(noteId!, noteData);
                Alert.alert('Thành công', 'Đã cập nhật ghi chú.');
              } else {
                await actions.addNote(noteData);
                Alert.alert('Thành công', 'Đã tạo ghi chú mới.');
              }

              navigation.goBack();
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể lưu ghi chú.');
            }
          }
        }
      ]
    );
  };

  const handleDelete = () => {
    if (!isEditing) return;

    Alert.alert(
      'Xác nhận xóa',
      `Bạn có muốn xóa ghi chú "${formData.title}" không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await actions.deleteNote(noteId!);
              Alert.alert('Thành công', 'Đã xóa ghi chú.');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa ghi chú.');
            }
          }
        }
      ]
    );
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDateTime = new Date(formData.reminderDateTime);
      newDateTime.setFullYear(selectedDate.getFullYear());
      newDateTime.setMonth(selectedDate.getMonth());
      newDateTime.setDate(selectedDate.getDate());
      setFormData(prev => ({ ...prev, reminderDateTime: newDateTime }));
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDateTime = new Date(formData.reminderDateTime);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setFormData(prev => ({ ...prev, reminderDateTime: newDateTime }));
      // Clear reminder time error
      setErrors(prev => ({ ...prev, reminderTime: '' }));
    }
  };

  // Helper functions to clear errors on input change
  const handleTitleChange = (text: string) => {
    setFormData(prev => ({ ...prev, title: text }));
    setErrors(prev => ({ ...prev, title: '', duplicate: '' }));
  };

  const handleContentChange = (text: string) => {
    setFormData(prev => ({ ...prev, content: text }));
    setErrors(prev => ({ ...prev, content: '', duplicate: '' }));
  };

  // Check if form is valid for save button state
  const isFormValid = () => {
    return formData.title.trim().length > 0 &&
           formData.title.trim().length <= 100 &&
           formData.content.trim().length > 0 &&
           formData.content.trim().length <= 300 &&
           !checkDuplicateNote(formData.title, formData.content) &&
           (!formData.hasReminder || (
             formData.reminderDateTime > new Date() &&
             (formData.useShiftSchedule ? formData.associatedShiftIds.length > 0 : formData.reminderDays.length > 0)
           ));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          {isEditing ? 'Chỉnh Sửa Ghi Chú' : 'Thêm Ghi Chú Mới'}
        </Text>
        {isEditing && (
          <IconButton
            icon="delete"
            size={24}
            iconColor={theme.colors.error}
            onPress={handleDelete}
          />
        )}
        {!isEditing && <View style={{ width: 48 }} />}
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Basic Info */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Thông tin ghi chú
            </Text>

            <TextInput
              label="Tiêu đề *"
              value={formData.title}
              onChangeText={handleTitleChange}
              style={styles.input}
              mode="outlined"
              error={!!errors.title}
              maxLength={100}
            />
            <View style={styles.inputFooter}>
              <HelperText type="error" visible={!!errors.title}>
                {errors.title}
              </HelperText>
              <Text style={[styles.characterCount, { color: theme.colors.onSurfaceVariant }]}>
                {formData.title.length}/100
              </Text>
            </View>

            <TextInput
              label="Nội dung *"
              value={formData.content}
              onChangeText={handleContentChange}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={6}
              error={!!errors.content}
              maxLength={300}
            />
            <View style={styles.inputFooter}>
              <HelperText type="error" visible={!!errors.content}>
                {errors.content}
              </HelperText>
              <Text style={[styles.characterCount, { color: theme.colors.onSurfaceVariant }]}>
                {formData.content.length}/300
              </Text>
            </View>

            {/* Duplicate error */}
            <HelperText type="error" visible={!!errors.duplicate}>
              {errors.duplicate}
            </HelperText>

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: theme.colors.onSurface }]}>
                Ưu tiên ⭐
              </Text>
              <Switch
                value={formData.isPriority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, isPriority: value }))}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Reminder */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Nhắc nhở
            </Text>

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: theme.colors.onSurface }]}>
                Đặt nhắc nhở
              </Text>
              <Switch
                value={formData.hasReminder}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, hasReminder: value }));
                  setErrors(prev => ({ ...prev, reminderTime: '', reminderDays: '' }));
                }}
              />
            </View>

            {formData.hasReminder && (
              <>
                <Text style={[styles.subSectionTitle, { color: theme.colors.onSurface }]}>
                  Thời gian nhắc nhở *
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => setShowTimePicker(true)}
                  style={[styles.timePickerButton, errors.reminderTime ? { borderColor: theme.colors.error } : {}]}
                  icon="clock-outline"
                >
                  {format(formData.reminderDateTime, 'HH:mm', { locale: vi })}
                </Button>
                <HelperText type="error" visible={!!errors.reminderTime}>
                  {errors.reminderTime}
                </HelperText>

                {/* Schedule Type Selection */}
                <Text style={[styles.subSectionTitle, { color: theme.colors.onSurface, marginTop: 16 }]}>
                  Lịch nhắc nhở *
                </Text>

                <View style={styles.scheduleTypeContainer}>
                  <View style={styles.radioOption}>
                    <Checkbox
                      status={formData.useShiftSchedule ? 'checked' : 'unchecked'}
                      onPress={() => {
                        setFormData(prev => ({ ...prev, useShiftSchedule: true }));
                        setErrors(prev => ({ ...prev, reminderDays: '' }));
                      }}
                    />
                    <Text style={[styles.radioLabel, { color: theme.colors.onSurface }]}>
                      Theo ca làm việc
                    </Text>
                  </View>

                  <View style={styles.radioOption}>
                    <Checkbox
                      status={!formData.useShiftSchedule ? 'checked' : 'unchecked'}
                      onPress={() => {
                        setFormData(prev => ({ ...prev, useShiftSchedule: false }));
                        setErrors(prev => ({ ...prev, reminderDays: '' }));
                      }}
                    />
                    <Text style={[styles.radioLabel, { color: theme.colors.onSurface }]}>
                      Chọn ngày thủ công
                    </Text>
                  </View>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Shift Selection or Manual Days */}
        {formData.hasReminder && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              {formData.useShiftSchedule ? (
                <>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                    Liên kết với ca làm việc *
                  </Text>
                  <Text style={[styles.sectionDescription, { color: theme.colors.onSurfaceVariant }]}>
                    Chọn ca làm việc để nhận nhắc nhở theo lịch ca
                  </Text>

                  {state.shifts.length > 0 ? (
                    <View style={styles.shiftsContainer}>
                      {state.shifts.map((shift) => (
                        <Chip
                          key={shift.id}
                          mode={formData.associatedShiftIds.includes(shift.id) ? 'flat' : 'outlined'}
                          selected={formData.associatedShiftIds.includes(shift.id)}
                          onPress={() => handleShiftToggle(shift.id)}
                          style={styles.shiftChip}
                        >
                          {shift.name}
                        </Chip>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.noShiftsText, { color: theme.colors.onSurfaceVariant }]}>
                      Chưa có ca làm việc nào. Hãy tạo ca làm việc trước hoặc chọn "Chọn ngày thủ công".
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                    Chọn ngày nhắc nhở *
                  </Text>
                  <Text style={[styles.sectionDescription, { color: theme.colors.onSurfaceVariant }]}>
                    Chọn các ngày trong tuần để nhận nhắc nhở
                  </Text>

                  <View style={styles.daysContainer}>
                    {DAYS_OF_WEEK.map((day) => (
                      <View key={day.value} style={styles.dayOption}>
                        <Checkbox
                          status={formData.reminderDays.includes(day.value) ? 'checked' : 'unchecked'}
                          onPress={() => handleDayToggle(day.value)}
                        />
                        <Text style={[styles.dayLabel, { color: theme.colors.onSurface }]}>
                          {day.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              <HelperText type="error" visible={!!errors.reminderDays}>
                {errors.reminderDays}
              </HelperText>
            </Card.Content>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={handleSave}
            style={[
              styles.saveButton,
              !isFormValid() && { backgroundColor: theme.colors.surfaceDisabled }
            ]}
            disabled={!isFormValid()}
            icon={isEditing ? 'content-save' : 'plus'}
          >
            {isEditing ? 'Lưu Thay Đổi' : 'Tạo Ghi Chú'}
          </Button>

          {isEditing && (
            <Button
              mode="outlined"
              onPress={handleDelete}
              style={styles.deleteButton}
              icon="delete"
              textColor={theme.colors.error}
            >
              Xóa Ghi Chú
            </Button>
          )}
        </View>
      </ScrollView>

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={formData.reminderDateTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
          is24Hour={true}
        />
      )}
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 12,
    marginBottom: 12,
  },
  input: {
    marginBottom: 4,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  characterCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
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
  timePickerButton: {
    marginBottom: 8,
    justifyContent: 'flex-start',
  },
  scheduleTypeContainer: {
    marginVertical: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  shiftsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  shiftChip: {
    marginBottom: 8,
  },
  noShiftsText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dayOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginVertical: 4,
  },
  dayLabel: {
    fontSize: 16,
    marginLeft: 8,
    minWidth: 30,
  },
  actions: {
    marginTop: 24,
    marginBottom: 32,
  },
  saveButton: {
    marginBottom: 12,
  },
  deleteButton: {
    borderColor: 'transparent',
  },
});

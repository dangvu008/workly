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
  Chip
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Note } from '../types';
import { RootStackParamList } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';

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
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (existingNote) {
      setFormData({
        title: existingNote.title,
        content: existingNote.content,
        isPriority: existingNote.isPriority,
        hasReminder: !!existingNote.reminderDateTime,
        reminderDateTime: existingNote.reminderDateTime ? new Date(existingNote.reminderDateTime) : new Date(),
        associatedShiftIds: existingNote.associatedShiftIds || [],
      });
    }
  }, [existingNote]);

  const handleShiftToggle = (shiftId: string) => {
    setFormData(prev => ({
      ...prev,
      associatedShiftIds: prev.associatedShiftIds.includes(shiftId)
        ? prev.associatedShiftIds.filter(id => id !== shiftId)
        : [...prev.associatedShiftIds, shiftId]
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề ghi chú.');
      return false;
    }

    if (!formData.content.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung ghi chú.');
      return false;
    }

    if (formData.hasReminder && formData.reminderDateTime <= new Date()) {
      Alert.alert('Lỗi', 'Thời gian nhắc nhở phải trong tương lai.');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

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
    }
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
          {isEditing ? 'Sửa ghi chú' : 'Tạo ghi chú'}
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
              label="Tiêu đề"
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Nội dung"
              value={formData.content}
              onChangeText={(text) => setFormData(prev => ({ ...prev, content: text }))}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={6}
            />

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
                onValueChange={(value) => setFormData(prev => ({ ...prev, hasReminder: value }))}
              />
            </View>

            {formData.hasReminder && (
              <View style={styles.dateTimeContainer}>
                <Button
                  mode="outlined"
                  onPress={() => setShowDatePicker(true)}
                  style={styles.dateTimeButton}
                >
                  📅 {formData.reminderDateTime.toLocaleDateString('vi-VN')}
                </Button>

                <Button
                  mode="outlined"
                  onPress={() => setShowTimePicker(true)}
                  style={styles.dateTimeButton}
                >
                  🕐 {formData.reminderDateTime.toLocaleTimeString('vi-VN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Associated Shifts */}
        {state.shifts.length > 0 && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Liên kết với ca làm việc
              </Text>
              <Text style={[styles.sectionDescription, { color: theme.colors.onSurfaceVariant }]}>
                Chọn ca làm việc để nhận nhắc nhở tự động
              </Text>

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
            </Card.Content>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
          >
            {isEditing ? 'Cập nhật' : 'Tạo ghi chú'}
          </Button>
        </View>
      </ScrollView>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.reminderDateTime}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={formData.reminderDateTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
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
    marginBottom: 12,
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
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  dateTimeButton: {
    flex: 0.48,
  },
  shiftsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shiftChip: {
    marginBottom: 8,
  },
  actions: {
    marginTop: 24,
    marginBottom: 32,
  },
  saveButton: {
    marginBottom: 8,
  },
});

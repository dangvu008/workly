import { Note } from '../types';

// Sample notes data for testing - Đa ngôn ngữ
export const SAMPLE_NOTES = {
  vi: [
    {
      id: 'note_001',
      title: 'Họp team hàng tuần',
      content: 'Chuẩn bị báo cáo tiến độ dự án và thảo luận về các vấn đề cần giải quyết trong tuần tới. Nhớ mang theo laptop và tài liệu.',
      isPriority: true,
      reminderDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    },
    {
      id: 'note_002',
      title: 'Kiểm tra sức khỏe định kỳ',
      content: 'Đặt lịch khám sức khỏe tổng quát tại bệnh viện. Cần mang theo BHYT và các xét nghiệm cũ.',
      isPriority: true,
      reminderDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    },
    {
      id: 'note_003',
      title: 'Mua quà sinh nhật',
      content: 'Tìm món quà phù hợp cho sinh nhật bạn thân. Có thể là sách, đồng hồ hoặc voucher du lịch.',
      isPriority: false,
      reminderDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    },
  {
    id: 'note_004',
    title: 'Nộp báo cáo tháng',
    content: 'Hoàn thành và nộp báo cáo công việc tháng này cho phòng nhân sự. Deadline là cuối tuần.',
    isPriority: true,
    associatedShiftIds: ['shift_morning'], // Linked to morning shift
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: 'note_005',
    title: 'Học tiếng Anh',
    content: 'Ôn tập từ vựng và ngữ pháp cho kỳ thi TOEIC. Mục tiêu đạt 750+ điểm.',
    isPriority: false,
    associatedShiftIds: ['shift_afternoon'], // Linked to afternoon shift
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
  },
  {
    id: 'note_006',
    title: 'Thanh toán hóa đơn điện',
    content: 'Nhớ thanh toán hóa đơn tiền điện trước ngày 15 để tránh bị cắt điện.',
    isPriority: false,
    reminderDateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
  },
  {
    id: 'note_007',
    title: 'Backup dữ liệu máy tính',
    content: 'Sao lưu toàn bộ dữ liệu quan trọng lên cloud và ổ cứng ngoài. Bao gồm ảnh, video, tài liệu công việc.',
    isPriority: false,
    associatedShiftIds: ['shift_night'], // Linked to night shift
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    id: 'note_008',
    title: 'Đặt vé máy bay',
    content: 'Tìm và đặt vé máy bay cho chuyến du lịch Đà Nẵng cuối tháng. So sánh giá từ nhiều hãng.',
    isPriority: true,
    reminderDateTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
    updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
  },
  {
    id: 'note_009',
    title: 'Gọi điện cho bố mẹ',
    content: 'Gọi điện hỏi thăm sức khỏe bố mẹ và chia sẻ về công việc gần đây.',
    isPriority: false,
    reminderDateTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: 'note_010',
    title: 'Cập nhật CV',
    content: 'Bổ sung kinh nghiệm và kỹ năng mới vào CV. Chuẩn bị cho cơ hội việc làm tốt hơn.',
    isPriority: false,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
  },
  {
    id: 'note_011',
    title: 'Tập thể dục',
    content: 'Duy trì thói quen tập gym 3 lần/tuần. Tập trung vào cardio và strength training.',
    isPriority: false,
    associatedShiftIds: ['shift_morning', 'shift_afternoon'], // Multiple shifts
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
  },
  {
    id: 'note_012',
    title: 'Đọc sách mới',
    content: 'Hoàn thành cuốn "Atomic Habits" và ghi chú những điểm quan trọng để áp dụng.',
    isPriority: false,
    reminderDateTime: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(), // 18 hours from now
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
    updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
  }
  ],
  en: [
    {
      id: 'note_001',
      title: 'Weekly team meeting',
      content: 'Prepare project progress report and discuss issues that need to be resolved next week. Remember to bring laptop and documents.',
      isPriority: true,
      reminderDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    },
    {
      id: 'note_002',
      title: 'Regular health checkup',
      content: 'Schedule a comprehensive health examination at the hospital. Need to bring health insurance and old test results.',
      isPriority: true,
      reminderDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    },
    {
      id: 'note_003',
      title: 'Buy birthday gift',
      content: 'Find a suitable gift for best friend\'s birthday. Could be books, watch, or travel voucher.',
      isPriority: false,
      reminderDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    },
    {
      id: 'note_004',
      title: 'Submit monthly report',
      content: 'Complete and submit this month\'s work report to HR department. Deadline is end of week.',
      isPriority: true,
      associatedShiftIds: ['shift_morning'], // Linked to morning shift
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    },
    {
      id: 'note_005',
      title: 'Learn English',
      content: 'Review vocabulary and grammar for TOEIC exam. Target score 750+.',
      isPriority: false,
      associatedShiftIds: ['shift_afternoon'], // Linked to afternoon shift
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    },
  ]
} as const;

// Function to generate sample notes with current timestamps - Hỗ trợ đa ngôn ngữ
export const generateSampleNotes = (language: string = 'vi'): Note[] => {
  const now = new Date();
  const notesData = SAMPLE_NOTES[language as keyof typeof SAMPLE_NOTES] || SAMPLE_NOTES.vi;

  return notesData.map(note => ({
    ...note,
    // Update reminder times to be relative to current time
    reminderDateTime: note.reminderDateTime ?
      new Date(now.getTime() + (new Date(note.reminderDateTime).getTime() - new Date(note.createdAt).getTime())).toISOString() :
      undefined,
    // Update created/updated times to be relative to current time
    createdAt: new Date(now.getTime() - (now.getTime() - new Date(note.createdAt).getTime())).toISOString(),
    updatedAt: new Date(now.getTime() - (now.getTime() - new Date(note.updatedAt).getTime())).toISOString(),
  }));
};

// Function to add sample notes to storage - Hỗ trợ đa ngôn ngữ
export const addSampleNotesToStorage = async (language: string = 'vi') => {
  const { storageService } = await import('./storage');

  try {
    const existingNotes = await storageService.getNotes();

    // Only add sample notes if there are no existing notes
    if (existingNotes.length === 0) {
      const sampleNotes = generateSampleNotes(language);
      await storageService.setNotes(sampleNotes);
      console.log(`✅ Added sample notes to storage (${language})`);
      return sampleNotes;
    } else {
      console.log('📝 Notes already exist, skipping sample data');
      return existingNotes;
    }
  } catch (error) {
    console.error('❌ Error adding sample notes:', error);
    return [];
  }
};

// Function to force reset with sample data (for testing)
export const resetWithSampleNotes = async () => {
  const { storageService } = await import('./storage');

  try {
    const sampleNotes = generateSampleNotes();
    await storageService.setNotes(sampleNotes);
    console.log('🔄 Reset with fresh sample notes');
    return sampleNotes;
  } catch (error) {
    console.error('❌ Error resetting sample notes:', error);
    return [];
  }
};

// Function to clear all notes
export const clearAllNotes = async () => {
  const { storageService } = await import('./storage');

  try {
    await storageService.setNotes([]);
    console.log('🗑️ Cleared all notes');
    return [];
  } catch (error) {
    console.error('❌ Error clearing notes:', error);
    return [];
  }
};

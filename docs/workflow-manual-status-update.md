# Luồng Hoạt Động: Cập Nhật Trạng Thái Thủ Công từ Lưới Trạng Thái Tuần

## Tổng Quan Luồng Hoạt Động

Luồng này mô tả chi tiết cách người dùng tương tác với Lưới Trạng Thái Tuần trên HomeScreen để cập nhật trạng thái làm việc thủ công, bao gồm tất cả các bước từ khi nhấn vào ô ngày đến khi dữ liệu được cập nhật và giao diện được làm mới.

---

## 1. Khởi Tạo và Hiển Thị Lưới

### 1.1 Khi HomeScreen Load
```
HomeScreen được render
         ↓
WeeklyStatusGrid component được mount với animation slideUp (delay 500ms)
         ↓
Tính toán tuần hiện tại dựa trên userSettings.firstDayOfWeek
         ↓
Lấy dữ liệu weeklyStatus từ AppContext
         ↓
Render 7 ô ngày với thông tin:
- Tên thứ (bản địa hóa theo ngôn ngữ)
- Số ngày trong tháng
- Icon trạng thái và màu sắc
- Highlight ngày hiện tại
```

### 1.2 Xác Định Trạng Thái Mỗi Ô
```
Với mỗi ngày trong tuần:
         ↓
Kiểm tra dailyWorkStatus[dateString]
         ↓
Nếu có dữ liệu:
  - Lấy icon và màu từ WEEKLY_STATUS[status]
Nếu không có dữ liệu:
  - Ngày tương lai: icon ❓ (pending)
  - Ngày quá khứ/hiện tại: icon ❌ (absent)
```

---

## 2. Tương Tác Người Dùng

### 2.1 Nhấn Vào Ô Ngày (Primary Flow)
```
Người dùng tap vào ô ngày
         ↓
handleDayPress(date) được gọi
         ↓
Xác định selectedDate = format(date, 'yyyy-MM-dd')
         ↓
setSelectedDate(selectedDate)
setManualUpdateModalVisible(true)
         ↓
ManualStatusUpdateModal xuất hiện với:
- Thông tin ngày đã chọn
- Trạng thái hiện tại (nếu có)
- Thông tin ca làm việc
- Các tùy chọn phù hợp với loại ngày
```

### 2.2 Phân Loại Ngày và Hiển Thị Tùy Chọn
```
Modal kiểm tra loại ngày:
         ↓
isDatePastOrToday = isPast(dateObj) || isToday(dateObj)
isDateFuture = isFuture(dateObj) && !isToday(dateObj)
         ↓
Nếu là ngày quá khứ/hiện tại:
  - Hiển thị section "Tính toán từ chấm công"
  - Hiển thị section "Cập nhật trạng thái nghỉ"
Nếu là ngày tương lai:
  - Chỉ hiển thị section "Đăng ký trạng thái nghỉ"
```

---

## 3. Xử Lý Các Hành Động

### 3.1 Tính Theo Chấm Công (Ngày Quá Khứ/Hiện Tại)
```
Người dùng chọn "Tính theo chấm công" từ dropdown
         ↓
handleRecalculate() được gọi
         ↓
onRecalculateFromLogs() - gọi workManager.recalculateWorkStatus(selectedDate)
         ↓
Hệ thống:
1. Lấy attendanceLogs cho ngày đó
2. Tính toán lại status dựa trên thời gian thực tế vs lịch trình
3. Cập nhật dailyWorkStatus với:
   - status mới (DU_CONG, DI_MUON, VE_SOM, etc.)
   - Giờ công dựa trên lịch trình ca
   - isManualOverride = false
         ↓
Lưu vào AsyncStorage
         ↓
Refresh AppContext.weeklyStatus
         ↓
Modal đóng + hiển thị Alert thành công
         ↓
Lưới trạng thái được cập nhật với icon/màu mới
```

### 3.2 Chỉnh Sửa Giờ Chấm Công
```
Người dùng chọn "Chỉnh sửa giờ chấm công"
         ↓
setTimeEditVisible(true) - mở TimeEditModal
         ↓
TimeEditModal hiển thị:
- Input giờ vào (pre-fill từ currentStatus.vaoLogTime)
- Input giờ ra (pre-fill từ currentStatus.raLogTime)
- Nút "Xóa Check-in", "Xóa Check-out"
- Validation: checkOutTime > checkInTime
         ↓
Người dùng nhập giờ và nhấn "Lưu"
         ↓
handleTimeEditSave(checkInTime, checkOutTime)
         ↓
onTimeEdit() - gọi workManager.updateAttendanceTime()
         ↓
Hệ thống:
1. Cập nhật/thêm attendanceLogs với thời gian mới
2. Tự động tính lại dailyWorkStatus
3. Lưu vào AsyncStorage
         ↓
Đóng TimeEditModal và ManualStatusUpdateModal
         ↓
Hiển thị Alert xác nhận + refresh UI
```

### 3.3 Đặt Trạng Thái Nghỉ
```
Người dùng chọn trạng thái nghỉ từ dropdown
(NGHI_PHEP, NGHI_BENH, NGHI_LE, VANG_MAT, CONG_TAC)
         ↓
handleStatusSelect(status) được gọi
         ↓
onStatusUpdate(status) - gọi workManager.setManualWorkStatus()
         ↓
Hệ thống tạo DailyWorkStatus mới:
- status = trạng thái đã chọn
- Tất cả giờ công = 0 (vì nghỉ)
- isManualOverride = true
- vaoLogTime, raLogTime = null (hoặc giữ nguyên nếu có)
         ↓
Lưu vào AsyncStorage
         ↓
Refresh AppContext.weeklyStatus
         ↓
Modal đóng + hiển thị Alert thành công
         ↓
Lưới trạng thái cập nhật icon/màu mới
```

### 3.4 Xóa Trạng Thái Thủ Công
```
Người dùng chọn "Xóa trạng thái thủ công"
(chỉ hiện khi currentStatus.isManualOverride = true)
         ↓
handleClearManual() hiển thị Alert xác nhận
         ↓
Người dùng xác nhận "Xóa và tính lại"
         ↓
onClearManualStatus() - gọi workManager.clearManualStatus()
         ↓
Hệ thống:
1. Xóa trạng thái thủ công
2. Tự động tính lại từ attendanceLogs
3. Cập nhật dailyWorkStatus với isManualOverride = false
         ↓
Lưu vào AsyncStorage + refresh UI
         ↓
Modal đóng + Alert xác nhận
```

---

## 4. Xử Lý Lỗi và Validation

### 4.1 Validation Dữ Liệu Đầu Vào
```
Khi chỉnh sửa giờ chấm công:
- checkOutTime phải > checkInTime
- Định dạng thời gian hợp lệ (HH:mm)
- Cảnh báo nếu giờ quá lệch khung ca

Khi đặt trạng thái nghỉ:
- Không cho phép đặt trạng thái trùng lặp
- Kiểm tra quyền cập nhật ngày tương lai
```

### 4.2 Error Handling
```
Nếu có lỗi trong quá trình cập nhật:
         ↓
Catch error trong try-catch block
         ↓
Hiển thị Alert lỗi với thông báo rõ ràng:
- "Không thể cập nhật trạng thái. Vui lòng thử lại."
- "Không thể cập nhật giờ chấm công. Vui lòng thử lại."
         ↓
Modal vẫn mở để người dùng thử lại
         ↓
Log error vào console để debug
```

---

## 5. Cập Nhật Giao Diện

### 5.1 Real-time UI Updates
```
Sau khi cập nhật thành công:
         ↓
AppContext.weeklyStatus được refresh
         ↓
WeeklyStatusGrid re-render với dữ liệu mới
         ↓
Ô ngày được cập nhật hiển thị:
- Icon trạng thái mới
- Màu sắc tương ứng
- Animation fade transition (200ms)
```

### 5.2 Consistency Across App
```
Dữ liệu được cập nhật đồng bộ:
- HomeScreen: Lưới trạng thái tuần
- StatisticsScreen: Thống kê tổng hợp
- NotesScreen: Ghi chú liên quan đến ca
- Multi-Function Button: Trạng thái hiện tại
```

---

## 6. Performance Optimization

### 6.1 Efficient Re-renders
```
Sử dụng React.memo cho WeeklyStatusGrid
         ↓
Chỉ re-render khi weeklyStatus thay đổi
         ↓
Memoize các function handlers với useCallback
         ↓
Optimize animation với native driver
```

### 6.2 Data Persistence
```
Tất cả thay đổi được lưu ngay vào AsyncStorage
         ↓
Backup dữ liệu trước khi cập nhật
         ↓
Rollback nếu có lỗi trong quá trình lưu
```

---

## 7. Accessibility và UX

### 7.1 Accessibility Support
```
Screen reader announcements:
- "Đã cập nhật trạng thái Thứ Bảy thành Nghỉ phép"
- "Đã tính lại trạng thái dựa trên chấm công"

Keyboard navigation:
- Tab order logic trong modal
- Enter/Space để confirm actions
```

### 7.2 User Experience
```
Loading states:
- Disable buttons khi đang xử lý
- Show spinner cho operations lâu

Feedback:
- Haptic feedback khi tap (iOS)
- Visual feedback với ripple effect
- Clear success/error messages
```

Luồng này đảm bảo trải nghiệm người dùng mượt mà, dữ liệu nhất quán và xử lý lỗi toàn diện cho tính năng cập nhật trạng thái thủ công.

---

## 8. Bảng Mapping Trạng Thái và Hành Động

### 8.1 Trạng Thái Tự Động (Từ Chấm Công)
| Trạng Thái | Điều Kiện | Icon | Màu | Mô Tả |
|------------|-----------|------|-----|-------|
| DU_CONG | Check-in đúng giờ, check-out đúng giờ | ✅ | #4CAF50 | Hoàn thành đầy đủ |
| DI_MUON | Check-in > startTime + tolerance | ❗ | #FF9800 | Đi làm muộn |
| VE_SOM | Check-out < endTime - tolerance | ⏰ | #2196F3 | Về sớm |
| DI_MUON_VE_SOM | Cả hai điều kiện trên | ⚠️ | #FF5722 | Đi muộn và về sớm |
| THIEU_LOG | Thiếu check-in hoặc check-out | ❗ | #FF9800 | Thiếu dữ liệu |

### 8.2 Trạng Thái Thủ Công (Nghỉ)
| Trạng Thái | Icon | Màu | Giờ Công | Có Lương |
|------------|------|-----|----------|----------|
| NGHI_PHEP | 🏖️ | #9C27B0 | 0 | Có |
| NGHI_BENH | 🛌 | #607D8B | 0 | Có (theo quy định) |
| NGHI_LE | 🎉 | #E91E63 | 0 | Có |
| VANG_MAT | ❌ | #F44336 | 0 | Không |
| CONG_TAC | ✈️ | #00BCD4 | 8 (theo ca) | Có |

---

## 9. Logic Tính Toán Giờ Công

### 9.1 Khi Trạng Thái = DU_CONG
```javascript
// Giờ công được tính dựa trên lịch trình ca, không phải thời gian thực tế
const workHours = {
  standardHoursScheduled: shift.standardHours || 8,
  otHoursScheduled: shift.otHours || 0,
  sundayHoursScheduled: isSunday ? (shift.standardHours || 8) : 0,
  nightHoursScheduled: isNightShift ? (shift.standardHours || 8) : 0,
  totalHoursScheduled: shift.standardHours || 8
};
```

### 9.2 Khi Trạng Thái Nghỉ
```javascript
// Tất cả giờ công = 0, trừ CONG_TAC
const workHours = {
  standardHoursScheduled: status === 'CONG_TAC' ? (shift.standardHours || 8) : 0,
  otHoursScheduled: 0,
  sundayHoursScheduled: 0,
  nightHoursScheduled: 0,
  totalHoursScheduled: status === 'CONG_TAC' ? (shift.standardHours || 8) : 0
};
```

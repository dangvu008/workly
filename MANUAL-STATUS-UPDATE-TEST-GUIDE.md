# Hướng Dẫn Test Chức Năng Cập Nhật Trạng Thái Tuần Này

## 🔧 Các Sửa Đổi Đã Thực Hiện

### 1. Sửa Logic refreshWeeklyStatus
- **Trước**: Chỉ lấy 7 ngày quá khứ (-6 đến 0)
- **Sau**: Lấy tuần hiện tại (Monday-Sunday) bao gồm cả tương lai

### 2. Thống Nhất Hệ Thống Lưu Trữ
- **Vấn đề**: Conflict giữa `DailyWorkStatus` và `DailyWorkStatusNew`
- **Giải pháp**: Sử dụng `DailyWorkStatus` cho tất cả manual updates

### 3. Thêm Debug Components
- **WeeklyStatusDebug**: Component kiểm tra dữ liệu real-time
- **Debug logs**: Chi tiết trong console

## 🧪 Cách Test Chức Năng

### Bước 1: Kiểm Tra Debug Component
1. Mở app trong development mode
2. Vào **HomeScreen**
3. Tìm card **"Weekly Status Debug"** (chỉ hiện trong __DEV__)
4. Nhấn **"Refresh Debug"** để xem thông tin hiện tại

### Bước 2: Test Manual Status Update
1. Nhấn **"Test Update"** trong debug card
2. Kiểm tra console logs:
   ```
   ✋ Setting manual work status for 2025-01-XX to NGHI_PHEP
   ✅ Successfully set manual work status for 2025-01-XX: NGHI_PHEP
   🔍 Verified saved status for 2025-01-XX: NGHI_PHEP
   📅 Refreshed weekly status: [...]
   ```

### Bước 3: Test Modal Interface
1. Tap vào một ô ngày trong **Weekly Status Grid**
2. Modal **"Cập nhật trạng thái"** sẽ xuất hiện
3. Chọn một trạng thái nghỉ (ví dụ: **Nghỉ Phép**)
4. Kiểm tra:
   - Modal đóng
   - Thông báo thành công
   - Icon trên grid thay đổi

### Bước 4: Test Time Edit
1. Tap vào ô ngày quá khứ/hiện tại
2. Chọn **"Chỉnh sửa giờ chấm công"**
3. Nhập giờ vào: `08:30`, giờ ra: `17:30`
4. Nhấn **"Lưu"**
5. Kiểm tra trạng thái được tính lại

### Bước 5: Test Recalculate
1. Tap vào ô ngày có trạng thái thủ công
2. Chọn **"Tính theo chấm công"**
3. Kiểm tra trạng thái được tính lại từ logs

## 🔍 Debug Console Logs

### Logs Cần Quan Sát
```javascript
// Khi tap vào ngày
📅 Day pressed: 2025-01-XX

// Khi modal render
📅 ManualStatusUpdateModal rendered for date: 2025-01-XX visible: true

// Khi cập nhật status
🔄 Updating status for 2025-01-XX to NGHI_PHEP
✋ Setting manual work status for 2025-01-XX to NGHI_PHEP
✅ Successfully set manual work status for 2025-01-XX: NGHI_PHEP
🔍 Verified saved status for 2025-01-XX: NGHI_PHEP

// Khi refresh weekly status
📅 Refreshed weekly status: ["2025-01-XX", ...]

// Khi hiển thị status icon
📊 Status for 2025-01-XX: NGHI_PHEP → 🏖️
```

## ❌ Troubleshooting

### Vấn Đề 1: Modal Không Hiển Thị
**Triệu chứng**: Tap vào ngày nhưng modal không xuất hiện
**Kiểm tra**:
```javascript
// Console sẽ hiển thị:
📅 Day pressed: 2025-01-XX
// Nhưng không có:
📅 ManualStatusUpdateModal rendered...
```
**Giải pháp**: Kiểm tra import và state management

### Vấn Đề 2: Status Không Cập Nhật
**Triệu chứng**: Modal đóng nhưng icon không thay đổi
**Kiểm tra**:
```javascript
// Console sẽ hiển thị error:
❌ Error updating status: [error details]
```
**Giải pháp**: Kiểm tra permissions và storage

### Vấn Đề 3: Dữ Liệu Không Đồng Bộ
**Triệu chứng**: Debug component hiển thị khác với grid
**Kiểm tra**:
```javascript
// So sánh:
📊 Weekly status from state: {...}
💾 Weekly status from storage: {...}
```
**Giải pháp**: Nhấn "Refresh Debug" và kiểm tra lại

## 🎯 Test Cases Cụ Thể

### Test Case 1: Nghỉ Phép Ngày Tương Lai
1. Tap vào ngày tương lai (ví dụ: Thứ 7)
2. Chỉ hiển thị trạng thái nghỉ (không có "Tính theo chấm công")
3. Chọn "Nghỉ Phép"
4. **Kết quả mong đợi**: Icon 🏖️ hiển thị

### Test Case 2: Sửa Giờ Chấm Công
1. Tap vào ngày hôm nay
2. Chọn "Chỉnh sửa giờ chấm công"
3. Nhập giờ hợp lệ
4. **Kết quả mong đợi**: Trạng thái tính lại dựa trên giờ mới

### Test Case 3: Xóa Trạng Thái Thủ Công
1. Tạo trạng thái nghỉ cho một ngày
2. Tap lại vào ngày đó
3. Chọn "Xóa trạng thái thủ công"
4. **Kết quả mong đợi**: Trạng thái tính lại từ logs

### Test Case 4: Validation Giờ Chấm Công
1. Chọn "Chỉnh sửa giờ chấm công"
2. Nhập giờ ra trước giờ vào (ví dụ: vào 08:00, ra 07:00)
3. **Kết quả mong đợi**: Hiển thị lỗi validation

## 📱 Test Trên Thiết Bị

### Android
```bash
# Chạy app
npx expo start --dev-client
# Hoặc
npx expo start

# Xem logs
adb logcat | grep -E "(📅|✋|🔄|📊)"
```

### iOS
```bash
# Chạy app
npx expo start --dev-client

# Xem logs trong Xcode Console hoặc Metro bundler
```

## ✅ Checklist Hoàn Thành

- [ ] Debug component hiển thị đúng dữ liệu
- [ ] Modal mở khi tap vào ngày
- [ ] Các trạng thái nghỉ cập nhật thành công
- [ ] Time edit hoạt động với validation
- [ ] Recalculate từ logs hoạt động
- [ ] Icons hiển thị đúng trên grid
- [ ] Console logs hiển thị đầy đủ
- [ ] Không có errors trong console

## 🚀 Khi Hoàn Thành Test

Sau khi test thành công, có thể:
1. Xóa WeeklyStatusDebug component khỏi HomeScreen
2. Giảm debug logs trong production
3. Thêm analytics tracking nếu cần
4. Optimize performance nếu cần

## 📞 Hỗ Trợ

Nếu gặp vấn đề, cung cấp:
1. Console logs đầy đủ
2. Screenshots của modal
3. Thông tin về ngày được test
4. Platform (Android/iOS) và environment (Expo Go/Dev Build)

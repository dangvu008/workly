# Hướng Dẫn Debug Modal Cập Nhật Trạng Thái

## 🔍 Vấn Đề Hiện Tại
Modal ManualStatusUpdateModal không hiển thị khi tap vào ngày trong WeeklyStatusGrid.

## 🧪 Cách Test và Debug

### Bước 1: Kiểm Tra Console Logs
Mở app trong development mode và kiểm tra console logs khi:

1. **Tap vào ngày trong WeeklyStatusGrid**
2. **Sử dụng Modal Test Button**

### Bước 2: Logs Cần Quan Sát

#### Khi Tap Vào Ngày (WeeklyStatusGrid):
```javascript
// Logs từ handleDayPress
📅 Day pressed: 2025-01-XX
📅 Setting selectedDate to: 2025-01-XX
📅 Setting manualUpdateModalVisible to: true

// Logs từ render
🔍 Rendering ManualStatusUpdateModal with: {
  visible: true,
  date: "2025-01-XX",
  hasCurrentStatus: false/true,
  hasShift: true/false
}

// Logs từ ManualStatusUpdateModal
🔍 ManualStatusUpdateModal props: {
  visible: true,
  date: "2025-01-XX",
  hasCurrentStatus: true/false,
  hasShift: true/false
}
✅ Modal rendering for: XX/01/2025
🎯 About to render Modal with visible: true
```

#### Khi Sử dụng Modal Test Button:
```javascript
🧪 Opening test modal
🔍 ManualStatusUpdateModal props: { visible: true, date: "2025-01-XX", ... }
✅ Modal rendering for: XX/01/2025
🎯 About to render Modal with visible: true
```

### Bước 3: Các Trường Hợp Lỗi Có Thể

#### Lỗi 1: Modal không visible
```javascript
🔍 ManualStatusUpdateModal props: { visible: false, ... }
❌ Modal not visible
```
**Nguyên nhân**: State `manualUpdateModalVisible` không được set đúng

#### Lỗi 2: Không có date
```javascript
🔍 ManualStatusUpdateModal props: { visible: true, date: "", ... }
❌ No date provided
```
**Nguyên nhân**: `selectedDate` không được set đúng

#### Lỗi 3: Date không hợp lệ
```javascript
🔍 ManualStatusUpdateModal props: { visible: true, date: "invalid", ... }
❌ Invalid date: invalid
```
**Nguyên nhân**: Format date không đúng

#### Lỗi 4: Không có activeShift
```javascript
🔍 ManualStatusUpdateModal props: { visible: true, date: "2025-01-XX", hasShift: false }
✅ Modal rendering for: XX/01/2025
// Modal hiển thị nhưng có thông báo "Chưa có ca làm việc được kích hoạt"
```

### Bước 4: Test Với Modal Test Button

1. **Mở app** → Vào HomeScreen
2. **Tìm card "Modal Test"** (chỉ hiện trong dev mode)
3. **Kiểm tra thông tin**:
   - Test date: 2025-01-XX
   - Modal visible: false
   - Has active shift: true/false
4. **Nhấn "Open Modal Test"**
5. **Quan sát console logs và modal**

### Bước 5: So Sánh Kết Quả

#### Test Button Hoạt Động Nhưng WeeklyStatusGrid Không:
- **Vấn đề**: Logic trong `handleDayPress` hoặc state management
- **Kiểm tra**: Console logs từ `handleDayPress`

#### Cả Hai Đều Không Hoạt Động:
- **Vấn đề**: Modal component hoặc React Native Modal
- **Kiểm tra**: Props truyền vào modal

#### Modal Hiển Thị Nhưng Trống:
- **Vấn đề**: Styling hoặc content rendering
- **Kiểm tra**: Styles và theme colors

### Bước 6: Kiểm Tra Cụ Thể

#### Kiểm Tra State Management:
```javascript
// Trong WeeklyStatusGrid, thêm log này:
console.log('Current state:', { 
  manualUpdateModalVisible, 
  selectedDate, 
  weeklyStatus: state.weeklyStatus,
  activeShift: state.activeShift 
});
```

#### Kiểm Tra Modal Props:
```javascript
// Trong ManualStatusUpdateModal, props đã được log
// Kiểm tra xem tất cả props có đúng không
```

#### Kiểm Tra React Native Modal:
```javascript
// Thêm vào Modal component:
<Modal
  visible={visible}
  onDismiss={onDismiss}
  // Thêm props debug
  animationType="slide"
  transparent={false}
  // ...
>
```

## 🔧 Các Bước Khắc Phục

### Nếu State Không Cập Nhật:
1. Kiểm tra `useState` hooks
2. Kiểm tra re-render của component
3. Thêm `useEffect` để log state changes

### Nếu Props Không Đúng:
1. Kiểm tra cách truyền props
2. Kiểm tra `state.weeklyStatus` và `state.activeShift`
3. Kiểm tra format của `selectedDate`

### Nếu Modal Không Render:
1. Kiểm tra import Modal từ react-native-paper
2. Kiểm tra theme và styling
3. Thử thay thế bằng React Native Modal

## 📱 Test Trên Thiết Bị

### Android:
```bash
npx expo start
# Hoặc
npx expo start --dev-client

# Xem logs:
adb logcat | grep -E "(📅|🔍|✅|❌|🎯|🧪)"
```

### iOS:
```bash
npx expo start
# Xem logs trong Metro bundler hoặc Xcode Console
```

## 🎯 Kết Quả Mong Đợi

### Khi Hoạt Động Đúng:
1. **Tap vào ngày** → Console hiển thị đầy đủ logs
2. **Modal xuất hiện** với header và nội dung
3. **Có thể chọn trạng thái** và modal đóng
4. **Test button** cũng hoạt động tương tự

### Khi Có Vấn Đề:
1. **Console logs** sẽ chỉ ra chính xác vấn đề
2. **Modal không xuất hiện** hoặc xuất hiện trống
3. **Error messages** rõ ràng trong console

## 📞 Báo Cáo Kết Quả

Khi test, hãy cung cấp:
1. **Console logs đầy đủ** (copy/paste)
2. **Screenshots** của UI
3. **Platform** (Android/iOS, Expo Go/Dev Build)
4. **Behavior** (modal có xuất hiện không, có content không)

Điều này sẽ giúp xác định chính xác nguyên nhân và cách khắc phục!

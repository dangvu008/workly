# Logic "Bấm Nhanh" (Rapid Press) - Workly App

## Tổng quan

Logic "Bấm Nhanh" được thiết kế để xử lý trường hợp người dùng ở chế độ Full thực hiện toàn bộ chuỗi hành động (Đi làm → Check-in → Check-out → Hoàn tất) trong một khoảng thời gian rất ngắn. Điều này thường xảy ra khi:

- Người dùng muốn "xác nhận nhanh cho có"
- Kiểm tra hoạt động của hệ thống
- Thực hiện demo hoặc test

## Cách thức hoạt động

### 1. Điều kiện kích hoạt

Logic "Bấm Nhanh" được kích hoạt khi:
- Có cả log `check_in` và `check_out` trong cùng một ngày
- Khoảng thời gian giữa `check_in` đầu tiên và `check_out` cuối cùng < `rapidPressThresholdSeconds`
- Không có log `complete` (vì complete có ưu tiên cao hơn)

### 2. Threshold mặc định

```typescript
rapidPressThresholdSeconds: 60 // Mặc định 60 giây
```

Giá trị này có thể được cấu hình trong UserSettings.

### 3. Logic xử lý

Khi phát hiện "Bấm Nhanh":

#### Status
- Luôn được đặt thành `DU_CONG` (Đủ công)

#### Thời gian
- `vaoLogTime`: Thời gian thực tế của log check-in
- `raLogTime`: Thời gian thực tế của log check-out
- Thời gian thực tế được lưu lại để tham khảo

#### Tính giờ công
Giờ công được tính **theo lịch trình ca cố định**, giống như chế độ Simple:

```typescript
// Standard hours
const standardMinutes = Math.max(0,
  (scheduledOfficeEndTimeFull.getTime() - scheduledStartTimeFull.getTime()) / (1000 * 60) - shift.breakMinutes
);
standardHours = standardMinutes / 60;

// Overtime hours
const otMinutes = Math.max(0,
  (scheduledEndTimeFull.getTime() - scheduledOfficeEndTimeFull.getTime()) / (1000 * 60)
);
otHours = otMinutes / 60;
```

#### Giờ đặc biệt
- `sundayHours`: Tính theo lịch trình nếu là Chủ nhật
- `nightHours`: Tính theo khoảng thời gian lịch trình ca (22:00-06:00)
- `isHolidayWork`: Kiểm tra ngày lễ

#### Chỉ số khác
- `lateMinutes`: 0 (không tính muộn)
- `earlyMinutes`: 0 (không tính sớm)

## Ví dụ thực tế

### Ví dụ 1: Bấm nhanh trong 30 giây

```typescript
// Ca làm việc: 08:00 - 17:00 (break 60 phút)
const logs = [
  { type: 'check_in', time: '2025-01-15T08:00:00.000Z' },
  { type: 'check_out', time: '2025-01-15T08:00:30.000Z' } // +30 giây
];

// Kết quả:
{
  status: 'DU_CONG',
  standardHours: 8.0,  // (17:00 - 08:00) - 1h break = 8h
  otHours: 0.0,
  totalHours: 8.0,
  vaoLogTime: '2025-01-15T08:00:00.000Z',
  raLogTime: '2025-01-15T08:00:30.000Z'
}
```

### Ví dụ 2: Không phải bấm nhanh (90 giây)

```typescript
// Cùng ca làm việc, nhưng cách nhau 90 giây
const logs = [
  { type: 'check_in', time: '2025-01-15T08:00:00.000Z' },
  { type: 'check_out', time: '2025-01-15T08:01:30.000Z' } // +90 giây
];

// Kết quả: Áp dụng logic bình thường
{
  status: 'DU_CONG', // Vẫn đủ công vì không muộn/sớm
  standardHours: 0.025, // Chỉ làm 90 giây = 1.5 phút
  otHours: 0.0,
  totalHours: 0.025
}
```

## Cấu hình

### Thay đổi threshold

Có thể thay đổi ngưỡng phát hiện thông qua UserSettings:

```typescript
await storageService.updateUserSettings({
  rapidPressThresholdSeconds: 120 // Tăng lên 2 phút
});
```

### Các giá trị khuyến nghị

- **60 giây** (mặc định): Phù hợp cho hầu hết trường hợp
- **30 giây**: Nghiêm ngặt hơn, chỉ phát hiện những lần bấm thực sự nhanh
- **120 giây**: Linh hoạt hơn, cho phép khoảng thời gian dài hơn

## Lợi ích

1. **Tránh kết quả không mong muốn**: Người dùng không bị ghi nhận giờ công = 0 khi test hệ thống
2. **Linh hoạt**: Cho phép "xác nhận nhanh" mà vẫn có kết quả hợp lý
3. **Minh bạch**: Thời gian thực tế vẫn được lưu lại để kiểm tra
4. **Cấu hình được**: Có thể điều chỉnh threshold theo nhu cầu

## Ghi chú kỹ thuật

- Logic này chỉ áp dụng cho chế độ `multiButtonMode: 'full'`
- Ưu tiên: `complete` log > "Bấm Nhanh" > Logic bình thường
- Console log sẽ hiển thị khi phát hiện "Bấm Nhanh" để debug
- Không ảnh hưởng đến các tính năng khác như notifications, location tracking

## Test Cases

Xem file `src/tests/rapidPress.test.ts` để biết chi tiết các test cases đã được implement.

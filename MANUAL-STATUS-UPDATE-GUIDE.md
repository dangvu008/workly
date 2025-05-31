# Hướng Dẫn Sử Dụng Chức Năng Cập Nhật Trạng Thái Làm Việc Thủ Công

## Tổng Quan

Chức năng Cập nhật Trạng thái Làm việc Thủ công cho phép người dùng nhanh chóng điều chỉnh trạng thái cho một ngày cụ thể trực tiếp từ Lưới Trạng Thái Tuần trên HomeScreen mà không cần qua nhiều bước.

## Cách Kích Hoạt

1. **Từ HomeScreen**: Nhấn (tap) vào một ô ngày cụ thể trên Lưới Trạng Thái Tuần
2. **Modal sẽ xuất hiện** với các tùy chọn phù hợp dựa trên ngày được chọn

## Phân Loại Ngày và Tùy Chọn

### Ngày Quá Khứ hoặc Hiện Tại
Hiển thị đầy đủ các tùy chọn:

#### Tính Toán Từ Chấm Công
- **Tính theo chấm công**: Tự động tính dựa trên log check-in/check-out hiện có
- **Chỉnh sửa giờ chấm công**: Nhập/sửa giờ vào và giờ ra thủ công
- **Xóa trạng thái thủ công**: Xóa trạng thái nghỉ và tính lại từ chấm công (chỉ hiện khi có trạng thái thủ công)

#### Trạng Thái Nghỉ
- **Nghỉ Phép** 🏖️: Nghỉ phép có kế hoạch
- **Nghỉ Bệnh** 🏥: Nghỉ ốm, khám bệnh  
- **Nghỉ Lễ** 🎌: Nghỉ lễ, tết
- **Vắng Mặt** ❌: Vắng mặt không phép
- **Công Tác** ✈️: Đi công tác

### Ngày Tương Lai
Chỉ hiển thị các trạng thái nghỉ để lập kế hoạch trước.

## Chi Tiết Chức Năng

### 1. Tính Theo Chấm Công
- Kích hoạt lại toàn bộ logic tính toán dựa trên attendanceLogs
- Xác định status (DU_CONG, DI_MUON, VE_SOM, etc.) dựa trên giờ thực tế vs lịch trình ca
- Tính các loại giờ công dựa trên lịch trình ca cố định

### 2. Chỉnh Sửa Giờ Chấm Công
- Mở modal con cho phép nhập giờ vào và giờ ra
- **Validation**:
  - Định dạng HH:MM
  - Giờ ra phải sau giờ vào (trừ ca đêm)
  - Thời gian làm việc 30 phút - 24 giờ
  - Cảnh báo nếu lệch quá 2 giờ so với ca chuẩn
- **Xử lý ca đêm**: Tự động điều chỉnh ngày cho giờ ra
- Sau khi lưu, tự động tính lại trạng thái từ logs mới

### 3. Trạng Thái Nghỉ
- Cập nhật trạng thái với flag `isManualOverride = true`
- Đặt tất cả giờ công về 0
- Không ảnh hưởng đến attendanceLogs hiện có
- Có thể áp dụng cho cả ngày tương lai (lập kế hoạch)

### 4. Xóa Trạng Thái Thủ Công
- Hiện dialog xác nhận
- Xóa flag `isManualOverride`
- Tính lại trạng thái từ attendanceLogs hiện có
- Chỉ hiện khi ngày đó có trạng thái thủ công

## Luồng Xử Lý

```
Người dùng tap vào ô ngày
    ↓
Kiểm tra loại ngày (quá khứ/hiện tại/tương lai)
    ↓
Hiển thị modal với tùy chọn phù hợp
    ↓
Người dùng chọn hành động
    ↓
Xử lý theo loại hành động:
    ├── Trạng thái nghỉ → Cập nhật với isManualOverride=true
    ├── Tính theo chấm công → Tính lại từ logs, isManualOverride=false  
    ├── Chỉnh sửa giờ → Cập nhật logs → Tính lại trạng thái
    └── Xóa thủ công → Xác nhận → Tính lại từ logs
    ↓
Làm mới Lưới Trạng Thái Tuần
    ↓
Hiển thị thông báo thành công
```

## Ví Dụ Sử Dụng

### Trường Hợp 1: Đánh Dấu Nghỉ Phép
1. Tap vào ngày 28/05 (quá khứ)
2. Chọn "Nghỉ Phép"
3. Hệ thống cập nhật status="NGHI_PHEP", giờ công=0
4. Hiển thị icon 🏖️ trên lưới

### Trường Hợp 2: Sửa Giờ Chấm Công Sai
1. Tap vào ngày hôm nay
2. Chọn "Chỉnh sửa giờ chấm công"
3. Nhập giờ vào: 08:30, giờ ra: 17:30
4. Hệ thống cập nhật logs và tính lại trạng thái

### Trường Hợp 3: Lập Kế Hoạch Nghỉ
1. Tap vào ngày tương lai (01/06)
2. Chọn "Nghỉ Phép" 
3. Hệ thống lưu trạng thái nghỉ cho ngày đó
4. Không tạo attendance logs

## Lưu Ý Kỹ Thuật

### Validation và Bảo Mật
- Kiểm tra định dạng thời gian nghiêm ngặt
- Cảnh báo khi giờ lệch quá nhiều so với ca chuẩn
- Xác nhận trước khi xóa dữ liệu
- Xử lý lỗi và hiển thị thông báo rõ ràng

### Tích Hợp Hệ Thống
- Tương thích với logic tính toán hiện có
- Không ảnh hưởng đến các chức năng khác
- Đồng bộ với WeeklyStatusGrid và các component liên quan
- Hỗ trợ cả DailyWorkStatus và DailyWorkStatusNew

### Performance
- Chỉ tính toán lại khi cần thiết
- Sử dụng AsyncStorage hiệu quả
- Lazy loading cho modal components
- Debounce cho các thao tác liên tiếp

## Troubleshooting

### Lỗi Thường Gặp
1. **"Không có ca làm việc được kích hoạt"**: Cần thiết lập activeShift trước
2. **"Định dạng giờ không hợp lệ"**: Nhập theo format HH:MM (ví dụ: 08:30)
3. **"Giờ ra phải sau giờ vào"**: Kiểm tra lại thời gian, trừ trường hợp ca đêm

### Debug
- Kiểm tra console logs với prefix 📊, ✋, 🔄, ⏰, 🗑️
- Xem AsyncStorage data trong React Native Debugger
- Kiểm tra state.weeklyStatus trong AppContext

## Tương Lai

### Tính Năng Có Thể Mở Rộng
- Bulk update cho nhiều ngày
- Template cho các loại nghỉ thường dùng
- Sync với calendar external
- Approval workflow cho manager
- Export/import dữ liệu chấm công

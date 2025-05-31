# Mockup Chi Tiết: Modal Cập Nhật Trạng Thái Thủ Công

## Tổng Quan
Modal này xuất hiện khi người dùng nhấn vào một ô ngày trong Lưới Trạng Thái Tuần trên HomeScreen. Giao diện và các tùy chọn sẽ thay đổi tùy thuộc vào ngày được chọn (quá khứ/hiện tại vs tương lai).

---

## Trường Hợp 1: Ngày Quá Khứ hoặc Hiện Tại
**Ví dụ: Thứ Bảy, 31/05/2025 (Hôm nay)**

```
┌─────────────────────────────────────────────────────────────┐
│                    Cập nhật trạng thái                      │
│                                                        [X]  │
├─────────────────────────────────────────────────────────────┤
│  Thứ Bảy, 31/05/2025                                       │
│  📅 Hôm nay                                                │
│  Ca: Ca Sáng (07:00 - 16:00)                               │
│  Trạng thái hiện tại: Chưa xác định                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Tính toán từ chấm công                                  │
│  Chọn hành động:                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🧮  Chọn hành động...                            ▼ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Dropdown Menu khi mở:]                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🧮  Tính theo chấm công                            │   │
│  │     Tự động tính dựa trên log check-in/check-out   │   │
│  │ 🕐  Chỉnh sửa giờ chấm công                        │   │
│  │     Nhập/sửa giờ vào và giờ ra thủ công            │   │
│  │ 🗑️  Xóa trạng thái thủ công                        │   │
│  │     Xóa trạng thái nghỉ và tính lại từ chấm công   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🏖️ Cập nhật trạng thái nghỉ                               │
│  Chọn trạng thái mới:                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📅  Chọn trạng thái...                           ▼ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Dropdown Menu khi mở:]                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🏖️  Nghỉ Phép                                      │   │
│  │     Nghỉ phép có lương, đã được duyệt               │   │
│  │ 🏥  Nghỉ Bệnh                                       │   │
│  │     Nghỉ ốm, bệnh tật có giấy tờ                    │   │
│  │ 🎌  Nghỉ Lễ                                         │   │
│  │     Nghỉ lễ, tết, ngày nghỉ chính thức              │   │
│  │ ❌  Vắng Mặt                                        │   │
│  │     Vắng mặt không phép, không báo trước            │   │
│  │ ✈️  Công Tác                                        │   │
│  │     Đi công tác, làm việc tại địa điểm khác         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    [ Hủy ]                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Trường Hợp 2: Ngày Tương Lai
**Ví dụ: Chủ Nhật, 01/06/2025**

```
┌─────────────────────────────────────────────────────────────┐
│                    Cập nhật trạng thái                      │
│                                                        [X]  │
├─────────────────────────────────────────────────────────────┤
│  Chủ Nhật, 01/06/2025                                       │
│  ⏩ Tương lai                                               │
│  Ca: Ca Sáng (07:00 - 16:00)                               │
│  Trạng thái hiện tại: Chưa xác định                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📝 Đăng ký trạng thái nghỉ                                │
│  Chọn trạng thái mới:                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📅  Chọn trạng thái...                           ▼ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Dropdown Menu khi mở:]                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🏖️  Nghỉ Phép                                      │   │
│  │     Đăng ký nghỉ phép cho ngày này                  │   │
│  │ 🏥  Nghỉ Bệnh                                       │   │
│  │     Đăng ký nghỉ bệnh cho ngày này                  │   │
│  │ 🎌  Nghỉ Lễ                                         │   │
│  │     Đánh dấu nghỉ lễ cho ngày này                   │   │
│  │ ❌  Vắng Mặt                                        │   │
│  │     Đăng ký vắng mặt cho ngày này                   │   │
│  │ ✈️  Công Tác                                        │   │
│  │     Đăng ký công tác cho ngày này                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    [ Hủy ]                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Trường Hợp 3: Modal Chỉnh Sửa Giờ Chấm Công
**Xuất hiện khi chọn "Chỉnh sửa giờ chấm công" từ dropdown**

```
┌─────────────────────────────────────────────────────────────┐
│                 Chỉnh sửa giờ chấm công                     │
│                                                        [X]  │
├─────────────────────────────────────────────────────────────┤
│  Thứ Bảy, 31/05/2025                                       │
│  Ca: Ca Sáng (07:00 - 16:00)                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🕐 Giờ vào làm:                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 07:30                                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🕐 Giờ ra về:                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 16:15                                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ⚠️ Lưu ý: Giờ sẽ được làm tròn theo phút                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [ Xóa Check-in ]    [ Xóa Check-out ]                     │
│                                                             │
│  [ Hủy ]                              [ Lưu ]              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Đặc Điểm Giao Diện

### 1. Header Section
- **Tiêu đề**: "Cập nhật trạng thái" 
- **Nút đóng**: Icon X ở góc phải
- **Thông tin ngày**: Thứ, ngày/tháng/năm
- **Badge loại ngày**: 📅 Hôm nay / ⏪ Quá khứ / ⏩ Tương lai
- **Thông tin ca**: Tên ca và khung giờ
- **Trạng thái hiện tại**: Hiển thị nếu có

### 2. Phần Tính Toán Chấm Công (Chỉ cho ngày quá khứ/hiện tại)
- **Tiêu đề section**: 📊 Tính toán từ chấm công
- **Dropdown menu** với các tùy chọn:
  - 🧮 Tính theo chấm công
  - 🕐 Chỉnh sửa giờ chấm công
  - 🗑️ Xóa trạng thái thủ công (chỉ hiện khi có)

### 3. Phần Trạng Thái Nghỉ
- **Tiêu đề section**: 
  - Ngày quá khứ/hiện tại: 🏖️ Cập nhật trạng thái nghỉ
  - Ngày tương lai: 📝 Đăng ký trạng thái nghỉ
- **Dropdown menu** với 5 tùy chọn nghỉ
- **Mô tả khác nhau** cho quá khứ vs tương lai

### 4. Nút Hành Động
- **Nút Hủy**: Đóng modal không thay đổi
- **Tự động đóng**: Sau khi chọn hành động thành công

### 5. Responsive Design
- **Chiều cao tối đa**: 80% màn hình
- **Scroll**: Khi nội dung dài
- **Padding**: 20px xung quanh
- **Border radius**: 12px

---

## Luồng Tương Tác

1. **Nhấn vào ô ngày** → Modal xuất hiện
2. **Chọn dropdown** → Menu mở ra với các tùy chọn
3. **Chọn tùy chọn** → Thực hiện hành động ngay lập tức
4. **Hiển thị thông báo** → Alert xác nhận thành công/lỗi
5. **Cập nhật UI** → Lưới trạng thái tuần được làm mới

### Xử Lý Lỗi
- **Validation**: Kiểm tra dữ liệu đầu vào
- **Error handling**: Hiển thị thông báo lỗi rõ ràng
- **Fallback**: Giữ modal mở nếu có lỗi

### Accessibility
- **Screen reader**: Hỗ trợ đọc màn hình
- **Keyboard navigation**: Điều hướng bằng phím
- **Color contrast**: Đảm bảo độ tương phản màu sắc

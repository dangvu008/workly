# Notification Icon Requirements

## Android Notification Icon

Để notification hoạt động tốt trên Android, bạn cần tạo file `notification-icon.png` với các yêu cầu sau:

### Yêu cầu kỹ thuật:
- **Kích thước**: 96x96 pixels
- **Định dạng**: PNG với transparency
- **Màu sắc**: Toàn bộ icon phải là màu trắng (#FFFFFF)
- **Background**: Trong suốt (transparent)
- **Style**: Simple, flat design theo Material Design guidelines

### Hướng dẫn tạo icon:
1. Sử dụng icon hiện tại (`icon.png`) làm base
2. Chuyển đổi thành màu trắng hoàn toàn
3. Đảm bảo background trong suốt
4. Resize về 96x96 pixels
5. Lưu với tên `notification-icon.png`

### Tạm thời:
Hiện tại app sẽ sử dụng `icon.png` cho notification. Để có trải nghiệm tốt nhất, hãy tạo `notification-icon.png` theo yêu cầu trên.

### Tools gợi ý:
- [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/icons-notification.html)
- Photoshop/GIMP
- Online PNG editors

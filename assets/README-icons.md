# Workly App Icons

Thư mục này chứa tất cả các icon và assets cho ứng dụng Workly.

## 🎨 Thiết kế Icon

Icon của Workly được thiết kế với chủ đề **quản lý thời gian làm việc**:

- **Đồng hồ**: Biểu tượng chính thể hiện quản lý thời gian
- **Kim đồng hồ**: Chỉ 9:00 (giờ bắt đầu làm việc phổ biến)
- **Badge công việc**: Icon cặp công sở với màu xanh lá
- **Màu sắc**: 
  - Xanh dương (#2196F3) - Chủ đạo, tin cậy
  - Đỏ cam (#FF5722) - Kim đồng hồ, nổi bật
  - Xanh lá (#4CAF50) - Công việc, tích cực

## 📁 Cấu trúc Files

### SVG Sources (Vector)
- `workly-icon.svg` - Icon chính (1024x1024)
- `workly-adaptive-icon.svg` - Android adaptive icon (432x432)
- `workly-notification-icon.svg` - Icon thông báo (256x256)
- `workly-favicon.svg` - Web favicon (32x32)
- `workly-splash-icon.svg` - Splash screen icon (512x512)

### PNG Outputs (Raster)
- `icon.png` - Icon chính cho app
- `adaptive-icon.png` - Android adaptive icon
- `notification-icon.png` - Icon thông báo
- `favicon.png` - Web favicon
- `splash-icon.png` - Splash screen icon

### Additional Sizes
- `ios-app-store-icon.png` (1024x1024) - iOS App Store
- `android-play-store-icon.png` (512x512) - Android Play Store
- `favicon-16x16.png` & `favicon-48x48.png` - Web icons

## 🛠️ Generate Icons

### Tự động (Khuyến nghị)
```bash
# Cài đặt dependencies
npm install sharp

# Chạy script generate
node scripts/generate-icons.js
```

### Thủ công
1. Mở các file SVG trong design tool (Figma, Sketch, Illustrator)
2. Export thành PNG với kích thước tương ứng
3. Hoặc sử dụng online converter: https://convertio.co/svg-png/

## 📱 Platform Requirements

### iOS
- **App Icon**: 1024x1024px (icon.png)
- **Formats**: PNG, no transparency
- **Corner radius**: iOS tự động apply

### Android
- **App Icon**: 432x432px (adaptive-icon.png)
- **Background**: Solid color (#2196F3) trong app.json
- **Foreground**: Icon với padding 108px
- **Formats**: PNG với transparency

### Web
- **Favicon**: 32x32px (favicon.png)
- **Additional**: 16x16px, 48x48px cho compatibility
- **Format**: PNG hoặc ICO

### Notifications
- **Size**: 256x256px (notification-icon.png)
- **Style**: Monochrome cho Android, full color cho iOS
- **Format**: PNG

## 🎯 Usage trong App

Icons được cấu hình trong `app.json`:

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash-icon.png"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#2196F3"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "notification": {
      "icon": "./assets/notification-icon.png"
    }
  }
}
```

## 🔄 Cập nhật Icons

1. Chỉnh sửa file SVG source
2. Chạy lại script generate: `node scripts/generate-icons.js`
3. Test trên các platform khác nhau
4. Build và deploy app

## 📐 Design Guidelines

### Kích thước
- **Minimum**: 16x16px (favicon)
- **Maximum**: 1024x1024px (app store)
- **Recommended**: Vector SVG cho scalability

### Màu sắc
- **Primary**: #2196F3 (Material Blue)
- **Secondary**: #FF5722 (Deep Orange)
- **Accent**: #4CAF50 (Green)
- **Background**: #FFFFFF (White)

### Style
- **Modern**: Flat design với subtle gradients
- **Professional**: Phù hợp môi trường công sở
- **Recognizable**: Dễ nhận biết ở kích thước nhỏ
- **Consistent**: Nhất quán trên tất cả platforms

## 🚀 Deployment

Sau khi generate icons:

1. **Development**: Icons tự động load từ assets/
2. **Production**: 
   - iOS: Upload qua Xcode hoặc App Store Connect
   - Android: Build APK/AAB với icons embedded
   - Web: Deploy với favicon trong public folder

## 📞 Support

Nếu có vấn đề với icons:
1. Kiểm tra file SVG source
2. Verify kích thước và format
3. Test trên device thật
4. Check app.json configuration

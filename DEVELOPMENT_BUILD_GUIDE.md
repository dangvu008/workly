# Hướng dẫn tạo Development Build cho Workly

## Vấn đề với Expo Go và Notifications

Từ Expo SDK 53, tính năng push notifications đã bị loại bỏ khỏi Expo Go trên Android. Để sử dụng đầy đủ tính năng notifications trong ứng dụng Workly, bạn cần tạo development build hoặc production build.

## Giải pháp: Tạo Development Build

### Bước 1: Cài đặt EAS CLI

```bash
npm install -g @expo/eas-cli
```

### Bước 2: Đăng nhập Expo

```bash
eas login
```

### Bước 3: Cấu hình EAS Build

Tạo file `eas.json` trong thư mục gốc của dự án:

```json
{
  "cli": {
    "version": ">= 7.8.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug"
      },
      "ios": {
        "buildConfiguration": "Debug"
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

### Bước 4: Tạo Development Build

#### Cho Android:
```bash
eas build --profile development --platform android
```

#### Cho iOS:
```bash
eas build --profile development --platform ios
```

### Bước 5: Cài đặt Expo Development Client

Sau khi build hoàn thành, tải file APK (Android) hoặc cài đặt qua TestFlight (iOS).

### Bước 6: Chạy ứng dụng

```bash
npx expo start --dev-client
```

## Giải pháp thay thế: Local Development Build

### Bước 1: Cài đặt Android Studio / Xcode

- **Android**: Cài đặt Android Studio và Android SDK
- **iOS**: Cài đặt Xcode (chỉ trên macOS)

### Bước 2: Tạo development build local

#### Android:
```bash
npx expo run:android
```

#### iOS:
```bash
npx expo run:ios
```

## Kiểm tra trạng thái Notifications

Sau khi cài đặt development build, bạn có thể kiểm tra trạng thái notifications trong ứng dụng:

1. Mở ứng dụng Workly
2. Trên trang chủ, tìm banner "Trạng thái Notifications"
3. Nhấn vào banner để xem chi tiết
4. Sử dụng nút "Test Notification" để kiểm tra

## Tính năng Notifications trong Workly

Khi notifications hoạt động đầy đủ, bạn sẽ có:

### 1. Nhắc nhở ca làm việc
- Nhắc nhở 30 phút trước giờ khởi hành
- Nhắc nhở giờ chấm công vào
- Nhắc nhở giờ chấm công ra

### 2. Nhắc nhở ghi chú
- Nhắc nhở theo thời gian cụ thể
- Nhắc nhở theo ca làm việc
- Tính năng snooze và ẩn ghi chú

### 3. Cảnh báo thời tiết
- Cảnh báo thời tiết xấu
- Thông báo nhiệt độ cực đoan

### 4. Thông báo xoay ca
- Thông báo khi ca làm việc được thay đổi tự động
- Nhắc nhở hàng tuần để kiểm tra ca

## Troubleshooting

### Lỗi thường gặp:

1. **"expo-notifications không khả dụng"**
   - Đảm bảo bạn đang sử dụng development build, không phải Expo Go

2. **"Notification permission not granted"**
   - Vào Settings > Apps > Workly > Notifications
   - Bật quyền notifications

3. **Build failed**
   - Kiểm tra kết nối internet
   - Đảm bảo đã đăng nhập EAS CLI
   - Chạy `npx expo install --fix` để cập nhật dependencies

### Liên hệ hỗ trợ:

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra logs trong console
2. Chụp ảnh màn hình lỗi
3. Ghi rõ các bước đã thực hiện

## Lưu ý quan trọng

- Development build chỉ cần tạo một lần, sau đó có thể sử dụng `npx expo start --dev-client` để phát triển
- Production build cần thiết khi muốn phát hành ứng dụng lên store
- Notifications chỉ hoạt động trên thiết bị thật, không hoạt động trên simulator/emulator

## Tài liệu tham khảo

- [Expo Development Builds](https://docs.expo.dev/development/build/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)

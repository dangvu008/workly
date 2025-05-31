# Hướng Dẫn Cấu Hình Notifications cho Workly

## Vấn Đề Hiện Tại

Từ Expo SDK 53+, **push notifications** đã bị loại bỏ khỏi Expo Go trên Android. Điều này có nghĩa là:

- ✅ **Local notifications** vẫn hoạt động bình thường
- ❌ **Push notifications** không hoạt động trong Expo Go trên Android
- ✅ **iOS Expo Go** vẫn hỗ trợ đầy đủ
- ✅ **Development builds** hỗ trợ đầy đủ trên cả Android và iOS

## Giải Pháp

### 1. Sử dụng Development Build (Khuyến nghị)

Development build cho phép bạn có đầy đủ tính năng notifications:

```bash
# Cài đặt EAS CLI
npm install -g @expo/eas-cli

# Đăng nhập EAS
eas login

# Tạo development build cho Android
eas build --profile development --platform android

# Tạo development build cho iOS
eas build --profile development --platform ios
```

### 2. Cấu Hình Notifications

#### a. Cài đặt Dependencies

```bash
# Đã được cài đặt trong project
expo install expo-notifications
```

#### b. Cấu hình app.json

```json
{
  "expo": {
    "plugins": [
      "expo-location",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#2196F3",
          "defaultChannel": "default",
          "sounds": []
        }
      ]
    ],
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#2196F3",
      "iosDisplayInForeground": true,
      "androidMode": "default",
      "androidCollapsedTitle": "Workly"
    }
  }
}
```

#### c. Quyền Android

```json
{
  "android": {
    "permissions": [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "VIBRATE",
      "RECEIVE_BOOT_COMPLETED",
      "WAKE_LOCK",
      "POST_NOTIFICATIONS",
      "USE_EXACT_ALARM",
      "SCHEDULE_EXACT_ALARM"
    ]
  }
}
```

### 3. Kiểm Tra Trạng Thái Notifications

Workly đã tích hợp sẵn component `NotificationStatusCard` để kiểm tra:

1. Mở **Settings** trong app
2. Xem card **"Trạng thái Notifications"** ở đầu trang
3. Nhấn **"Test Notification"** để kiểm tra
4. Nhấn **"Kiểm tra lại"** để refresh status

### 4. Các Tính Năng Notifications trong Workly

#### Local Notifications (Hoạt động trong Expo Go)
- ✅ Nhắc nhở ca làm việc
- ✅ Nhắc nhở ghi chú
- ✅ Báo thức
- ✅ Cảnh báo thời tiết

#### Push Notifications (Cần Development Build)
- ❌ Remote notifications từ server
- ❌ Background sync notifications

## Hướng Dẫn Chi Tiết

### Tạo Development Build

1. **Cài đặt EAS CLI**:
```bash
npm install -g @expo/eas-cli
```

2. **Đăng nhập Expo**:
```bash
eas login
```

3. **Cấu hình EAS** (đã có sẵn trong `eas.json`):
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug"
      }
    }
  }
}
```

4. **Build cho Android**:
```bash
eas build --profile development --platform android
```

5. **Cài đặt APK** từ link được cung cấp

6. **Chạy development server**:
```bash
npx expo start --dev-client
```

### Cấu Hình Notification Icons

Tạo các file icon cần thiết:

```
assets/
├── notification-icon.png (96x96px, white on transparent)
├── adaptive-icon.png (1024x1024px)
└── icon.png (1024x1024px)
```

### Test Notifications

1. **Trong Settings**:
   - Mở app Workly
   - Vào tab "Cài đặt"
   - Nhấn "Test Notification"

2. **Trong Code**:
```typescript
import { notificationService } from './src/services/notifications';

// Test notification
await notificationService.testNotification();

// Kiểm tra support
const status = await notificationService.checkNotificationSupport();
console.log(status);
```

## Troubleshooting

### Lỗi Thường Gặp

1. **"Notifications không khả dụng"**:
   - Kiểm tra quyền trong Settings điện thoại
   - Đảm bảo đã cài đặt expo-notifications
   - Restart app sau khi cấp quyền

2. **"Push notifications không hoạt động"**:
   - Sử dụng development build thay vì Expo Go
   - Kiểm tra cấu hình trong app.json

3. **"Notification không hiển thị"**:
   - Kiểm tra Do Not Disturb mode
   - Kiểm tra notification settings của app
   - Kiểm tra battery optimization settings

### Debug Commands

```bash
# Kiểm tra logs
npx expo start --dev-client
# Hoặc
adb logcat | grep -i notification

# Clear app data
adb shell pm clear com.workly.app

# Check permissions
adb shell dumpsys package com.workly.app | grep permission
```

## Kết Luận

- **Expo Go**: Chỉ hỗ trợ local notifications
- **Development Build**: Hỗ trợ đầy đủ tính năng
- **Production Build**: Hỗ trợ đầy đủ tính năng

Để có trải nghiệm tốt nhất với Workly, khuyến nghị sử dụng development build hoặc production build thay vì Expo Go.

## Liên Kết Hữu Ích

- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Android Notification Channels](https://developer.android.com/develop/ui/views/notifications/channels)

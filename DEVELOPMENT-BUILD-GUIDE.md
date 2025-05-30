# Hướng dẫn Development Build cho Workly

## Vấn đề với Expo Go

Từ Expo SDK 53, push notifications không còn được hỗ trợ trong Expo Go trên Android. Để sử dụng đầy đủ tính năng notification của Workly, bạn cần tạo development build.

## Cách tạo Development Build

### 1. Cài đặt EAS CLI

```bash
npm install -g @expo/eas-cli
```

### 2. Đăng nhập EAS

```bash
eas login
```

### 3. Cấu hình project

```bash
eas build:configure
```

### 4. Tạo development build

**Cho Android:**
```bash
eas build --platform android --profile development
```

**Cho iOS:**
```bash
eas build --platform ios --profile development
```

### 5. Cài đặt Expo Dev Client

Sau khi build hoàn thành, tải file APK (Android) hoặc cài đặt qua TestFlight (iOS).

### 6. Chạy development server

```bash
npx expo start --dev-client
```

## Lợi ích của Development Build

✅ **Push notifications hoạt động đầy đủ**
✅ **Tất cả native modules được hỗ trợ**
✅ **Performance tốt hơn Expo Go**
✅ **Debugging dễ dàng**
✅ **Hot reload vẫn hoạt động**

## Alternative: Sử dụng Expo Go với hạn chế

Nếu bạn vẫn muốn sử dụng Expo Go:

1. **Local notifications** vẫn hoạt động (nhắc nhở ca làm việc, ghi chú)
2. **Push notifications** sẽ không hoạt động trên Android
3. App sẽ hiển thị cảnh báo về hạn chế này

## Kiểm tra trạng thái Notifications

Trong app, bạn có thể kiểm tra trạng thái notification support:

```typescript
import { notificationService } from './src/services/notifications';

const checkSupport = async () => {
  const support = await notificationService.checkNotificationSupport();
  console.log(support.message);
};
```

## Test Notifications

Để test notifications:

```typescript
await notificationService.testNotification();
```

## Troubleshooting

### Lỗi thường gặp:

1. **"expo-notifications functionality is not fully supported"**
   - Đây là cảnh báo bình thường trong Expo Go
   - Local notifications vẫn hoạt động

2. **"Android Push notifications functionality was removed"**
   - Cần sử dụng development build cho Android
   - iOS vẫn hoạt động trong Expo Go

3. **Permission denied**
   - Kiểm tra settings device
   - Chạy lại `requestPermissionsAsync()`

## Liên hệ hỗ trợ

Nếu gặp vấn đề, hãy tạo issue trên GitHub repository của project.

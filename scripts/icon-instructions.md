# 🎨 Hướng dẫn tạo Icons cho Workly

## 📋 Danh sách Icons cần tạo

Từ các file SVG trong thư mục `assets/`, bạn cần convert thành PNG với kích thước sau:

### 1. Icon chính (icon.png)
- **Source**: `workly-icon.svg`
- **Size**: 1024x1024px
- **Format**: PNG
- **Usage**: App icon chính

### 2. Adaptive Icon (adaptive-icon.png)
- **Source**: `workly-adaptive-icon.svg`
- **Size**: 432x432px
- **Format**: PNG với transparency
- **Usage**: Android adaptive icon

### 3. Notification Icon (notification-icon.png)
- **Source**: `workly-notification-icon.svg`
- **Size**: 256x256px
- **Format**: PNG
- **Usage**: Push notifications

### 4. Favicon (favicon.png)
- **Source**: `workly-favicon.svg`
- **Size**: 32x32px
- **Format**: PNG
- **Usage**: Web favicon

### 5. Splash Icon (splash-icon.png)
- **Source**: `workly-splash-icon.svg`
- **Size**: 512x512px
- **Format**: PNG
- **Usage**: Splash screen

## 🛠️ Cách convert SVG sang PNG

### Option 1: Online Tools (Khuyến nghị)
1. Truy cập: https://convertio.co/svg-png/
2. Upload file SVG
3. Chọn kích thước output
4. Download PNG
5. Rename theo tên cần thiết

### Option 2: Figma (Free)
1. Tạo tài khoản Figma miễn phí
2. Import file SVG
3. Resize canvas theo kích thước cần thiết
4. Export as PNG
5. Download và rename

### Option 3: Command Line (Advanced)
```bash
# Cài đặt Inkscape
# Windows: Download từ https://inkscape.org/
# macOS: brew install inkscape
# Linux: sudo apt install inkscape

# Convert commands
inkscape --export-type=png --export-width=1024 --export-height=1024 workly-icon.svg --export-filename=icon.png
inkscape --export-type=png --export-width=432 --export-height=432 workly-adaptive-icon.svg --export-filename=adaptive-icon.png
inkscape --export-type=png --export-width=256 --export-height=256 workly-notification-icon.svg --export-filename=notification-icon.png
inkscape --export-type=png --export-width=32 --export-height=32 workly-favicon.svg --export-filename=favicon.png
inkscape --export-type=png --export-width=512 --export-height=512 workly-splash-icon.svg --export-filename=splash-icon.png
```

### Option 4: Node.js Script (Automatic)
```bash
# Cài đặt sharp
npm install sharp

# Chạy script
npm run generate-icons
```

## 📁 Kết quả cuối cùng

Sau khi convert, thư mục `assets/` sẽ có:

```
assets/
├── icon.png (1024x1024)
├── adaptive-icon.png (432x432)
├── notification-icon.png (256x256)
├── favicon.png (32x32)
├── splash-icon.png (512x512)
├── workly-icon.svg (source)
├── workly-adaptive-icon.svg (source)
├── workly-notification-icon.svg (source)
├── workly-favicon.svg (source)
└── workly-splash-icon.svg (source)
```

## ✅ Kiểm tra

1. **Kích thước đúng**: Verify PNG files có đúng dimensions
2. **Chất lượng**: Icons rõ nét, không bị blur
3. **Transparency**: Adaptive icon có background trong suốt
4. **App config**: app.json đã point đến đúng files

## 🚀 Test Icons

1. **Development**: `expo start` và check trên device
2. **Build**: `expo build` và verify icons trong app
3. **Platforms**: Test trên iOS, Android, và Web

## 💡 Tips

- **Giữ nguyên SVG sources** để dễ chỉnh sửa sau này
- **Backup PNG files** trước khi regenerate
- **Test trên device thật** để đảm bảo icons hiển thị đúng
- **Check app stores** requirements nếu publish app

## 🎨 Customization

Để thay đổi design icons:
1. Edit file SVG sources
2. Regenerate PNG files
3. Test trên app
4. Deploy changes

## 📞 Troubleshooting

**Icons không hiển thị?**
- Check file paths trong app.json
- Verify file sizes và formats
- Clear cache: `expo start -c`

**Icons bị blur?**
- Đảm bảo export đúng kích thước
- Sử dụng PNG thay vì JPG
- Check DPI/resolution settings

**Android adaptive icon không hoạt động?**
- Verify foreground image có transparency
- Check background color trong app.json
- Test trên Android device thật

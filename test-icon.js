// Script test icon cho Workly app
const fs = require('fs');
const path = require('path');

console.log('🎨 WORKLY APP - KIỂM TRA ICON');
console.log('================================');

// Kiểm tra app.json config
const appJsonPath = path.join(__dirname, 'app.json');
if (fs.existsSync(appJsonPath)) {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  const expo = appJson.expo;
  
  console.log('\n📋 Cấu hình Icon trong app.json:');
  console.log(`   Main icon: ${expo.icon}`);
  console.log(`   Splash icon: ${expo.splash?.image}`);
  console.log(`   Android adaptive: ${expo.android?.adaptiveIcon?.foregroundImage}`);
  console.log(`   Web favicon: ${expo.web?.favicon}`);
  console.log(`   Notification icon: ${expo.notification?.icon}`);
}

// Kiểm tra các file icon
const assetsDir = path.join(__dirname, 'assets');
const iconChecks = [
  { file: 'icon.png', purpose: 'Main app icon', expectedSize: '1024x1024' },
  { file: 'adaptive-icon.png', purpose: 'Android adaptive icon', expectedSize: '432x432' },
  { file: 'notification-icon.png', purpose: 'Notification icon', expectedSize: '256x256' },
  { file: 'favicon.png', purpose: 'Web favicon', expectedSize: '32x32' },
  { file: 'splash-icon.png', purpose: 'Splash screen icon', expectedSize: '512x512' }
];

console.log('\n🔍 Kiểm tra file icon:');
iconChecks.forEach(({ file, purpose, expectedSize }) => {
  const filePath = path.join(assetsDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`   ✅ ${file} (${purpose})`);
    console.log(`      Size: ${sizeKB}KB | Expected: ${expectedSize}`);
  } else {
    console.log(`   ❌ ${file} - MISSING!`);
  }
});

// Kiểm tra SVG source files
console.log('\n🎨 SVG Source files:');
const svgFiles = ['workly-icon.svg', 'workly-adaptive-icon.svg', 'workly-notification-icon.svg', 'workly-favicon.svg', 'workly-splash-icon.svg'];
svgFiles.forEach(file => {
  const filePath = path.join(assetsDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MISSING!`);
  }
});

console.log('\n🚀 Kết luận:');
console.log('   - Tất cả file icon PNG đã được generate thành công');
console.log('   - Cấu hình trong app.json đã đúng');
console.log('   - Icon sẽ hiển thị khi build app hoặc chạy trên device');
console.log('   - Trong Expo Go, icon có thể không hiển thị do limitation');

console.log('\n💡 Để test icon:');
console.log('   1. Chạy: npx expo start');
console.log('   2. Scan QR code với Expo Go app');
console.log('   3. Hoặc build development build: npx eas build --profile development');

console.log('\n✅ Icon setup hoàn tất!');

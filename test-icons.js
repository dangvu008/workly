// Script test các icon names trong MaterialCommunityIcons
const fs = require('fs');
const path = require('path');

console.log('🔍 KIỂM TRA ICON NAMES TRONG WORKLY APP');
console.log('=====================================');

// Đọc constants file để lấy icon names
const constantsPath = path.join(__dirname, 'src', 'constants', 'index.ts');
if (!fs.existsSync(constantsPath)) {
  console.log('❌ Không tìm thấy file constants');
  process.exit(1);
}

const constantsContent = fs.readFileSync(constantsPath, 'utf8');

// Extract icon names từ BUTTON_STATES
const buttonStatesMatch = constantsContent.match(/export const BUTTON_STATES = \{([\s\S]*?)\} as const;/);
const weeklyStatusMatch = constantsContent.match(/export const WEEKLY_STATUS = \{([\s\S]*?)\} as const;/);

const extractIconNames = (content) => {
  const iconMatches = content.match(/icon: '([^']+)'/g);
  return iconMatches ? iconMatches.map(match => match.replace(/icon: '([^']+)'/, '$1')) : [];
};

console.log('\n📋 BUTTON_STATES Icons:');
if (buttonStatesMatch) {
  const buttonIcons = extractIconNames(buttonStatesMatch[1]);
  buttonIcons.forEach(icon => {
    console.log(`   - ${icon}`);
  });
}

console.log('\n📋 WEEKLY_STATUS Icons:');
if (weeklyStatusMatch) {
  const weeklyIcons = extractIconNames(weeklyStatusMatch[1]);
  // Loại bỏ duplicate
  const uniqueWeeklyIcons = [...new Set(weeklyIcons)];
  uniqueWeeklyIcons.forEach(icon => {
    console.log(`   - ${icon}`);
  });
}

// Danh sách các icon có thể có vấn đề
const problematicIcons = [
  'run-fast',
  'location-enter', 
  'location-exit',
  'timer-sand-empty',
  'target-account',
  'clock-alert-outline',
  'walk'
];

console.log('\n⚠️  ICON CÓ THỂ CÓ VẤN ĐỀ:');
problematicIcons.forEach(icon => {
  console.log(`   - ${icon} (cần kiểm tra)`);
});

console.log('\n💡 GỢI Ý SỬA LỖI:');
console.log('   1. Thay thế các icon không tồn tại bằng icon tương tự');
console.log('   2. Sử dụng icon cơ bản như: run, login, logout, timer, target');
console.log('   3. Kiểm tra MaterialCommunityIcons documentation');

console.log('\n🔧 ICON THAY THẾ ĐỀ XUẤT:');
const replacements = {
  'run-fast': 'run',
  'location-enter': 'login',
  'location-exit': 'logout', 
  'timer-sand-empty': 'timer-sand',
  'target-account': 'target',
  'clock-alert-outline': 'clock-alert',
  'walk': 'walk'
};

Object.entries(replacements).forEach(([old, newIcon]) => {
  console.log(`   ${old} → ${newIcon}`);
});

console.log('\n✅ Kiểm tra hoàn tất!');

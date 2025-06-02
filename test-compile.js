// Test file để kiểm tra compilation
console.log('Testing compilation...');

// Import một số modules cơ bản
const fs = require('fs');
const path = require('path');

// Kiểm tra xem các file icon có tồn tại không
const assetsDir = path.join(__dirname, 'assets');
const iconFiles = [
  'icon.png',
  'adaptive-icon.png', 
  'notification-icon.png',
  'favicon.png',
  'splash-icon.png'
];

console.log('🔍 Kiểm tra các file icon...');

iconFiles.forEach(file => {
  const filePath = path.join(assetsDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file} - ${Math.round(stats.size / 1024)}KB`);
  } else {
    console.log(`❌ ${file} - Không tồn tại`);
  }
});

console.log('✅ Test hoàn tất!');

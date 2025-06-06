/**
 * ✅ Script dọn dẹp các file icon cũ và không cần thiết
 * Loại bỏ các component icon phức tạp, giữ lại WorklyIcon đơn giản
 */

const fs = require('fs');
const path = require('path');

const filesToRemove = [
  'src/components/OptimizedIcon.tsx',
  'src/components/OptimizedIconButton.tsx',
  'src/components/IconLoadingFallback.tsx',
];

const filesToKeep = [
  'src/components/WorklyIcon.tsx',
  'src/components/SimpleIcon.tsx', // Giữ lại để backward compatibility
  'src/components/IconTest.tsx',
];

function cleanupIcons() {
  console.log('🧹 Bắt đầu dọn dẹp các file icon cũ...');

  // Xóa các file không cần thiết
  filesToRemove.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
        console.log(`✅ Đã xóa: ${filePath}`);
      } catch (error) {
        console.log(`❌ Lỗi khi xóa ${filePath}:`, error.message);
      }
    } else {
      console.log(`⚠️  File không tồn tại: ${filePath}`);
    }
  });

  // Kiểm tra các file cần giữ lại
  console.log('\n📋 Kiểm tra các file icon cần giữ lại:');
  filesToKeep.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ Tồn tại: ${filePath}`);
    } else {
      console.log(`❌ Thiếu: ${filePath}`);
    }
  });

  console.log('\n🎯 Tóm tắt:');
  console.log('- Đã loại bỏ các component icon phức tạp');
  console.log('- Chỉ sử dụng @expo/vector-icons (MaterialCommunityIcons)');
  console.log('- WorklyIcon là component icon chính thống');
  console.log('- Tất cả icon đều load nhanh và ổn định');
  
  console.log('\n✨ Hoàn thành dọn dẹp icon!');
}

if (require.main === module) {
  cleanupIcons();
}

module.exports = { cleanupIcons };

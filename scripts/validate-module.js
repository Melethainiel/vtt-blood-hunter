const fs = require('fs');
const path = require('path');

function validateModule() {
  const modulePath = path.join(__dirname, '..', 'module.json');
  
  if (!fs.existsSync(modulePath)) {
    console.error('❌ module.json not found');
    process.exit(1);
  }
  
  try {
    const moduleData = JSON.parse(fs.readFileSync(modulePath, 'utf8'));
    
    // Validate required fields
    const requiredFields = ['id', 'title', 'version', 'compatibility', 'esmodules'];
    for (const field of requiredFields) {
      if (!moduleData[field]) {
        console.error(`❌ Missing required field: ${field}`);
        process.exit(1);
      }
    }
    
    // Validate version format
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(moduleData.version)) {
      console.error('❌ Version should be in format x.y.z');
      process.exit(1);
    }
    
    // Check if referenced files exist
    for (const module of moduleData.esmodules) {
      const filePath = path.join(__dirname, '..', module);
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Referenced module file not found: ${module}`);
        process.exit(1);
      }
    }
    
    for (const style of moduleData.styles || []) {
      const filePath = path.join(__dirname, '..', style);
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Referenced style file not found: ${style}`);
        process.exit(1);
      }
    }
    
    for (const lang of moduleData.languages || []) {
      const filePath = path.join(__dirname, '..', lang.path);
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Referenced language file not found: ${lang.path}`);
        process.exit(1);
      }
    }
    
    console.log('✅ Module validation passed');
    
  } catch (error) {
    console.error('❌ Error parsing module.json:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  validateModule();
}

module.exports = { validateModule };
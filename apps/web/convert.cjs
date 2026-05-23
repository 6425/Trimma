const fs = require('fs');
const sharp = require('sharp');

const inputPath = 'C:\\Users\\thusi\\.gemini\\antigravity\\brain\\3916314e-0d1f-420b-8abe-0225f1f3416b\\salon_dashboard_ui_1779551620082.png';
const outDir = 'C:\\Users\\thusi\\Downloads\\Trimma\\apps\\web\\public\\assets';
const outPath = outDir + '\\salon_dashboard.webp';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

sharp(inputPath)
  .webp({ quality: 80 })
  .toFile(outPath)
  .then(() => console.log('SUCCESS'))
  .catch(err => console.error('ERROR:', err));

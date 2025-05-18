const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng() {
  const svgPath = path.join(__dirname, 'public/icons/icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);
  
  // Process multiple sizes
  const sizes = [192, 512];
  
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .toFile(path.join(__dirname, `public/icons/icon-${size}x${size}.png`));
    
    console.log(`Created icon-${size}x${size}.png`);
  }
}

convertSvgToPng().catch(console.error); 
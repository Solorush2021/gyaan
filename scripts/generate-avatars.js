const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const AVATARS_DIR = path.join(__dirname, '../public/avatars');

const MAPPING = {
  'user.svg': 'user.png',
  'teacher.svg': 'teacher-2.png',
  'assistant.svg': 'assist-2.png',
  'clown.svg': 'clown-2.png',
  'curious.svg': 'curious-2.png',
  'notes.svg': 'note-taker-2.png',
  'thinker.svg': 'thinker-2.png'
};

// Premium duotone/monochrome filter
// Sepia (100%) + hue-rotate (215deg) + saturate (140%) + brightness (90%) + contrast (115%)
// This converts the colorful avatars into a unified, premium violet/indigo tint.
const STYLE_INJECTION = `
  <style>
    svg {
      filter: sepia(100%) hue-rotate(215deg) saturate(140%) brightness(90%) contrast(115%) !important;
      background: transparent !important;
    }
  </style>
`;

async function main() {
  console.log('--- Generating premium monochrome avatars ---');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set transparent viewport
  await page.setViewportSize({ width: 280, height: 280 });
  
  for (const [svgFile, pngFile] of Object.entries(MAPPING)) {
    const svgPath = path.join(AVATARS_DIR, svgFile);
    const pngPath = path.join(AVATARS_DIR, pngFile);
    
    if (!fs.existsSync(svgPath)) {
      console.warn(`Warning: SVG file not found: ${svgFile}`);
      continue;
    }
    
    let svgContent = fs.readFileSync(svgPath, 'utf8');
    
    // Inject our premium filter style right after <svg ...> tag
    const match = svgContent.match(/<svg([^>]*)>/);
    if (match) {
      svgContent = svgContent.replace(match[0], `${match[0]}${STYLE_INJECTION}`);
    }
    
    // Load the SVG in the page
    await page.setContent(`
      <style>
        body, html {
          margin: 0;
          padding: 0;
          background: transparent !important;
          overflow: hidden;
          width: 280px;
          height: 280px;
        }
      </style>
      ${svgContent}
    `);
    
    // Take screenshot with transparent background
    await page.screenshot({
      path: pngPath,
      omitBackground: true,
      type: 'png'
    });
    
    console.log(`Generated premium monochrome avatar: ${pngFile} (from ${svgFile})`);
  }
  
  await browser.close();
  console.log('--- Done generating avatars ---');
}

main().catch(err => {
  console.error('Error rendering avatars:', err);
  process.exit(1);
});

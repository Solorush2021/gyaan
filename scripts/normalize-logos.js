const fs = require('fs');
const path = require('path');

const LOGOS_DIR = path.join(__dirname, '../public/logos');
const LIB_DIR = path.join(__dirname, '../lib');

// 1. Define new SVG contents for the PNG logos
const NEW_SVGs = {
  'baidu.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%">
  <path d="M4.5 9.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zm4.5-4a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm6 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm4.5 4a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM12 11c-2.8 0-5 2.2-5 5 0 2.2 2.2 4 5 4s5-1.8 5-4c0-2.8-2.2-5-5-5z" />
</svg>`,
  'brave.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2l3.5 3h-7L12 2zM5 8l1.5-3 5.5 3L12 22l-7-14zM19 8l-1.5-3-5.5 3L12 22l7-14zM8.5 5h7M5 8h14M8.5 11l3.5-3 3.5 3" />
</svg>`,
  'bocha.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="11" cy="11" r="6" />
  <path d="M21 21l-4.35-4.35" />
  <path d="M9.5 8.5h2a1.5 1.5 0 0 1 0 3h-2v-3zm0 3h2a1.5 1.5 0 0 1 0 3h-2v-3z" stroke-width="1.8" />
</svg>`,
  'kimi.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6 4v16M18 4l-9 8 9 8" />
</svg>`,
  'mineru.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5V3.5A2.5 2.5 0 0 1 6.5 1h10.5L20 4.5V17M14 6v8l-3-2-3 2V6h6z" />
</svg>`,
  'voxcpm.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  <path d="M8 9v2M12 7v6M16 9v2" />
</svg>`
};

// Premium monochrome style tag to be injected
const STYLE_TAG = `
  <style>
    path:not([fill="none"]), 
    circle:not([fill="none"]), 
    rect:not([fill="none"]), 
    polygon:not([fill="none"]), 
    ellipse:not([fill="none"]) {
      fill: #475569 !important;
    }
    path[stroke]:not([stroke="none"]), 
    circle[stroke]:not([stroke="none"]), 
    rect[stroke]:not([stroke="none"]), 
    polygon[stroke]:not([stroke="none"]) {
      stroke: #475569 !important;
    }
    @media (prefers-color-scheme: dark) {
      path:not([fill="none"]), 
      circle:not([fill="none"]), 
      rect:not([fill="none"]), 
      polygon:not([fill="none"]), 
      ellipse:not([fill="none"]) {
        fill: #cbd5e1 !important;
      }
      path[stroke]:not([stroke="none"]), 
      circle[stroke]:not([stroke="none"]), 
      rect[stroke]:not([stroke="none"]), 
      polygon[stroke]:not([stroke="none"]) {
        stroke: #cbd5e1 !important;
      }
    }
  </style>
`;

// Helper to inject style tag into SVG string
function injectStyle(svgContent) {
  // Strip existing style tag if any
  let cleaned = svgContent.replace(/<style>[\s\S]*?<\/style>/g, '');
  
  // Find <svg...> tag
  const svgTagRegex = /<svg([^>]*)>/;
  const match = cleaned.match(svgTagRegex);
  if (match) {
    const fullSvgTag = match[0];
    return cleaned.replace(fullSvgTag, `${fullSvgTag}${STYLE_TAG}`);
  }
  return cleaned;
}

function main() {
  console.log('--- Processing provider logos ---');

  // Create new SVGs
  for (const [filename, content] of Object.entries(NEW_SVGs)) {
    const filePath = path.join(LOGOS_DIR, filename);
    fs.writeFileSync(filePath, injectStyle(content), 'utf8');
    console.log(`Created new SVG logo: ${filename}`);
  }

  // Read all SVGs in logos folder and normalize them
  const files = fs.readdirSync(LOGOS_DIR);
  files.forEach(file => {
    if (path.extname(file).toLowerCase() === '.svg') {
      const filePath = path.join(LOGOS_DIR, file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Inject theme-switching monochrome style
      const updatedContent = injectStyle(content);
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Normalized SVG: ${file}`);
    }
  });

  // Update references in code from .png to .svg
  const replacements = [
    {
      file: path.join(LIB_DIR, 'ai/providers.ts'),
      from: '/logos/kimi.png',
      to: '/logos/kimi.svg'
    },
    {
      file: path.join(LIB_DIR, 'audio/constants.ts'),
      from: '/logos/voxcpm-icon.png',
      to: '/logos/voxcpm.svg'
    },
    {
      file: path.join(LIB_DIR, 'pdf/constants.ts'),
      from: '/logos/mineru.png',
      to: '/logos/mineru.svg'
    },
    {
      file: path.join(LIB_DIR, 'web-search/constants.ts'),
      from: '/logos/bocha.png',
      to: '/logos/bocha.svg'
    },
    {
      file: path.join(LIB_DIR, 'web-search/constants.ts'),
      from: '/logos/brave.png',
      to: '/logos/brave.svg'
    },
    {
      file: path.join(LIB_DIR, 'web-search/constants.ts'),
      from: '/logos/baidu.png',
      to: '/logos/baidu.svg'
    }
  ];

  replacements.forEach(({ file, from, to }) => {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      if (content.includes(from)) {
        content = content.split(from).join(to);
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated reference in ${path.relative(LIB_DIR, file)}: ${from} -> ${to}`);
      }
    }
  });

  console.log('--- Done processing provider logos ---');
}

main();

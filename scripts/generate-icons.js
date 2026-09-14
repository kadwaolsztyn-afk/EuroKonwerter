import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';

// Master SVG for the App Icon (Full-bleed, 512x512)
// Designed for automotive headlight conversion & multimedia adaptation
export const MASTER_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient (Deep Obsidian Navy to Royal Midnight) -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="45%" stop-color="#020617" />
      <stop offset="100%" stop-color="#020817" />
    </linearGradient>

    <!-- Radial Ambient Glow behind headlight projector -->
    <radialGradient id="ambientGlow" cx="45%" cy="50%" r="55%">
      <stop offset="0%" stop-color="#0284c7" stop-opacity="0.38" />
      <stop offset="45%" stop-color="#0369a1" stop-opacity="0.16" />
      <stop offset="100%" stop-color="#020617" stop-opacity="0" />
    </radialGradient>

    <!-- Metallic Rim Gradient -->
    <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8" />
      <stop offset="30%" stop-color="#1e293b" stop-opacity="0.9" />
      <stop offset="60%" stop-color="#f59e0b" stop-opacity="0.7" />
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.8" />
    </linearGradient>

    <!-- Headlight Housing Polycarbonate Shell Gradient -->
    <linearGradient id="housingGrad" x1="0%" y1="0%" x2="100%" y2="85%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="40%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>

    <!-- Bi-LED Crystal Projector Lens (Ice Cyan Core) -->
    <radialGradient id="lensGlow1" cx="38%" cy="38%" r="62%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="22%" stop-color="#a5f3fc" />
      <stop offset="50%" stop-color="#0ea5e9" />
      <stop offset="78%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#082f49" />
    </radialGradient>

    <!-- Matrix Beam Projector Lens 2 -->
    <radialGradient id="lensGlow2" cx="36%" cy="36%" r="64%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="28%" stop-color="#bae6fd" />
      <stop offset="62%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0c4a6e" />
    </radialGradient>

    <!-- Amber Sequential Turn Indicator Gradient -->
    <linearGradient id="amberStrip" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="55%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <!-- Forward Laser Beam Projection Flare -->
    <linearGradient id="lightBeam" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.85" />
      <stop offset="35%" stop-color="#0284c7" stop-opacity="0.45" />
      <stop offset="75%" stop-color="#0369a1" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0" />
    </linearGradient>

    <!-- Upper DRL LED Blade (Neon Ice Cyan/White) -->
    <linearGradient id="drlBlade" x1="0%" y1="0%" x2="100%" y2="40%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="25%" stop-color="#f0f9ff" />
      <stop offset="65%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>

    <!-- Glow Filter for sharp neon illumination -->
    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="12" result="blur2" />
      <feComposite in="SourceGraphic" in2="blur2" operator="over" />
    </filter>
  </defs>

  <!-- 1. FULL BLEED BACKGROUND (0,0 to 512,512) - Essential for iOS & Android -->
  <rect x="0" y="0" width="512" height="512" fill="url(#bgGrad)" />

  <!-- 2. Ambient Light Radial Diffusion behind the projector -->
  <circle cx="230" cy="245" r="240" fill="url(#ambientGlow)" />

  <!-- 3. Futuristic Geometric Grid Pattern (Low Opacity) -->
  <g stroke="#334155" stroke-width="1" stroke-opacity="0.22">
    <line x1="64" y1="0" x2="64" y2="512" />
    <line x1="128" y1="0" x2="128" y2="512" />
    <line x1="192" y1="0" x2="192" y2="512" />
    <line x1="256" y1="0" x2="256" y2="512" />
    <line x1="320" y1="0" x2="320" y2="512" />
    <line x1="384" y1="0" x2="384" y2="512" />
    <line x1="448" y1="0" x2="448" y2="512" />

    <line x1="0" y1="64" x2="512" y2="64" />
    <line x1="0" y1="128" x2="512" y2="128" />
    <line x1="0" y1="192" x2="512" y2="192" />
    <line x1="0" y1="256" x2="512" y2="256" />
    <line x1="0" y1="320" x2="512" y2="320" />
    <line x1="0" y1="384" x2="512" y2="384" />
    <line x1="0" y1="448" x2="512" y2="448" />
  </g>

  <!-- 4. Subtle Inner Border Accent (Safe within corner radius) -->
  <rect x="18" y="18" width="476" height="476" rx="96" ry="96" fill="none" stroke="url(#rimGrad)" stroke-width="3" stroke-opacity="0.55" />

  <!-- 5. Forward Light Beam Projection (Right-firing optical rays) -->
  <path d="M 235,220 L 490,145 L 495,295 L 235,255 Z" fill="url(#lightBeam)" filter="url(#neonGlow)" />
  <path d="M 160,270 L 492,240 L 496,380 L 160,310 Z" fill="url(#lightBeam)" filter="url(#softGlow)" opacity="0.75" />

  <!-- 6. Outer Headlight Assembly Contour (Aerodynamic Car Headlight Shell) -->
  <path d="M 72,172 C 132,138 268,122 420,186 C 438,194 445,214 434,233 C 382,318 296,374 144,368 C 94,365 68,328 66,280 C 64,232 66,195 72,172 Z" 
        fill="url(#housingGrad)" 
        stroke="#475569" 
        stroke-width="5" />

  <!-- 7. Inner Dark Chrome Housing & Light Reflector Pocket -->
  <path d="M 88,188 C 142,158 262,144 398,200 C 411,206 415,220 405,234 C 358,306 284,350 152,345 C 114,343 90,315 86,277 C 84,239 86,207 88,188 Z" 
        fill="#070c18" 
        stroke="#1e293b" 
        stroke-width="3.5" />

  <!-- 8. Upper Daytime Running Light (DRL) Neon Blade Bar -->
  <path d="M 98,180 C 168,150 274,141 404,196 C 410,199 407,208 400,209 C 280,161 170,171 104,202 C 96,206 92,197 98,180 Z" 
        fill="url(#drlBlade)" 
        filter="url(#neonGlow)" />

  <!-- 9. Dynamic Amber LED Turn Signal Strip (Sequential Indicator) -->
  <path d="M 112,336 C 186,342 268,322 350,270 C 356,266 361,272 355,277 C 274,331 189,352 112,346 C 105,345 106,335 112,336 Z" 
        fill="url(#amberStrip)" 
        filter="url(#neonGlow)" />

  <!-- 10. Secondary Bi-LED Projector (Right / High Beam Module) -->
  <g transform="translate(312, 242)">
    <!-- Chrome Bezel Ring -->
    <circle cx="0" cy="0" r="41" fill="#0f172a" stroke="#475569" stroke-width="4" />
    <circle cx="0" cy="0" r="34" fill="#020617" stroke="#38bdf8" stroke-width="2.5" />
    <!-- Glass Lens Core -->
    <circle cx="0" cy="0" r="29" fill="url(#lensGlow2)" filter="url(#neonGlow)" />
    <!-- Specular Optical Glare -->
    <ellipse cx="-9" cy="-9" rx="11" ry="6" transform="rotate(-25 -9 -9)" fill="#ffffff" opacity="0.8" />
    <!-- Projector Center Point -->
    <circle cx="0" cy="0" r="6" fill="#ffffff" />
  </g>

  <!-- 11. Primary Main Bi-LED Laser Projector (Left / Dominant Lens) -->
  <g transform="translate(196, 234)">
    <!-- Heavy Chrome Outer Ring -->
    <circle cx="0" cy="0" r="54" fill="#0f172a" stroke="#64748b" stroke-width="5" />
    <circle cx="0" cy="0" r="46" fill="#020617" stroke="#38bdf8" stroke-width="3" />
    <!-- Intense Glowing Ice Cyan Glass Lens -->
    <circle cx="0" cy="0" r="40" fill="url(#lensGlow1)" filter="url(#neonGlow)" />
    <!-- Primary Specular Flare -->
    <ellipse cx="-13" cy="-14" rx="16" ry="9" transform="rotate(-25 -13 -14)" fill="#ffffff" opacity="0.9" />
    <ellipse cx="14" cy="14" rx="10" ry="5" transform="rotate(-25 14 14)" fill="#ffffff" opacity="0.45" />
    <!-- Focused Laser Center Point -->
    <circle cx="0" cy="0" r="9" fill="#ffffff" />
  </g>

  <!-- 12. Corner Matrix LED Cluster (Left Wing) -->
  <g transform="translate(118, 252)">
    <rect x="-14" y="-20" width="11" height="9" rx="2" fill="#38bdf8" filter="url(#neonGlow)" />
    <rect x="-14" y="-6" width="11" height="9" rx="2" fill="#38bdf8" filter="url(#neonGlow)" />
    <rect x="-14" y="8" width="11" height="9" rx="2" fill="#38bdf8" filter="url(#neonGlow)" />
  </g>

  <!-- 13. Sleek Bottom Emblem Badge: "CENNIK" with Automotive Amber/Cyan Dots -->
  <g transform="translate(256, 432)">
    <rect x="-110" y="-18" width="220" height="34" rx="17" fill="#091024" stroke="#334155" stroke-width="2" />
    <text x="0" y="5" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif" font-size="14" font-weight="900" letter-spacing="3" fill="#f8fafc">
      CENNIK LAMP
    </text>
    <circle cx="-85" cy="-1" r="4" fill="#f59e0b" />
    <circle cx="85" cy="-1" r="4" fill="#38bdf8" />
  </g>
</svg>
`;

// Maskable version with extra padding for Android adaptive icons (Safe Zone = 80%)
export const MASKABLE_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="45%" stop-color="#020617" />
      <stop offset="100%" stop-color="#020817" />
    </linearGradient>

    <radialGradient id="ambientGlowM" cx="45%" cy="50%" r="55%">
      <stop offset="0%" stop-color="#0284c7" stop-opacity="0.38" />
      <stop offset="45%" stop-color="#0369a1" stop-opacity="0.16" />
      <stop offset="100%" stop-color="#020617" stop-opacity="0" />
    </radialGradient>

    <linearGradient id="housingGradM" x1="0%" y1="0%" x2="100%" y2="85%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="40%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>

    <radialGradient id="lensGlow1M" cx="38%" cy="38%" r="62%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="22%" stop-color="#a5f3fc" />
      <stop offset="50%" stop-color="#0ea5e9" />
      <stop offset="78%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#082f49" />
    </radialGradient>

    <radialGradient id="lensGlow2M" cx="36%" cy="36%" r="64%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="28%" stop-color="#bae6fd" />
      <stop offset="62%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0c4a6e" />
    </radialGradient>

    <linearGradient id="amberStripM" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="55%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <linearGradient id="lightBeamM" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.85" />
      <stop offset="35%" stop-color="#0284c7" stop-opacity="0.45" />
      <stop offset="75%" stop-color="#0369a1" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0" />
    </linearGradient>

    <linearGradient id="drlBladeM" x1="0%" y1="0%" x2="100%" y2="40%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="25%" stop-color="#f0f9ff" />
      <stop offset="65%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>

    <filter id="neonGlowM" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <rect x="0" y="0" width="512" height="512" fill="url(#bgGradM)" />
  <circle cx="256" cy="256" r="220" fill="url(#ambientGlowM)" />

  <!-- Centered content scaled down by 0.78 to fit within circular adaptive mask safe area -->
  <g transform="translate(56, 56) scale(0.78)">
    <path d="M 235,220 L 490,145 L 495,295 L 235,255 Z" fill="url(#lightBeamM)" filter="url(#neonGlowM)" />
    <path d="M 160,270 L 492,240 L 496,380 L 160,310 Z" fill="url(#lightBeamM)" opacity="0.75" />

    <path d="M 72,172 C 132,138 268,122 420,186 C 438,194 445,214 434,233 C 382,318 296,374 144,368 C 94,365 68,328 66,280 C 64,232 66,195 72,172 Z" 
          fill="url(#housingGradM)" 
          stroke="#475569" 
          stroke-width="5" />

    <path d="M 88,188 C 142,158 262,144 398,200 C 411,206 415,220 405,234 C 358,306 284,350 152,345 C 114,343 90,315 86,277 C 84,239 86,207 88,188 Z" 
          fill="#070c18" 
          stroke="#1e293b" 
          stroke-width="3.5" />

    <path d="M 98,180 C 168,150 274,141 404,196 C 410,199 407,208 400,209 C 280,161 170,171 104,202 C 96,206 92,197 98,180 Z" 
          fill="url(#drlBladeM)" 
          filter="url(#neonGlowM)" />

    <path d="M 112,336 C 186,342 268,322 350,270 C 356,266 361,272 355,277 C 274,331 189,352 112,346 C 105,345 106,335 112,336 Z" 
          fill="url(#amberStripM)" 
          filter="url(#neonGlowM)" />

    <g transform="translate(312, 242)">
      <circle cx="0" cy="0" r="41" fill="#0f172a" stroke="#475569" stroke-width="4" />
      <circle cx="0" cy="0" r="34" fill="#020617" stroke="#38bdf8" stroke-width="2.5" />
      <circle cx="0" cy="0" r="29" fill="url(#lensGlow2M)" filter="url(#neonGlowM)" />
      <ellipse cx="-9" cy="-9" rx="11" ry="6" transform="rotate(-25 -9 -9)" fill="#ffffff" opacity="0.8" />
      <circle cx="0" cy="0" r="6" fill="#ffffff" />
    </g>

    <g transform="translate(196, 234)">
      <circle cx="0" cy="0" r="54" fill="#0f172a" stroke="#64748b" stroke-width="5" />
      <circle cx="0" cy="0" r="46" fill="#020617" stroke="#38bdf8" stroke-width="3" />
      <circle cx="0" cy="0" r="40" fill="url(#lensGlow1M)" filter="url(#neonGlowM)" />
      <ellipse cx="-13" cy="-14" rx="16" ry="9" transform="rotate(-25 -13 -14)" fill="#ffffff" opacity="0.9" />
      <ellipse cx="14" cy="14" rx="10" ry="5" transform="rotate(-25 14 14)" fill="#ffffff" opacity="0.45" />
      <circle cx="0" cy="0" r="9" fill="#ffffff" />
    </g>

    <g transform="translate(118, 252)">
      <rect x="-14" y="-20" width="11" height="9" rx="2" fill="#38bdf8" filter="url(#neonGlowM)" />
      <rect x="-14" y="-6" width="11" height="9" rx="2" fill="#38bdf8" filter="url(#neonGlowM)" />
      <rect x="-14" y="8" width="11" height="9" rx="2" fill="#38bdf8" filter="url(#neonGlowM)" />
    </g>

    <g transform="translate(256, 432)">
      <rect x="-110" y="-18" width="220" height="34" rx="17" fill="#091024" stroke="#334155" stroke-width="2" />
      <text x="0" y="5" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="900" letter-spacing="3" fill="#f8fafc">
        CENNIK LAMP
      </text>
      <circle cx="-85" cy="-1" r="4" fill="#f59e0b" />
      <circle cx="85" cy="-1" r="4" fill="#38bdf8" />
    </g>
  </g>
</svg>
`;

// Generator script
export function generateAllAppIcons() {
  console.log('Generating high-resolution PWA & iOS app icons from SVG...');

  const outputDirs = [
    path.join(process.cwd(), 'public'),
    path.join(process.cwd(), 'dist'),
  ];

  // Render PNG buffer helper
  function renderSvgToPng(svgStr, size) {
    const resvg = new Resvg(svgStr, {
      fitTo: { mode: 'width', value: size },
      shapeRendering: 2, // Geometric precision
      textRendering: 1,  // Geometric precision
      imageRendering: 0, // Optimize quality
    });
    const pngData = resvg.render();
    return pngData.asPng();
  }

  // Create buffers
  const png512 = renderSvgToPng(MASTER_ICON_SVG, 512);
  const png192 = renderSvgToPng(MASTER_ICON_SVG, 192);
  const png180 = renderSvgToPng(MASTER_ICON_SVG, 180);
  const png32 = renderSvgToPng(MASTER_ICON_SVG, 32);
  const png16 = renderSvgToPng(MASTER_ICON_SVG, 16);

  const maskable512 = renderSvgToPng(MASKABLE_ICON_SVG, 512);
  const maskable192 = renderSvgToPng(MASKABLE_ICON_SVG, 192);

  // Write files to both public and dist (if dist exists)
  outputDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) return;

    // SVG
    fs.writeFileSync(path.join(dir, 'icon.svg'), MASTER_ICON_SVG, 'utf8');
    fs.writeFileSync(path.join(dir, 'favicon.svg'), MASTER_ICON_SVG, 'utf8');

    // Standard PNGs
    fs.writeFileSync(path.join(dir, 'icon.png'), png512);
    fs.writeFileSync(path.join(dir, 'icon-512.png'), png512);
    fs.writeFileSync(path.join(dir, 'icon-192.png'), png192);

    // iOS Apple Touch Icons (180x180 is the official iPhone requirement)
    fs.writeFileSync(path.join(dir, 'apple-touch-icon.png'), png180);
    fs.writeFileSync(path.join(dir, 'apple-touch-icon-180x180.png'), png180);
    fs.writeFileSync(path.join(dir, 'apple-touch-icon-precomposed.png'), png180);

    // Android Adaptive Maskable Icons
    fs.writeFileSync(path.join(dir, 'icon-maskable-512.png'), maskable512);
    fs.writeFileSync(path.join(dir, 'icon-maskable-192.png'), maskable192);

    // Favicons
    fs.writeFileSync(path.join(dir, 'favicon-32x32.png'), png32);
    fs.writeFileSync(path.join(dir, 'favicon-16x16.png'), png16);
    // Simple 32x32 or 48x48 as favicon.ico
    fs.writeFileSync(path.join(dir, 'favicon.ico'), png32);

    console.log(`Successfully generated all icons in: ${dir}`);
  });

  console.log('Icon generation complete!');
}

// If run directly via node
if (process.argv[1] && process.argv[1].endsWith('generate-icons.js')) {
  generateAllAppIcons();
}

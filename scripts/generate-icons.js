const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const iconsDir = path.join(__dirname, '../public/icons')

// SVG logo
const svgLogo = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="512" height="512" rx="96" fill="#282A42"/>

  <!-- Outer Hexagon -->
  <path d="M256 80L416 168V344L256 432L96 344V168L256 80Z" stroke="#7367F0" stroke-width="16" fill="none" stroke-linejoin="round"/>

  <!-- Inner Diamond -->
  <path d="M256 176L320 256L256 336L192 256L256 176Z" stroke="#7367F0" stroke-width="12" fill="none" stroke-linejoin="round"/>

  <!-- Center Dot -->
  <circle cx="256" cy="256" r="16" fill="#7367F0"/>
</svg>`

// SVG logo for maskable (with more padding)
const svgLogoMaskable = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background fills entire canvas for maskable -->
  <rect width="512" height="512" fill="#282A42"/>

  <!-- Outer Hexagon - scaled down to 70% for safe zone -->
  <g transform="translate(256,256) scale(0.7) translate(-256,-256)">
    <path d="M256 80L416 168V344L256 432L96 344V168L256 80Z" stroke="#7367F0" stroke-width="16" fill="none" stroke-linejoin="round"/>

    <!-- Inner Diamond -->
    <path d="M256 176L320 256L256 336L192 256L256 176Z" stroke="#7367F0" stroke-width="12" fill="none" stroke-linejoin="round"/>

    <!-- Center Dot -->
    <circle cx="256" cy="256" r="16" fill="#7367F0"/>
  </g>
</svg>`

async function generateIcons() {
  console.log('Generating PWA icons...\n')

  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true })
  }

  // Generate regular icons
  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`)
    await sharp(Buffer.from(svgLogo)).resize(size, size).png().toFile(outputPath)
    console.log(`✓ Generated icon-${size}x${size}.png`)
  }

  // Generate maskable icons (192 and 512)
  for (const size of [192, 512]) {
    const outputPath = path.join(iconsDir, `icon-maskable-${size}x${size}.png`)
    await sharp(Buffer.from(svgLogoMaskable)).resize(size, size).png().toFile(outputPath)
    console.log(`✓ Generated icon-maskable-${size}x${size}.png`)
  }

  // Generate apple-touch-icon
  const appleTouchPath = path.join(iconsDir, 'apple-touch-icon.png')
  await sharp(Buffer.from(svgLogo)).resize(180, 180).png().toFile(appleTouchPath)
  console.log('✓ Generated apple-touch-icon.png')

  // Generate favicon
  const faviconPath = path.join(iconsDir, 'favicon.ico')
  await sharp(Buffer.from(svgLogo)).resize(32, 32).png().toFile(path.join(iconsDir, 'favicon-32x32.png'))
  console.log('✓ Generated favicon-32x32.png')

  await sharp(Buffer.from(svgLogo)).resize(16, 16).png().toFile(path.join(iconsDir, 'favicon-16x16.png'))
  console.log('✓ Generated favicon-16x16.png')

  console.log('\n✅ All icons generated successfully!')
  console.log(`📁 Icons saved to: ${iconsDir}`)
}

generateIcons().catch(console.error)

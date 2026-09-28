// Builds the app icons (home screen, splash, favicon) from one SVG.  node scripts/make-icons.mjs
import sharp from "sharp";
const svg = (pad) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16b36e"/><stop offset="1" stop-color="#0a7f4b"/></linearGradient></defs>
  <rect width="512" height="512" rx="${pad ? 0 : 112}" fill="url(#g)"/>
  <g transform="translate(256 262) scale(${pad ? 0.78 : 1}) translate(-256 -262)">
    <rect x="150" y="128" width="150" height="210" rx="18" fill="#fff" opacity=".35" transform="rotate(-12 225 233)"/>
    <rect x="212" y="150" width="150" height="210" rx="18" fill="#fff" opacity=".6" transform="rotate(8 287 255)"/>
    <text x="256" y="345" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="230" fill="#fff">$</text>
  </g></svg>`);
const out = "public/icons/";
await sharp(svg(false)).resize(192).png().toFile(out + "icon-192.png");
await sharp(svg(false)).resize(512).png().toFile(out + "icon-512.png");
await sharp(svg(true)).resize(512).png().toFile(out + "icon-maskable-512.png");   // safe zone for Android adaptive icons
await sharp(svg(true)).resize(180).png().toFile(out + "apple-touch-icon.png");    // iPhone home screen
await sharp(svg(false)).resize(32).png().toFile(out + "favicon-32.png");
console.log("icons written to", out);

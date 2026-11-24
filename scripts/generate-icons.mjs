import sharp from 'sharp';

function getSvg(size) {
  const sw = Math.round(size * 0.05);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" rx="${Math.round(size * 0.22)}" fill="#020617"/>
    <path d="M${size * 0.5} ${size * 0.18} L${size * 0.8} ${size * 0.3} V${size * 0.55} C${size * 0.8} ${size * 0.75} ${size * 0.5} ${size * 0.86} C${size * 0.5} ${size * 0.86} ${size * 0.2} ${size * 0.75} ${size * 0.2} ${size * 0.55} V${size * 0.3} Z" fill="none" stroke="#10b981" stroke-width="${sw}" stroke-linejoin="round"/>
    <path d="M${size * 0.38} ${size * 0.52} L${size * 0.46} ${size * 0.6} L${size * 0.64} ${size * 0.42}" fill="none" stroke="#10b981" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

async function run() {
  await sharp(Buffer.from(getSvg(192))).png().toFile('public/icon-192.png');
  await sharp(Buffer.from(getSvg(512))).png().toFile('public/icon-512.png');
  console.log('✅ Icons generated: public/icon-192.png and public/icon-512.png');
}

run();

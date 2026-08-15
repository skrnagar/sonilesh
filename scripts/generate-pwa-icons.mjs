/**
 * Generate branded EHS360 PWA icons (navy + safety green) into public/icons/.
 * Pure Node — no image deps.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const OUT_DIR = path.resolve(process.cwd(), "public", "icons");
const NAVY = [7, 31, 45]; // #071f2d
const GREEN = [34, 197, 94]; // safety green accent
const WHITE = [248, 250, 252];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    }
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(size, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    const rowStart = y * stride;
    raw[rowStart] = 0; // filter none
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4;
      const dst = rowStart + 1 + x * 4;
      raw[dst] = rgba[src];
      raw[dst + 1] = rgba[src + 1];
      raw[dst + 2] = rgba[src + 2];
      raw[dst + 3] = rgba[src + 3];
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function setPixel(rgba, size, x, y, rgb, a = 255) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const i = (y * size + x) * 4;
  rgba[i] = rgb[0];
  rgba[i + 1] = rgb[1];
  rgba[i + 2] = rgb[2];
  rgba[i + 3] = a;
}

function fillRect(rgba, size, x0, y0, w, h, rgb) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) setPixel(rgba, size, x, y, rgb);
  }
}

function fillCircle(rgba, size, cx, cy, r, rgb) {
  const r2 = r * r;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r2) setPixel(rgba, size, x, y, rgb);
    }
  }
}

function paintIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  // Background navy
  fillRect(rgba, size, 0, 0, size, size, NAVY);

  // Soft corner vignette via inset safety ring
  const margin = Math.round(size * 0.08);
  const ringR = Math.round(size * 0.42);
  fillCircle(rgba, size, size / 2, size / 2, ringR, [10, 42, 58]);

  // Safety green shield body
  const cx = size / 2;
  const top = Math.round(size * 0.22);
  const midY = Math.round(size * 0.48);
  const bot = Math.round(size * 0.78);
  const halfW = Math.round(size * 0.22);

  for (let y = top; y <= bot; y++) {
    const t = (y - top) / (bot - top);
    let half;
    if (t < 0.45) {
      half = halfW * (0.85 + 0.15 * (t / 0.45));
    } else {
      const u = (t - 0.45) / 0.55;
      half = halfW * (1 - u * 0.95);
    }
    const x0 = Math.round(cx - half);
    const x1 = Math.round(cx + half);
    for (let x = x0; x <= x1; x++) setPixel(rgba, size, x, y, GREEN);
  }

  // White "360" mark — simple bar glyph (readable at small sizes)
  const barW = Math.round(size * 0.28);
  const barH = Math.max(2, Math.round(size * 0.045));
  const barX = Math.round(cx - barW / 2);
  const barY1 = Math.round(midY - size * 0.08);
  const barY2 = Math.round(midY);
  const barY3 = Math.round(midY + size * 0.08);
  fillRect(rgba, size, barX, barY1, barW, barH, WHITE);
  fillRect(rgba, size, barX, barY2, Math.round(barW * 0.72), barH, WHITE);
  fillRect(rgba, size, barX, barY3, barW, barH, WHITE);

  // Outer green accent corners
  const c = Math.max(4, Math.round(size * 0.06));
  fillRect(rgba, size, margin, margin, c * 3, c, GREEN);
  fillRect(rgba, size, margin, margin, c, c * 3, GREEN);
  fillRect(rgba, size, size - margin - c * 3, margin, c * 3, c, GREEN);
  fillRect(rgba, size, size - margin - c, margin, c, c * 3, GREEN);

  return rgba;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const size of [192, 512]) {
  const png = encodePng(size, paintIcon(size));
  const file = path.join(OUT_DIR, `icon-${size}.png`);
  fs.writeFileSync(file, png);
  console.log(`wrote ${file} (${png.length} bytes)`);
}

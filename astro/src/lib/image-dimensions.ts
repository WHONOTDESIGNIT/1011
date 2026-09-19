import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

/**
 * 读取 public 目录下本地图片的原始像素尺寸，供 Article schema 的 ImageObject 声明宽高用。
 * 只处理站内相对路径；远程 URL（如 Pexels）返回 null，调用方退化回纯 URL 的 image。
 *
 * 支持 WebP（VP8 / VP8L / VP8X）、PNG、JPEG。读取失败一律返回 null，绝不让构建失败。
 */
export function localImageSize(publicPath: string | undefined): { width: number; height: number } | null {
  if (!publicPath) return null;
  if (/^https?:\/\//i.test(publicPath) || publicPath.startsWith('//')) return null;
  const file = path.join(process.cwd(), 'public', publicPath.replace(/^\/+/, ''));
  if (!existsSync(file)) return null;

  let buf: Buffer;
  try {
    buf = readFileSync(file);
  } catch {
    return null;
  }
  if (buf.length < 32) return null;

  // ── WebP ──────────────────────────────────────────────────────────────────
  if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') {
    const fourcc = buf.toString('latin1', 12, 16);
    if (fourcc === 'VP8X') return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
    if (fourcc === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    if (fourcc === 'VP8L') {
      const bits = buf.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    return null;
  }

  // ── PNG ───────────────────────────────────────────────────────────────────
  if (buf.readUInt32BE(0) === 0x89504e47) return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };

  // ── JPEG：扫描 SOF 段 ──────────────────────────────────────────────────────
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i += 1; continue; }
      const marker = buf[i + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      const len = buf.readUInt16BE(i + 2);
      // SOF0/1/2/3/5/6/7/9/10/11/13/14/15 都带尺寸
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
    return null;
  }

  return null;
}

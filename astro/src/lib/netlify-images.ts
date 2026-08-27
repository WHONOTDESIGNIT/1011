import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type NetlifyImageFormat = 'avif' | 'webp' | 'jpg' | 'png' | 'gif';
export type NetlifyImageFit = 'contain' | 'cover' | 'fill';
export type NetlifyImagePosition = 'center' | 'top' | 'bottom' | 'left' | 'right';
export type ImageDimensions = { width: number; height: number };

type NetlifyImageOptions = {
  width?: number;
  height?: number;
  format?: NetlifyImageFormat;
  quality?: number;
  fit?: NetlifyImageFit;
  position?: NetlifyImagePosition;
};

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public');
const localImageDimensionCache = new Map<string, ImageDimensions | null>();

function readSvgDimensions(buffer: Buffer) {
  const source = buffer.toString('utf8', 0, Math.min(buffer.length, 4096));
  const widthMatch = source.match(/\bwidth=["']?([\d.]+)(px)?["']?/i);
  const heightMatch = source.match(/\bheight=["']?([\d.]+)(px)?["']?/i);
  if (widthMatch && heightMatch) {
    return {
      width: Math.round(Number(widthMatch[1])),
      height: Math.round(Number(heightMatch[1])),
    };
  }

  const viewBoxMatch = source.match(/\bviewBox=["']?\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)\s*["']?/i);
  if (viewBoxMatch) {
    return {
      width: Math.round(Number(viewBoxMatch[1])),
      height: Math.round(Number(viewBoxMatch[2])),
    };
  }

  return null;
}

function readJpegDimensions(buffer: Buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }

    const length = buffer.readUInt16BE(offset + 2);
    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isStartOfFrame) {
      return {
        width: buffer.readUInt16BE(offset + 7),
        height: buffer.readUInt16BE(offset + 5),
      };
    }

    offset += 2 + length;
  }

  return null;
}

function readWebpDimensions(buffer: Buffer) {
  const chunkType = buffer.toString('ascii', 12, 16);
  if (chunkType === 'VP8X' && buffer.length >= 30) {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }

  if (chunkType === 'VP8L' && buffer.length >= 25) {
    const b0 = buffer[21];
    const b1 = buffer[22];
    const b2 = buffer[23];
    const b3 = buffer[24];
    return {
      width: 1 + (((b1 & 0x3f) << 8) | b0),
      height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
    };
  }

  if (chunkType === 'VP8 ' && buffer.length >= 30) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }

  return null;
}

function detectImageDimensions(buffer: Buffer, source: string) {
  if (buffer.length >= 24 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  if (buffer.length >= 10 && (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a')) {
    return {
      width: buffer.readUInt16LE(6),
      height: buffer.readUInt16LE(8),
    };
  }

  if (buffer.length >= 30 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return readWebpDimensions(buffer);
  }

  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return readJpegDimensions(buffer);
  }

  if (source.toLowerCase().endsWith('.svg')) {
    return readSvgDimensions(buffer);
  }

  return null;
}

export function getLocalImageDimensions(source: string) {
  if (!source.startsWith('/')) return null;

  const cleanSource = decodeURIComponent(source.split('?')[0]);
  if (localImageDimensionCache.has(cleanSource)) {
    return localImageDimensionCache.get(cleanSource) ?? null;
  }

  const fullPath = path.join(publicDir, cleanSource.replace(/^\//, '').replace(/\//g, path.sep));
  if (!fs.existsSync(fullPath)) {
    localImageDimensionCache.set(cleanSource, null);
    return null;
  }

  const dimensions = detectImageDimensions(fs.readFileSync(fullPath), cleanSource);
  localImageDimensionCache.set(cleanSource, dimensions);
  return dimensions;
}

export function netlifyImageUrl(source: string, options: NetlifyImageOptions = {}) {
  const params = new URLSearchParams({
    url: source,
  });

  if (options.width) {
    params.set('w', String(options.width));
  }

  if (options.height) {
    params.set('h', String(options.height));
  }

  if (options.format) {
    params.set('fm', options.format);
  }

  if (options.quality) {
    params.set('q', String(options.quality));
  }

  if (options.fit) {
    params.set('fit', options.fit);
  }

  if (options.position) {
    params.set('position', options.position);
  }

  return `/.netlify/images?${params.toString()}`;
}

export function buildSrcSet(
  source: string,
  widths: number[],
  format: Exclude<NetlifyImageFormat, 'gif'>,
  quality = 80,
) {
  return widths
    .map((width) => `${netlifyImageUrl(source, { width, format, quality })} ${width}w`)
    .join(', ');
}

export function responsiveImageSources(source: string, widths = [400, 800, 1200], defaultWidth = 800, quality = 80) {
  return {
    src: netlifyImageUrl(source, { width: defaultWidth, format: 'webp', quality }),
    webpSrcSet: buildSrcSet(source, widths, 'webp', quality),
    avifSrcSet: buildSrcSet(source, widths, 'avif', quality),
  };
}

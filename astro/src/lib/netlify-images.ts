export type NetlifyImageFormat = 'avif' | 'webp' | 'jpg' | 'png' | 'gif';
export type NetlifyImageFit = 'contain' | 'cover' | 'fill';
export type NetlifyImagePosition = 'center' | 'top' | 'bottom' | 'left' | 'right';

type NetlifyImageOptions = {
  width?: number;
  height?: number;
  format?: NetlifyImageFormat;
  quality?: number;
  fit?: NetlifyImageFit;
  position?: NetlifyImagePosition;
};

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

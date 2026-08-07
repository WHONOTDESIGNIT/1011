import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'docs', 'research');

mkdirSync(join(outDir, 'components'), { recursive: true });
mkdirSync(join(__dirname, '..', 'docs', 'design-references'), { recursive: true });

const URL = 'https://www.develodesign.co.uk/blog';
const VIEWPORT = { width: 1440, height: 900 };

const CSS_PROPS = [
  'fontSize','fontWeight','fontFamily','lineHeight','letterSpacing','color',
  'textTransform','textDecoration','backgroundColor','background','backgroundImage',
  'padding','paddingTop','paddingRight','paddingBottom','paddingLeft',
  'margin','marginTop','marginRight','marginBottom','marginLeft',
  'width','height','maxWidth','minWidth','maxHeight','minHeight',
  'display','flexDirection','justifyContent','alignItems','gap',
  'gridTemplateColumns','gridTemplateRows',
  'borderRadius','border','borderTop','borderBottom','borderLeft','borderRight','borderWidth',
  'boxShadow','overflow','overflowX','overflowY',
  'position','top','right','bottom','left','zIndex',
  'opacity','transform','transition','cursor',
  'objectFit','objectPosition','mixBlendMode','filter','backdropFilter',
  'whiteSpace','textOverflow',
];

function extractStyles(cs) {
  const styles = {};
  for (const p of CSS_PROPS) {
    let v = cs[p];
    if (v === 'none' || v === 'normal' || v === 'auto' || v === '0px' || v === 'rgba(0, 0, 0, 0)' || v === 'transparent') continue;
    if (p === 'position' && v === 'static') continue;
    if (p === 'display' && v === 'block') continue;
    if (p === 'opacity' && v === '1') continue;
    if (p === 'flexDirection' && v === 'row') continue;
    styles[p] = v;
  }
  return styles;
}

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize(VIEWPORT);
  
  console.log('Navigating to', URL);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  // Take full-page screenshot
  console.log('Taking screenshot...');
  await page.screenshot({ 
    path: join(__dirname, '..', 'docs', 'design-references', 'blog-original-full.png'),
    fullPage: true 
  });

  // Extract global info
  const global = await page.evaluate(() => {
    const bodyCS = getComputedStyle(document.body);
    const banner = document.querySelector('[class*=banner], [class*=hero], [class*=page-header], .page-title, [class*=blog-header]');
    const bannerCS = banner ? getComputedStyle(banner) : null;
    const bannerText = banner ? banner.textContent.trim().slice(0, 500) : '';
    
    // Get all blog cards
    const cards = [...document.querySelectorAll('[class*=card], [class*=post], [class*=article], [class*=blog-item], article')]
      .filter(el => el.offsetHeight > 100);
    
    // Get sidebar
    const sidebar = document.querySelector('[class*=sidebar], [class*=aside], aside');
    
    // Get pagination
    const pagination = document.querySelector('[class*=pagination], [class*=pager], nav[aria-label*="page"]');
    
    return {
      bodyFontFamily: bodyCS.fontFamily,
      bodyColor: bodyCS.color,
      banner: banner ? {
        classes: banner.className,
        tag: banner.tagName,
        styles: ((cs) => ({
          padding: cs.padding,
          background: cs.background,
          backgroundImage: cs.backgroundImage,
          textAlign: cs.textAlign,
          height: cs.height,
          minHeight: cs.minHeight,
          display: cs.display,
          flexDirection: cs.flexDirection,
          alignItems: cs.alignItems,
          justifyContent: cs.justifyContent,
        }))(bannerCS),
        html: banner.innerHTML.substring(0, 400),
        text: bannerText,
      } : null,
      cardCount: cards.length,
      firstCards: cards.slice(0, 5).map(card => {
        const cs = getComputedStyle(card);
        const title = card.querySelector('h1,h2,h3,h4,[class*=title]');
        const img = card.querySelector('img');
        const desc = card.querySelector('[class*=desc], [class*=excerpt], p');
        const tags = card.querySelectorAll('[class*=tag], [class*=category], [class*=label]');
        const author = card.querySelector('[class*=author]');
        const date = card.querySelector('[class*=date], time');
        return {
          classes: card.className,
          tag: card.tagName,
          styles: {
            display: cs.display,
            flexDirection: cs.flexDirection,
            padding: cs.padding,
            borderRadius: cs.borderRadius,
            background: cs.backgroundColor,
            gap: cs.gap,
            width: cs.width,
            boxShadow: cs.boxShadow,
          },
          title: title ? {
            text: title.textContent.trim().slice(0, 100),
            tag: title.tagName,
            fs: getComputedStyle(title).fontSize,
            fw: getComputedStyle(title).fontWeight,
            ff: getComputedStyle(title).fontFamily,
            lh: getComputedStyle(title).lineHeight,
            color: getComputedStyle(title).color,
          } : null,
          img: img ? { src: img.src || img.currentSrc, alt: img.alt, w: img.naturalWidth, h: img.naturalHeight } : null,
          descText: desc ? desc.textContent.trim().slice(0, 200) : null,
          tags: [...tags].map(t => t.textContent.trim()),
          authorText: author ? author.textContent.trim() : null,
          dateText: date ? date.textContent.trim() : null,
        };
      }),
      sidebar: sidebar ? {
        classes: sidebar.className,
        width: getComputedStyle(sidebar).width,
        html: sidebar.innerHTML.substring(0, 500),
      } : null,
      pagination: pagination ? {
        classes: pagination.className,
        html: pagination.innerHTML.substring(0, 300),
        text: pagination.textContent.trim().slice(0, 200),
      } : null,
      // Get headings
      headings: [...document.querySelectorAll('h1,h2,h3')].slice(0, 10).map(h => ({
        tag: h.tagName,
        text: h.textContent.trim().slice(0, 100),
        styles: {
          fs: getComputedStyle(h).fontSize,
          fw: getComputedStyle(h).fontWeight,
          ff: getComputedStyle(h).fontFamily,
          lh: getComputedStyle(h).lineHeight,
          color: getComputedStyle(h).color,
          ls: getComputedStyle(h).letterSpacing,
        }
      })),
    };
  });

  // Get page structure
  const structure = await page.evaluate(() => {
    const result = [];
    // Find main content area
    const main = document.querySelector('main, [class*=main], [class*=content]');
    if (main) {
      result.push({ type: 'main', classes: main.className, styles: extractStylesLocal(getComputedStyle(main)) });
    }
    
    // Blog list container
    const list = document.querySelector('[class*=list], [class*=grid], [class*=posts]');
    if (list) {
      result.push({ type: 'list_container', classes: list.className, tag: list.tagName, styles: extractStylesLocal(getComputedStyle(list)) });
    }
    
    function extractStylesLocal(cs) {
      const s = {};
      const props = ['display','flexDirection','gap','padding','maxWidth','width','gridTemplateColumns','background','alignItems','justifyContent'];
      for (const p of props) {
        let v = cs[p];
        if (v && v !== 'none' && v !== 'normal' && v !== 'auto' && v !== '0px' && v !== 'rgba(0, 0, 0, 0)') s[p] = v;
      }
      return s;
    }
    
    return result;
  });

  // Extract all images
  const images = await page.evaluate(() => {
    return [...document.querySelectorAll('img')].slice(0, 30).map(img => ({
      src: img.src || img.currentSrc,
      alt: img.alt,
      w: img.naturalWidth,
      h: img.naturalHeight,
      cls: img.className?.split(' ')[0],
    }));
  });

  // Get all blog post links
  const links = await page.evaluate(() => {
    return [...document.querySelectorAll('a[href*="/resources/"], a[href*="/blog/"], a[href*="/insights/"], a[href*="/news/"]')]
      .slice(0, 20)
      .map(a => ({ href: a.href, text: a.textContent.trim().slice(0, 80) }));
  });

  const output = {
    url: URL,
    viewport: VIEWPORT,
    timestamp: new Date().toISOString(),
    global,
    structure,
    images,
    links,
  };

  writeFileSync(join(outDir, 'blog-extracted.json'), JSON.stringify(output, null, 2));
  console.log('Extracted data saved to docs/research/blog-extracted.json');
  console.log('Cards found:', global.cardCount);
  console.log('Images found:', images.length);
  console.log('Links found:', links.length);

  await browser.close();
  console.log('Done.');
})();

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'docs', 'research');

mkdirSync(join(outDir, 'components'), { recursive: true });
mkdirSync(join(__dirname, '..', 'docs', 'design-references'), { recursive: true });

const URL = 'https://www.develodesign.co.uk/';
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
    // Skip default values
    if (p === 'position' && v === 'static') continue;
    if (p === 'display' && v === 'block') continue;
    if (p === 'opacity' && v === '1') continue;
    if (p === 'flexDirection' && v === 'row') continue;
    styles[p] = v;
  }
  return styles;
}

function walkTree(el, depth = 0) {
  if (depth > 5) return null;
  const cs = getComputedStyle(el);
  const children = [...el.children];
  const result = {
    tag: el.tagName.toLowerCase(),
    id: el.id || undefined,
    classes: el.className?.toString().split(' ').filter(Boolean).slice(0, 6).join(' ') || undefined,
    styles: extractStyles(cs),
    children: children.slice(0, 30).map(c => walkTree(c, depth + 1)).filter(Boolean),
    text: el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 ? el.textContent.trim().slice(0, 200) || undefined : undefined,
  };
  if (el.tagName === 'IMG' || el.tagName === 'VIDEO' || el.tagName === 'SOURCE') {
    result.src = el.src || el.currentSrc || '';
    result.alt = el.alt || '';
    result.naturalWidth = el.naturalWidth;
    result.naturalHeight = el.naturalHeight;
  }
  // Remove empty
  if (!result.id) delete result.id;
  if (!result.classes) delete result.classes;
  if (!result.text) delete result.text;
  if (!result.src) delete result.src;
  return result;
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
    path: join(__dirname, '..', 'docs', 'design-references', 'original-full.png'),
    fullPage: true 
  });

  // Extract all section selectors
  const sections = await page.evaluate(() => {
    const result = [];
    // Get all major sections
    const selectors = [
      '.trust-bar', '.site-header', '.hero-section', '.usp-accordion-bleed',
      '.our-clients-section', '.stat-cards-section', '.hero-content-logos',
      '.our-work-section', '.testimonial-carousel-section', '.footer'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        result.push({
          selector: sel,
          tag: el.tagName,
          text: el.textContent.trim().slice(0, 100),
          offsetTop: el.offsetTop,
          offsetHeight: el.offsetHeight,
        });
      }
    }
    // Also try common section tags
    document.querySelectorAll('section, footer, header, [class*=section]').forEach(el => {
      if (el.offsetHeight > 60 && !result.find(r => r.selector === '.' + el.className?.split(' ')[0])) {
        const cls = el.className?.split(' ')[0];
        if (cls) result.push({
          selector: '.' + cls,
          tag: el.tagName,
          text: el.textContent.trim().slice(0, 100),
          offsetTop: el.offsetTop,
          offsetHeight: el.offsetHeight,
        });
      }
    });
    return result;
  });

  console.log('Found sections:', sections.map(s => s.selector));

  // Extract tree for each section
  const extracted = {};
  
  const extractFn = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    const result = {
      selector: sel,
      tag: el.tagName.toLowerCase(),
      offsetTop: el.offsetTop,
      offsetHeight: el.offsetHeight,
      sectionStyles: extractStyles(cs),
      innerHTML: el.innerHTML.substring(0, 300),
      children: [...el.children].slice(0, 10).map(child => {
        const childCS = getComputedStyle(child);
        return {
          tag: child.tagName.toLowerCase(),
          classes: child.className?.toString().split(' ').filter(Boolean).slice(0, 6).join(' '),
          styles: extractStyles(childCS),
        };
      }),
    };
    return result;
  };

  // Extract each section
  for (const section of sections) {
    console.log('Extracting:', section.selector);
    const data = await page.evaluate(({ sel, extractStylesFn }) => {
      const props = ['fontSize','fontWeight','fontFamily','lineHeight','letterSpacing','color','textTransform','textDecoration','backgroundColor','background','backgroundImage','padding','paddingTop','paddingRight','paddingBottom','paddingLeft','margin','marginTop','marginRight','marginBottom','marginLeft','width','height','maxWidth','minWidth','maxHeight','minHeight','display','flexDirection','justifyContent','alignItems','gap','gridTemplateColumns','gridTemplateRows','borderRadius','border','borderTop','borderBottom','borderLeft','borderRight','borderWidth','boxShadow','overflow','overflowX','overflowY','position','top','right','bottom','left','zIndex','opacity','transform','transition','cursor','objectFit','objectPosition','mixBlendMode','filter','backdropFilter','whiteSpace','textOverflow'];
      function extractStyles(cs) {
        const s = {};
        for (const p of props) {
          let v = cs[p];
          if (v === 'none' || v === 'normal' || v === 'auto' || v === '0px' || v === 'rgba(0, 0, 0, 0)' || v === 'transparent') continue;
          if (p === 'position' && v === 'static') continue;
          if (p === 'display' && v === 'block') continue;
          if (p === 'opacity' && v === '1') continue;
          if (p === 'flexDirection' && v === 'row') continue;
          s[p] = v;
        }
        return s;
      }
      
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const children = [...el.children];
      return {
        selector: sel,
        tag: el.tagName.toLowerCase(),
        offsetTop: el.offsetTop,
        offsetHeight: el.offsetHeight,
        sectionStyles: extractStyles(cs),
        innerHTML: el.innerHTML.substring(0, 500),
        childCount: children.length,
        children: children.slice(0, 15).map(child => ({
          tag: child.tagName.toLowerCase(),
          classes: child.className?.toString().split(' ').filter(Boolean).slice(0, 5).join(' ') || undefined,
          styles: extractStyles(getComputedStyle(child)),
        })),
      };
    }, { sel: section.selector, extractStylesFn: extractStyles.toString() });
    
    if (data) extracted[section.selector] = data;
  }

  // Also extract global info
  const global = await page.evaluate(() => {
    const links = [...document.querySelectorAll('link[rel*="font"], link[href*="font"]')].map(l => l.href);
    const styles = [...document.querySelectorAll('style')].map(s => s.textContent.slice(0, 500));
    const bodyCS = getComputedStyle(document.body);
    return {
      fonts: links,
      bodyFontFamily: bodyCS.fontFamily,
      bodyColor: bodyCS.color,
      bodyBackground: bodyCS.backgroundColor,
      inlineStyles: styles.filter(Boolean),
      meta: [...document.querySelectorAll('meta[name], meta[property]')].map(m => ({ 
        name: m.name || m.getAttribute('property'), 
        content: m.content 
      })),
    };
  });

  // Get all images
  const images = await page.evaluate(() => {
    return [...document.querySelectorAll('img')].map(img => ({
      src: img.src || img.currentSrc,
      alt: img.alt,
      width: img.naturalWidth,
      height: img.naturalHeight,
      parentClass: img.parentElement?.className?.split(' ')[0],
    }));
  });

  // Get all SVG icons
  const svgs = await page.evaluate(() => {
    return [...document.querySelectorAll('svg')].slice(0, 50).map(svg => ({
      className: svg.className?.baseVal || svg.getAttribute('class'),
      width: svg.getAttribute('width'),
      height: svg.getAttribute('height'),
      viewBox: svg.getAttribute('viewBox'),
      innerHTML: svg.innerHTML?.substring(0, 300),
    }));
  });

  // Extract heading styles
  const headings = await page.evaluate(() => {
    return [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => ({
      tag: h.tagName,
      text: h.textContent.trim().slice(0, 100),
      styles: ((cs) => ({
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        fontFamily: cs.fontFamily,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        color: cs.color,
      }))(getComputedStyle(h)),
    }));
  });

  // Save everything
  const output = {
    url: URL,
    viewport: VIEWPORT,
    timestamp: new Date().toISOString(),
    global,
    sections: extracted,
    headings,
    images: images.slice(0, 50),
    svgs: svgs.slice(0, 30),
  };

  writeFileSync(join(outDir, 'extracted-css.json'), JSON.stringify(output, null, 2));
  console.log('Extracted data saved to docs/research/extracted-css.json');
  console.log('Sections extracted:', Object.keys(extracted).length);
  console.log('Images found:', images.length);
  console.log('Headings found:', headings.length);

  await browser.close();
  console.log('Done.');
})();

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('https://www.develodesign.co.uk/blog', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  const data = await page.evaluate(() => {
    const props = ['fontSize','fontWeight','fontFamily','lineHeight','letterSpacing','color','textTransform','textDecoration','backgroundColor','background','padding','paddingTop','paddingRight','paddingBottom','paddingLeft','margin','marginTop','marginRight','marginBottom','marginLeft','width','height','maxWidth','minWidth','maxHeight','minHeight','display','flexDirection','justifyContent','alignItems','gap','gridTemplateColumns','gridTemplateRows','borderRadius','border','borderBottom','borderTop','borderLeft','borderRight','boxShadow','overflow','position','top','right','bottom','left','zIndex','opacity','transform','transition','cursor','objectFit','filter','whiteSpace','textOverflow'];
    function cs(el, props) { const s = {}; const c = getComputedStyle(el); props.forEach(p => { let v = c[p]; if (v && v !== 'none' && v !== 'normal' && v !== 'auto' && v !== '0px' && v !== 'rgba(0, 0, 0, 0)' && v !== 'transparent' && !(p==='position'&&v==='static') && !(p==='display'&&v==='block')) s[p]=v; }); return s; }

    // Hero header
    const heroSection = document.querySelector('.hero-section');
    const heroHeader = heroSection?.querySelector('.hero-header');
    const heroLabel = heroSection?.querySelector('.hero-label-wrapper');
    const heroLabelText = heroLabel?.querySelector('[class*=label-text], [class*=label], span');
    const heroH1 = heroSection?.querySelector('h1');
    const heroDesc = heroSection?.querySelector('[class*=description], [class*=desc], p');

    // Latest articles section
    const latestSection = document.querySelector('.latest-section, [class*=latest-section], [class*=blog-posts]');
    const latestHeader = latestSection?.querySelector('h2, [class*=heading]');
    const latestList = document.querySelector('.latest-list');
    const latestItems = latestList?.querySelectorAll('[class*=item], [class*=post-item], [class*=blog-item], a[href*="/resources/"], a[href*="/blog/"]');
    const firstLatestItems = latestItems ? [...latestItems].slice(0, 6).map(item => ({
      tag: item.tagName,
      classes: item.className,
      styles: cs(item, ['display','flexDirection','gap','padding','borderBottom','width','alignItems','textDecoration']),
      innerHTML: item.innerHTML.substring(0, 400),
      category: item.querySelector('[class*=category], [class*=tag]')?.textContent?.trim(),
      title: item.querySelector('h3, h2, [class*=title]')?.textContent?.trim()?.slice(0, 100),
      link: item.href || item.querySelector('a')?.href,
      img: item.querySelector('img')?.src,
      author: item.querySelector('[class*=author], [class*=by]')?.textContent?.trim(),
      date: item.querySelector('[class*=date], time')?.textContent?.trim(),
    })) : [];

    // Featured article
    const featuredArticle = document.querySelector('.featured-article, [class*=featured], [class*=hero-post], [class*=main-article]');

    // Browse all section
    const browseSection = document.querySelector('[class*=browse-all], [class*=all-posts]');
    const browseGrid = document.querySelector('[class*=articles-grid], [class*=browse-grid]');

    // Pagination
    const paginationContainer = document.querySelector('.pagination-container');
    const paginationButtons = paginationContainer?.querySelectorAll('button, a, [class*=page]');

    return {
      heroSection: heroSection ? cs(heroSection, props) : null,
      heroHeader: heroHeader ? {
        styles: cs(heroHeader, props),
        innerHTML: heroHeader.innerHTML.substring(0, 600),
      } : null,
      heroLabel: heroLabel ? {
        styles: cs(heroLabel, ['display','alignItems','gap','padding','marginBottom']),
        text: heroLabelText?.textContent?.trim(),
      } : null,
      h1: heroH1 ? {
        text: heroH1.textContent.trim(),
        styles: cs(heroH1, ['fontSize','fontWeight','fontFamily','lineHeight','letterSpacing','color']),
      } : null,
      heroDesc: heroDesc ? {
        text: heroDesc.textContent.trim(),
        styles: cs(heroDesc, ['fontSize','fontWeight','fontFamily','lineHeight','color','maxWidth']),
      } : null,

      latestList: latestList ? {
        styles: cs(latestList, props),
        gap: getComputedStyle(latestList).gap,
      } : null,
      latestHeader: latestHeader ? {
        text: latestHeader.textContent.trim(),
        styles: cs(latestHeader, ['fontSize','fontWeight','fontFamily','lineHeight','color']),
      } : null,
      latestItems: firstLatestItems,

      featuredArticle: featuredArticle ? {
        classes: featuredArticle.className,
        styles: cs(featuredArticle, props),
        innerHTML: featuredArticle.innerHTML.substring(0, 600),
      } : null,

      browseGrid: browseGrid ? {
        styles: cs(browseGrid, props),
      } : null,

      paginationContainer: paginationContainer ? {
        styles: cs(paginationContainer, props),
      } : null,
      paginationButtons: paginationButtons ? [...paginationButtons].map(b => ({
        text: b.textContent.trim(),
        disabled: b.disabled,
        styles: cs(b, ['padding','borderRadius','background','color','fontSize','fontFamily','border','cursor','width','height','display','alignItems','justifyContent','gap','minWidth']),
      })) : [],
    };
  });

  writeFileSync('docs/research/blog-deep.json', JSON.stringify(data, null, 2));
  console.log(JSON.stringify(data, null, 2));
  
  await browser.close();
})();

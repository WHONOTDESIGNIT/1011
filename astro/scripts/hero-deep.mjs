import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('https://www.develodesign.co.uk/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  // Deep extract hero structure
  const hero = await page.evaluate(() => {
    const section = document.querySelector('.hero-section');
    const wrapper = section.querySelector('.hero-wrapper');
    const card = wrapper.querySelector('.hero-content-card');
    const content = card.querySelector('[class*=content]');
    
    // Get all children of hero-content-card
    const cardChildren = [...card.children].map(c => ({
      tag: c.tagName,
      classes: c.className,
      computed: ((cs) => ({
        position: cs.position,
        zIndex: cs.zIndex,
        padding: cs.padding,
        width: cs.width,
        height: cs.height,
      }))(getComputedStyle(c)),
    }));

    // Get heading details
    const h1 = card.querySelector('h1');
    const h2 = card.querySelector('h2');
    
    return {
      hero: {
        padding: getComputedStyle(section).padding,
        width: getComputedStyle(section).width,
      },
      wrapper: {
        display: getComputedStyle(wrapper).display,
        flexDirection: getComputedStyle(wrapper).flexDirection,
        gap: getComputedStyle(wrapper).gap,
        maxWidth: getComputedStyle(wrapper).maxWidth,
        alignItems: getComputedStyle(wrapper).alignItems,
      },
      card: {
        width: getComputedStyle(card).width,
        maxWidth: getComputedStyle(card).maxWidth,
        marginTop: getComputedStyle(card).marginTop,
        position: getComputedStyle(card).position,
      },
      content: content ? {
        padding: getComputedStyle(content).padding,
      } : null,
      cardChildren,
      h1: h1 ? {
        text: h1.textContent.trim(),
        fontSize: getComputedStyle(h1).fontSize,
        fontWeight: getComputedStyle(h1).fontWeight,
        fontFamily: getComputedStyle(h1).fontFamily,
        color: getComputedStyle(h1).color,
        lineHeight: getComputedStyle(h1).lineHeight,
      } : null,
      h2: h2 ? {
        text: h2.textContent.trim(),
        fontSize: getComputedStyle(h2).fontSize,
        fontWeight: getComputedStyle(h2).fontWeight,
        fontFamily: getComputedStyle(h2).fontFamily,
        lineHeight: getComputedStyle(h2).lineHeight,
        letterSpacing: getComputedStyle(h2).letterSpacing,
        color: getComputedStyle(h2).color,
      } : null,
      innerHTML: card.innerHTML.substring(0, 800),
    };
  });

  writeFileSync('docs/research/hero-deep.json', JSON.stringify(hero, null, 2));
  console.log(JSON.stringify(hero, null, 2));
  
  await browser.close();
})();

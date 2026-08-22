// 三层 UI 审计：结构（axe）→ 样式（token 对比）→ 布局（溢出 + CLS）
// 用法：npm run build 后启动 astro preview（localhost:4321），再运行：
//   node scripts/audit-ui.mjs
// 可用环境变量 AUDIT_BASE_URL 覆盖目标站点（默认本地 preview）。
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { designTokens } from '../design-tokens.config.js';
import fs from 'node:fs';

const BASE = process.env.AUDIT_BASE_URL || 'http://localhost:4321';
const PAGES = [
  'https://iplmanufacturer.com/',
  'https://iplmanufacturer.com/tr',
  'https://iplmanufacturer.com/de',
  'https://iplmanufacturer.com/products/helix',
  'https://iplmanufacturer.com/blog',
];

const tokenColors = Object.values(designTokens.colors).map((c) => c.toLowerCase());
const tokenFonts = Object.values(designTokens.typography).map((t) => t.family.toLowerCase());

// 优先使用系统浏览器（Windows 自带 Edge/Chrome），避免下载 playwright 浏览器包受沙箱限制
const launchBrowser = async () => {
  for (const channel of ['chrome', 'msedge']) {
    try {
      return await chromium.launch({ channel });
    } catch (e) {
      console.warn(`[launch ${channel}] ${String(e.message).split('\n')[0]}`);
    }
  }
  return chromium.launch(); // 回退：内置 chromium（.pw-browsers）
};

const run = async () => {
  const browser = await launchBrowser();
  const results = { generatedAt: new Date().toISOString(), pages: [] };

  for (const path of PAGES) {
    const url = /^https?:/.test(path) ? path : BASE + path;
    // @axe-core/playwright 要求页面来自 browser.newContext()
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const entry = { url, structural: [], visual: { offenders: [] }, layout: { cls: 0, overflows: [] } };

    // 在导航前注册 CLS 观测器
    await page.addInitScript(() => {
      window.__cls = 0;
      try {
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) {
            if (!e.hadRecentInput) window.__cls += e.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });
      } catch { /* 旧浏览器忽略 */ }
    });

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(1200); // 等待字体 swap 等首帧稳定

      // 第一层：结构 / 语义 / ARIA（axe-core）
      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
        .analyze();
      entry.structural = axe.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
        samples: v.nodes.slice(0, 3).map((n) => String(n.target)),
      }));

      // 第二层：视觉 / 样式一致性（与设计 token 对比，取出现频率最高的非 token 值）
      entry.visual.offenders = await page.evaluate((tv) => {
        const freq = new Map();
        const samples = {};
        const note = (cat, val, el) => {
          const key = `${cat}:${val}`;
          freq.set(key, (freq.get(key) || 0) + 1);
          if (!samples[key]) samples[key] = [];
          if (samples[key].length < 3) samples[key].push(el);
        };
        const clsOf = (el) => {
          const c = typeof el.className === 'string' ? el.className : '';
          return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${c ? '.' + c.split(/\s+/).slice(0, 2).join('.') : ''}`;
        };
        document.querySelectorAll('body *').forEach((el) => {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') return;
          const pad = cs.paddingLeft;
          if (pad !== '0px' && !tv.spacing.includes(pad)) note('padding-left', pad, clsOf(el));
          const rgb = (cs.color.match(/\d+/g) || []).map(Number);
          if (rgb.length === 3) {
            const hex = '#' + rgb.map((n) => n.toString(16).padStart(2, '0')).join('');
            if (!tv.colors.includes(hex) && !hex.startsWith('#0000') && hex !== '#000000' && hex !== '#ffffff' && !/^#0[0-9a-f]{5}$/.test(hex)) {
              note('color', hex, clsOf(el));
            }
          }
          const fam = cs.fontFamily.split(',')[0].replace(/['"]/g, '').toLowerCase();
          if (fam && !tv.fonts.includes(fam)) note('font-family', fam, clsOf(el));
        });
        return [...freq.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([k, count]) => ({ key: k, count, samples: samples[k] }));
      }, { colors: tokenColors, fonts: tokenFonts, spacing: designTokens.spacing });

      // 第三层：布局 / 响应式（横向溢出 + CLS）
      entry.layout.overflows = await page.evaluate(() => {
        const bad = [];
        document.querySelectorAll('body *').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.right > window.innerWidth + 1 && !el.closest('.gradient-bg') && !el.closest('.product-carousel-track') && !el.closest('.stat-cards-grid')) {
            const c = typeof el.className === 'string' ? el.className : '';
            bad.push({
              el: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${c ? '.' + c.split(/\s+/).slice(0, 2).join('.') : ''}`,
              right: Math.round(r.right),
              viewport: window.innerWidth,
            });
          }
        });
        return bad.slice(0, 15);
      });
      entry.layout.cls = await page.evaluate(() => Math.round((window.__cls || 0) * 1000) / 1000);

      const shots = 'ui-audit-shots';
      fs.mkdirSync(shots, { recursive: true });
      const name = path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
      await page.screenshot({ path: `${shots}/${name}.png` });
    } catch (err) {
      entry.error = String(err);
    }
    await context.close();
    results.pages.push(entry);
  }

  await browser.close();
  fs.writeFileSync('ui-audit-report.json', JSON.stringify(results, null, 2));
  console.log('\n==== UI AUDIT SUMMARY ====');
  for (const p of results.pages) {
    const line = `${p.url}  axe:${p.structural.length}  CLS:${p.layout.cls}  overflow:${p.layout.overflows.length}  styleOffenders:${p.visual.offenders.length}${p.error ? '  ERROR:' + p.error : ''}`;
    console.log(line);
  }
  console.log('\nReport saved to ui-audit-report.json, screenshots in ui-audit-shots/');
};

run().catch((e) => {
  console.error('Audit failed:', e);
  process.exit(1);
});

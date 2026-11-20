// Asserts the hero video autoplay policy. Runs against the built page, not a copy.
//
// Policy (2026-11-19): the video must not be an LCP/bandwidth cost, but it must
// actually play. Two things changed and this guard encodes them:
//   1. Missing Network Information API (Safari/Firefox) is NOT treated as a slow
//      network any more - those browsers autoplay too, otherwise the hero looked
//      like a broken poster on Safari.
//   2. When autoplay is refused (saveData, 2G, prefers-reduced-motion) the page
//      must expose a visible play button, so the poster is never a dead end.
import fs from 'node:fs';
import vm from 'node:vm';

const page = new URL('../dist/index.html', import.meta.url);
if (!fs.existsSync(page)) {
  console.error('❌ hero-video-autoplay: dist/index.html missing (run the build first)');
  process.exit(1);
}

const html = fs.readFileSync(page, 'utf8');
const inline = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const code = inline.find((s) => s.includes('navigator.connection'));
if (!code) {
  console.error('❌ hero-video-autoplay: the hero video script is not in the built page');
  process.exit(1);
}

function run({ connection, reducedMotion = false }) {
  let played = false;
  const video = {
    preload: '',
    muted: false,
    paused: true,
    play() {
      played = true;
      return Promise.resolve();
    },
    pause() {},
    addEventListener() {},
  };
  // 与真实标记一致：按钮初始 hidden，只有自动播放被拒时才显示
  const btn = { hidden: true, addEventListener() {} };
  const wrap = { querySelector: (s) => (s.includes('toggle') ? btn : video) };
  const sandbox = {
    navigator: connection === undefined ? {} : { connection },
    matchMedia: () => ({ matches: reducedMotion }),
    document: {
      querySelector: (s) => {
        if (s.includes('video-placeholder')) return wrap;
        if (s.includes('toggle')) return btn;
        return video;
      },
      readyState: 'complete',
      addEventListener() {},
    },
    requestIdleCallback: (cb) => cb(),
    setTimeout: (cb) => cb(), // 立即触发 6s 兜底，确保兜底路径也走同一套判断
    addEventListener() {},
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { timeout: 5000 });
  return { played, buttonVisible: btn.hidden === false, preload: video.preload, muted: video.muted };
}

const noApi = run({ connection: undefined });
const fast = run({ connection: { effectiveType: '4g', saveData: false } });
const saveData = run({ connection: { effectiveType: '4g', saveData: true } });
const slow = run({ connection: { effectiveType: '2g', saveData: false } });
const reduced = run({ connection: { effectiveType: '4g', saveData: false }, reducedMotion: true });

const failures = [];
if (fast.played !== true) failures.push('fast 4G: should autoplay');
if (fast.preload !== 'auto') failures.push('fast 4G: preload should switch to auto');
if (fast.muted !== true) failures.push('fast 4G: must be muted before play()');
if (noApi.played !== true) failures.push('no connection API (Safari/Firefox): should autoplay');
if (saveData.played !== false) failures.push('saveData: must not autoplay');
if (saveData.buttonVisible !== true) failures.push('saveData: play button must be visible');
if (slow.played !== false) failures.push('2G: must not autoplay');
if (slow.buttonVisible !== true) failures.push('2G: play button must be visible');
if (reduced.played !== false) failures.push('reduced motion: must not autoplay');
if (reduced.buttonVisible !== true) failures.push('reduced motion: play button must be visible');

if (failures.length) {
  console.error('❌ hero-video-autoplay: ' + failures.join('; '));
  process.exit(1);
}
console.log(
  '✅ hero-video-autoplay: autoplay on 4G and unknown networks; saveData/2G/reduced-motion fall back to a visible play button'
);

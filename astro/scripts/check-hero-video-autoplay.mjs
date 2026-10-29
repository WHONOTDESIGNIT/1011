// Asserts the hero video autoplay guard. Runs against the built page, not a copy.
// The guarded branch cannot be entered in Chromium, so no browser-based tool can
// observe it; this is the only executable evidence that the guard works.
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

function run(withConnection) {
  let played = false;
  const video = { preload: '', paused: true, play() { played = true; return Promise.resolve(); }, addEventListener() {} };
  const btn = { classList: { add() {}, remove() {} }, setAttribute() {}, addEventListener() {} };
  const sandbox = {
    navigator: withConnection ? { connection: { effectiveType: '4g', saveData: false } } : {},
    matchMedia: () => ({ matches: false }),
    document: {
      querySelector: (s) => (s.includes('.video-control') ? btn : video),
      readyState: 'complete',
      addEventListener() {},
    },
    requestIdleCallback: (cb) => cb(),
    setTimeout: (cb) => cb(), // fire the 6s fallback immediately: it must hit the same guard
    addEventListener() {},
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { timeout: 5000 });
  return played;
}

const without = run(false);
const withC = run(true);

if (without !== false || withC !== true) {
  console.error(`❌ hero-video-autoplay: no connection -> played=${without} (want false), connection -> played=${withC} (want true)`);
  process.exit(1);
}
console.log('✅ hero-video-autoplay: no connection API means no autoplay (fallback path included)');

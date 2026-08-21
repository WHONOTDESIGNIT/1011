// 对比 ro 与 pl 的相同页面: lang/dir/hreflang，判断失败项是否为既有行为
const fs = require('fs');
const pages = ['index.html', 'meet-the-team/index.html', 'services/private-label/index.html', 'blog/index.html', 'privacy/index.html', 'privacy-policy/index.html'];
for (const l of ['ro', 'pl']) {
  console.log(`\n===== /${l}/ =====`);
  for (const p of pages) {
    const f = `dist/${l}/${p}`;
    if (!fs.existsSync(f)) { console.log(`  ${p}: MISSING`); continue; }
    const s = fs.readFileSync(f, 'utf8');
    const head = s.slice(0, s.indexOf('</head>'));
    const hl = [...head.matchAll(/<link rel="alternate"[^>]*hreflang="[^"]*"[^>]*>/g)].map((m) => m[0].match(/hreflang="([^"]*)"/)[1]);
    const lang = s.match(/<html[^>]*lang="([^"]*)"/);
    const dir = s.match(/<html[^>]*dir="([^"]*)"/);
    console.log(`  ${p}: lang=${lang ? lang[1] : 'null'} dir=${dir ? dir[1] : 'null'} hreflang=[${hl.join(',')}]`);
  }
}

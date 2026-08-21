// 检查各页面 hreflang / dir / 语言
const fs = require('fs');
for (const p of ['pl/index.html', 'pl/meet-the-team/index.html', 'pl/services/private-label/index.html', 'pl/blog/index.html', 'index.html']) {
  const f = 'dist/' + p;
  if (!fs.existsSync(f)) { console.log('MISSING', p); continue; }
  const s = fs.readFileSync(f, 'utf8');
  const head = s.slice(0, s.indexOf('</head>'));
  const hl = [...head.matchAll(/<link rel="alternate"[^>]+>/g)].map((m) => m[0].slice(0, 90));
  const dir = s.match(/<html[^>]*dir="([^"]*)"/);
  const lang = s.match(/<html[^>]*lang="([^"]*)"/);
  console.log('---', p, '| lang=', lang && lang[1], '| dir=', dir && dir[1]);
  console.log(hl.length ? hl.join('\n') : '(no hreflang links)');
}

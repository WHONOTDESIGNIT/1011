// 检查哪些内联页存在构建产物
const fs = require('fs');
const list = ['develo-about-testimonials', 'develo-blog-detail', 'develo-about', 'develo-careers', 'develo-blog', 'develo-service-tech-partner', 'develo-contact', 'develo-privacy', 'develo-testimonials', 'develo-service-uiux', 'develo-clone', 'develo-work', 'marketplace', 'services/build-a-new-ipl', 'services/find-a-technology-partner', 'services/maintain-or-fix-ipl-project', 'services/private-label', 'index', 'meet-the-team'];
for (const p of list) {
  const f = `dist/${p}/index.html`;
  const f2 = `dist/${p}.html`;
  console.log(p, fs.existsSync(f) || fs.existsSync(f2) ? '✅' : '—');
}

// 最终综合验证：三语博客 + en/ar 页面回归 + 语言切换器/悬浮按钮
const fs = require('fs');
const path = require('path');
const dist = path.join(__dirname, 'astro', 'dist');

function read(p) { return fs.readFileSync(path.join(dist, p), 'utf8'); }
function has(p, sub) { try { return read(p).includes(sub); } catch { return false; } }
function title(p) { try { return (read(p).match(/<title>([^<]+)/) || [])[1] || ''; } catch { return 'N/A'; } }

console.log('=== 1. 三语博客《You Design It, We Build It, Box It》 ===');
for (const lang of ['en', 'tr', 'ar']) {
  const p = `${lang === 'en' ? '' : lang + '/'}blog/you-design-it-we-build-it-box-it/`;
  const exists = fs.existsSync(path.join(dist, p, 'index.html'));
  console.log(`  /${p} 存在: ${exists} | title: ${exists ? title(p + 'index.html').slice(0, 60) : 'N/A'}`);
}

console.log('\n=== 2. ar 页面回归（header/footer/rtl） ===');
console.log('  ar/services dir=rtl:', has('ar/services/index.html', '<html lang="ar" dir="rtl"'));
console.log('  ar/services 阿拉伯语导航(المنتجات):', has('ar/services/index.html', 'المنتجات'));
console.log('  ar/services 英文 Products 残留:', has('ar/services/index.html', '>Products<'));
console.log('  ar 语言切换器(اختر لغتك):', has('ar/services/index.html', 'اختر لغتك'));
console.log('  ar 悬浮按钮(تحدث عبر WhatsApp):', has('ar/services/index.html', 'تحدث عبر WhatsApp'));

console.log('\n=== 3. en 页面回归 ===');
console.log('  /services Products 导航存在:', has('services/index.html', '>Products<'));
console.log('  /services Get in touch:', has('services/index.html', '>Get in touch<'));
console.log('  /services 土耳其语残留(Ürünler):', has('services/index.html', 'Ürünler'));
console.log('  /services 语言切换器 Choose your language:', has('services/index.html', 'Choose your language'));

console.log('\n=== 4. tr 语言切换器/悬浮按钮 ===');
console.log('  tr/services Dil Seçin:', has('tr/services/index.html', 'Dil Seçin'));
console.log('  tr/services WhatsApp tip:', has('tr/services/index.html', 'WhatsApp üzerinden yazın'));
console.log('  tr/services Choose your language 残留:', has('tr/services/index.html', 'Choose your language'));

console.log('\n=== 5. tr 面包屑 ===');
console.log('  tr/products/lumi İçerik Haritası:', has('tr/products/lumi/index.html', 'İçerik Haritası'));
console.log('  tr/products/lumi Kapat:', has('tr/products/lumi/index.html', '>Kapat<'));
console.log('  tr/products/lumi Breadcrumb 残留:', has('tr/products/lumi/index.html', '>Breadcrumb<'));
console.log('  tr/products/lumi Close 残留:', has('tr/products/lumi/index.html', '>Close<'));
console.log('  tr/products/lumi Explore 残留:', has('tr/products/lumi/index.html', '>Explore<'));

console.log('\n=== 6. tr 动态案例页 ku2 ===');
console.log('  tr/clients/ku2-ipl title:', title('tr/clients/ku2-ipl/index.html').slice(0, 70));
console.log('  en/clients/ku2-ipl title:', title('clients/ku2-ipl/index.html').slice(0, 70));
console.log('  ar/clients/ku2-ipl 存在:', fs.existsSync(path.join(dist, 'ar', 'clients', 'ku2-ipl', 'index.html')));

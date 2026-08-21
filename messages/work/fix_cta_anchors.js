// 临时修复脚本：把 3 个「Learn more」无描述性 CTA 键改为描述性锚文本「Find a technology partner」
// 目标键路径：
//   ['homepage','whatWeDo','item1','cta']
//   ['develoCore','clone','wwd','item1','cta']
//   ['servicesPage','index','wwd','items','1','cta']
const fs = require('fs');
const path = require('path');

const MSG = path.resolve(__dirname, '..');

const TARGETS = [
  ['homepage', 'whatWeDo', 'item1', 'cta'],
  ['develoCore', 'clone', 'wwd', 'item1', 'cta'],
  ['servicesPage', 'index', 'wwd', 'items', '1', 'cta'],
];

const TRANSLATIONS = {
  en: 'Find a technology partner',
  ar: 'ابحث عن شريك تقني',
  cs: 'Najděte technologického partnera',
  de: 'Finden Sie einen Technologiepartner',
  el: 'Βρείτε έναν τεχνολογικό συνεργάτη',
  es: 'Encuentra un socio tecnológico',
  fa: 'یک شریک فناوری پیدا کنید',
  fr: 'Trouvez un partenaire technologique',
  he: 'מצאו שותף טכנולוגי',
  id: 'Temukan mitra teknologi',
  ja: 'テクノロジーパートナーを見つける',
  ko: '기술 파트너 찾기',
  nl: 'Vind een technologiepartner',
  pl: 'Znajdź partnera technologicznego',
  'pt-BR': 'Encontre um parceiro tecnológico',
  'pt-PT': 'Encontre um parceiro tecnológico',
  ro: 'Găsește un partener tehnologic',
  ru: 'Найдите технологического партнёра',
  th: 'ค้นหาพันธมิตรด้านเทคโนโลยี',
  tr: 'Bir teknoloji ortağı bulun',
  vi: 'Tìm đối tác công nghệ',
  it: 'Trova un partner tecnologico',
};

// —— 缩进状态机：按 JSON 缩进精确跟踪对象/数组路径 ——
function replaceKey(text, pathParts, newValue) {
  const lines = text.split('\n');
  const stack = []; // { type:'obj'|'arr'|'elem', key, indent }
  let arrCounter = 0; // 当前数组元素计数
  let changed = false;

  // elem 的 key 记录为「数组名.序号」，如 items.1，保证路径含数组名
  const pathSeq = () => stack.map((s) => s.key).join('.');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indent = (line.match(/^\s*/) || [''])[0].length;
    const t = line.trim();

    // 关闭对象/数组（`]` 可能独占一行或带逗号，均需处理）
    if (t === '}' || t === '},' || t === ']' || t === '],') {
      const popped = stack.pop();
      if (popped && popped.type === 'arr') arrCounter = 0;
      continue;
    }

    // 数组元素对象开始：栈顶是 arr 且本行是裸 `{`
    if (t === '{' && stack.length && stack[stack.length - 1].type === 'arr') {
      stack.push({ type: 'elem', key: String(arrCounter), indent });
      arrCounter++;
      continue;
    }

    // `"key": {` 或 `"key": [` （含同行内容情况不处理，目标对象均有子键独占行）
    const objMatch = t.match(/^"([^"]+)"\s*:\s*\{\s*$/);
    const arrMatch = t.match(/^"([^"]+)"\s*:\s*\[\s*$/);
    if (objMatch) {
      stack.push({ type: 'obj', key: objMatch[1], indent });
      continue;
    }
    if (arrMatch) {
      stack.push({ type: 'arr', key: arrMatch[1], indent });
      arrCounter = 0;
      continue;
    }

    // 在目标对象内替换 cta
    const currentPath = pathSeq();
    if (currentPath === pathParts.slice(0, -1).join('.')) {
      const ctaMatch = t.match(/^"cta"\s*:\s*"(.*)",?\s*$/);
      if (ctaMatch) {
        const comma = t.endsWith(',') ? ',' : '';
        const cr = line.endsWith('\r') ? '\r' : ''; // 保留原 CRLF 行尾
        lines[i] = ' '.repeat(indent) + `"cta": "${newValue}"` + comma + cr;
        changed = true;
      }
    }
  }
  return { text: lines.join('\n'), changed };
}

// —— 主流程：处理 messages/*.json ——
const files = fs.readdirSync(MSG).filter((f) => f.endsWith('.json') && f !== 'en.json');
let total = 0;
for (const f of files) {
  const lang = f.replace('.json', '');
  const newVal = TRANSLATIONS[lang];
  if (!newVal) {
    console.log(`⚠ 跳过 ${f}：无翻译映射`);
    continue;
  }
  let text = fs.readFileSync(path.join(MSG, f), 'utf8');
  let changed = false;
  for (const p of TARGETS) {
    const r = replaceKey(text, p, newVal);
    text = r.text;
    changed = changed || r.changed;
  }
  if (changed) {
    fs.writeFileSync(path.join(MSG, f), text);
    total++;
    console.log(`✓ ${f}`);
  } else {
    console.log(`– ${f}（无变化）`);
  }
}

// —— it 分片 ——
const IT_DIR = path.join(MSG, 'work', 'it', 'split');
const itMap = {
  'extract_it_part04.json': ['homepage', 'whatWeDo', 'item1', 'cta'],
  'extract_it_part10.json': ['servicesPage', 'index', 'wwd', 'items', '1', 'cta'],
  'extract_it_part27.json': ['develoCore', 'clone', 'wwd', 'item1', 'cta'],
};
for (const [file, p] of Object.entries(itMap)) {
  const fp = path.join(IT_DIR, file);
  if (!fs.existsSync(fp)) continue;
  const text = fs.readFileSync(fp, 'utf8');
  const r = replaceKey(text, p, TRANSLATIONS.it);
  if (r.changed) {
    fs.writeFileSync(fp, r.text);
    console.log(`✓ ${file}`);
  } else {
    console.log(`– ${file}（无变化）`);
  }
}

console.log(`\n完成，共更新 ${total} 个语言文件`);

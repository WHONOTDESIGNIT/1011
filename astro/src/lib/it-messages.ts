// 意大利语消息模块（运行时深合并 40 个翻译分片）
// 背景：终端沙箱故障无法执行 merge_it.js 生成静态 it.json，
// 故在运行时合并分片，效果与静态合并一致，且无构建期额外产物。
import en from '../../../messages/en.json';
import it01 from '../../../messages/work/it/split/extract_it_part01.json';
import it02 from '../../../messages/work/it/split/extract_it_part02.json';
import it03 from '../../../messages/work/it/split/extract_it_part03.json';
import it04 from '../../../messages/work/it/split/extract_it_part04.json';
import it05 from '../../../messages/work/it/split/extract_it_part05.json';
import it06 from '../../../messages/work/it/split/extract_it_part06.json';
import it07 from '../../../messages/work/it/split/extract_it_part07.json';
import it08 from '../../../messages/work/it/split/extract_it_part08.json';
import it09 from '../../../messages/work/it/split/extract_it_part09.json';
import it10 from '../../../messages/work/it/split/extract_it_part10.json';
import it11 from '../../../messages/work/it/split/extract_it_part11.json';
import it12 from '../../../messages/work/it/split/extract_it_part12.json';
import it13 from '../../../messages/work/it/split/extract_it_part13.json';
import it14 from '../../../messages/work/it/split/extract_it_part14.json';
import it15 from '../../../messages/work/it/split/extract_it_part15.json';
import it16 from '../../../messages/work/it/split/extract_it_part16.json';
import it17 from '../../../messages/work/it/split/extract_it_part17.json';
import it18 from '../../../messages/work/it/split/extract_it_part18.json';
import it19 from '../../../messages/work/it/split/extract_it_part19.json';
import it20 from '../../../messages/work/it/split/extract_it_part20.json';
import it21 from '../../../messages/work/it/split/extract_it_part21.json';
import it22 from '../../../messages/work/it/split/extract_it_part22.json';
import it23 from '../../../messages/work/it/split/extract_it_part23.json';
import it24 from '../../../messages/work/it/split/extract_it_part24.json';
import it25 from '../../../messages/work/it/split/extract_it_part25.json';
import it26 from '../../../messages/work/it/split/extract_it_part26.json';
import it27 from '../../../messages/work/it/split/extract_it_part27.json';
import it28 from '../../../messages/work/it/split/extract_it_part28.json';
import it29 from '../../../messages/work/it/split/extract_it_part29.json';
import it30 from '../../../messages/work/it/split/extract_it_part30.json';
import it31 from '../../../messages/work/it/split/extract_it_part31.json';
import it32 from '../../../messages/work/it/split/extract_it_part32.json';
import it33 from '../../../messages/work/it/split/extract_it_part33.json';
import it34 from '../../../messages/work/it/split/extract_it_part34.json';
import it35 from '../../../messages/work/it/split/extract_it_part35.json';
import it36 from '../../../messages/work/it/split/extract_it_part36.json';
import it37 from '../../../messages/work/it/split/extract_it_part37.json';
import it38 from '../../../messages/work/it/split/extract_it_part38.json';
import it39 from '../../../messages/work/it/split/extract_it_part39.json';
import it40 from '../../../messages/work/it/split/extract_it_part40.json';

type Messages = Record<string, unknown>;

function deepMerge(a: Record<string, unknown>, b: unknown): void {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return;
  for (const [k, v] of Object.entries(b as Record<string, unknown>)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (!a[k] || typeof a[k] !== 'object' || Array.isArray(a[k])) a[k] = {};
      deepMerge(a[k] as Record<string, unknown>, v);
    } else {
      a[k] = v;
    }
  }
}

// 归一化：英文源为 [TODO] 的遗留键（站点未使用）保持与 en.json 完全一致（与既有语言包约定一致）
function normalizeTodo(obj: Record<string, unknown>, enObj: unknown): void {
  if (!obj || !enObj || typeof enObj !== 'object') return;
  for (const [k, v] of Object.entries(obj)) {
    const ev = (enObj as Record<string, unknown>)[k];
    if (typeof ev === 'string' && ev.startsWith('[TODO]')) {
      obj[k] = ev;
    } else if (v && typeof v === 'object' && !Array.isArray(v) && ev && typeof ev === 'object' && !Array.isArray(ev)) {
      normalizeTodo(v as Record<string, unknown>, ev);
    }
  }
}

const parts = [it01, it02, it03, it04, it05, it06, it07, it08, it09, it10, it11, it12, it13, it14, it15, it16, it17, it18, it19, it20, it21, it22, it23, it24, it25, it26, it27, it28, it29, it30, it31, it32, it33, it34, it35, it36, it37, it38, it39, it40] as Messages[];

const merged: Messages = {};
for (const part of parts) deepMerge(merged, part);
normalizeTodo(merged, en as Messages);

// en.json 拆分时顶层键 cookieConsent 未进入分片，此处运行时补齐意大利语翻译（Lei 形式，与其余分片一致）
merged.cookieConsent = {
  message:
    'Utilizziamo cookie e altre tecnologie di tracciamento per migliorare la Sua esperienza di navigazione sul nostro sito web, per mostrarLe contenuti personalizzati e annunci mirati, per analizzare il traffico del nostro sito e per capire da dove provengono i nostri visitatori.',
  accept: 'Accetta tutti',
  decline: 'Rifiuta',
  settings: 'Impostazioni dei cookie',
  title: 'Avviso sui cookie',
  privacyLink: 'Informativa sulla privacy',
};

export default merged as Messages;

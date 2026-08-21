import en from '../../../messages/en.json';
import tr from '../../../messages/tr.json';
import ro from '../../../messages/ro.json';
import ar from '../../../messages/ar.json';
import es from '../../../messages/es.json';
import fr from '../../../messages/fr.json';
import ru from '../../../messages/ru.json';
import he from '../../../messages/he.json';
import fa from '../../../messages/fa.json';
import el from '../../../messages/el.json';
import pt from '../../../messages/pt-BR.json';
import ptPT from '../../../messages/pt-PT.json';
import nl from '../../../messages/nl.json';
import id from '../../../messages/id.json';
import th from '../../../messages/th.json';
import pl from '../../../messages/pl.json';
import ja from '../../../messages/ja.json';
import ko from '../../../messages/ko.json';
import cs from '../../../messages/cs.json';
import vi from '../../../messages/vi.json';
import de from '../../../messages/de.json';
import it from '../../../messages/it.json';

type Messages = Record<string, unknown>;

const messagesByLocale: Record<string, Messages> = {
  en: en as Messages,
  tr: tr as Messages,
  ro: ro as Messages,
  ar: ar as Messages,
  'es-ES': es as Messages,
  fr: fr as Messages,
  ru: ru as Messages,
  he: he as Messages,
  fa: fa as Messages,
  el: el as Messages,
  'pt-BR': pt as Messages,
  'pt-PT': ptPT as Messages,
  nl: nl as Messages,
  id: id as Messages,
  th: th as Messages,
  pl: pl as Messages,
  ja: ja as Messages,
  ko: ko as Messages,
  cs: cs as Messages,
  vi: vi as Messages,
  de: de as Messages,
  it: it as Messages,
};

function getValue(obj: unknown, key: string): unknown {
  if (!key) return obj;
  const parts = key.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

export function t(locale: string, key: string): string {
  const messages = messagesByLocale[locale] ?? messagesByLocale.en;
  const value = getValue(messages, key);
  if (typeof value === 'string') return value;
  // 当前语言缺失该 key 时回退到默认语言（en），避免直接显示 key 字符串
  const enValue = getValue(messagesByLocale.en, key);
  return typeof enValue === 'string' ? enValue : key;
}

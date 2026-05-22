import en from '../../../messages/en.json';
import es from '../../../messages/es.json';
import de from '../../../messages/de.json';

type Messages = Record<string, unknown>;

const messagesByLocale: Record<string, Messages> = {
  en: en as Messages,
  es: es as Messages,
  de: de as Messages,
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
  return typeof value === 'string' ? value : key;
}

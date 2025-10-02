import { useStore } from '../store/useStore';
import { translations } from '../i18n/translations';
import type { Language } from '../types';

export function useTranslation() {
  const user = useStore((state) => state.user);
  const language: Language = user?.language || 'de';

  const t = (key: string, variables?: Record<string, string>): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace variables like {{nickname}}
    if (variables) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
        return variables[varName] || '';
      });
    }

    return value;
  };

  return { t, language };
}

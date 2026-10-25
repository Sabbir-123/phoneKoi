'use client';

import { useDashboardStore, Language } from '@/store/useDashboardStore';
import { translations, Translations } from './translations';

export function useTranslation() {
  const language = useDashboardStore((s) => s.language);
  const setLanguage = useDashboardStore((s) => s.setLanguage);

  // If language is 'bangla' or legacy 'banglish', treat as Bengali 'bn'
  const isBn = language === 'bangla' || language === 'banglish';
  const t: Translations = isBn ? translations.bn : translations.en;

  const toggleLanguage = () => {
    setLanguage(isBn ? 'english' : 'bangla');
  };

  return {
    t,
    language,
    setLanguage,
    toggleLanguage,
    isBn,
  };
}

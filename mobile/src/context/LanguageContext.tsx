/*
** EPITECH PROJECT, 2026
** AREA
** File description:
** LanguageContext
*/

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {defaultLanguage, Language, translations} from '../i18n/translations';

type TranslationValues = Record<string, string | number>;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, values?: TranslationValues) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const LANGUAGE_STORAGE_KEY = 'language_preference';

const resolveLanguage = (value: string | null): Language | null => {
  if (value === 'en' || value === 'fr') {
    return value;
  }
  return null;
};

const interpolate = (template: string, values?: TranslationValues): string => {
  if (!values) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = values[key];
    return value === undefined || value === null ? '' : String(value);
  });
};

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);

  useEffect(() => {
    let isMounted = true;
    const loadLanguage = async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        const resolved = resolveLanguage(stored);
        if (resolved && isMounted) {
          setLanguageState(resolved);
        }
      } catch (error) {
        console.error('Failed to load language preference', error);
      }
    };
    loadLanguage();
    return () => {
      isMounted = false;
    };
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    void AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: string, values?: TranslationValues) => {
      const active = translations[language] || translations[defaultLanguage];
      const fallback = translations[defaultLanguage] || {};
      const template = active[key] ?? fallback[key] ?? key;
      return interpolate(template, values);
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

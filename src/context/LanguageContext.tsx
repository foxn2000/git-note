import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { en } from '../i18n/en';
import { ja } from '../i18n/ja';

type Language = 'en' | 'ja';
type Translations = typeof en;

interface LanguageContextType {
  language: Language;
  translations: Translations;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [translations, setTranslations] = useState<Translations>(en);

  const location = useLocation();

  useEffect(() => {
    // URLパスに基づいて言語を設定
    console.log('Current path:', location.pathname);
    if (location.pathname.startsWith('/jp')) {
      console.log('Setting language to Japanese');
      setLanguage('ja');
    } else {
      console.log('Setting language to English');
      setLanguage('en');
    }
  }, [location.pathname]);

  useEffect(() => {
    // 言語が変更されたときに翻訳を更新
    setTranslations(language === 'ja' ? ja : en);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, translations, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

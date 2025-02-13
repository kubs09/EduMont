import React, { createContext, useContext, useState, useCallback } from 'react';
import { Language, languageService } from '../../services/languageService';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'cs',
  setLanguage: () => {
    throw new Error('Language context not initialized');
  },
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(languageService.getLanguage());

  const setLanguage = useCallback((newLanguage: Language) => {
    languageService.setLanguage(newLanguage);
    setLanguageState(newLanguage);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

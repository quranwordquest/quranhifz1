import { createContext, useContext, useState, type ReactNode } from "react";
import { translations, type LangCode, type Translation } from "./translations";

const SESSION_KEY = "ayah-puzzle-lang";

interface LanguageContextValue {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: Translation;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved && saved in translations ? (saved as LangCode) : "en";
    } catch {
      return "en";
    }
  });

  const setLang = (l: LangCode) => {
    try {
      sessionStorage.setItem(SESSION_KEY, l);
    } catch { /* ignore */ }
    setLangState(l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useT(): Translation {
  return useContext(LanguageContext).t;
}

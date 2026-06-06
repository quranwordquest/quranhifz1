import { useLanguage } from "@/i18n/LanguageContext";
import { LANGUAGE_NAMES, type LangCode } from "@/i18n/translations";

const LANG_CODES = Object.keys(LANGUAGE_NAMES) as LangCode[];

export default function LanguageSelector() {
  const { lang, setLang } = useLanguage();

  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as LangCode)}
      className="text-sm bg-background border border-border rounded-lg px-2 py-1.5 text-foreground cursor-pointer hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
      aria-label="Select language"
    >
      {LANG_CODES.map((code) => (
        <option key={code} value={code}>
          {LANGUAGE_NAMES[code]}
        </option>
      ))}
    </select>
  );
}

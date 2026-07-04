import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { TRANSLATIONS, LABEL_KEYS, type TranslationKey } from "./translations";

export const LANGUAGES = [
  { code: "EN", label: "English",    flag: "🇬🇧" },
  { code: "ES", label: "Español",    flag: "🇪🇸" },
  { code: "DE", label: "Deutsch",    flag: "🇩🇪" },
  { code: "FR", label: "Français",   flag: "🇫🇷" },
  { code: "IT", label: "Italiano",   flag: "🇮🇹" },
  { code: "PT", label: "Português",  flag: "🇵🇹" },
  { code: "NL", label: "Nederlands", flag: "🇳🇱" },
  { code: "PL", label: "Polski",     flag: "🇵🇱" },
  { code: "TR", label: "Türkçe",     flag: "🇹🇷" },
  { code: "AR", label: "العربية",    flag: "🇸🇦" },
];

// rate = units per 1 USD. SAR/AED/QAR are pegged to the dollar; the rest are
// approximations to update when real FX data is wired in. suffix places the
// symbol after the amount (Arabic-script currencies).
export const CURRENCIES = [
  { code: "USD", symbol: "$",   name: "US Dollar",         rate: 1,      suffix: false },
  { code: "EUR", symbol: "€",   name: "Euro",              rate: 0.92,   suffix: false },
  { code: "GBP", symbol: "£",   name: "British Pound",     rate: 0.79,   suffix: false },
  { code: "CAD", symbol: "C$",  name: "Canadian Dollar",   rate: 1.37,   suffix: false },
  { code: "AUD", symbol: "A$",  name: "Australian Dollar", rate: 1.52,   suffix: false },
  { code: "BRL", symbol: "R$",  name: "Brazilian Real",    rate: 5.43,   suffix: false },
  { code: "TRY", symbol: "₺",   name: "Turkish Lira",      rate: 41.2,   suffix: false },
  { code: "EGP", symbol: "E£",  name: "Egyptian Pound",    rate: 48.5,   suffix: false },
  { code: "SAR", symbol: "ر.س", name: "Saudi Riyal",       rate: 3.75,   suffix: true },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham",        rate: 3.6725, suffix: true },
  { code: "QAR", symbol: "ر.ق", name: "Qatari Riyal",      rate: 3.64,   suffix: true },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar",     rate: 0.31,   suffix: true },
];

type Locale = { lang: string; cur: string };

type LocaleContextValue = {
  lang: string;
  cur: string;
  setLocale: (l: Locale) => void;
  language: (typeof LANGUAGES)[number];
  currency: (typeof CURRENCIES)[number];
  formatPrice: (usd: number | string) => string;
  t: (key: TranslationKey) => string;
  tLabel: (label: string) => string;
};

const STORAGE_KEY = "rarumble-locale";

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (LANGUAGES.some(l => l.code === parsed.lang) && CURRENCIES.some(c => c.code === parsed.cur)) {
          return parsed;
        }
      }
    } catch { /* corrupted storage — fall back to defaults */ }
    return { lang: "EN", cur: "USD" };
  });

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(l)); } catch { /* storage unavailable */ }
  };

  useEffect(() => {
    document.documentElement.lang = locale.lang.toLowerCase();
  }, [locale.lang]);

  const language = LANGUAGES.find(l => l.code === locale.lang) ?? LANGUAGES[0];
  const currency = CURRENCIES.find(c => c.code === locale.cur) ?? CURRENCIES[0];

  const formatPrice = (usd: number | string) => {
    const n = typeof usd === "string" ? parseFloat(usd) : usd;
    if (Number.isNaN(n)) return "";
    // KWD is conventionally quoted to 3 decimal places
    const decimals = currency.code === "KWD" ? 3 : 2;
    const amount = (n * currency.rate).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return currency.suffix ? `${amount} ${currency.symbol}` : `${currency.symbol}${amount}`;
  };

  // t: translate by key. tLabel: translate an English UI label that doubles as
  // an internal identifier (service names, footer links); unknown labels pass through.
  const t = (key: TranslationKey) => TRANSLATIONS[locale.lang]?.[key] ?? TRANSLATIONS.EN[key];
  const tLabel = (label: string) => {
    const key = LABEL_KEYS[label];
    return key ? t(key) : label;
  };

  return (
    <LocaleContext.Provider value={{ lang: locale.lang, cur: locale.cur, setLocale, language, currency, formatPrice, t, tLabel }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

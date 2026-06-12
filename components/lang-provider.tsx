"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { dictionaries, type Dict, type Lang } from "@/lib/i18n";

type LangCtx = { lang: Lang; setLang: (l: Lang) => void; t: Dict };

const Ctx = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  // Server always renders fr to avoid hydration mismatch; localStorage is read on mount.
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const saved = localStorage.getItem("redline-lang");
    if (saved === "fr" || saved === "en") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("redline-lang", l);
    document.documentElement.lang = l;
  };

  return (
    <Ctx.Provider value={{ lang, setLang, t: dictionaries[lang] }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLang(): LangCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLang must be used within LangProvider");
  return v;
}

"use client";

import { useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { copy } from "@/lib/i18n";
import type { Language } from "@/lib/types";

export type ThemePreference = "light" | "dark" | "system";

interface PreferenceControlsProps {
  initialLanguage: Language;
  initialTheme: ThemePreference;
  language?: Language;
  theme?: ThemePreference;
  onLanguageChange?: (language: Language) => void;
  onThemeChange?: (theme: ThemePreference) => void;
}

export function PreferenceControls({
  initialLanguage,
  initialTheme,
  language: controlledLanguage,
  theme: controlledTheme,
  onLanguageChange,
  onThemeChange,
}: PreferenceControlsProps) {
  const [localLanguage, setLocalLanguage] = useState(initialLanguage);
  const [localTheme, setLocalTheme] = useState(initialTheme);
  const language = controlledLanguage ?? localLanguage;
  const theme = controlledTheme ?? localTheme;
  const t = copy[language];

  const changeLanguage = (nextLanguage: Language) => {
    if (onLanguageChange) {
      onLanguageChange(nextLanguage);
      return;
    }
    setLocalLanguage(nextLanguage);
    document.cookie = `breatheeasy-language=${nextLanguage}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  };

  const changeTheme = (nextTheme: ThemePreference) => {
    if (onThemeChange) {
      onThemeChange(nextTheme);
      return;
    }
    setLocalTheme(nextTheme);
    const root = document.documentElement;
    root.dataset.theme =
      nextTheme === "light"
        ? "morning"
        : nextTheme === "dark"
          ? "dusk"
          : "system";
    root.style.colorScheme =
      nextTheme === "light"
        ? "light"
        : nextTheme === "dark"
          ? "dark"
          : "light dark";
    document.cookie = `breatheeasy-theme=${nextTheme}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <div className="preference-controls">
      <div className="language-control" role="group" aria-label={t.language}>
        <button
          type="button"
          lang="en"
          aria-pressed={language === "en"}
          onClick={() => changeLanguage("en")}
        >
          EN
        </button>
        <span aria-hidden="true">|</span>
        <button
          type="button"
          lang="hi"
          aria-pressed={language === "hi"}
          onClick={() => changeLanguage("hi")}
        >
          हि
        </button>
      </div>
      <div className="theme-control" role="group" aria-label={t.colorTheme}>
        <button
          type="button"
          aria-label={t.lightTheme}
          title={t.lightTheme}
          aria-pressed={theme === "light"}
          onClick={() => changeTheme("light")}
        >
          <Sun size={17} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={t.darkTheme}
          title={t.darkTheme}
          aria-pressed={theme === "dark"}
          onClick={() => changeTheme("dark")}
        >
          <Moon size={17} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={t.systemTheme}
          title={t.systemTheme}
          aria-pressed={theme === "system"}
          onClick={() => changeTheme("system")}
        >
          <Monitor size={17} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

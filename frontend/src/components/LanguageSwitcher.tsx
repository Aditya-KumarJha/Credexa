"use client";

import React, { useEffect, useRef, useState } from "react";

// Minimal styles are handled via globals.css; this component focuses on behavior + markup

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
  }
}

const LANG_MAP: Record<string, string> = {
  en: "English",
  hi: "हिन्दी",
  bn: "বাংলা",
  ta: "தமிழ்",
  te: "తెలుగు",
  mr: "मराठी",
  gu: "ગુજરાતી",
  kn: "ಕನ್ನಡ",
  pa: "ਪੰਜਾਬੀ",
  ml: "മലയാളം",
  or: "ଓଡ଼ିଆ",
  as: "অসমীয়া",
  ur: "اردو",
  sa: "संस्कृतम्",
  ne: "नेपाली",
  bho: "भोजपुरी",
  mai: "मैथिली",
  gom: "कोंकणी",
  doi: "डोगरी",
  "mni-Mtei": "ꯃꯤꯇꯩꯂꯣꯟ",
};

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
}

function getCurrentLangCode(): string {
  const currentLangCookie = getCookie("googtrans");
  let currentLangCode = "en";
  if (currentLangCookie) {
    const cookieParts = currentLangCookie.split("/");
    if (cookieParts.length > 2) {
      currentLangCode = cookieParts[2];
    }
  }
  return currentLangCode;
}

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [currentCode, setCurrentCode] = useState<string>("en");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const appliedRef = useRef(false);

  // Load google translate script once
  useEffect(() => {
    if (typeof window === "undefined") return;

    // define the init callback on window
    window.googleTranslateElementInit = () => {
      try {
        // eslint-disable-next-line no-new
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages:
              "en,hi,bn,ta,te,mr,gu,kn,pa,ml,or,as,ur,sa,ne,bho,mai,gom,doi,mni-Mtei",
          },
          "google_translate_element"
        );
      } catch (e) {
        // no-op if google is not ready yet
      }
      // Set initial label from cookie
      setCurrentCode(getCurrentLangCode());
    };

    // inject script if not already present
    const existing = document.querySelector(
      'script[src*="translate.google.com/translate_a/element.js"]'
    );
    if (!existing) {
      const s = document.createElement("script");
      s.type = "text/javascript";
      s.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.head.appendChild(s);
    }

    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Update current code when cookie changes after language switch
  const updateCurrent = () => setCurrentCode(getCurrentLangCode());

  // Try to get the hidden Google select
  const getGoogleSelect = () =>
    (document.querySelector(
      "#google_translate_element select"
    ) as HTMLSelectElement | null);

  // Apply language from cookie into Google select (useful on reload)
  const applyFromCookie = () => {
    const code = getCurrentLangCode();
    const select = getGoogleSelect();
    if (!select) return false;
    if (select.value !== code) {
      select.value = code;
      select.dispatchEvent(new Event("change"));
    }
    setTimeout(updateCurrent, 120);
    return true;
  };

  // On mount and whenever the widget renders, re-apply cookie language
  useEffect(() => {
    let tries = 0;
    const maxTries = 25; // ~5s with 200ms interval
    const interval = setInterval(() => {
      if (applyFromCookie()) {
        appliedRef.current = true;
        clearInterval(interval);
      } else if (++tries >= maxTries) {
        clearInterval(interval);
      }
    }, 200);

    const onPageShow = () => {
      // Re-apply when the page is shown from bfcache or reload
      setTimeout(() => applyFromCookie(), 150);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        setTimeout(() => applyFromCookie(), 150);
      }
    };
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const changeLanguage = (code: string) => {
    const googleSelect = getGoogleSelect();
    if (googleSelect) {
      googleSelect.value = code;
      googleSelect.dispatchEvent(new Event("change"));
      // update after small delay for widget to apply
      setTimeout(updateCurrent, 150);
      setOpen(false);
    }
  };

  const displayCode = (code: string) => code.split("-")[0].toUpperCase();

  return (
    <div className="relative notranslate" translate="no" ref={containerRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex items-center gap-2 w-auto px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors notranslate"
        translate="no"
      >
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/40 px-1.5 py-0.5 rounded notranslate" translate="no">
          {displayCode(currentCode)}
        </span>
        <svg
          className="w-4 h-4 text-slate-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xl p-2 z-[9999] max-h-80 overflow-y-auto pointer-events-auto notranslate" translate="no">
          {Object.entries(LANG_MAP).map(([code, name]) => {
            const selected = getCurrentLangCode() === code;
            return (
              <div
                key={code}
                role="button"
                onClick={() => changeLanguage(code)}
                className={`flex items-center p-2 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer ${
                  selected ? "bg-indigo-50 dark:bg-indigo-900/30" : ""
                }`}
                data-lang-code={code}
                translate="no"
              >
                <span className="text-sm font-semibold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 rounded w-12 text-center notranslate" translate="no">
                  {displayCode(code)}
                </span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 ml-3 notranslate" translate="no">
                  {name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Hidden Google widget host */}
      <div id="google_translate_element" className="hidden" />
    </div>
  );
}

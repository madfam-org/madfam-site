'use client';

import { Sun, Moon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState<boolean | null>(null);
  const t = useTranslations('common.darkMode');

  useEffect(() => {
    // Check for saved preference or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(systemPrefersDark);
    }
  }, []);

  useEffect(() => {
    if (darkMode === null) return;

    // Apply the theme. `.light` is what lets an explicit light choice beat a
    // dark OS preference (see the `dark` variant in globals.css).
    const classes = document.documentElement.classList;
    classes.toggle('dark', darkMode);
    classes.toggle('light', !darkMode);
  }, [darkMode]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't manually set a preference
      if (!localStorage.getItem('theme')) {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleDarkMode = () => {
    // Persist only an explicit choice, so visitors who never touch the toggle
    // keep following their OS setting.
    const next = !darkMode;
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setDarkMode(next);
  };

  // Don't render until we know the theme to avoid flashing
  if (darkMode === null) {
    return (
      <button
        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 w-10 h-10"
        aria-label={t('toggle')}
        disabled
      >
        <div className="w-6 h-6" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={darkMode ? t('switchToLight') : t('switchToDark')}
      title={darkMode ? t('switchToLight') : t('switchToDark')}
    >
      {darkMode ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-gray-700" />
      )}
    </button>
  );
}

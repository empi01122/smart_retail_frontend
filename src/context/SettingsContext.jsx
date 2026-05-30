import React, { createContext, useState, useEffect } from 'react';
import { getStoreSettings } from '../services/settingsService';

export const SettingsContext = createContext();

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '79, 70, 229'; // fallback to default primary rgb
};

const getThemeMode = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 'dark';
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 165 ? 'light' : 'dark';
};


export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    store_name: 'Smart Retail Shop',
    logo_url: '',
    primary_theme_color: '#4F46E5',
    secondary_theme_color: '#F8FAFC',
    accent_theme_color: '#F59E0B'
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await getStoreSettings();
      if (data) {
        setSettings(data);
        applyThemeStyles(data);
      }
    } catch (error) {
      console.error('Error loading store settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyThemeStyles = (themeData) => {
    if (!themeData) return;
    const root = document.documentElement;
    root.style.setProperty('--primary-color', themeData.primary_theme_color);
    root.style.setProperty('--secondary-color', themeData.secondary_theme_color);
    root.style.setProperty('--accent-color', themeData.accent_theme_color);

    const rgbPrimary = hexToRgb(themeData.primary_theme_color);
    root.style.setProperty('--primary-color-rgb', rgbPrimary);

    const rgbAccent = hexToRgb(themeData.accent_theme_color);
    root.style.setProperty('--accent-color-rgb', rgbAccent);

    const mode = getThemeMode(themeData.secondary_theme_color);
    if (mode === 'light') {
      root.style.setProperty('--bg-app', themeData.secondary_theme_color);
      root.style.setProperty('--bg-surface', 'rgba(255, 255, 255, 0.75)');
      root.style.setProperty('--bg-surface-border', 'rgba(0, 0, 0, 0.08)');
      root.style.setProperty('--text-primary', '#0f172a'); // slate-900
      root.style.setProperty('--text-secondary', '#334155'); // slate-700 (much higher contrast)
      root.style.setProperty('--text-muted', '#475569'); // slate-600 (much higher contrast)
      root.style.setProperty('--bg-sidebar', 'rgba(255, 255, 255, 0.95)');
      root.style.setProperty('--border-sidebar', 'rgba(0, 0, 0, 0.08)');
      root.style.setProperty('--glass-card-bg', 'rgba(0, 0, 0, 0.015)');
      root.style.setProperty('--glass-card-border', 'rgba(0, 0, 0, 0.04)');
      root.style.setProperty('--input-bg', 'rgba(255, 255, 255, 0.8)');
      root.style.setProperty('--input-border', 'rgba(0, 0, 0, 0.12)');
      root.style.setProperty('--shadow-md', '0 10px 25px -5px rgba(0, 0, 0, 0.06), 0 8px 16px -6px rgba(0, 0, 0, 0.06)');
      root.style.setProperty('--shadow-lg', '0 20px 40px -10px rgba(0, 0, 0, 0.08)');
    } else {
      root.style.setProperty('--bg-app', themeData.secondary_theme_color);
      root.style.setProperty('--bg-surface', 'rgba(17, 24, 39, 0.7)');
      root.style.setProperty('--bg-surface-border', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--text-primary', '#ffffff'); // pure white (maximum contrast)
      root.style.setProperty('--text-secondary', '#e2e8f0'); // slate-200 (very clean & legible)
      root.style.setProperty('--text-muted', '#94a3b8'); // slate-400 (very legible grey)
      root.style.setProperty('--bg-sidebar', 'rgba(11, 15, 25, 0.95)');
      root.style.setProperty('--border-sidebar', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--glass-card-bg', 'rgba(255, 255, 255, 0.02)');
      root.style.setProperty('--glass-card-border', 'rgba(255, 255, 255, 0.04)');
      root.style.setProperty('--input-bg', 'rgba(255, 255, 255, 0.03)');
      root.style.setProperty('--input-border', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--shadow-md', '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 16px -6px rgba(0, 0, 0, 0.3)');
      root.style.setProperty('--shadow-lg', '0 20px 40px -10px rgba(0, 0, 0, 0.5)');
    }

    document.title = themeData.store_name || 'Smart Retail Shop';
  };

  useEffect(() => {
    // Initial load
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings, applyThemeStyles }}>
      {children}
    </SettingsContext.Provider>
  );
};
import React, { createContext, useState, useEffect } from 'react';
import { getStoreSettings } from '../services/settingsService';

export const SettingsContext = createContext();

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '79, 70, 229'; // fallback to default primary rgb
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    store_name: 'Smart Retail Shop',
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
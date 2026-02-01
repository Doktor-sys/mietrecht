import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMediaQuery } from '@mui/material';

interface AccessibilityPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  largerText: boolean;
  dyslexiaFriendly: boolean;
  screenReaderMode: boolean;
}

interface AccessibilityContextType {
  preferences: AccessibilityPreferences;
  updatePreference: (key: keyof AccessibilityPreferences, value: boolean) => void;
  resetPreferences: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const defaultPreferences: AccessibilityPreferences = {
  reducedMotion: false,
  highContrast: false,
  largerText: false,
  dyslexiaFriendly: false,
  screenReaderMode: false,
};

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => {
    const saved = localStorage.getItem('accessibilityPreferences');
    return saved ? JSON.parse(saved) : defaultPreferences;
  });

  // Check for system preferences
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const prefersContrast = useMediaQuery('(prefers-contrast: more)');

  useEffect(() => {
    // Apply system preferences if not already set
    if (prefersReducedMotion && !preferences.reducedMotion) {
      updatePreference('reducedMotion', true);
    }
    
    if (prefersContrast && !preferences.highContrast) {
      updatePreference('highContrast', true);
    }
    
    // Apply preferences to document
    applyAccessibilityPreferences(preferences);
  }, [preferences, prefersReducedMotion, prefersContrast]);

  const updatePreference = (key: keyof AccessibilityPreferences, value: boolean) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    localStorage.setItem('accessibilityPreferences', JSON.stringify(updated));
    applyAccessibilityPreferences(updated);
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    localStorage.removeItem('accessibilityPreferences');
    applyAccessibilityPreferences(defaultPreferences);
  };

  const applyAccessibilityPreferences = (prefs: AccessibilityPreferences) => {
    // Apply classes to body for CSS targeting
    document.body.classList.toggle('reduced-motion', prefs.reducedMotion);
    document.body.classList.toggle('high-contrast', prefs.highContrast);
    document.body.classList.toggle('larger-text', prefs.largerText);
    document.body.classList.toggle('dyslexia-friendly', prefs.dyslexiaFriendly);
    document.body.classList.toggle('screen-reader-mode', prefs.screenReaderMode);
    
    // Update meta tags
    updateMetaTags(prefs);
  };

  const updateMetaTags = (prefs: AccessibilityPreferences) => {
    // Update theme color based on high contrast mode
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', prefs.highContrast ? '#000000' : '#1976d2');
    }
  };

  return (
    <AccessibilityContext.Provider value={{ preferences, updatePreference, resetPreferences }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export default AccessibilityProvider;
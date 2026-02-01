import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';

interface KeyboardNavigationManagerProps {
  children: React.ReactNode;
}

const KeyboardNavigationManager: React.FC<KeyboardNavigationManagerProps> = ({ children }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showHelp, setShowHelp] = useState(false);

  // Create announcement for screen readers
  const announceToScreenReader = useCallback((message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-9999px';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    // Remove announcement after it's been read
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  // Handle global keyboard shortcuts
  const handleGlobalShortcuts = useCallback((e: KeyboardEvent) => {
    // Prevent default behavior for our shortcuts
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+Alt+H - Show keyboard shortcuts help
      if (e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setShowHelp(true);
        announceToScreenReader(t('accessibility.shortcuts.helpShortcut'));
      }
      
      // Ctrl+Alt+P - Open profile
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        navigate('/profile');
        announceToScreenReader(t('nav.profile'));
      }
      
      // Ctrl+Alt+A - Open accessibility settings
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        navigate('/accessibility-settings');
        announceToScreenReader(t('accessibility.settings.title'));
      }
      
      // Ctrl+Alt+C - Open chat
      if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        navigate('/chat');
        announceToScreenReader(t('nav.chat'));
      }
      
      // Ctrl+Alt+D - Open documents
      if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        navigate('/documents');
        announceToScreenReader(t('nav.documents'));
      }
      
      // Ctrl+Alt+L - Open lawyers
      if (e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        navigate('/lawyers');
        announceToScreenReader(t('nav.lawyers'));
      }
    }
    
    // Escape key - close overlays, modals, menus
    if (e.key === 'Escape') {
      // Close any open menus
      const openMenus = document.querySelectorAll('[role="menu"][aria-hidden="false"]');
      if (openMenus.length > 0) {
        e.preventDefault();
        // Trigger escape on the menu
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        openMenus[0].dispatchEvent(event);
        announceToScreenReader(t('accessibility.shortcuts.closeOverlay'));
      }
      
      // Close help dialog if open
      if (showHelp) {
        e.preventDefault();
        setShowHelp(false);
        announceToScreenReader(t('accessibility.shortcuts.closeOverlay'));
      }
      
      // Close any open dialogs
      const openDialogs = document.querySelectorAll('[role="dialog"][aria-hidden="false"]');
      if (openDialogs.length > 0) {
        e.preventDefault();
        // Try to find and click the close button
        const closeButton = openDialogs[0].querySelector('button[aria-label="close"], button[title*="close" i], button[title*="schließen" i]');
        if (closeButton) {
          (closeButton as HTMLElement).click();
        } else {
          // Fallback: dispatch escape event to dialog
          const event = new KeyboardEvent('keydown', { key: 'Escape' });
          openDialogs[0].dispatchEvent(event);
        }
        announceToScreenReader(t('accessibility.shortcuts.closeOverlay'));
      }
    }
    
    // Tab key navigation
    if (e.key === 'Tab') {
      // We'll handle focus trapping in the focus trap handler
    }
  }, [navigate, t, announceToScreenReader, showHelp]);

  // Handle focus trap for modal dialogs
  const handleFocusTrap = useCallback((e: KeyboardEvent) => {
    // Check if a modal dialog is open
    const dialog = document.querySelector('[role="dialog"][aria-hidden="false"]');
    if (!dialog) return;
    
    const focusableElements = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift+Tab - move focus backwards
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab - move focus forwards
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, []);

  useEffect(() => {
    // Add event listeners
    document.addEventListener('keydown', handleGlobalShortcuts);
    document.addEventListener('keydown', handleFocusTrap);
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleGlobalShortcuts);
      document.removeEventListener('keydown', handleFocusTrap);
    };
  }, [handleGlobalShortcuts, handleFocusTrap]);

  const handleCloseHelp = () => {
    setShowHelp(false);
  };

  return (
    <>
      {children}
      <KeyboardShortcutsHelp open={showHelp} onClose={handleCloseHelp} />
    </>
  );
};

export default KeyboardNavigationManager;
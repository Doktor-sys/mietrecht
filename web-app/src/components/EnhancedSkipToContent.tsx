import React, { useEffect } from 'react';
import { Button, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface EnhancedSkipToContentProps {
  targets?: Array<{
    id: string;
    label: string;
  }>;
}

const EnhancedSkipToContent: React.FC<EnhancedSkipToContentProps> = ({ targets = [] }) => {
  const { t } = useTranslation();

  // Default targets if none provided
  const defaultTargets = [
    { id: 'main-content', label: t('accessibility.skipToMain') },
    { id: 'navigation', label: t('accessibility.skipToNav') },
  ];

  const allTargets = targets.length > 0 ? targets : defaultTargets;

  const handleSkip = (targetId: string) => {
    const element = document.getElementById(targetId);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Announce skip action to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.style.position = 'absolute';
      announcement.style.left = '-9999px';
      announcement.textContent = t('accessibility.skippedTo', { target: allTargets.find(t => t.id === targetId)?.label });
      document.body.appendChild(announcement);
      
      // Remove announcement after it's been read
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  };

  // Add keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Option + S (macOS) or Ctrl + Alt + S (Windows/Linux)
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 's') {
        e.preventDefault();
        // Focus first skip link
        const firstLink = document.querySelector('[data-skip-link]');
        if (firstLink instanceof HTMLElement) {
          firstLink.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Box
      sx={{
        position: 'absolute',
        left: '-9999px',
        zIndex: 9999,
        display: 'flex',
        gap: 1,
        flexWrap: 'wrap',
        '&:focus-within, &:hover': {
          left: '10px',
          top: '10px',
          right: '10px',
          display: 'flex',
        },
      }}
      role="region"
      aria-label={t('accessibility.skipLinksRegion')}
    >
      {allTargets.map((target, index) => (
        <Button
          key={target.id}
          variant="contained"
          onClick={() => handleSkip(target.id)}
          sx={{
            mb: 1,
            '&:focus': {
              position: 'relative',
              left: 0,
            },
          }}
          data-skip-link={index === 0 ? 'true' : undefined}
          aria-label={`${t('accessibility.skipTo')} ${target.label}`}
        >
          {target.label}
        </Button>
      ))}
    </Box>
  );
};

export default EnhancedSkipToContent;
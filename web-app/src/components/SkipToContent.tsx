import React from 'react';
import { Button, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const SkipToContent: React.FC = () => {
  const { t } = useTranslation();

  const handleSkip = () => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView();
    }
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        left: '-9999px',
        zIndex: 9999,
        '&:focus-within': {
          left: '10px',
          top: '10px',
        },
      }}
    >
      <Button
        variant="contained"
        onClick={handleSkip}
        sx={{
          '&:focus': {
            position: 'relative',
            left: 0,
          },
        }}
      >
        Zum Hauptinhalt springen
      </Button>
    </Box>
  );
};

export default SkipToContent;

import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  Divider,
  Paper
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ open, onClose }) => {
  const { t } = useTranslation();

  const shortcuts = [
    {
      category: t('accessibility.shortcuts.navigation'),
      items: [
        { keys: 'Ctrl+Alt+H', description: t('accessibility.shortcuts.showShortcuts') },
        { keys: 'Ctrl+Alt+P', description: t('accessibility.shortcuts.openProfile') },
        { keys: 'Ctrl+Alt+A', description: t('accessibility.shortcuts.openAccessibility') },
        { keys: 'Ctrl+Alt+C', description: t('accessibility.shortcuts.openChat') },
        { keys: 'Ctrl+Alt+D', description: t('accessibility.shortcuts.openDocuments') },
        { keys: 'Ctrl+Alt+L', description: t('accessibility.shortcuts.openLawyers') },
        { keys: 'Esc', description: t('accessibility.shortcuts.closeOverlay') }
      ]
    },
    {
      category: t('accessibility.shortcuts.globalShortcuts'),
      items: [
        { keys: 'Tab', description: t('accessibility.shortcuts.skipToContent') },
        { keys: 'Shift+Tab', description: t('accessibility.shortcuts.skipToNavigation') }
      ]
    }
  ];

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="keyboard-shortcuts-title"
      aria-describedby="keyboard-shortcuts-description"
    >
      <DialogTitle id="keyboard-shortcuts-title">
        {t('accessibility.shortcuts.title')}
      </DialogTitle>
      
      <DialogContent dividers>
        <Typography id="keyboard-shortcuts-description" paragraph>
          {t('accessibility.shortcuts.description')}
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          {shortcuts.map((section, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {section.category}
              </Typography>
              
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                {section.items.map((item, itemIndex) => (
                  <Box 
                    key={itemIndex} 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      py: 1,
                      '&:not(:last-child)': { borderBottom: 1, borderColor: 'divider' }
                    }}
                  >
                    <Typography variant="body2">
                      {item.description}
                    </Typography>
                    <Box 
                      component="kbd" 
                      sx={{ 
                        px: 1, 
                        py: 0.5, 
                        borderRadius: 1, 
                        bgcolor: 'grey.200', 
                        border: 1, 
                        borderColor: 'grey.300',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem'
                      }}
                    >
                      {item.keys}
                    </Box>
                  </Box>
                ))}
              </Paper>
            </Box>
          ))}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="contained" autoFocus>
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default KeyboardShortcutsHelp;
import React from 'react';
import { 
  Box, 
  Typography, 
  Switch, 
  FormControlLabel, 
  FormGroup, 
  Button,
  Paper,
  Divider
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from './EnhancedAccessibilityProvider';

const AccessibilitySettingsPanel: React.FC = () => {
  const { t } = useTranslation();
  const { preferences, updatePreference, resetPreferences } = useAccessibility();

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t('accessibility.settings.title')}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('accessibility.settings.description')}
      </Typography>
      
      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              checked={preferences.reducedMotion}
              onChange={(e) => updatePreference('reducedMotion', e.target.checked)}
              aria-describedby="reduced-motion-description"
            />
          }
          label={
            <Box>
              <Typography variant="body1">{t('accessibility.settings.reducedMotion')}</Typography>
              <Typography 
                id="reduced-motion-description" 
                variant="caption" 
                color="text.secondary"
                component="div"
              >
                {t('accessibility.settings.reducedMotionDesc')}
              </Typography>
            </Box>
          }
          aria-label={t('accessibility.settings.reducedMotion')}
        />
        
        <Divider sx={{ my: 1 }} />
        
        <FormControlLabel
          control={
            <Switch
              checked={preferences.highContrast}
              onChange={(e) => updatePreference('highContrast', e.target.checked)}
              aria-describedby="high-contrast-description"
            />
          }
          label={
            <Box>
              <Typography variant="body1">{t('accessibility.settings.highContrast')}</Typography>
              <Typography 
                id="high-contrast-description" 
                variant="caption" 
                color="text.secondary"
                component="div"
              >
                {t('accessibility.settings.highContrastDesc')}
              </Typography>
            </Box>
          }
          aria-label={t('accessibility.settings.highContrast')}
        />
        
        <Divider sx={{ my: 1 }} />
        
        <FormControlLabel
          control={
            <Switch
              checked={preferences.largerText}
              onChange={(e) => updatePreference('largerText', e.target.checked)}
              aria-describedby="larger-text-description"
            />
          }
          label={
            <Box>
              <Typography variant="body1">{t('accessibility.settings.largerText')}</Typography>
              <Typography 
                id="larger-text-description" 
                variant="caption" 
                color="text.secondary"
                component="div"
              >
                {t('accessibility.settings.largerTextDesc')}
              </Typography>
            </Box>
          }
          aria-label={t('accessibility.settings.largerText')}
        />
        
        <Divider sx={{ my: 1 }} />
        
        <FormControlLabel
          control={
            <Switch
              checked={preferences.dyslexiaFriendly}
              onChange={(e) => updatePreference('dyslexiaFriendly', e.target.checked)}
              aria-describedby="dyslexia-friendly-description"
            />
          }
          label={
            <Box>
              <Typography variant="body1">{t('accessibility.settings.dyslexiaFriendly')}</Typography>
              <Typography 
                id="dyslexia-friendly-description" 
                variant="caption" 
                color="text.secondary"
                component="div"
              >
                {t('accessibility.settings.dyslexiaFriendlyDesc')}
              </Typography>
            </Box>
          }
          aria-label={t('accessibility.settings.dyslexiaFriendly')}
        />
        
        <Divider sx={{ my: 1 }} />
        
        <FormControlLabel
          control={
            <Switch
              checked={preferences.screenReaderMode}
              onChange={(e) => updatePreference('screenReaderMode', e.target.checked)}
              aria-describedby="screen-reader-description"
            />
          }
          label={
            <Box>
              <Typography variant="body1">{t('accessibility.settings.screenReaderMode')}</Typography>
              <Typography 
                id="screen-reader-description" 
                variant="caption" 
                color="text.secondary"
                component="div"
              >
                {t('accessibility.settings.screenReaderModeDesc')}
              </Typography>
            </Box>
          }
          aria-label={t('accessibility.settings.screenReaderMode')}
        />
      </FormGroup>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="outlined" 
          onClick={resetPreferences}
          aria-label={t('accessibility.settings.reset')}
        >
          {t('accessibility.settings.reset')}
        </Button>
      </Box>
    </Paper>
  );
};

export default AccessibilitySettingsPanel;
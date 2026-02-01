import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Button,
  Divider,
  Chip,
  Autocomplete,
  Switch,
  Grid
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { userAPI } from '../services/api';

interface LegalTopic {
  id: string;
  name: string;
  category: string;
  description: string;
  parentId?: string;
}

interface DocumentType {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface UserProfilePreferences {
  language: 'de' | 'tr' | 'ar' | 'en';
  accessibility: {
    highContrast: boolean;
    dyslexiaFriendly: boolean;
    reducedMotion: boolean;
    largerText: boolean;
    screenReaderMode: boolean;
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    dataSharing: boolean;
    analytics: boolean;
    marketing: boolean;
  };
  legalTopics: string[];
  frequentDocuments: string[];
  alerts: {
    newCaseLaw: 'instant' | 'daily' | 'weekly' | 'disabled';
    documentUpdates: 'instant' | 'daily' | 'disabled';
    newsletter: 'monthly' | 'disabled';
  };
}

const EnhancedProfileSettings: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state: RootState) => state.auth);
  const [preferences, setPreferences] = useState<UserProfilePreferences>({
    language: 'de',
    accessibility: {
      highContrast: false,
      dyslexiaFriendly: false,
      reducedMotion: false,
      largerText: false,
      screenReaderMode: false
    },
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    privacy: {
      dataSharing: false,
      analytics: true,
      marketing: false
    },
    legalTopics: [],
    frequentDocuments: [],
    alerts: {
      newCaseLaw: 'daily',
      documentUpdates: 'instant',
      newsletter: 'monthly'
    }
  });

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Mock data for legal topics
  const [legalTopics] = useState<LegalTopic[]>([
    {
      id: 'tenant-protection',
      name: 'Mieterschutz',
      category: 'Grundlagen',
      description: 'Rechte und Pflichten von Mietern'
    },
    {
      id: 'rent-increases',
      name: 'Mietpreiserhöhungen',
      category: 'Grundlagen',
      description: 'Zulässigkeit und Berechnung von Mietpreiserhöhungen'
    },
    {
      id: 'modernization',
      name: 'Modernisierung',
      category: 'Grundlagen',
      description: 'Rechte bei Modernisierungsmaßnahmen'
    }
  ]);

  // Mock data for document types
  const [documentTypes] = useState<DocumentType[]>([
    {
      id: 'rental-contract',
      name: 'Mietvertrag',
      description: 'Standard- und individuelle Mietverträge',
      icon: 'description'
    },
    {
      id: 'warning-letter',
      name: 'Abmahnung',
      description: 'Rechtliche Abmahnungen und deren Beantwortung',
      icon: 'warning'
    },
    {
      id: 'termination',
      name: 'Kündigung',
      description: 'Mietvertragskündigungen und deren Rechtmäßigkeit',
      icon: 'cancel'
    }
  ]);

  // Load user preferences on component mount
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const response = await userAPI.getPreferences();
        if (response.success) {
          setPreferences(response.data);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Benutzereinstellungen:', error);
      }
    };

    if (user) {
      loadUserPreferences();
    }
  }, [user]);

  const handlePreferenceChange = (section: keyof UserProfilePreferences, field: string, value: any) => {
    setPreferences(prev => {
      const sectionData = prev[section];
      
      // Handle different section types
      if (section === 'accessibility' || section === 'notifications' || section === 'alerts') {
        return {
          ...prev,
          [section]: {
            ...(sectionData as Record<string, unknown>),
            [field]: value
          }
        };
      } else if (section === 'language') {
        return {
          ...prev,
          [section]: value
        };
      } else if (section === 'legalTopics' || section === 'frequentDocuments') {
        return {
          ...prev,
          [section]: value
        };
      }
      
      return prev;
    });
  };

  const handleLegalTopicToggle = (topicId: string) => {
    setPreferences(prev => {
      const topics = [...prev.legalTopics];
      const index = topics.indexOf(topicId);
      
      if (index >= 0) {
        // Remove topic
        topics.splice(index, 1);
      } else {
        // Add topic
        topics.push(topicId);
      }
      
      return {
        ...prev,
        legalTopics: topics
      };
    });
  };

  const handleDocumentTypeToggle = (docTypeId: string) => {
    setPreferences(prev => {
      const docs = [...prev.frequentDocuments];
      const index = docs.indexOf(docTypeId);
      
      if (index >= 0) {
        // Remove document type
        docs.splice(index, 1);
      } else {
        // Add document type
        docs.push(docTypeId);
      }
      
      return {
        ...prev,
        frequentDocuments: docs
      };
    });
  };

  // Get main categories for legal topics
  const mainCategories = [...new Set(legalTopics.map(topic => topic.category))];

  const handleSavePreferences = async () => {
    setSaving(true);
    setSaveMessage(null);
    
    try {
      const response = await userAPI.updatePreferences(preferences);
      if (response.success) {
        setSaveMessage({
          type: 'success',
          text: 'Präferenzen erfolgreich aktualisiert'
        });
      } else {
        setSaveMessage({
          type: 'error',
          text: 'Fehler beim Aktualisieren der Präferenzen'
        });
      }
    } catch (error) {
      setSaveMessage({
        type: 'error',
        text: 'Netzwerkfehler beim Speichern der Präferenzen'
      });
    } finally {
      setSaving(false);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 2 }} role="region" aria-labelledby="enhanced-profile-settings-heading">
      <Typography 
        variant="h5" 
        gutterBottom 
        id="enhanced-profile-settings-heading"
        aria-label={t('profile.enhancedSettings')}
      >
        {t('profile.enhancedSettings')}
      </Typography>
      
      <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ mb: 3 }}
        aria-label={t('profile.enhancedSettingsDescription')}
      >
        {t('profile.enhancedSettingsDescription')}
      </Typography>

      {/* Language Settings */}
      <Box sx={{ mb: 4 }} role="region" aria-labelledby="language-settings-heading">
        <Typography 
          variant="h6" 
          gutterBottom 
          id="language-settings-heading"
          aria-label={t('profile.languageSettings')}
        >
          {t('profile.languageSettings')}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl 
              fullWidth 
              aria-labelledby="language-select-label"
              aria-describedby="language-select-description"
            >
              <InputLabel id="language-select-label">{t('common.language')}</InputLabel>
              <Select
                value={preferences.language}
                onChange={(e) => handlePreferenceChange('language', '', e.target.value as any)}
                label={t('common.language')}
                labelId="language-select-label"
                aria-describedby="language-select-description"
              >
                <MenuItem value="de">{t('languages.german')}</MenuItem>
                <MenuItem value="tr">{t('languages.turkish')}</MenuItem>
                <MenuItem value="ar">{t('languages.arabic')}</MenuItem>
                <MenuItem value="en">{t('languages.english')}</MenuItem>
              </Select>
              <Typography 
                id="language-select-description" 
                variant="caption" 
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                {t('profile.languageSettingsDescription', 'Wählen Sie die Sprache der Anwendung')}
              </Typography>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Accessibility Settings */}
      <Box sx={{ mb: 4 }} role="region" aria-labelledby="accessibility-settings-heading">
        <Typography 
          variant="h6" 
          gutterBottom 
          id="accessibility-settings-heading"
          aria-label={t('accessibility.settings.title')}
        >
          {t('accessibility.settings.title')}
        </Typography>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mb: 2 }}
          aria-label={t('accessibility.settings.description')}
        >
          {t('accessibility.settings.description')}
        </Typography>
        
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={preferences.accessibility.highContrast}
                onChange={(e) => handlePreferenceChange('accessibility', 'highContrast', e.target.checked)}
                aria-describedby="high-contrast-description"
              />
            }
            label={t('accessibility.settings.highContrast')}
          />
          <Typography 
            id="high-contrast-description" 
            variant="caption" 
            color="text.secondary"
            sx={{ ml: 4, mb: 1 }}
            aria-label={t('accessibility.settings.highContrastDesc')}
          >
            {t('accessibility.settings.highContrastDesc')}
          </Typography>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={preferences.accessibility.dyslexiaFriendly}
                onChange={(e) => handlePreferenceChange('accessibility', 'dyslexiaFriendly', e.target.checked)}
                aria-describedby="dyslexia-friendly-description"
              />
            }
            label={t('accessibility.settings.dyslexiaFriendly')}
          />
          <Typography 
            id="dyslexia-friendly-description" 
            variant="caption" 
            color="text.secondary"
            sx={{ ml: 4, mb: 1 }}
            aria-label={t('accessibility.settings.dyslexiaFriendlyDesc')}
          >
            {t('accessibility.settings.dyslexiaFriendlyDesc')}
          </Typography>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={preferences.accessibility.reducedMotion}
                onChange={(e) => handlePreferenceChange('accessibility', 'reducedMotion', e.target.checked)}
                aria-describedby="reduced-motion-description"
              />
            }
            label={t('accessibility.settings.reducedMotion')}
          />
          <Typography 
            id="reduced-motion-description" 
            variant="caption" 
            color="text.secondary"
            sx={{ ml: 4, mb: 1 }}
            aria-label={t('accessibility.settings.reducedMotionDesc')}
          >
            {t('accessibility.settings.reducedMotionDesc')}
          </Typography>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={preferences.accessibility.largerText}
                onChange={(e) => handlePreferenceChange('accessibility', 'largerText', e.target.checked)}
                aria-describedby="larger-text-description"
              />
            }
            label={t('accessibility.settings.largerText')}
          />
          <Typography 
            id="larger-text-description" 
            variant="caption" 
            color="text.secondary"
            sx={{ ml: 4, mb: 1 }}
            aria-label={t('accessibility.settings.largerTextDesc')}
          >
            {t('accessibility.settings.largerTextDesc')}
          </Typography>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={preferences.accessibility.screenReaderMode}
                onChange={(e) => handlePreferenceChange('accessibility', 'screenReaderMode', e.target.checked)}
                aria-describedby="screen-reader-description"
              />
            }
            label={t('accessibility.settings.screenReaderMode')}
          />
          <Typography 
            id="screen-reader-description" 
            variant="caption" 
            color="text.secondary"
            sx={{ ml: 4, mb: 1 }}
            aria-label={t('accessibility.settings.screenReaderModeDesc')}
          >
            {t('accessibility.settings.screenReaderModeDesc')}
          </Typography>
        </FormGroup>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Notification Settings */}
      <Box sx={{ mb: 4 }} role="region" aria-labelledby="notification-settings-heading">
        <Typography 
          variant="h6" 
          gutterBottom 
          id="notification-settings-heading"
          aria-label={t('profile.notificationSettings')}
        >
          {t('profile.notificationSettings')}
        </Typography>
        
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.notifications.email}
                onChange={(e) => handlePreferenceChange('notifications', 'email', e.target.checked)}
                aria-describedby="email-notifications-description"
              />
            }
            label={t('profile.emailNotifications')}
          />
          <Typography 
            id="email-notifications-description" 
            variant="caption" 
            color="text.secondary"
            sx={{ ml: 4, mb: 1 }}
            aria-label={t('profile.emailNotificationsDescription', 'Erhalten Sie Benachrichtigungen per E-Mail')}
          >
            {t('profile.emailNotificationsDescription', 'Erhalten Sie Benachrichtigungen per E-Mail')}
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={preferences.notifications.push}
                onChange={(e) => handlePreferenceChange('notifications', 'push', e.target.checked)}
                aria-describedby="push-notifications-description"
              />
            }
            label={t('profile.pushNotifications')}
          />
          <Typography 
            id="push-notifications-description" 
            variant="caption" 
            color="text.secondary"
            sx={{ ml: 4, mb: 1 }}
            aria-label={t('profile.pushNotificationsDescription', 'Erhalten Sie Push-Benachrichtigungen auf Ihrem Gerät')}
          >
            {t('profile.pushNotificationsDescription', 'Erhalten Sie Push-Benachrichtigungen auf Ihrem Gerät')}
          </Typography>
        </FormGroup>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Legal Topics */}
      <Box sx={{ mb: 4 }} role="region" aria-labelledby="legal-topics-heading">
        <Typography 
          variant="h6" 
          gutterBottom 
          id="legal-topics-heading"
          aria-label={t('profile.legalTopics')}
        >
          {t('profile.legalTopics')}
        </Typography>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mb: 2 }}
          aria-label={t('profile.selectRelevantTopics')}
        >
          {t('profile.selectRelevantTopics')}
        </Typography>
        
        {mainCategories.map(category => {
          const categoryTopics = legalTopics.filter(topic => topic.category === category && !topic.parentId);
          return (
            <Box key={category} sx={{ mb: 3 }} role="group" aria-labelledby={`category-${category}-heading`}>
              <Typography 
                variant="subtitle1" 
                sx={{ fontWeight: 'bold', mb: 1 }}
                id={`category-${category}-heading`}
                aria-label={category}
              >
                {category}
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }} role="list">
                {categoryTopics.map(topic => (
                  <Chip
                    key={topic.id}
                    label={topic.name}
                    clickable
                    color={preferences.legalTopics.includes(topic.id) ? 'primary' : 'default'}
                    onClick={() => handleLegalTopicToggle(topic.id)}
                    sx={{ mb: 1 }}
                    role="checkbox"
                    aria-checked={preferences.legalTopics.includes(topic.id)}
                    aria-label={`${topic.name} ${preferences.legalTopics.includes(topic.id) ? 'ausgewählt' : 'nicht ausgewählt'}`}
                  />
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Frequent Documents */}
      <Box sx={{ mb: 4 }} role="region" aria-labelledby="frequent-documents-heading">
        <Typography 
          variant="h6" 
          gutterBottom 
          id="frequent-documents-heading"
          aria-label={t('profile.frequentDocuments')}
        >
          {t('profile.frequentDocuments')}
        </Typography>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mb: 2 }}
          aria-label={t('profile.selectFrequentDocuments')}
        >
          {t('profile.selectFrequentDocuments')}
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }} role="list">
          {documentTypes.map(docType => (
            <Chip
              key={docType.id}
              label={docType.name}
              clickable
              color={preferences.frequentDocuments.includes(docType.id) ? 'primary' : 'default'}
              onClick={() => handleDocumentTypeToggle(docType.id)}
              sx={{ mb: 1 }}
              role="checkbox"
              aria-checked={preferences.frequentDocuments.includes(docType.id)}
              aria-label={`${docType.name} ${preferences.frequentDocuments.includes(docType.id) ? 'ausgewählt' : 'nicht ausgewählt'}`}
            />
          ))}
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Alert Preferences */}
      <Box sx={{ mb: 4 }} role="region" aria-labelledby="alert-preferences-heading">
        <Typography 
          variant="h6" 
          gutterBottom 
          id="alert-preferences-heading"
          aria-label={t('profile.alertPreferences')}
        >
          {t('profile.alertPreferences')}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth aria-labelledby="new-case-law-label">
              <InputLabel id="new-case-law-label">{t('profile.newCaseLawAlerts')}</InputLabel>
              <Select
                value={preferences.alerts.newCaseLaw}
                onChange={(e) => handlePreferenceChange('alerts', 'newCaseLaw', e.target.value)}
                label={t('profile.newCaseLawAlerts')}
                labelId="new-case-law-label"
              >
                <MenuItem value="instant">{t('profile.instant')}</MenuItem>
                <MenuItem value="daily">{t('profile.daily')}</MenuItem>
                <MenuItem value="weekly">{t('profile.weekly')}</MenuItem>
                <MenuItem value="disabled">{t('profile.disabled')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth aria-labelledby="document-updates-label">
              <InputLabel id="document-updates-label">{t('profile.documentUpdateAlerts')}</InputLabel>
              <Select
                value={preferences.alerts.documentUpdates}
                onChange={(e) => handlePreferenceChange('alerts', 'documentUpdates', e.target.value)}
                label={t('profile.documentUpdateAlerts')}
                labelId="document-updates-label"
              >
                <MenuItem value="instant">{t('profile.instant')}</MenuItem>
                <MenuItem value="daily">{t('profile.daily')}</MenuItem>
                <MenuItem value="disabled">{t('profile.disabled')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth aria-labelledby="newsletter-label">
              <InputLabel id="newsletter-label">{t('profile.newsletter')}</InputLabel>
              <Select
                value={preferences.alerts.newsletter}
                onChange={(e) => handlePreferenceChange('alerts', 'newsletter', e.target.value)}
                label={t('profile.newsletter')}
                labelId="newsletter-label"
              >
                <MenuItem value="monthly">{t('profile.monthly')}</MenuItem>
                <MenuItem value="disabled">{t('profile.disabled')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Save Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        {saveMessage && (
          <Typography 
            color={saveMessage.type === 'success' ? 'success.main' : 'error.main'}
            sx={{ mr: 2, alignSelf: 'center' }}
            role="alert"
            aria-live="polite"
          >
            {saveMessage.text}
          </Typography>
        )}
        <Button
          variant="contained"
          onClick={handleSavePreferences}
          disabled={saving}
          aria-busy={saving}
          aria-label={saving ? t('common.saving') : t('common.save')}
        >
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </Box>
    </Paper>
  );
};

export default EnhancedProfileSettings;
import React from 'react';
import { Container, Typography, Box, Tabs, Tab, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';
import EnhancedProfileSettings from '../components/EnhancedProfileSettings';

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('nav.profile')}
        </Typography>
        
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="profile tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label={t('profile.basicInfo')} />
            <Tab label={t('profile.enhancedSettings')} />
          </Tabs>
        </Paper>
        
        {activeTab === 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('profile.basicInfo')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('profile.basicInfoDescription')}
            </Typography>
            {/* Basic profile information would go here */}
          </Paper>
        )}
        
        {activeTab === 1 && <EnhancedProfileSettings />}
      </Box>
    </Container>
  );
};

export default ProfilePage;
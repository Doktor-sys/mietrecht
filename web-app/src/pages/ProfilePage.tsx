import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('nav.profile')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Profil-Verwaltung
        </Typography>
      </Box>
    </Container>
  );
};

export default ProfilePage;

import React from 'react';
import { Container, Typography, Box, Button, Grid, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Chat, Description, Gavel } from '@mui/icons-material';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const features = [
    {
      icon: <Chat sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: 'KI-Chat',
      description: 'Stellen Sie Ihre mietrechtlichen Fragen und erhalten Sie sofortige Antworten',
      action: () => navigate('/chat'),
    },
    {
      icon: <Description sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: 'Dokumentenanalyse',
      description: 'Laden Sie Mietverträge und Dokumente zur Analyse hoch',
      action: () => navigate('/documents'),
    },
    {
      icon: <Gavel sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: 'Anwaltsvermittlung',
      description: 'Finden Sie spezialisierte Mietrechtsanwälte in Ihrer Nähe',
      action: () => navigate('/lawyers'),
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Willkommen bei SmartLaw Agent
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Ihre KI-gestützte Mietrechtsberatung
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/chat')}
          sx={{ mt: 3 }}
        >
          Jetzt starten
        </Button>
      </Box>

      <Grid container spacing={4} sx={{ mt: 4 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                p: 2,
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 6,
                },
              }}
              onClick={feature.action}
            >
              <CardContent>
                {feature.icon}
                <Typography variant="h5" component="h2" sx={{ mt: 2, mb: 1 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default HomePage;

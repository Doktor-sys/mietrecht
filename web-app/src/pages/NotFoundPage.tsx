import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h5" gutterBottom>
          Seite nicht gefunden
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Die gesuchte Seite existiert nicht.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          Zur Startseite
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage;

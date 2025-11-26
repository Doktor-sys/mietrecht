import React from 'react';
import { Box, Container, Typography, Link } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box component="footer" role="contentinfo" sx={{ bgcolor: 'background.paper', py: 3, mt: 'auto' }}>
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          © {new Date().getFullYear()} SmartLaw Agent - Mietrecht. Alle Rechte vorbehalten.
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mt: 1 }}
          component="nav"
          aria-label="Footer-Navigation"
        >
          <Link href="/datenschutz" color="inherit" aria-label="Datenschutzerklärung">
            Datenschutz
          </Link>
          {' | '}
          <Link href="/impressum" color="inherit" aria-label="Impressum">
            Impressum
          </Link>
          {' | '}
          <Link href="/agb" color="inherit" aria-label="Allgemeine Geschäftsbedingungen">
            AGB
          </Link>
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;

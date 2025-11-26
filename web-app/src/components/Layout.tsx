import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import Header from './Header';
import Footer from './Footer';
import SkipToContent from './SkipToContent';

const Layout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <SkipToContent />
      <Header />
      <Box
        component="main"
        id="main-content"
        tabIndex={-1}
        sx={{ flexGrow: 1, py: 3, outline: 'none' }}
        role="main"
        aria-label="Hauptinhalt"
      >
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
};

export default Layout;

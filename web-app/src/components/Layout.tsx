import React from 'react';
import { Box } from '@mui/material';
import Header from './Header';
import Footer from './Footer';
import EnhancedSkipToContent from './EnhancedSkipToContent';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        position: 'relative'
      }}
      id="layout-container"
    >
      <EnhancedSkipToContent 
        targets={[
          { id: 'main-content', label: 'Hauptinhalt' },
          { id: 'navigation', label: 'Navigation' },
          { id: 'chat-messages', label: 'Chat' },
          { id: 'documents-section', label: 'Dokumente' },
          { id: 'lawyers-section', label: 'Anwälte' }
        ]}
      />
      <Header />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          pt: 8,
          pb: 4,
          px: { xs: 2, sm: 3, md: 4 }
        }}
        id="main-content"
        role="main"
      >
        {children}
      </Box>
      <Footer />
    </Box>
  );
};

export default Layout;
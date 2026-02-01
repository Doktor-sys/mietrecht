import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import DocumentsPage from './pages/DocumentsPage';
import LawyersPage from './pages/LawyersPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import AccessibilitySettingsPanel from './components/AccessibilitySettingsPanel';
import IntegrationDashboardPage from './pages/IntegrationDashboardPage';
import LegalAgentDashboard from './pages/LegalAgentDashboard';
import { AccessibilityProvider } from './components/EnhancedAccessibilityProvider';
import KeyboardNavigationManager from './components/KeyboardNavigationManager';

const App: React.FC = () => {
  const { i18n } = useTranslation();

  return (
    <AccessibilityProvider>
      <KeyboardNavigationManager>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/lawyers" element={<LawyersPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/accessibility-settings" element={<AccessibilitySettingsPanel />} />
            <Route path="/integrations" element={<IntegrationDashboardPage />} />
            <Route path="/agent" element={<LegalAgentDashboard />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </KeyboardNavigationManager>
    </AccessibilityProvider>
  );
};

export default App;

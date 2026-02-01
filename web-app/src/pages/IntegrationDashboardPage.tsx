import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import IntegrationDashboard from '../components/IntegrationDashboard';

const IntegrationDashboardPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <React.Fragment>
      <Helmet>
        <title>{t('integrations.pageTitle')}</title>
        <meta name="description" content={t('integrations.pageDescription')} />
      </Helmet>
      
      <IntegrationDashboard />
    </React.Fragment>
  );
};

export default IntegrationDashboardPage;
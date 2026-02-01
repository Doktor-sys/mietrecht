import * as React from 'react';
import { Helmet } from 'react-helmet-async';

const TestHelmetPage: React.FC = () => {
  return (
    <div>
      <Helmet>
        <title>Test Page</title>
      </Helmet>
      <h1>Test Page</h1>
    </div>
  );
};

export default TestHelmetPage;
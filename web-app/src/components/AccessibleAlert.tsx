import React from 'react';
import { Alert, AlertProps } from '@mui/material';

interface AccessibleAlertProps extends AlertProps {
  ariaLive?: 'polite' | 'assertive' | 'off';
}

const AccessibleAlert: React.FC<AccessibleAlertProps> = ({
  ariaLive = 'polite',
  severity = 'info',
  children,
  ...props
}) => {
  return (
    <Alert
      {...props}
      severity={severity}
      role="alert"
      aria-live={ariaLive}
      aria-atomic="true"
    >
      {children}
    </Alert>
  );
};

export default AccessibleAlert;

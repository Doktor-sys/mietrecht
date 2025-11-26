import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';

interface AccessibleButtonProps extends ButtonProps {
  loading?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  loading = false,
  ariaLabel,
  ariaDescribedBy,
  children,
  disabled,
  ...props
}) => {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      role="button"
    >
      {loading ? (
        <>
          <CircularProgress
            size={20}
            sx={{ mr: 1 }}
            aria-label="Lädt"
          />
          {children}
        </>
      ) : (
        children
      )}
    </Button>
  );
};

export default AccessibleButton;

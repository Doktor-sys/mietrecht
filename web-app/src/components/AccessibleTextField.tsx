import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';

interface AccessibleTextFieldProps extends Omit<TextFieldProps, 'inputProps'> {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  errorMessage?: string;
}

const AccessibleTextField: React.FC<AccessibleTextFieldProps> = ({
  ariaLabel,
  ariaDescribedBy,
  errorMessage,
  error,
  helperText,
  id,
  label,
  required,
  ...props
}) => {
  const fieldId = id || `textfield-${label?.toString().toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = error && errorMessage ? `${fieldId}-error` : undefined;
  const helperId = helperText ? `${fieldId}-helper` : undefined;

  return (
    <TextField
      {...props}
      id={fieldId}
      label={label}
      required={required}
      error={error}
      helperText={error && errorMessage ? errorMessage : helperText}
      inputProps={{
        'aria-label': ariaLabel || (typeof label === 'string' ? label : undefined),
        'aria-describedby': [ariaDescribedBy, errorId, helperId].filter(Boolean).join(' ') || undefined,
        'aria-required': required,
        'aria-invalid': error,
      }}
      FormHelperTextProps={{
        id: error ? errorId : helperId,
        role: error ? 'alert' : undefined,
      }}
    />
  );
};

export default AccessibleTextField;

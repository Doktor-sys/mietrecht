import React, { useState } from 'react';
import { Container, Box, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../store/slices/authSlice';
import { RootState, AppDispatch } from '../store';
import AccessibleTextField from '../components/AccessibleTextField';
import AccessibleButton from '../components/AccessibleButton';
import AccessibleAlert from '../components/AccessibleAlert';

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'tenant',
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(register(formData));
    if (register.fulfilled.match(result)) {
      navigate('/chat');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        role="region"
        aria-labelledby="register-title"
      >
        <Typography component="h1" variant="h4" gutterBottom id="register-title">
          {t('auth.registerTitle')}
        </Typography>
        
        {error && (
          <AccessibleAlert severity="error" sx={{ width: '100%', mt: 2 }} ariaLive="assertive">
            {error}
          </AccessibleAlert>
        )}
        
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ mt: 3, width: '100%' }}
          aria-label="Registrierungsformular"
        >
          <AccessibleTextField
            margin="normal"
            required
            fullWidth
            id="email"
            label={t('auth.email')}
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
            ariaLabel="E-Mail-Adresse eingeben"
          />
          <AccessibleTextField
            margin="normal"
            required
            fullWidth
            name="password"
            label={t('auth.password')}
            type="password"
            id="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            ariaLabel="Passwort eingeben"
            helperText="Mindestens 8 Zeichen"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="userType-label">{t('auth.userType')}</InputLabel>
            <Select
              labelId="userType-label"
              id="userType"
              name="userType"
              value={formData.userType}
              label={t('auth.userType')}
              onChange={handleChange}
              inputProps={{
                'aria-label': 'Benutzertyp auswählen',
                'aria-required': true,
              }}
            >
              <MenuItem value="tenant" aria-label={t('auth.tenant')}>
                {t('auth.tenant')}
              </MenuItem>
              <MenuItem value="landlord" aria-label={t('auth.landlord')}>
                {t('auth.landlord')}
              </MenuItem>
              <MenuItem value="business" aria-label={t('auth.business')}>
                {t('auth.business')}
              </MenuItem>
            </Select>
          </FormControl>
          <AccessibleButton
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            loading={loading}
            ariaLabel={loading ? t('common.loading') : t('auth.register')}
          >
            {loading ? t('common.loading') : t('auth.register')}
          </AccessibleButton>
          <Box sx={{ textAlign: 'center' }}>
            <Link to="/login" style={{ textDecoration: 'none' }} aria-label="Zur Anmeldeseite">
              <Typography variant="body2" color="primary">
                Bereits ein Konto? Jetzt anmelden
              </Typography>
            </Link>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default RegisterPage;

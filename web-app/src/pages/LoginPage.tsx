import React, { useState } from 'react';
import { Container, Box, Typography } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/slices/authSlice';
import { RootState, AppDispatch } from '../store';
import AccessibleTextField from '../components/AccessibleTextField';
import AccessibleButton from '../components/AccessibleButton';
import AccessibleAlert from '../components/AccessibleAlert';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(login(formData));
    if (login.fulfilled.match(result)) {
      navigate('/chat');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        role="region"
        aria-labelledby="login-title"
      >
        <Typography component="h1" variant="h4" gutterBottom id="login-title">
          {t('auth.loginTitle')}
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
          aria-label="Anmeldeformular"
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
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            ariaLabel="Passwort eingeben"
          />
          <AccessibleButton
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            loading={loading}
            ariaLabel={loading ? t('common.loading') : t('auth.login')}
          >
            {loading ? t('common.loading') : t('auth.login')}
          </AccessibleButton>
          <Box sx={{ textAlign: 'center' }}>
            <Link to="/register" style={{ textDecoration: 'none' }} aria-label="Zur Registrierungsseite">
              <Typography variant="body2" color="primary">
                Noch kein Konto? Jetzt registrieren
              </Typography>
            </Link>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;

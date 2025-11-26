import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Menu, MenuItem } from '@mui/material';
import { Menu as MenuIcon, AccountCircle } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleClose();
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <AppBar position="static" component="header" role="banner">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
          aria-label={t('app.title')}
        >
          {t('app.title')}
        </Typography>
        
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }} component="nav" role="navigation" aria-label="Hauptnavigation">
          {isAuthenticated && (
            <>
              <Button color="inherit" component={RouterLink} to="/chat" aria-label={t('nav.chat')}>
                {t('nav.chat')}
              </Button>
              <Button color="inherit" component={RouterLink} to="/documents" aria-label={t('nav.documents')}>
                {t('nav.documents')}
              </Button>
              <Button color="inherit" component={RouterLink} to="/lawyers" aria-label={t('nav.lawyers')}>
                {t('nav.lawyers')}
              </Button>
            </>
          )}
          
          <Box role="group" aria-label="Sprachauswahl" sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={() => changeLanguage('de')}
              color="inherit"
              size="small"
              aria-label="Sprache auf Deutsch ändern"
              aria-pressed={i18n.language === 'de'}
            >
              DE
            </Button>
            <Button
              onClick={() => changeLanguage('tr')}
              color="inherit"
              size="small"
              aria-label="Dili Türkçe olarak değiştir"
              aria-pressed={i18n.language === 'tr'}
            >
              TR
            </Button>
            <Button
              onClick={() => changeLanguage('ar')}
              color="inherit"
              size="small"
              aria-label="تغيير اللغة إلى العربية"
              aria-pressed={i18n.language === 'ar'}
            >
              AR
            </Button>
          </Box>
          
          {isAuthenticated ? (
            <>
              <IconButton
                size="large"
                aria-label="Benutzerkonto-Menü öffnen"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                aria-expanded={Boolean(anchorEl)}
                onClick={handleMenu}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                aria-label="Benutzerkonto-Optionen"
              >
                <MenuItem
                  component={RouterLink}
                  to="/profile"
                  onClick={handleClose}
                  aria-label={t('nav.profile')}
                >
                  {t('nav.profile')}
                </MenuItem>
                <MenuItem onClick={handleLogout} aria-label={t('nav.logout')}>
                  {t('nav.logout')}
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login" aria-label={t('nav.login')}>
                {t('nav.login')}
              </Button>
              <Button color="inherit" component={RouterLink} to="/register" aria-label={t('nav.register')}>
                {t('nav.register')}
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

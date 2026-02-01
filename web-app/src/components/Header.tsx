import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Menu, MenuItem, Divider } from '@mui/material';
import { Menu as MenuIcon, AccountCircle, SettingsAccessibility } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [languageAnchorEl, setLanguageAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLanguageMenu = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setLanguageAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleClose();
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    handleClose();
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
              <Button color="inherit" component={RouterLink} to="/integrations" aria-label={t('nav.integrations')}>
                {t('nav.integrations')}
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
                <MenuItem
                  component={RouterLink}
                  to="/accessibility-settings"
                  onClick={handleClose}
                  aria-label={t('accessibility.settings.title')}
                >
                  <SettingsAccessibility sx={{ mr: 1 }} />
                  {t('accessibility.settings.title')}
                </MenuItem>
                <Divider />
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
        
        {/* Mobile menu */}
        <IconButton
          size="large"
          aria-label="Menü öffnen"
          aria-controls="menu-mobile"
          aria-haspopup="true"
          onClick={handleMenu}
          color="inherit"
          sx={{ display: { xs: 'flex', md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Menu
          id="menu-mobile"
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
          aria-label="Mobile Navigation"
        >
          {isAuthenticated ? (
            <>
              <MenuItem
                component={RouterLink}
                to="/chat"
                onClick={handleClose}
                aria-label={t('nav.chat')}
              >
                {t('nav.chat')}
              </MenuItem>
              <MenuItem
                component={RouterLink}
                to="/documents"
                onClick={handleClose}
                aria-label={t('nav.documents')}
              >
                {t('nav.documents')}
              </MenuItem>
              <MenuItem
                component={RouterLink}
                to="/lawyers"
                onClick={handleClose}
                aria-label={t('nav.lawyers')}
              >
                {t('nav.lawyers')}
              </MenuItem>
              <MenuItem
                component={RouterLink}
                to="/integrations"
                onClick={handleClose}
                aria-label={t('nav.integrations')}
              >
                {t('nav.integrations')}
              </MenuItem>
              <Divider />
              <MenuItem
                component={RouterLink}
                to="/profile"
                onClick={handleClose}
                aria-label={t('nav.profile')}
              >
                {t('nav.profile')}
              </MenuItem>
              <MenuItem
                component={RouterLink}
                to="/accessibility-settings"
                onClick={handleClose}
                aria-label={t('accessibility.settings.title')}
              >
                <SettingsAccessibility sx={{ mr: 1 }} />
                {t('accessibility.settings.title')}
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} aria-label={t('nav.logout')}>
                {t('nav.logout')}
              </MenuItem>
            </>
          ) : (
            <>
              <MenuItem
                component={RouterLink}
                to="/login"
                onClick={handleClose}
                aria-label={t('nav.login')}
              >
                {t('nav.login')}
              </MenuItem>
              <MenuItem
                component={RouterLink}
                to="/register"
                onClick={handleClose}
                aria-label={t('nav.register')}
              >
                {t('nav.register')}
              </MenuItem>
            </>
          )}
          
          <Divider />
          <MenuItem onClick={handleLanguageMenu} aria-label="Sprachauswahl öffnen">
            {t('nav.language')}
          </MenuItem>
          <Menu
            id="menu-language"
            anchorEl={languageAnchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(languageAnchorEl)}
            onClose={handleClose}
            aria-label="Sprachauswahl"
          >
            <MenuItem 
              onClick={() => changeLanguage('de')} 
              aria-label="Sprache auf Deutsch ändern"
              aria-pressed={i18n.language === 'de'}
            >
              Deutsch
            </MenuItem>
            <MenuItem 
              onClick={() => changeLanguage('tr')} 
              aria-label="Dili Türkçe olarak değiştir"
              aria-pressed={i18n.language === 'tr'}
            >
              Türkçe
            </MenuItem>
            <MenuItem 
              onClick={() => changeLanguage('ar')} 
              aria-label="تغيير اللغة إلى العربية"
              aria-pressed={i18n.language === 'ar'}
            >
              العربية
            </MenuItem>
          </Menu>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
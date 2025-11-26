import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Rating,
  Avatar,
  Alert,
  Paper,
  Divider,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MapIcon from '@mui/icons-material/Map';
import ListIcon from '@mui/icons-material/List';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setLawyers, selectLawyer, setSearchCriteria, setLoading } from '../store/slices/lawyerSlice';
import { lawyerAPI } from '../services/api';
import LawyerDetailsDialog from '../components/LawyerDetailsDialog';
import BookingDialog from '../components/BookingDialog';
import LawyerMapView from '../components/LawyerMapView';

const LawyersPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { lawyers, searchCriteria, loading } = useSelector((state: RootState) => state.lawyer);
  const [location, setLocation] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number>(50);
  const [minRating, setMinRating] = useState<number>(0);
  const [maxHourlyRate, setMaxHourlyRate] = useState<number>(500);
  const [languages, setLanguages] = useState<string[]>([]);

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    try {
      dispatch(setLoading(true));
      setError(null);

      const criteria = {
        location: location || undefined,
        specialization: specialization || undefined,
        maxDistance: maxDistance || undefined,
        minRating: minRating > 0 ? minRating : undefined,
        maxHourlyRate: maxHourlyRate < 500 ? maxHourlyRate : undefined,
        languages: languages.length > 0 ? languages : undefined,
      };

      dispatch(setSearchCriteria(criteria));
      const response = await lawyerAPI.search(criteria);

      if (response.success && response.data) {
        dispatch(setLawyers(response.data));
      }
    } catch (err) {
      console.error('Fehler bei der Anwaltssuche:', err);
      setError(t('lawyers.error.searchFailed'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleLanguageToggle = (language: string) => {
    setLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((l) => l !== language)
        : [...prev, language]
    );
  };

  const handleViewDetails = (lawyer: any) => {
    dispatch(selectLawyer(lawyer));
    setDetailsDialogOpen(true);
  };

  const handleBookConsultation = (lawyer: any) => {
    dispatch(selectLawyer(lawyer));
    setBookingDialogOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t('lawyers.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {t('lawyers.subtitle')}
      </Typography>

      {/* Suchfilter */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label={t('lawyers.location')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('lawyers.locationPlaceholder')}
              InputProps={{
                startAdornment: <LocationOnIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>{t('lawyers.specialization')}</InputLabel>
              <Select
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                label={t('lawyers.specialization')}
              >
                <MenuItem value="">{t('lawyers.allSpecializations')}</MenuItem>
                <MenuItem value="rent_law">{t('lawyers.specializations.rentLaw')}</MenuItem>
                <MenuItem value="tenant_protection">{t('lawyers.specializations.tenantProtection')}</MenuItem>
                <MenuItem value="landlord_law">{t('lawyers.specializations.landlordLaw')}</MenuItem>
                <MenuItem value="real_estate">{t('lawyers.specializations.realEstate')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Tooltip title={t('lawyers.toggleFilters')}>
              <IconButton
                onClick={() => setShowFilters(!showFilters)}
                color={showFilters ? 'primary' : 'default'}
                sx={{ height: 56, width: '100%', border: 1, borderColor: 'divider' }}
              >
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading}
              sx={{ height: 56 }}
            >
              {t('lawyers.search')}
            </Button>
          </Grid>
        </Grid>

        {/* Erweiterte Filter */}
        {showFilters && (
          <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography gutterBottom>{t('lawyers.filters.maxDistance')}: {maxDistance} km</Typography>
                <Slider
                  value={maxDistance}
                  onChange={(_, value) => setMaxDistance(value as number)}
                  min={5}
                  max={100}
                  step={5}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography gutterBottom>{t('lawyers.filters.minRating')}</Typography>
                <Rating
                  value={minRating}
                  onChange={(_, value) => setMinRating(value || 0)}
                  size="large"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography gutterBottom>{t('lawyers.filters.maxHourlyRate')}: {maxHourlyRate}€/h</Typography>
                <Slider
                  value={maxHourlyRate}
                  onChange={(_, value) => setMaxHourlyRate(value as number)}
                  min={50}
                  max={500}
                  step={25}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography gutterBottom>{t('lawyers.filters.languages')}</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {['Deutsch', 'English', 'Türkçe', 'العربية', 'Français', 'Español'].map((lang) => (
                    <Chip
                      key={lang}
                      label={lang}
                      onClick={() => handleLanguageToggle(lang)}
                      color={languages.includes(lang) ? 'primary' : 'default'}
                      variant={languages.includes(lang) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Ansichtsmodus-Umschalter */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          {lawyers.length > 0 && t('lawyers.resultsCount', { count: lawyers.length })}
        </Typography>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, newMode) => newMode && setViewMode(newMode)}
          aria-label={t('lawyers.viewMode')}
        >
          <ToggleButton value="list" aria-label={t('lawyers.listView')}>
            <ListIcon />
          </ToggleButton>
          <ToggleButton value="map" aria-label={t('lawyers.mapView')}>
            <MapIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Suchergebnisse */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            {t('common.loading')}
          </Typography>
        </Box>
      ) : lawyers.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('lawyers.noResults')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('lawyers.noResultsHint')}
          </Typography>
        </Box>
      ) : viewMode === 'map' ? (
        <LawyerMapView
          lawyers={lawyers}
          onSelectLawyer={handleViewDetails}
          onBookLawyer={handleBookConsultation}
        />
      ) : (
        <Grid container spacing={3}>
          {lawyers.map((lawyer) => (
            <Grid item xs={12} md={6} key={lawyer.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 60,
                        height: 60,
                        bgcolor: 'primary.main',
                        mr: 2,
                      }}
                    >
                      {getInitials(lawyer.name)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6">{lawyer.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          {lawyer.location}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Rating value={lawyer.rating} readOnly size="small" />
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          ({lawyer.reviewCount} {t('lawyers.reviews')})
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    {t('lawyers.specializations.title')}:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {lawyer.specializations.map((spec, index) => (
                      <Chip key={index} label={spec} size="small" />
                    ))}
                  </Box>

                  {lawyer.hourlyRate && (
                    <Typography variant="body2" color="text.secondary">
                      {t('lawyers.hourlyRate')}: {lawyer.hourlyRate}€/h
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => handleViewDetails(lawyer)}>
                    {t('lawyers.viewProfile')}
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<CalendarMonthIcon />}
                    onClick={() => handleBookConsultation(lawyer)}
                  >
                    {t('lawyers.book')}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <LawyerDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        onBook={() => {
          setDetailsDialogOpen(false);
          setBookingDialogOpen(true);
        }}
      />

      <BookingDialog
        open={bookingDialogOpen}
        onClose={() => setBookingDialogOpen(false)}
      />
    </Container>
  );
};

export default LawyersPage;

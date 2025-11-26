import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Rating,
  Chip,
  Paper,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useTranslation } from 'react-i18next';

interface Lawyer {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviewCount: number;
  specializations: string[];
  hourlyRate?: number;
  coordinates?: { lat: number; lng: number };
}

interface LawyerMapViewProps {
  lawyers: Lawyer[];
  onSelectLawyer: (lawyer: Lawyer) => void;
  onBookLawyer: (lawyer: Lawyer) => void;
}

const LawyerMapView: React.FC<LawyerMapViewProps> = ({
  lawyers,
  onSelectLawyer,
  onBookLawyer,
}) => {
  const { t } = useTranslation();
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleMarkerClick = (lawyer: Lawyer) => {
    setSelectedLawyer(lawyer);
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, height: '600px' }}>
      {/* Karte (Platzhalter für echte Kartenintegration) */}
      <Paper
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          position: 'relative',
        }}
      >
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <LocationOnIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('lawyers.map.placeholder')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('lawyers.map.placeholderHint')}
          </Typography>
          
          {/* Simulierte Marker */}
          <Box sx={{ mt: 4, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
            {lawyers.slice(0, 5).map((lawyer, index) => (
              <Button
                key={lawyer.id}
                variant={selectedLawyer?.id === lawyer.id ? 'contained' : 'outlined'}
                size="small"
                startIcon={<LocationOnIcon />}
                onClick={() => handleMarkerClick(lawyer)}
              >
                {lawyer.name}
              </Button>
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Anwalts-Details Sidebar */}
      <Box sx={{ width: 350, overflowY: 'auto' }}>
        {selectedLawyer ? (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: 'primary.main',
                    mr: 2,
                  }}
                >
                  {getInitials(selectedLawyer.name)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedLawyer.name}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      {selectedLawyer.location}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Rating value={selectedLawyer.rating} readOnly size="small" />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({selectedLawyer.reviewCount} {t('lawyers.reviews')})
                </Typography>
              </Box>

              <Typography variant="subtitle2" gutterBottom>
                {t('lawyers.specializations.title')}:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {selectedLawyer.specializations.map((spec, index) => (
                  <Chip key={index} label={spec} size="small" />
                ))}
              </Box>

              {selectedLawyer.hourlyRate && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('lawyers.hourlyRate')}: {selectedLawyer.hourlyRate}€/h
                </Typography>
              )}

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => onSelectLawyer(selectedLawyer)}
                >
                  {t('lawyers.viewProfile')}
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<CalendarMonthIcon />}
                  onClick={() => onBookLawyer(selectedLawyer)}
                >
                  {t('lawyers.book')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('lawyers.map.selectLawyer')}
            </Typography>
          </Paper>
        )}

        {/* Liste aller Anwälte */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            {t('lawyers.allLawyers')}
          </Typography>
          {lawyers.map((lawyer) => (
            <Card
              key={lawyer.id}
              sx={{
                mb: 1,
                cursor: 'pointer',
                border: selectedLawyer?.id === lawyer.id ? 2 : 0,
                borderColor: 'primary.main',
              }}
              onClick={() => handleMarkerClick(lawyer)}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="body2" fontWeight="medium">
                  {lawyer.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <Rating value={lawyer.rating} readOnly size="small" />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    ({lawyer.reviewCount})
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default LawyerMapView;

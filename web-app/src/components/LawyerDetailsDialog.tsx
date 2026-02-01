import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  Chip,
  Rating,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Lawyer } from '../../../shared/types/src';
import LawyerReviewDialog from './LawyerReviewDialog';

interface Review {
  rating: number;
  comment: string;
  author: string;
  date: string;
}

interface ExtendedLawyer extends Lawyer {
  email?: string;
  phone?: string;
  description?: string;
  reviews?: Review[];
}

interface LawyerDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  onBook: () => void;
}

const LawyerDetailsDialog: React.FC<LawyerDetailsDialogProps> = ({ open, onClose, onBook }) => {
  const { t } = useTranslation();
  const { selectedLawyer } = useSelector((state: RootState) => state.lawyer);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  if (!selectedLawyer) return null;

  const lawyer = selectedLawyer as ExtendedLawyer;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      aria-labelledby="lawyer-details-dialog-title"
      aria-describedby="lawyer-details-dialog-description"
    >
      <DialogTitle id="lawyer-details-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'primary.main',
              mr: 2,
            }}
            aria-label={t('lawyers.details.avatar', { name: lawyer.name })}
          >
            {getInitials(lawyer.name)}
          </Avatar>
          <Box>
            <Typography variant="h5">{lawyer.name}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <Rating value={lawyer.rating} readOnly aria-label={t('lawyers.details.rating', { rating: lawyer.rating })} />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({lawyer.reviewCount} {t('lawyers.reviews')})
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography 
          id="lawyer-details-dialog-description" 
          sx={{ 
            mb: 2, 
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0
          }}
        >
          {t('lawyers.details.description', { name: lawyer.name })}
        </Typography>
        
        {/* Kontaktinformationen */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }} role="region" aria-labelledby="contact-info-heading">
          <Typography variant="subtitle1" gutterBottom id="contact-info-heading">
            {t('lawyers.details.contact')}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ mr: 1 }}>📍</Typography>
              <Typography variant="body2">{lawyer.location}</Typography>
            </Box>
            {lawyer.email && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 1 }}>✉️</Typography>
                <Typography variant="body2">{lawyer.email}</Typography>
              </Box>
            )}
            {lawyer.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 1 }}>📞</Typography>
                <Typography variant="body2">{lawyer.phone}</Typography>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Spezialisierungen */}
        <Box sx={{ mb: 3 }} role="region" aria-labelledby="specializations-heading">
          <Typography variant="subtitle1" gutterBottom id="specializations-heading">
            {t('lawyers.specializations.title')}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {lawyer.specializations.map((spec: string, index: number) => (
              <Chip key={index} label={spec} color="primary" variant="outlined" aria-label={spec} />
            ))}
          </Box>
        </Box>

        {/* Sprachen */}
        {lawyer.languages && lawyer.languages.length > 0 && (
          <Box sx={{ mb: 3 }} role="region" aria-labelledby="languages-heading">
            <Typography variant="subtitle1" gutterBottom id="languages-heading">
              <span style={{ marginRight: '8px' }}>🌐</span>
              {t('lawyers.details.languages')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {lawyer.languages.map((lang: string, index: number) => (
                <Chip key={index} label={lang} size="small" aria-label={lang} />
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Beschreibung */}
        {lawyer.description && (
          <Box sx={{ mb: 3 }} role="region" aria-labelledby="about-heading">
            <Typography variant="subtitle1" gutterBottom id="about-heading">
              {t('lawyers.details.about')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {lawyer.description}
            </Typography>
          </Box>
        )}

        {/* Preise */}
        {lawyer.hourlyRate && (
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }} role="region" aria-labelledby="pricing-heading">
            <Typography variant="subtitle1" gutterBottom id="pricing-heading">
              {t('lawyers.details.pricing')}
            </Typography>
            <Typography variant="h6" color="primary.main">
              {lawyer.hourlyRate}€/h
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('lawyers.details.pricingNote')}
            </Typography>
          </Paper>
        )}

        {/* Bewertungen */}
        <Box role="region" aria-labelledby="reviews-heading">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" id="reviews-heading">
              {t('lawyers.reviews')}
            </Typography>
            <Button
              size="small"
              startIcon={<StarIcon />}
              onClick={() => setReviewDialogOpen(true)}
              aria-label={t('lawyers.details.reviews.viewAll')}
            >
              {t('lawyers.details.reviews.viewAll')}
            </Button>
          </Box>
          {lawyer.reviews && lawyer.reviews.length > 0 ? (
            <List>
              {lawyer.reviews.slice(0, 3).map((review: Review, index: number) => (
                <ListItem key={index} alignItems="flex-start" divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Rating value={review.rating} readOnly size="small" aria-label={t('lawyers.details.reviews.rating', { rating: review.rating })} />
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          {new Date(review.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          {review.comment}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          - {review.author}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {t('lawyers.details.reviews.noReviews')}
              </Typography>
            </Paper>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} aria-label={t('common.close')}>{t('common.close')}</Button>
        <Button variant="contained" onClick={onBook} aria-label={t('lawyers.book')}>
          {t('lawyers.book')}
        </Button>
      </DialogActions>

      <LawyerReviewDialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        lawyer={lawyer}
      />
    </Dialog>
  );
};

export default LawyerDetailsDialog;
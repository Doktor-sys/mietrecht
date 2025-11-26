import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Rating,
  Alert,
  Paper,
  Avatar,
  Divider,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import { useTranslation } from 'react-i18next';
import { lawyerAPI } from '../services/api';

interface Review {
  rating: number;
  comment: string;
  author: string;
  date: string;
}

interface Lawyer {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  reviews?: Review[];
}

interface LawyerReviewDialogProps {
  open: boolean;
  onClose: () => void;
  lawyer: Lawyer | null;
  onReviewSubmitted?: () => void;
}

const LawyerReviewDialog: React.FC<LawyerReviewDialogProps> = ({
  open,
  onClose,
  lawyer,
  onReviewSubmitted,
}) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const handleSubmitReview = async () => {
    if (!lawyer) return;

    if (rating === 0) {
      setError(t('lawyers.reviews.error.ratingRequired'));
      return;
    }

    if (!comment.trim()) {
      setError(t('lawyers.reviews.error.commentRequired'));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await lawyerAPI.submitReview(lawyer.id, {
        rating,
        comment: comment.trim(),
      });

      if (response.success) {
        setSuccess(true);
        setRating(0);
        setComment('');
        setShowReviewForm(false);
        
        if (onReviewSubmitted) {
          onReviewSubmitted();
        }

        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error('Fehler beim Einreichen der Bewertung:', err);
      setError(t('lawyers.reviews.error.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    setError(null);
    setSuccess(false);
    setShowReviewForm(false);
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!lawyer) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {t('lawyers.reviews.title')} - {lawyer.name}
      </DialogTitle>
      <DialogContent>
        {/* Gesamtbewertung */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3, textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom>
            {lawyer.rating.toFixed(1)}
          </Typography>
          <Rating value={lawyer.rating} readOnly precision={0.1} size="large" />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('lawyers.reviews.basedOn', { count: lawyer.reviewCount })}
          </Typography>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {t('lawyers.reviews.success')}
          </Alert>
        )}

        {/* Bewertung schreiben */}
        {!showReviewForm ? (
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              startIcon={<StarIcon />}
              onClick={() => setShowReviewForm(true)}
            >
              {t('lawyers.reviews.writeReview')}
            </Button>
          </Box>
        ) : (
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('lawyers.reviews.yourReview')}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('lawyers.reviews.yourRating')}
              </Typography>
              <Rating
                value={rating}
                onChange={(_, value) => setRating(value || 0)}
                size="large"
              />
            </Box>
            <TextField
              fullWidth
              multiline
              rows={4}
              label={t('lawyers.reviews.yourComment')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('lawyers.reviews.commentPlaceholder')}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowReviewForm(false)} disabled={submitting}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmitReview}
                disabled={submitting || rating === 0 || !comment.trim()}
              >
                {submitting ? t('lawyers.reviews.submitting') : t('lawyers.reviews.submit')}
              </Button>
            </Box>
          </Paper>
        )}

        {/* Bestehende Bewertungen */}
        <Typography variant="h6" gutterBottom>
          {t('lawyers.reviews.allReviews')}
        </Typography>
        {lawyer.reviews && lawyer.reviews.length > 0 ? (
          <Box>
            {lawyer.reviews.map((review, index) => (
              <Box key={index}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    {getInitials(review.author)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="subtitle2">{review.author}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(review.date)}
                      </Typography>
                    </Box>
                    <Rating value={review.rating} readOnly size="small" sx={{ mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {review.comment}
                    </Typography>
                  </Box>
                </Box>
                {index < lawyer.reviews.length - 1 && <Divider sx={{ my: 2 }} />}
              </Box>
            ))}
          </Box>
        ) : (
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('lawyers.reviews.noReviews')}
            </Typography>
          </Paper>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LawyerReviewDialog;

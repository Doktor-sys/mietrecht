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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Grid,
  Chip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { lawyerAPI } from '../services/api';

interface BookingDialogProps {
  open: boolean;
  onClose: () => void;
}

const BookingDialog: React.FC<BookingDialogProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { selectedLawyer } = useSelector((state: RootState) => state.lawyer);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [consultationType, setConsultationType] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [booking, setBooking] = useState(false);

  const steps = [
    t('lawyers.booking.selectDateTime'),
    t('lawyers.booking.consultationType'),
    t('lawyers.booking.confirmation'),
  ];

  // Verfügbare Zeitslots (in einer echten App würden diese vom Backend kommen)
  const availableDates = [
    new Date(Date.now() + 86400000).toISOString().split('T')[0],
    new Date(Date.now() + 172800000).toISOString().split('T')[0],
    new Date(Date.now() + 259200000).toISOString().split('T')[0],
    new Date(Date.now() + 345600000).toISOString().split('T')[0],
    new Date(Date.now() + 432000000).toISOString().split('T')[0],
  ];

  const availableTimes = [
    '09:00',
    '10:00',
    '11:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
  ];

  const consultationTypes = [
    { value: 'video', label: t('lawyers.booking.types.video') },
    { value: 'phone', label: t('lawyers.booking.types.phone') },
    { value: 'in_person', label: t('lawyers.booking.types.inPerson') },
  ];

  const handleNext = () => {
    if (activeStep === 0 && (!selectedDate || !selectedTime)) {
      setError(t('lawyers.booking.error.selectDateTime'));
      return;
    }
    if (activeStep === 1 && !consultationType) {
      setError(t('lawyers.booking.error.selectType'));
      return;
    }
    setError(null);
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prev) => prev - 1);
  };

  const handleBooking = async () => {
    if (!selectedLawyer) return;

    try {
      setBooking(true);
      setError(null);

      const timeSlot = `${selectedDate}T${selectedTime}:00`;
      const response = await lawyerAPI.bookConsultation(selectedLawyer.id, timeSlot, {
        consultationType,
        notes,
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (err) {
      console.error('Fehler bei der Buchung:', err);
      setError(t('lawyers.booking.error.bookingFailed'));
    } finally {
      setBooking(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setSelectedDate('');
    setSelectedTime('');
    setConsultationType('');
    setNotes('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!selectedLawyer) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {t('lawyers.booking.title')} - {selectedLawyer.name}
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {t('lawyers.booking.success')}
          </Alert>
        )}

        {/* Schritt 1: Datum und Zeit auswählen */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('lawyers.booking.selectDateTime')}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('lawyers.booking.selectDate')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {availableDates.map((date) => (
                    <Chip
                      key={date}
                      label={formatDate(date)}
                      onClick={() => setSelectedDate(date)}
                      color={selectedDate === date ? 'primary' : 'default'}
                      variant={selectedDate === date ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Grid>
              {selectedDate && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('lawyers.booking.selectTime')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {availableTimes.map((time) => (
                      <Chip
                        key={time}
                        label={time}
                        onClick={() => setSelectedTime(time)}
                        color={selectedTime === time ? 'primary' : 'default'}
                        variant={selectedTime === time ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* Schritt 2: Beratungsart auswählen */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('lawyers.booking.consultationType')}
            </Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>{t('lawyers.booking.selectConsultationType')}</InputLabel>
              <Select
                value={consultationType}
                onChange={(e) => setConsultationType(e.target.value)}
                label={t('lawyers.booking.selectConsultationType')}
              >
                {consultationTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={4}
              label={t('lawyers.booking.notes')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('lawyers.booking.notesPlaceholder')}
            />
          </Box>
        )}

        {/* Schritt 3: Bestätigung */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('lawyers.booking.confirmBooking')}
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('lawyers.booking.lawyer')}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedLawyer.name}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                {t('lawyers.booking.dateTime')}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formatDate(selectedDate)} - {selectedTime}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                {t('lawyers.booking.type')}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {consultationTypes.find((t) => t.value === consultationType)?.label}
              </Typography>

              {notes && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                    {t('lawyers.booking.notes')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {notes}
                  </Typography>
                </>
              )}

              {selectedLawyer.hourlyRate && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                    {t('lawyers.booking.estimatedCost')}
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    {selectedLawyer.hourlyRate}€
                  </Typography>
                </>
              )}
            </Paper>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={booking}>
          {t('common.cancel')}
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={booking}>
            {t('common.back')}
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button variant="contained" onClick={handleNext}>
            {t('common.next')}
          </Button>
        ) : (
          <Button variant="contained" onClick={handleBooking} disabled={booking}>
            {booking ? t('lawyers.booking.booking') : t('lawyers.booking.confirmAndBook')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BookingDialog;

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
  Divider,
  Backdrop,
  CircularProgress,
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
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [booking, setBooking] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    iban: '',
  });
  const [showPaypalLogin, setShowPaypalLogin] = useState(false);
  const [paypalAuthorized, setPaypalAuthorized] = useState(false);

  const [paypalLoading, setPaypalLoading] = useState(false);
  const [paypalCheckout, setPaypalCheckout] = useState(false);
  const [showSofortMock, setShowSofortMock] = useState(false);

  // Sofortige Reaktion bei PayPal-Auswahl
  React.useEffect(() => {
    if (paymentMethod === 'paypal' && !paypalAuthorized) {
      setPaypalLoading(true);
      setTimeout(() => {
        setPaypalLoading(false);
        setShowPaypalLogin(true);
      }, 1200);
    }
  }, [paymentMethod, paypalAuthorized]);

  const steps = [
    t('lawyers.booking.selectDateTime'),
    t('lawyers.booking.consultationType'),
    t('lawyers.booking.confirmation'),
    'Zahlung',
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
        paymentMethod,
        paymentDetails: paymentMethod === 'credit_card' || paymentMethod === 'sepa' ? paymentDetails : undefined
      });

      if (paymentMethod === 'paypal' && !paypalAuthorized) {
        setShowPaypalLogin(true);
        return;
      }

      if (paymentMethod === 'paypal' || paymentMethod === 'sofort') {
        // Simulierte Weiterleitung
        setMessage(`Zahlung wird verarbeitet. ${paymentMethod === 'paypal' ? 'PayPal Autorisierung erfolgreich.' : 'Sie werden nun zu Sofort weitergeleitet...'}`);
        setBooking(true);
        setTimeout(() => {
          setSuccess(true);
          setMessage(null);
          setBooking(false);
          setTimeout(() => {
            handleClose();
          }, 2000);
        }, 2000);
        return;
      }

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError(response.error?.message || 'Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (err) {
      console.error('Fehler bei der Buchung:', err);
      setError(t('lawyers.booking.error.bookingFailed'));
    } finally {
      setBooking(false);
    }
  };

  const handleClose = () => {
    console.log('BookingDialog: Closing and resetting state');
    setActiveStep(0);
    setSelectedDate('');
    setSelectedTime('');
    setConsultationType('');
    setNotes('');
    setPaymentMethod('');
    setError(null);
    setMessage(null);
    setPaypalAuthorized(false);
    setShowPaypalLogin(false);
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

        {message && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {message}
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

        {/* Schritt 4 (Schritt 6 in der Vorstellung): Zahlung */}
        {activeStep === 3 && (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Erstberatung, Zahlung für Anwaltstermin
            </Typography>
            <Typography variant="h6" gutterBottom>
              Sichere Bezahlung vor Ihrem Beratungsgespräch
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Ihr Termin wird nach erfolgreicher Zahlung bestätigt
            </Alert>

            <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Ihr gebuchter Termin:</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Anwalt:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{selectedLawyer.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Termin:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{formatDate(selectedDate)} um {selectedTime}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Leistung:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{consultationTypes.find(t => t.value === consultationType)?.label || 'Erstberatung'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Dauer:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>60 Minuten</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Gesamt:</Typography>
                    <Typography variant="h5" color="primary.main" sx={{ fontWeight: 'bold' }}>{selectedLawyer.hourlyRate || 0} Euro</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Zahlungsmethode wählen:</Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                { id: 'paypal', label: 'PayPal', icon: <Box component="span" sx={{ color: '#003087', fontWeight: 'bold' }}>Pay<span style={{ color: '#009cde' }}>Pal</span></Box>, sub: 'Schnell & Sicher' },
                { id: 'sepa', label: 'SEPA Lastschrift', icon: <Typography variant="h6">SEPA</Typography>, sub: 'Bankeinzug' },
                { id: 'credit_card', label: 'Kreditkarte', icon: <Typography variant="h6">VISA/MC</Typography>, sub: 'Visa, Master Card' },
                { id: 'sofort', label: 'Sofort', icon: <Typography variant="h6">SOFORT</Typography>, sub: 'Überweisung' },
              ].map((method) => (
                <Grid item xs={12} sm={6} key={method.id}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      borderColor: paymentMethod === method.id ? 'primary.main' : 'divider',
                      bgcolor: paymentMethod === method.id ? 'rgba(25, 118, 210, 0.04)' : 'background.paper',
                      borderWidth: paymentMethod === method.id ? 2 : 1,
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)', borderColor: 'primary.light' }
                    }}
                    onClick={() => {
                      console.log(`Payment card clicked: ${method.id}`);
                      if (method.id === 'paypal' && !paypalAuthorized) {
                        setPaypalLoading(true);
                        setTimeout(() => {
                          setPaypalLoading(false);
                          setShowPaypalLogin(true);
                        }, 1200);
                      } else if (method.id === 'sofort' && !paypalAuthorized) {
                        setPaypalLoading(true);
                        setTimeout(() => {
                          setPaypalLoading(false);
                          setShowSofortMock(true);
                        }, 1000);
                      }
                      setPaymentMethod(method.id);
                    }}
                  >
                    <Box sx={{ mb: 1 }}>{method.icon}</Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{method.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{method.sub}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {paymentMethod && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Ausgewählt: <strong>{paymentMethod.toUpperCase()}</strong>
              </Alert>
            )}

            {paymentMethod === 'credit_card' && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Kartennummer"
                    value={paymentDetails.cardNumber}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Gültig bis (MM/JJ)"
                    value={paymentDetails.expiryDate}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, expiryDate: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="CVV"
                    value={paymentDetails.cvv}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, cvv: e.target.value })}
                  />
                </Grid>
              </Grid>
            )}

            {paymentMethod === 'sepa' && (
              <TextField
                fullWidth
                label="IBAN"
                value={paymentDetails.iban}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, iban: e.target.value })}
              />
            )}

            {(paymentMethod === 'paypal' || paymentMethod === 'sofort') && (
              <Box sx={{ mt: 2, p: 2, textAlign: 'center', bgcolor: '#fffbed', border: '1px dashed #ffd666', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {paymentMethod === 'paypal'
                    ? 'Klicken Sie auf "Zahlen & Buchen", um das PayPal-Fenster zu öffnen.'
                    : 'Sie werden nach dem Klicken auf "Zahlen" zum jeweiligen Anbieter weitergeleitet.'}
                </Typography>
                {paymentMethod === 'paypal' && (
                  <Button
                    variant="contained"
                    onClick={() => setShowPaypalLogin(true)}
                    sx={{
                      mt: 1,
                      bgcolor: '#ffc439',
                      color: '#000',
                      fontWeight: 'bold',
                      '&:hover': { bgcolor: '#f2ba36' },
                      textTransform: 'none',
                      borderRadius: '20px',
                      px: 4
                    }}
                  >
                    PayPal Checkout
                  </Button>
                )}
              </Box>
            )}
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
          <Button
            variant="contained"
            onClick={handleBooking}
            disabled={booking || (activeStep === 3 && !paymentMethod)}
            sx={paymentMethod === 'paypal' ? { bgcolor: '#0070ba', '&:hover': { bgcolor: '#005ea6' } } : {}}
          >
            {booking ? t('lawyers.booking.booking') : (activeStep === 3 ? (paypalAuthorized ? 'Jetzt final buchen' : 'Mit PayPal zahlen') : t('lawyers.booking.confirmAndBook'))}
          </Button>
        )}
      </DialogActions>

      {/* PayPal Mock Login Dialog */}
      <Dialog open={showPaypalLogin} onClose={() => { setShowPaypalLogin(false); setPaypalCheckout(false); }} maxWidth="xs" fullWidth>
        {!paypalCheckout ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" sx={{ color: '#003087', fontWeight: 'bold', fontStyle: 'italic' }}>
                Pay<span style={{ color: '#009cde' }}>Pal</span>
              </Typography>
            </Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Einloggen</Typography>
            <TextField
              autoFocus
              fullWidth
              margin="normal"
              label="E-Mail-Adresse"
              defaultValue="user@example.com"
              variant="outlined"
            />
            <TextField
              fullWidth
              margin="normal"
              label="Passwort"
              type="password"
              defaultValue="password123"
              variant="outlined"
            />
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, bgcolor: '#0070ba', borderRadius: '20px', py: 1.5, color: '#fff', '&:hover': { bgcolor: '#005ea6' } }}
              onClick={() => {
                setPaypalLoading(true);
                setTimeout(() => {
                  setPaypalLoading(false);
                  setPaypalCheckout(true);
                }, 1000);
              }}
            >
              Einloggen
            </Button>
            <Typography variant="caption" color="text.secondary">
              Sichere Verbindung zu PayPal.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 0, textAlign: 'center', bgcolor: '#ffc439' }}>
            <Box sx={{ p: 4 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ color: '#003087', fontWeight: 'bold', fontStyle: 'italic' }}>
                  Pay<span style={{ color: '#009cde' }}>Pal</span>
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2c2e2f', mb: 3 }}>Zahlung überprüfen</Typography>

              <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(255,255,255,0.5)', borderRadius: 3 }} elevation={0}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', textTransform: 'uppercase' }}>Betrag</Typography>
                <Typography variant="h4" sx={{ fontWeight: '900', color: '#2c2e2f' }}>
                  {selectedLawyer.hourlyRate || 0},00 €
                </Typography>
              </Paper>

              <Typography variant="body2" sx={{ mb: 4, color: '#2c2e2f' }}>
                Zahlung an <strong>JurisMind GmbH</strong>
              </Typography>

              <Button
                fullWidth
                variant="contained"
                sx={{
                  py: 2,
                  bgcolor: '#2c2e2f',
                  color: '#fff',
                  borderRadius: '30px',
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: '#1a1b1c' },
                  textTransform: 'none',
                  fontSize: '1.1rem'
                }}
                onClick={() => {
                  setPaypalAuthorized(true);
                  setShowPaypalLogin(false);
                  setPaypalCheckout(false);
                  setMessage('PayPal-Konto erfolgreich verknüpft.');
                }}
              >
                Jetzt bezahlen
              </Button>
            </Box>
            <Box sx={{ p: 2, bgcolor: '#fff' }}>
              <Button variant="text" size="small" onClick={() => { setShowPaypalLogin(false); setPaypalCheckout(false); }} sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                Abbrechen
              </Button>
            </Box>
          </Box>
        )}
      </Dialog>

      {/* SOFORT Mock Dialog */}
      <Dialog open={showSofortMock} onClose={() => setShowSofortMock(false)} maxWidth="xs" fullWidth>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Box sx={{ bgcolor: '#0070ba', color: '#fff', px: 1, borderRadius: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>SOFORT</Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2c2e2f' }}>Überweisung</Typography>
          </Box>
          <Typography variant="body1" sx={{ mb: 3, fontWeight: 'medium' }}>
            Sicher bezahlen mit Klarna.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Sie werden nun zu Ihrer Bank weitergeleitet, um die Zahlung von <strong>{selectedLawyer.hourlyRate || 0},00 €</strong> zu autorisieren.
          </Typography>

          <Button
            fullWidth
            variant="contained"
            sx={{
              py: 1.5,
              bgcolor: '#f5a9b8',
              color: '#2c2e2f',
              borderRadius: '10px',
              fontWeight: 'bold',
              '&:hover': { bgcolor: '#ffb3c1' },
              textTransform: 'none'
            }}
            onClick={() => {
              setShowSofortMock(false);
              setPaypalLoading(true); // Reuse loading backdrop
              setTimeout(() => {
                setPaypalLoading(false);
                setPaypalAuthorized(true);
                setMessage('Zahlung erfolgreich über SOFORT autorisiert.');
              }, 2000);
            }}
          >
            Weiter zur Bank
          </Button>
          <Button variant="text" size="small" onClick={() => setShowSofortMock(false)} sx={{ mt: 2, color: 'text.secondary' }}>
            Abbrechen
          </Button>
        </Box>
      </Dialog>

      {/* Backdrop für "Reaktion" */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 2, flexDirection: 'column', gap: 2 }}
        open={paypalLoading}
      >
        <CircularProgress color="inherit" />
        <Typography variant="h6">Verbindung zu PayPal wird hergestellt...</Typography>
      </Backdrop>
    </Dialog>
  );
};

export default BookingDialog;

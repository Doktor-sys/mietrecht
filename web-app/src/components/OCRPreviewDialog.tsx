import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Alert,
  TextField,
  Chip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface OCRPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  onConfirm: (documentId: string) => void;
  onExtractText: (documentId: string) => Promise<any>;
}

const OCRPreviewDialog: React.FC<OCRPreviewDialogProps> = ({ 
  open, 
  onClose, 
  documentId, 
  onConfirm,
  onExtractText 
}) => {
  const { t } = useTranslation();
  const [extracting, setExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && documentId) {
      extractDocumentText();
    }
  }, [open, documentId]);

  const extractDocumentText = async () => {
    setExtracting(true);
    setError(null);
    
    try {
      const response = await onExtractText(documentId);
      if (response.success && response.data) {
        setExtractedText(response.data.text);
        setConfidence(response.data.confidence || 0);
      }
    } catch (err) {
      setError(t('documents.error.extractFailed'));
      console.error('Error extracting text:', err);
    } finally {
      setExtracting(false);
    }
  };

  const handleConfirm = () => {
    onConfirm(documentId);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('documents.ocrPreview.title')}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {extracting && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
              {t('documents.ocrPreview.extracting')}
            </Typography>
          </Box>
        )}

        {!extracting && extractedText && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('documents.ocrPreview.extractedText')}
              </Typography>
              <Chip
                label={`${t('documents.ocrPreview.confidence')}: ${(confidence * 100).toFixed(1)}%`}
                color={confidence > 0.8 ? 'success' : confidence > 0.6 ? 'warning' : 'error'}
                size="small"
              />
            </Box>
            
            <TextField
              fullWidth
              multiline
              rows={15}
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              variant="outlined"
              sx={{ fontFamily: 'monospace' }}
            />
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('documents.ocrPreview.instructions')}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={extracting}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={extracting || !extractedText}
        >
          {t('documents.ocrPreview.confirmAndAnalyze')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OCRPreviewDialog;
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useTranslation } from 'react-i18next';

interface FileUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File, documentType: string) => Promise<void>;
}

const FileUploadDialog: React.FC<FileUploadDialogProps> = ({ open, onClose, onUpload }) => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validierung
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

    if (file.size > maxSize) {
      setError(t('chat.error.fileTooLarge'));
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setError(t('chat.error.invalidFileType'));
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) return;

    setUploading(true);
    setError(null);

    try {
      await onUpload(selectedFile, documentType);
      handleClose();
    } catch (err) {
      setError(t('chat.error.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setDocumentType('');
    setError(null);
    setDragActive(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('chat.uploadDocument')}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Drag & Drop Bereich */}
        <Box
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          sx={{
            border: 2,
            borderStyle: 'dashed',
            borderColor: dragActive ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            bgcolor: dragActive ? 'action.hover' : 'background.paper',
            cursor: 'pointer',
            transition: 'all 0.3s',
            mb: 2,
          }}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="body1" gutterBottom>
            {selectedFile ? selectedFile.name : t('chat.dragDropFile')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('chat.orClickToSelect')}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {t('chat.supportedFormats')}: PDF, JPG, PNG (max. 10MB)
          </Typography>
          <input
            id="file-input"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
        </Box>

        {/* Dokumenttyp-Auswahl */}
        <FormControl fullWidth disabled={!selectedFile}>
          <InputLabel>{t('chat.documentType')}</InputLabel>
          <Select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            label={t('chat.documentType')}
          >
            <MenuItem value="rental_contract">{t('chat.documentTypes.rentalContract')}</MenuItem>
            <MenuItem value="utility_bill">{t('chat.documentTypes.utilityBill')}</MenuItem>
            <MenuItem value="warning_letter">{t('chat.documentTypes.warningLetter')}</MenuItem>
            <MenuItem value="termination">{t('chat.documentTypes.termination')}</MenuItem>
            <MenuItem value="other">{t('chat.documentTypes.other')}</MenuItem>
          </Select>
        </FormControl>

        {uploading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
              {t('chat.uploading')}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!selectedFile || !documentType || uploading}
        >
          {t('chat.upload')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileUploadDialog;

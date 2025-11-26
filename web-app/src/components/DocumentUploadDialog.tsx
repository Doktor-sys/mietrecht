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
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';

interface DocumentUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File, documentType: string, onProgress: (progress: number) => void) => Promise<void>;
}

const DocumentUploadDialog: React.FC<DocumentUploadDialogProps> = ({ open, onClose, onUpload }) => {
  const { t } = useTranslation();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (files: File[]) => {
    // Validierung
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      if (file.size > maxSize) {
        errors.push(`${file.name}: ${t('documents.error.fileTooLarge')}`);
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: ${t('documents.error.invalidFileType')}`);
        return;
      }

      validFiles.push(file);
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    if (errors.length > 0) {
      setError(errors.join(', '));
    } else {
      setError(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !documentType) return;

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Upload each file sequentially
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const progressPerFile = Math.floor((i / selectedFiles.length) * 100);
        setUploadProgress(progressPerFile);
        
        await onUpload(file, documentType, (progress) => {
          const fileProgress = Math.floor((progress / selectedFiles.length) + (i / selectedFiles.length) * 100);
          setUploadProgress(fileProgress);
        });
      }
      
      setUploadProgress(100);
      handleClose();
    } catch (err) {
      setError(t('documents.error.uploadFailed'));
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFiles([]);
      setDocumentType('');
      setError(null);
      setDragActive(false);
      setUploadProgress(0);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('documents.uploadDocument')}</DialogTitle>
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
          onClick={() => !uploading && document.getElementById('file-input')?.click()}
        >
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="body1" gutterBottom>
            {selectedFiles.length > 0 
              ? t('documents.selectedFiles', { count: selectedFiles.length })
              : t('documents.dragDropFile')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('documents.orClickToSelect')}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {t('documents.supportedFormats')}: PDF, JPG, PNG (max. 10MB)
          </Typography>
          <input
            id="file-input"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            disabled={uploading}
            multiple // Allow multiple file selection
          />
        </Box>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('documents.selectedFilesList')}
            </Typography>
            <List dense>
              {selectedFiles.map((file, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    !uploading && (
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => removeFile(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )
                  }
                >
                  <ListItemText
                    primary={file.name}
                    secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Dokumenttyp-Auswahl */}
        <FormControl fullWidth disabled={selectedFiles.length === 0 || uploading}>
          <InputLabel>{t('documents.documentType')}</InputLabel>
          <Select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            label={t('documents.documentType')}
          >
            <MenuItem value="rental_contract">{t('documents.types.rentalContract')}</MenuItem>
            <MenuItem value="utility_bill">{t('documents.types.utilityBill')}</MenuItem>
            <MenuItem value="warning_letter">{t('documents.types.warningLetter')}</MenuItem>
            <MenuItem value="termination">{t('documents.types.termination')}</MenuItem>
            <MenuItem value="other">{t('documents.types.other')}</MenuItem>
          </Select>
        </FormControl>

        {uploading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
              {t('documents.uploading')}: {uploadProgress}%
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
          disabled={selectedFiles.length === 0 || !documentType || uploading}
        >
          {t('documents.upload')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentUploadDialog;
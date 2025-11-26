import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useTranslation } from 'react-i18next';
import { documentAPI } from '../services/api';

interface DocumentVersion {
  id: string;
  version: number;
  originalName: string;
  uploadedAt: string;
  isCurrent: boolean;
  mimeType: string;
  size: number;
  documentType: string;
}

interface DocumentVersionHistoryProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  onDownload: (documentId: string, fileName: string) => void;
  onViewAnalysis: (document: any) => void;
}

const DocumentVersionHistory: React.FC<DocumentVersionHistoryProps> = ({
  open,
  onClose,
  documentId,
  onDownload,
  onViewAnalysis,
}) => {
  const { t } = useTranslation();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && documentId) {
      loadVersions();
    }
  }, [open, documentId]);

  const loadVersions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await documentAPI.getVersions(documentId);
      if (response.success && response.data) {
        setVersions(response.data);
      }
    } catch (err) {
      console.error('Error loading versions:', err);
      setError(t('documents.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (versionId: string, fileName: string) => {
    onDownload(versionId, fileName);
  };

  const handleViewAnalysis = (version: DocumentVersion) => {
    // For simplicity, we're just passing the version data
    // In a real implementation, you might fetch the full analysis for that version
    onViewAnalysis(version);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getDocumentTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      RENTAL_CONTRACT: t('documents.types.rentalContract'),
      UTILITY_BILL: t('documents.types.utilityBill'),
      WARNING_LETTER: t('documents.types.warningLetter'),
      OTHER: t('documents.types.other'),
    };
    return typeMap[type] || type;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon />
          <span>{t('documents.versionHistory.title')}</span>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : versions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              {t('documents.versionHistory.noVersions')}
            </Typography>
          </Box>
        ) : (
          <List>
            {versions.map((version) => (
              <ListItem
                key={version.id}
                divider
                sx={{
                  bgcolor: version.isCurrent ? 'action.selected' : 'transparent',
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">
                        {t('documents.versionHistory.version')} {version.version}
                      </Typography>
                      {version.isCurrent && (
                        <Chip
                          label={t('documents.versionHistory.current')}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {version.originalName}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(version.uploadedAt).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(version.size)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getDocumentTypeLabel(version.documentType)}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleDownload(version.id, version.originalName)}
                    aria-label={t('documents.download')}
                  >
                    <CloudDownloadIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => handleViewAnalysis(version)}
                    aria-label={t('documents.view')}
                    sx={{ ml: 1 }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentVersionHistory;
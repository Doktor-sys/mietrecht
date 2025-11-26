import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  CircularProgress,
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import { documentAPI } from '../services/api';

interface Share {
  id: string;
  documentId: string;
  ownerId: string;
  sharedWith: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
  permission: string;
  sharedAt: string;
  expiresAt?: string;
}

interface DocumentShareDialogProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentName: string;
}

const DocumentShareDialog: React.FC<DocumentShareDialogProps> = ({
  open,
  onClose,
  documentId,
  documentName,
}) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('READ');
  const [expiresAt, setExpiresAt] = useState('');
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharesLoading, setSharesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (open && documentId) {
      loadShares();
    }
  }, [open, documentId]);

  const loadShares = async () => {
    setSharesLoading(true);
    setError(null);
    
    try {
      const response = await documentAPI.getShares(documentId);
      if (response.success && response.data) {
        setShares(response.data);
      }
    } catch (err) {
      console.error('Error loading shares:', err);
      setError(t('documents.sharing.error.loadFailed'));
    } finally {
      setSharesLoading(false);
    }
  };

  const handleShare = async () => {
    if (!email) {
      setError(t('documents.sharing.error.emailRequired'));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await documentAPI.share(documentId, email, permission, expiresAt || undefined);
      
      if (response.success) {
        setSuccess(t('documents.sharing.success.shared'));
        setEmail('');
        setPermission('READ');
        setExpiresAt('');
        loadShares(); // Refresh the shares list
      }
    } catch (err: any) {
      console.error('Error sharing document:', err);
      setError(err.response?.data?.error?.message || t('documents.sharing.error.shareFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      await documentAPI.removeShare(shareId);
      setSuccess(t('documents.sharing.success.removed'));
      loadShares(); // Refresh the shares list
    } catch (err) {
      console.error('Error removing share:', err);
      setError(t('documents.sharing.error.removeFailed'));
    }
  };

  const getPermissionLabel = (permission: string) => {
    switch (permission) {
      case 'READ':
        return t('documents.sharing.permissions.read');
      case 'WRITE':
        return t('documents.sharing.permissions.write');
      case 'COMMENT':
        return t('documents.sharing.permissions.comment');
      default:
        return permission;
    }
  };

  const getUserName = (share: Share) => {
    if (share.sharedWith.profile?.firstName || share.sharedWith.profile?.lastName) {
      return `${share.sharedWith.profile.firstName || ''} ${share.sharedWith.profile.lastName || ''}`.trim();
    }
    return share.sharedWith.email;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShareIcon />
          <span>{t('documents.sharing.title')}</span>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {documentName}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            {t('documents.sharing.shareWith')}
          </Typography>
          
          <TextField
            fullWidth
            label={t('documents.sharing.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            helperText={t('documents.sharing.emailHelper')}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{t('documents.sharing.permission')}</InputLabel>
            <Select
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
              label={t('documents.sharing.permission')}
            >
              <MenuItem value="READ">{t('documents.sharing.permissions.read')}</MenuItem>
              <MenuItem value="COMMENT">{t('documents.sharing.permissions.comment')}</MenuItem>
              <MenuItem value="WRITE">{t('documents.sharing.permissions.write')}</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            type="date"
            label={t('documents.sharing.expiresAt')}
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          
          <Button
            variant="contained"
            onClick={handleShare}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <ShareIcon />}
          >
            {t('documents.sharing.shareButton')}
          </Button>
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          {t('documents.sharing.sharedWith')}
        </Typography>
        
        {sharesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress />
          </Box>
        ) : shares.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 2 }}>
            {t('documents.sharing.noShares')}
          </Typography>
        ) : (
          <List>
            {shares.map((share) => (
              <ListItem
                key={share.id}
                divider
              >
                <ListItemText
                  primary={getUserName(share)}
                  secondary={share.sharedWith.email}
                />
                <ListItemSecondaryAction>
                  <Chip
                    label={getPermissionLabel(share.permission)}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <IconButton
                    edge="end"
                    onClick={() => handleRemoveShare(share.id)}
                    aria-label={t('documents.sharing.remove')}
                  >
                    <DeleteIcon />
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

export default DocumentShareDialog;
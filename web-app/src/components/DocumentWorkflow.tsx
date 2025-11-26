import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Chip, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  TextField, 
  Typography 
} from '@mui/material';
import { 
  CheckCircle, 
  Pending, 
  Cancel, 
  Archive, 
  RestoreFromTrash,
  History
} from '@mui/icons-material';
import { documentAPI } from '../services/api';

interface DocumentWorkflowProps {
  documentId: string;
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
}

interface WorkflowHistoryItem {
  id: string;
  action: string;
  fromStatus: string;
  toStatus: string;
  comment?: string;
  createdAt: string;
  user: {
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

const DocumentWorkflow: React.FC<DocumentWorkflowProps> = ({ 
  documentId, 
  currentStatus,
  onStatusChange 
}) => {
  const { t } = useTranslation();
  const [history, setHistory] = useState<WorkflowHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  // Status to color mapping
  const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    'DRAFT': 'default',
    'REVIEW': 'warning',
    'APPROVED': 'success',
    'ARCHIVED': 'info',
    'REJECTED': 'error'
  };

  // Action to icon mapping
  const actionIcons: Record<string, React.ReactNode> = {
    'SUBMIT_FOR_REVIEW': <Pending />,
    'APPROVE': <CheckCircle />,
    'REJECT': <Cancel />,
    'REQUEST_CHANGES': <Pending />,
    'ARCHIVE': <Archive />,
    'RESTORE': <RestoreFromTrash />
  };

  // Load workflow history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await documentAPI.getWorkflowHistory(documentId);
        setHistory(response.data || []);
      } catch (error) {
        console.error('Failed to load workflow history:', error);
      }
    };

    if (showHistory) {
      loadHistory();
    }
  }, [documentId, showHistory]);

  // Get available actions based on current status
  const getAvailableActions = () => {
    const actions: Record<string, string[]> = {
      'DRAFT': ['SUBMIT_FOR_REVIEW', 'ARCHIVE'],
      'REVIEW': ['APPROVE', 'REJECT', 'REQUEST_CHANGES', 'ARCHIVE'],
      'APPROVED': ['ARCHIVE'],
      'REJECTED': ['SUBMIT_FOR_REVIEW', 'ARCHIVE'],
      'ARCHIVED': ['RESTORE']
    };

    return actions[currentStatus] || [];
  };

  // Handle status transition
  const handleTransition = async () => {
    if (!selectedAction) return;

    setLoading(true);
    try {
      const response = await documentAPI.transitionStatus(documentId, selectedAction, comment);
      onStatusChange(response.data.status);
      setShowTransitionDialog(false);
      setSelectedAction('');
      setComment('');
    } catch (error) {
      console.error('Failed to transition document status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format user name
  const formatUserName = (user: WorkflowHistoryItem['user']) => {
    if (user.profile?.firstName || user.profile?.lastName) {
      return `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim();
    }
    return user.email;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Typography variant="h6">
          {t('document.workflow.status')}: 
        </Typography>
        <Chip 
          label={t(`document.status.${currentStatus.toLowerCase()}`)} 
          color={statusColors[currentStatus] || 'default'} 
        />
        <Button 
          variant="outlined" 
          startIcon={<History />}
          onClick={() => setShowHistory(true)}
        >
          {t('document.workflow.history')}
        </Button>
        <Button 
          variant="contained" 
          onClick={() => setShowTransitionDialog(true)}
        >
          {t('document.workflow.changeStatus')}
        </Button>
      </Box>

      {/* Status Transition Dialog */}
      <Dialog 
        open={showTransitionDialog} 
        onClose={() => setShowTransitionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t('document.workflow.changeStatus')}
        </DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <FormControl fullWidth margin="normal">
              <InputLabel>{t('document.workflow.action')}</InputLabel>
              <Select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value as string)}
                label={t('document.workflow.action')}
              >
                {getAvailableActions().map((action) => (
                  <MenuItem key={action} value={action}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {actionIcons[action]}
                      {t(`document.workflow.actions.${action.toLowerCase()}`)}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              margin="normal"
              label={t('document.workflow.comment')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTransitionDialog(false)}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleTransition} 
            variant="contained" 
            disabled={!selectedAction || loading}
          >
            {loading ? t('common.loading') : t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Workflow History Dialog */}
      <Dialog 
        open={showHistory} 
        onClose={() => setShowHistory(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {t('document.workflow.history')}
        </DialogTitle>
        <DialogContent>
          {history.length === 0 ? (
            <Typography>{t('document.workflow.noHistory')}</Typography>
          ) : (
            <Box>
              {history.map((item) => (
                <Card key={item.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        {actionIcons[item.action]}
                        <Typography variant="subtitle1">
                          {t(`document.workflow.actions.${item.action.toLowerCase()}`)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        {formatDate(item.createdAt)}
                      </Typography>
                    </Box>
                    
                    <Box mt={1}>
                      <Typography variant="body2">
                        {t('document.workflow.from')}:{' '}
                        <Chip 
                          size="small"
                          label={t(`document.status.${item.fromStatus.toLowerCase()}`)} 
                          color={statusColors[item.fromStatus] || 'default'} 
                        />
                        {' → '}
                        <Chip 
                          size="small"
                          label={t(`document.status.${item.toStatus.toLowerCase()}`)} 
                          color={statusColors[item.toStatus] || 'default'} 
                        />
                      </Typography>
                    </Box>
                    
                    {item.comment && (
                      <Box mt={1}>
                        <Typography variant="body2">
                          <strong>{t('document.workflow.comment')}:</strong> {item.comment}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box mt={1}>
                      <Typography variant="caption" color="textSecondary">
                        {t('document.workflow.by')}: {formatUserName(item.user)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistory(false)}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentWorkflow;
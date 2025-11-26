import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import ReplyIcon from '@mui/icons-material/Reply';
import { useTranslation } from 'react-i18next';
import { documentAPI } from '../services/api';

interface Annotation {
  id: string;
  documentId: string;
  userId: string;
  parentId?: string;
  page?: number;
  positionX?: number;
  positionY?: number;
  text: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  resolved: boolean;
  resolvedAt?: string;
  user: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
  children?: Annotation[];
}

interface DocumentAnnotationsProps {
  documentId: string;
  open: boolean;
  onClose: () => void;
}

const DocumentAnnotations: React.FC<DocumentAnnotationsProps> = ({
  documentId,
  open,
  onClose,
}) => {
  const { t } = useTranslation();
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newAnnotationText, setNewAnnotationText] = useState('');
  const [newAnnotationType, setNewAnnotationType] = useState('COMMENT');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open && documentId) {
      loadAnnotations();
    }
  }, [open, documentId]);

  const loadAnnotations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await documentAPI.getAnnotations(documentId, true);
      if (response.success && response.data) {
        setAnnotations(response.data);
      }
    } catch (err) {
      console.error('Error loading annotations:', err);
      setError(t('documents.annotations.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnotation = async () => {
    if (!newAnnotationText.trim()) {
      return;
    }

    setCreating(true);
    setError(null);
    
    try {
      const response = await documentAPI.createAnnotation(documentId, {
        text: newAnnotationText,
        type: newAnnotationType,
        parentId: replyingTo || undefined
      });
      
      if (response.success && response.data) {
        if (replyingTo) {
          // Add reply to existing annotation
          setAnnotations(prev => prev.map(ann => 
            ann.id === replyingTo 
              ? { ...ann, children: [...(ann.children || []), response.data] } 
              : ann
          ));
          setReplyText('');
          setReplyingTo(null);
        } else {
          // Add new top-level annotation
          setAnnotations(prev => [response.data, ...prev]);
          setNewAnnotationText('');
        }
      }
    } catch (err) {
      console.error('Error creating annotation:', err);
      setError(t('documents.annotations.error.createFailed'));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    try {
      await documentAPI.deleteAnnotation(annotationId);
      // Remove from state
      setAnnotations(prev => {
        // Check if it's a top-level annotation
        const topLevelIndex = prev.findIndex(ann => ann.id === annotationId);
        if (topLevelIndex !== -1) {
          return prev.filter(ann => ann.id !== annotationId);
        }
        
        // Check if it's a reply
        return prev.map(ann => {
          if (ann.children) {
            return {
              ...ann,
              children: ann.children.filter(child => child.id !== annotationId)
            };
          }
          return ann;
        });
      });
    } catch (err) {
      console.error('Error deleting annotation:', err);
      setError(t('documents.annotations.error.deleteFailed'));
    }
  };

  const handleResolveAnnotation = async (annotationId: string) => {
    try {
      const response = await documentAPI.resolveAnnotation(annotationId);
      if (response.success && response.data) {
        // Update in state
        setAnnotations(prev => prev.map(ann => 
          ann.id === annotationId ? { ...ann, ...response.data } : ann
        ));
      }
    } catch (err) {
      console.error('Error resolving annotation:', err);
      setError(t('documents.annotations.error.resolveFailed'));
    }
  };

  const getUserName = (annotation: Annotation) => {
    if (annotation.user.profile?.firstName || annotation.user.profile?.lastName) {
      return `${annotation.user.profile.firstName || ''} ${annotation.user.profile.lastName || ''}`.trim();
    }
    return annotation.user.email;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'COMMENT':
        return t('documents.annotations.types.comment');
      case 'HIGHLIGHT':
        return t('documents.annotations.types.highlight');
      case 'STRIKETHROUGH':
        return t('documents.annotations.types.strikethrough');
      case 'UNDERLINE':
        return t('documents.annotations.types.underline');
      case 'NOTE':
        return t('documents.annotations.types.note');
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'COMMENT':
        return 'primary';
      case 'HIGHLIGHT':
        return 'warning';
      case 'STRIKETHROUGH':
        return 'error';
      case 'UNDERLINE':
        return 'info';
      case 'NOTE':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {t('documents.annotations.title')}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Add new annotation form */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            {replyingTo 
              ? t('documents.annotations.replyToAnnotation') 
              : t('documents.annotations.addAnnotation')}
          </Typography>
          
          {replyingTo && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('documents.annotations.replyingTo')}:
              </Typography>
              <Typography variant="body2">
                {annotations
                  .flatMap(ann => [ann, ...(ann.children || [])])
                  .find(ann => ann.id === replyingTo)?.text}
              </Typography>
            </Box>
          )}
          
          <TextField
            fullWidth
            multiline
            rows={3}
            value={replyingTo ? replyText : newAnnotationText}
            onChange={(e) => replyingTo ? setReplyText(e.target.value) : setNewAnnotationText(e.target.value)}
            placeholder={t('documents.annotations.textPlaceholder')}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>{t('documents.annotations.type')}</InputLabel>
              <Select
                value={newAnnotationType}
                onChange={(e) => setNewAnnotationType(e.target.value)}
                label={t('documents.annotations.type')}
              >
                <MenuItem value="COMMENT">{t('documents.annotations.types.comment')}</MenuItem>
                <MenuItem value="HIGHLIGHT">{t('documents.annotations.types.highlight')}</MenuItem>
                <MenuItem value="STRIKETHROUGH">{t('documents.annotations.types.strikethrough')}</MenuItem>
                <MenuItem value="UNDERLINE">{t('documents.annotations.types.underline')}</MenuItem>
                <MenuItem value="NOTE">{t('documents.annotations.types.note')}</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="contained"
              onClick={handleCreateAnnotation}
              disabled={creating || (!newAnnotationText.trim() && !replyText.trim())}
              startIcon={creating ? <CircularProgress size={20} /> : <AddIcon />}
            >
              {t('documents.annotations.addButton')}
            </Button>
            
            {replyingTo && (
              <Button
                variant="outlined"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyText('');
                }}
              >
                {t('common.cancel')}
              </Button>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Annotations list */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : annotations.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            {t('documents.annotations.noAnnotations')}
          </Typography>
        ) : (
          <List>
            {annotations.map((annotation) => (
              <React.Fragment key={annotation.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    bgcolor: annotation.resolved ? 'action.selected' : 'background.paper',
                    mb: 2,
                    borderRadius: 1,
                    border: annotation.resolved ? '1px solid' : 'none',
                    borderColor: 'success.main'
                  }}
                >
                  <ListItemAvatar>
                    <Avatar>
                      {getUserName(annotation)[0]?.toUpperCase() || 'U'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle2">
                          {getUserName(annotation)}
                        </Typography>
                        <Chip
                          label={getTypeLabel(annotation.type)}
                          size="small"
                          color={getTypeColor(annotation.type) as any}
                        />
                        {annotation.resolved && (
                          <Chip
                            label={t('documents.annotations.resolved')}
                            size="small"
                            color="success"
                            icon={<CheckIcon />}
                          />
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {new Date(annotation.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{ display: 'block', mt: 1 }}
                        >
                          {annotation.text}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Tooltip title={t('documents.annotations.reply')}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setReplyingTo(annotation.id);
                                setReplyText('');
                              }}
                            >
                              <ReplyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {!annotation.resolved && (
                            <Tooltip title={t('documents.annotations.resolve')}>
                              <IconButton
                                size="small"
                                onClick={() => handleResolveAnnotation(annotation.id)}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title={t('documents.annotations.delete')}>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteAnnotation(annotation.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </React.Fragment>
                    }
                  />
                </ListItem>

                {/* Replies */}
                {annotation.children && annotation.children.length > 0 && (
                  <Box sx={{ ml: 4, mb: 2 }}>
                    <List>
                      {annotation.children.map((reply) => (
                        <ListItem
                          key={reply.id}
                          alignItems="flex-start"
                          sx={{
                            bgcolor: reply.resolved ? 'action.selected' : 'background.paper',
                            mb: 1,
                            borderRadius: 1,
                            border: reply.resolved ? '1px solid' : 'none',
                            borderColor: 'success.main'
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              {getUserName(reply)[0]?.toUpperCase() || 'U'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {getUserName(reply)}
                                </Typography>
                                <Chip
                                  label={getTypeLabel(reply.type)}
                                  size="small"
                                  color={getTypeColor(reply.type) as any}
                                  sx={{ height: 20 }}
                                />
                                {reply.resolved && (
                                  <Chip
                                    label={t('documents.annotations.resolved')}
                                    size="small"
                                    color="success"
                                    icon={<CheckIcon />}
                                    sx={{ height: 20 }}
                                  />
                                )}
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(reply.createdAt).toLocaleString()}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <React.Fragment>
                                <Typography
                                  component="span"
                                  variant="body2"
                                  sx={{ display: 'block', mt: 0.5 }}
                                >
                                  {reply.text}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                  {!reply.resolved && (
                                    <Tooltip title={t('documents.annotations.resolve')}>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleResolveAnnotation(reply.id)}
                                      >
                                        <CheckIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  <Tooltip title={t('documents.annotations.delete')}>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteAnnotation(reply.id)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </React.Fragment>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </React.Fragment>
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

export default DocumentAnnotations;
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ShareIcon from '@mui/icons-material/Share';
import CommentIcon from '@mui/icons-material/Comment';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { addDocument, updateDocument, selectDocument, setUploading } from '../store/slices/documentSlice';
import { documentAPI } from '../services/api';
import DocumentUploadDialog from '../components/DocumentUploadDialog';
import DocumentAnalysisView from '../components/DocumentAnalysisView';
import OCRPreviewDialog from '../components/OCRPreviewDialog';
import DocumentVersionHistory from '../components/DocumentVersionHistory';
import DocumentShareDialog from '../components/DocumentShareDialog';
import DocumentAnnotations from '../components/DocumentAnnotations';
import DocumentWorkflow from '../components/DocumentWorkflow';

const DocumentsPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { documents, selectedDocument } = useSelector((state: RootState) => state.document);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [ocrPreviewDialogOpen, setOcrPreviewDialogOpen] = useState(false);
  const [versionHistoryDialogOpen, setVersionHistoryDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [annotationsDialogOpen, setAnnotationsDialogOpen] = useState(false);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [selectedDocumentForWorkflow, setSelectedDocumentForWorkflow] = useState<any>(null);
  const [documentToAnalyze, setDocumentToAnalyze] = useState<string | null>(null);
  const [selectedDocumentForHistory, setSelectedDocumentForHistory] = useState<any>(null);
  const [selectedDocumentForSharing, setSelectedDocumentForSharing] = useState<any>(null);
  const [selectedDocumentForAnnotations, setSelectedDocumentForAnnotations] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentAPI.getAll();
      if (response.success && response.data) {
        response.data.forEach((doc: any) => {
          dispatch(addDocument({
            id: doc.id,
            name: doc.fileName,
            type: doc.documentType,
            uploadDate: new Date(doc.uploadDate),
            status: doc.analysisStatus || 'completed',
            analysisResult: doc.analysis,
          }));
        });
      }
    } catch (err) {
      console.error('Fehler beim Laden der Dokumente:', err);
      setError(t('documents.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File, documentType: string, onProgress: (progress: number) => void) => {
    try {
      dispatch(setUploading(true));
      const response = await documentAPI.upload(file, documentType, onProgress);
      
      if (response.success && response.data) {
        const newDoc = {
          id: response.data.documentId,
          name: file.name,
          type: documentType,
          uploadDate: new Date(),
          status: 'analyzing' as const,
        };
        
        dispatch(addDocument(newDoc));
        
        // Show OCR preview before analysis
        setDocumentToAnalyze(response.data.documentId);
        setOcrPreviewDialogOpen(true);
      }
    } catch (err) {
      console.error('Fehler beim Upload:', err);
      setError(t('documents.error.uploadFailed'));
    } finally {
      dispatch(setUploading(false));
    }
  };

  const handleOcrConfirm = async (documentId: string) => {
    setOcrPreviewDialogOpen(false);
    
    try {
      // Automatically start analysis after OCR confirmation
      const analysisResponse = await documentAPI.analyze(documentId);
      
      if (analysisResponse.success) {
        // Find the existing document to get its properties
        const existingDocument = documents.find(doc => doc.id === documentId);
        
        if (existingDocument) {
          dispatch(updateDocument({
            ...existingDocument,
            status: 'completed',
            analysisResult: analysisResponse.data,
          }));
        }
      }
    } catch (err) {
      console.error('Fehler bei der Analyse:', err);
      setError(t('documents.error.analysisFailed'));
    }
  };

  const handleView = (doc: any) => {
    dispatch(selectDocument(doc));
    setAnalysisDialogOpen(true);
  };

  const handleViewHistory = (doc: any) => {
    setSelectedDocumentForHistory(doc);
    setVersionHistoryDialogOpen(true);
  };

  const handleViewAnnotations = (doc: any) => {
    setSelectedDocumentForAnnotations(doc);
    setAnnotationsDialogOpen(true);
  };

  const handleViewWorkflow = (doc: any) => {
    setSelectedDocumentForWorkflow(doc);
    setWorkflowDialogOpen(true);
  };

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const blob = await documentAPI.download(documentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Fehler beim Download:', err);
      setError(t('documents.error.downloadFailed'));
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!window.confirm(t('documents.confirmDelete'))) return;
    
    try {
      await documentAPI.delete(documentId);
      // Dokumente neu laden
      await loadDocuments();
    } catch (err) {
      console.error('Fehler beim Löschen:', err);
      setError(t('documents.error.deleteFailed'));
    }
  };

  const handleShare = (doc: any) => {
    setSelectedDocumentForSharing(doc);
    setShareDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'analyzing':
        return 'info';
      case 'uploading':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      rental_contract: t('documents.types.rentalContract'),
      utility_bill: t('documents.types.utilityBill'),
      warning_letter: t('documents.types.warningLetter'),
      termination: t('documents.types.termination'),
      other: t('documents.types.other'),
    };
    return typeMap[type] || type;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          {t('documents.title')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={() => setUploadDialogOpen(true)}
        >
          {t('documents.upload')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            {t('common.loading')}
          </Typography>
        </Box>
      ) : documents.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CloudUploadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('documents.noDocuments')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('documents.uploadHint')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            {t('documents.uploadFirst')}
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {documents.map((doc) => (
            <Grid item xs={12} sm={6} md={4} key={doc.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" noWrap title={doc.name}>
                    {doc.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {getDocumentTypeLabel(doc.type)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {new Date(doc.uploadDate).toLocaleDateString()}
                  </Typography>
                  <Chip
                    label={t(`documents.status.${doc.status}`)}
                    color={getStatusColor(doc.status) as any}
                    size="small"
                    sx={{ mt: 2 }}
                  />
                </CardContent>
                <CardActions>
                  <IconButton
                    size="small"
                    onClick={() => handleView(doc)}
                    disabled={doc.status !== 'completed'}
                    aria-label={t('documents.view')}
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDownload(doc.id, doc.name)}
                    aria-label={t('documents.download')}
                  >
                    <DownloadIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleViewHistory(doc)}
                    aria-label={t('documents.viewHistory')}
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleShare(doc)}
                    aria-label={t('documents.share')}
                  >
                    <ShareIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleViewAnnotations(doc)}
                    aria-label={t('documents.viewAnnotations')}
                  >
                    <CommentIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleViewWorkflow(doc)}
                    aria-label={t('documents.viewWorkflow')}
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(doc.id)}
                    aria-label={t('documents.delete')}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <DocumentUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleUpload}
      />

      <OCRPreviewDialog
        open={ocrPreviewDialogOpen}
        onClose={() => setOcrPreviewDialogOpen(false)}
        documentId={documentToAnalyze || ''}
        onConfirm={handleOcrConfirm}
        onExtractText={documentAPI.extractText}
      />

      <Dialog
        open={analysisDialogOpen}
        onClose={() => setAnalysisDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t('documents.analysisResults')}</DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <DocumentAnalysisView document={selectedDocument} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalysisDialogOpen(false)}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>

      <DocumentVersionHistory
        open={versionHistoryDialogOpen}
        onClose={() => setVersionHistoryDialogOpen(false)}
        documentId={selectedDocumentForHistory?.id || ''}
        onDownload={handleDownload}
        onViewAnalysis={handleView}
      />

      <DocumentAnnotations
        documentId={selectedDocumentForAnnotations?.id || ''}
        open={annotationsDialogOpen}
        onClose={() => setAnnotationsDialogOpen(false)}
      />

      <DocumentShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        documentId={selectedDocumentForSharing?.id || ''}
        documentName={selectedDocumentForSharing?.name || ''}
      />

      <Dialog
        open={workflowDialogOpen}
        onClose={() => setWorkflowDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t('documents.workflow')}</DialogTitle>
        <DialogContent>
          {selectedDocumentForWorkflow && (
            <DocumentWorkflow 
              documentId={selectedDocumentForWorkflow.id}
              currentStatus={selectedDocumentForWorkflow.status || 'DRAFT'}
              onStatusChange={(newStatus) => {
                // Update the document in the store
                dispatch(updateDocument({
                  ...selectedDocumentForWorkflow,
                  status: newStatus
                }));
                
                // Update the document list
                loadDocuments();
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkflowDialogOpen(false)}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default DocumentsPage;
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Tooltip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { useTranslation } from 'react-i18next';

interface Issue {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  legalBasis?: string;
  suggestedAction?: string;
}

interface Recommendation {
  type: string;
  title?: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionRequired?: boolean;
}

interface AnalysisResult {
  documentType: string;
  extractedData?: Record<string, any>;
  issues: Issue[];
  recommendations: Recommendation[];
  riskLevel: 'low' | 'medium' | 'high';
  confidence?: number;
  analyzedAt?: Date;
}

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: Date;
  status: string;
  analysisResult?: AnalysisResult;
}

interface DocumentAnalysisViewProps {
  document: Document;
}

const DocumentAnalysisView: React.FC<DocumentAnalysisViewProps> = ({ document }) => {
  const { t } = useTranslation();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!document.analysisResult) {
    return (
      <Alert severity="info">
        {t('documents.noAnalysis')}
      </Alert>
    );
  }

  const { issues, recommendations, riskLevel, extractedData, confidence, analyzedAt } = document.analysisResult;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatExtractedDataValue = (value: any): string => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getDocumentTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      'RENTAL_CONTRACT': t('documents.types.rentalContract'),
      'UTILITY_BILL': t('documents.types.utilityBill'),
      'WARNING_LETTER': t('documents.types.warningLetter'),
      'TERMINATION': t('documents.types.termination'),
      'OTHER': t('documents.types.other'),
    };
    return typeMap[type] || type;
  };

  return (
    <Box>
      {/* Document Information Header */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              {document.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {getDocumentTypeName(document.analysisResult.documentType)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 2, flexWrap: 'wrap' }}>
              {/* Risiko-Level */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t('documents.analysis.riskLevel')}
                </Typography>
                <Chip
                  label={t(`documents.analysis.risk.${riskLevel}`)}
                  color={getRiskLevelColor(riskLevel) as any}
                  size="medium"
                />
              </Box>
              
              {/* Confidence Level */}
              {confidence !== undefined && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t('documents.analysis.confidence')}
                  </Typography>
                  <Chip
                    label={`${(confidence * 100).toFixed(0)}%`}
                    color={confidence > 0.8 ? 'success' : confidence > 0.6 ? 'warning' : 'error'}
                    size="medium"
                  />
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
        
        {analyzedAt && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {t('documents.analysis.analyzedAt')}: {new Date(analyzedAt).toLocaleDateString()}
          </Typography>
        )}
      </Paper>

      {/* Extrahierte Daten */}
      {extractedData && Object.keys(extractedData).length > 0 && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              {t('documents.analysis.extractedData')} ({Object.keys(extractedData).length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {Object.entries(extractedData).map(([key, value]) => (
                <Grid item xs={12} key={key}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          {key}
                        </Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {formatExtractedDataValue(value)}
                        </Typography>
                      </Box>
                      <Tooltip title={copiedField === key ? t('documents.analysis.copied') : t('documents.analysis.copyToClipboard')}>
                        <IconButton 
                          size="small" 
                          onClick={() => copyToClipboard(formatExtractedDataValue(value), key)}
                        >
                          <FileCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Gefundene Probleme */}
      {issues && issues.length > 0 && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              {t('documents.analysis.issues')} ({issues.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {issues.map((issue, index) => (
                <React.Fragment key={index}>
                  <ListItem alignItems="flex-start">
                    <ListItemIcon>
                      {getSeverityIcon(issue.severity)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="body1">
                            {issue.description}
                          </Typography>
                          <Chip
                            label={t(`documents.analysis.severity.${issue.severity}`)}
                            color={getSeverityColor(issue.severity) as any}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          {issue.legalBasis && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              <strong>{t('documents.analysis.legalBasis')}:</strong> {issue.legalBasis}
                            </Typography>
                          )}
                          {issue.suggestedAction && (
                            <Typography variant="body2" color="primary.main">
                              <strong>{t('documents.analysis.suggestedAction')}:</strong> {issue.suggestedAction}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < issues.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Empfehlungen */}
      {recommendations && recommendations.length > 0 && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              {t('documents.analysis.recommendations')} ({recommendations.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {recommendations.map((rec, index) => (
                <React.Fragment key={index}>
                  <ListItem alignItems="flex-start">
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="body1">
                            {rec.title || rec.description}
                          </Typography>
                          <Chip
                            label={t(`documents.analysis.priority.${rec.priority}`)}
                            color={getPriorityColor(rec.priority) as any}
                            size="small"
                          />
                          {rec.actionRequired && (
                            <Chip
                              label={t('documents.analysis.actionRequired')}
                              color="error"
                              size="small"
                            />
                          )}
                        </Box>
                      }
                      secondary={rec.title && rec.description ? rec.description : undefined}
                    />
                  </ListItem>
                  {index < recommendations.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Keine Probleme gefunden */}
      {(!issues || issues.length === 0) && (!recommendations || recommendations.length === 0) && (
        <Alert severity="success" icon={<CheckCircleIcon />}>
          {t('documents.analysis.noIssues')}
        </Alert>
      )}

      {/* Summary Section */}
      {(issues.length > 0 || recommendations.length > 0) && (
        <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('documents.analysis.summary')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {issues.filter(i => i.severity === 'critical').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('documents.analysis.criticalIssues')}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {issues.filter(i => i.severity === 'warning').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('documents.analysis.warnings')}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {recommendations.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('documents.analysis.recommendations')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default DocumentAnalysisView;
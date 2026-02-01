/**
 * Integration Dashboard Component
 * 
 * This component provides a user interface for managing integrations with
 * law firm management systems, accounting systems, and calendar systems.
 */

import * as React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
  Button,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Sync as SyncIcon,
  CheckCircle as ConnectedIcon,
  Error as DisconnectedIcon,
  Info as InfoIcon,
  CalendarToday as CalendarIcon,
  AccountBalance as AccountingIcon,
  Gavel as LawFirmIcon,
  Cached as CacheIcon,
  FlashOn as FlashOnIcon,
  CloudOff as CloudOffIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useIntegrations } from '../services/useIntegrations';
import { useOffline } from '../services/useOffline';
import { 
  LAW_FIRM_SYSTEMS, 
  ACCOUNTING_SYSTEMS, 
  CALENDAR_SYSTEMS,
  DEFAULT_CONFIG_TEMPLATES
} from '../services/integrationConfig';

const { useState, useEffect, useCallback } = React;

const IntegrationDashboard: React.FC = () => {
  const {
    isInitialized,
    lawFirmSystemConnected,
    accountingSystemConnected,
    calendarSystemConnected,
    isSyncing,
    lastSync,
    error,
    cases,
    events,
    initialize,
    syncLawFirmCases,
    syncAccountingData,
    syncCalendarEvents,
    clearCaches,
    flushBatchProcessors
  } = useIntegrations();

  const {
    isSupported,
    isInitialized: isOfflineInitialized,
    isOffline,
    isSyncing: isOfflineSyncing,
    unsyncedItemCount,
    lastSync: offlineLastSync,
    error: offlineError,
    initialize: initializeOffline,
    syncOfflineData,
    getOfflineStatus,
    clearOfflineData
  } = useOffline();

  // Form states
  const [lawFirmConfig, setLawFirmConfig] = useState({
    type: '',
    apiUrl: '',
    apiKey: '',
    username: '',
    password: '',
    syncFrequency: 30
  });

  const [accountingConfig, setAccountingConfig] = useState({
    type: '',
    apiUrl: '',
    apiKey: '',
    clientId: '',
    clientSecret: '',
    refreshToken: '',
    email: '',
    username: '',
    password: '',
    syncFrequency: 60
  });

  const [calendarConfig, setCalendarConfig] = useState({
    type: '',
    apiUrl: '',
    apiKey: '',
    clientId: '',
    clientSecret: '',
    tenantId: '',
    refreshToken: '',
    calendarId: '',
    username: '',
    password: '',
    syncFrequency: 15
  });

  const [autoSync, setAutoSync] = useState({
    lawFirm: true,
    accounting: true,
    calendar: true
  });

  /**
   * Handle form submission for law firm configuration
   */
  const handleSaveLawFirmConfig = async () => {
    try {
      await initialize({
        lawFirmSystem: {
          type: lawFirmConfig.type as any,
          apiUrl: lawFirmConfig.apiUrl || undefined,
          apiKey: lawFirmConfig.apiKey || undefined,
          credentials: lawFirmConfig.username && lawFirmConfig.password ? {
            username: lawFirmConfig.username,
            password: lawFirmConfig.password
          } : undefined
        }
      });
    } catch (err) {
      console.error('Failed to save law firm configuration:', err);
    }
  };

  /**
   * Handle form submission for accounting configuration
   */
  const handleSaveAccountingConfig = async () => {
    try {
      await initialize({
        accountingSystem: {
          type: accountingConfig.type as any,
          apiUrl: accountingConfig.apiUrl || undefined,
          apiKey: accountingConfig.apiKey || undefined,
          clientId: accountingConfig.clientId || undefined,
          clientSecret: accountingConfig.clientSecret || undefined,
          refreshToken: accountingConfig.refreshToken || undefined,
          email: accountingConfig.email || undefined,
          credentials: accountingConfig.username && accountingConfig.password ? {
            username: accountingConfig.username,
            password: accountingConfig.password
          } : undefined,
          syncFrequency: accountingConfig.syncFrequency.toString()
        }
      });
    } catch (err) {
      console.error('Failed to save accounting configuration:', err);
    }
  };

  /**
   * Handle form submission for calendar configuration
   */
  const handleSaveCalendarConfig = async () => {
    try {
      await initialize({
        calendarSystem: {
          type: calendarConfig.type as any,
          apiUrl: calendarConfig.apiUrl || undefined,
          clientId: calendarConfig.clientId || undefined,
          clientSecret: calendarConfig.clientSecret || undefined,
          tenantId: calendarConfig.tenantId || undefined,
          refreshToken: calendarConfig.refreshToken || undefined,
          calendarId: calendarConfig.calendarId || undefined,

        }
      });
    } catch (err) {
      console.error('Failed to save calendar configuration:', err);
    }
  };

  /**
   * Handle manual sync for law firm cases
   */
  const handleSyncLawFirm = async () => {
    try {
      await syncLawFirmCases();
    } catch (err) {
      console.error('Failed to sync law firm cases:', err);
    }
  };

  /**
   * Handle manual sync for accounting data
   */
  const handleSyncAccounting = async () => {
    try {
      // In a real implementation, this would sync actual accounting data
      await syncAccountingData([]);
    } catch (err) {
      console.error('Failed to sync accounting data:', err);
    }
  };

  /**
   * Handle manual sync for calendar events
   */
  const handleSyncCalendar = async () => {
    try {
      // In a real implementation, this would sync actual calendar events
      await syncCalendarEvents([]);
    } catch (err) {
      console.error('Failed to sync calendar events:', err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Integrations Dashboard
      </Typography>
      
      {/* Offline Status Banner */}
      {isSupported && (
        <Alert 
          severity={isOffline ? "warning" : "info"} 
          icon={isOffline ? <CloudOffIcon /> : <CloudUploadIcon />}
          sx={{ mb: 3 }}
        >
          <Typography variant="body1">
            {isOffline 
              ? "Sie arbeiten derzeit offline. Daten werden lokal gespeichert und bei der nächsten Verbindung synchronisiert." 
              : "Offline-Modus aktiv. Daten werden auch offline gespeichert."}
          </Typography>
          {unsyncedItemCount > 0 && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Nicht synchronisierte Elemente: {unsyncedItemCount}
            </Typography>
          )}
        </Alert>
      )}
      
      {/* Connection Status Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Law Firm Integration */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              avatar={
                <LawFirmIcon color={lawFirmSystemConnected ? "success" : "disabled"} />
              }
              title="Law Firm Management"
              subheader={lawFirmSystemConnected ? "Connected" : "Not connected"}
              action={
                <Tooltip title="Sync now">
                  <IconButton 
                    onClick={handleSyncLawFirm}
                    disabled={!lawFirmSystemConnected || isSyncing}
                  >
                    <SyncIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <Divider />
            <CardContent>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>System</InputLabel>
                <Select
                  value={lawFirmConfig.type}
                  onChange={(e) => setLawFirmConfig({...lawFirmConfig, type: e.target.value})}
                >
                  <MenuItem value=""><em>Select system</em></MenuItem>
                  {Object.entries(LAW_FIRM_SYSTEMS).map(([key, system]) => (
                    <MenuItem key={key} value={key}>{system.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {lawFirmConfig.type && (
                <>
                  <TextField
                    fullWidth
                    label="API URL"
                    value={lawFirmConfig.apiUrl}
                    onChange={(e) => setLawFirmConfig({...lawFirmConfig, apiUrl: e.target.value})}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="API Key"
                    type="password"
                    value={lawFirmConfig.apiKey}
                    onChange={(e) => setLawFirmConfig({...lawFirmConfig, apiKey: e.target.value})}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Username"
                    value={lawFirmConfig.username}
                    onChange={(e) => setLawFirmConfig({...lawFirmConfig, username: e.target.value})}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={lawFirmConfig.password}
                    onChange={(e) => setLawFirmConfig({...lawFirmConfig, password: e.target.value})}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Sync Frequency (minutes)"
                    type="number"
                    value={lawFirmConfig.syncFrequency}
                    onChange={(e) => setLawFirmConfig({...lawFirmConfig, syncFrequency: parseInt(e.target.value) || 30})}
                    sx={{ mb: 2 }}
                  />
                  
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoSync.lawFirm}
                          onChange={(e) => setAutoSync({...autoSync, lawFirm: e.target.checked})}
                        />
                      }
                      label="Auto-sync enabled"
                    />
                  </FormGroup>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Accounting Integration */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              avatar={
                <AccountingIcon color={accountingSystemConnected ? "success" : "disabled"} />
              }
              title="Accounting System"
              subheader={accountingSystemConnected ? "Connected" : "Not connected"}
              action={
                <Tooltip title="Sync now">
                  <IconButton 
                    onClick={handleSyncAccounting}
                    disabled={!accountingSystemConnected || isSyncing}
                  >
                    <SyncIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <Divider />
            <CardContent>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>System</InputLabel>
                <Select
                  value={accountingConfig.type}
                  onChange={(e) => setAccountingConfig({...accountingConfig, type: e.target.value})}
                >
                  <MenuItem value=""><em>Select system</em></MenuItem>
                  {Object.entries(ACCOUNTING_SYSTEMS).map(([key, system]) => (
                    <MenuItem key={key} value={key}>{system.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {accountingConfig.type && (
                <>
                  <TextField
                    fullWidth
                    label="API URL"
                    value={accountingConfig.apiUrl}
                    onChange={(e) => setAccountingConfig({...accountingConfig, apiUrl: e.target.value})}
                    sx={{ mb: 2 }}
                  />
                  
                  {/* Fields specific to DATEV and Outlook */}
                  {(accountingConfig.type === 'datev' || accountingConfig.type === 'outlook') && (
                    <>
                      <TextField
                        fullWidth
                        label="Client ID"
                        value={accountingConfig.clientId}
                        onChange={(e) => setAccountingConfig({...accountingConfig, clientId: e.target.value})}
                        sx={{ mb: 2 }}
                      />
                      
                      <TextField
                        fullWidth
                        label="Client Secret"
                        value={accountingConfig.clientSecret}
                        onChange={(e) => setAccountingConfig({...accountingConfig, clientSecret: e.target.value})}
                        sx={{ mb: 2 }}
                      />
                      
                      <TextField
                        fullWidth
                        label="Refresh Token"
                        value={accountingConfig.refreshToken}
                        onChange={(e) => setAccountingConfig({...accountingConfig, refreshToken: e.target.value})}
                        sx={{ mb: 2 }}
                      />
                    </>
                  )}
                  
                  {/* Fields specific to FastBill */}
                  {accountingConfig.type === 'fastbill' && (
                    <TextField
                      fullWidth
                      label="Email"
                      value={accountingConfig.email}
                      onChange={(e) => setAccountingConfig({...accountingConfig, email: e.target.value})}
                      sx={{ mb: 2 }}
                    />
                  )}
                  
                  <TextField
                    fullWidth
                    label="API Key"
                    type="password"
                    value={accountingConfig.apiKey}
                    onChange={(e) => setAccountingConfig({...accountingConfig, apiKey: e.target.value})}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Username"
                    value={accountingConfig.username}
                    onChange={(e) => setAccountingConfig({...accountingConfig, username: e.target.value})}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={accountingConfig.password}
                    onChange={(e) => setAccountingConfig({...accountingConfig, password: e.target.value})}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Sync Frequency (minutes)"
                    type="number"
                    value={accountingConfig.syncFrequency}
                    onChange={(e) => setAccountingConfig({...accountingConfig, syncFrequency: parseInt(e.target.value) || 60})}
                    sx={{ mb: 2 }}
                  />
                  
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoSync.accounting}
                          onChange={(e) => setAutoSync({...autoSync, accounting: e.target.checked})}
                        />
                      }
                      label="Auto-sync enabled"
                    />
                  </FormGroup>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Calendar Integration */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              avatar={
                <CalendarIcon color={calendarSystemConnected ? "success" : "disabled"} />
              }
              title="Calendar System"
              subheader={calendarSystemConnected ? "Connected" : "Not connected"}
              action={
                <Tooltip title="Sync now">
                  <IconButton 
                    onClick={handleSyncCalendar}
                    disabled={!calendarSystemConnected || isSyncing}
                  >
                    <SyncIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <Divider />
            <CardContent>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>System</InputLabel>
                <Select
                  value={calendarConfig.type}
                  onChange={(e) => setCalendarConfig({...calendarConfig, type: e.target.value})}
                >
                  <MenuItem value=""><em>Select system</em></MenuItem>
                  {Object.entries(CALENDAR_SYSTEMS).map(([key, system]) => (
                    <MenuItem key={key} value={key}>{system.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {calendarConfig.type && (
                <>
                  <TextField
                    fullWidth
                    label="API URL"
                    value={calendarConfig.apiUrl}
                    onChange={(e) => setCalendarConfig({...calendarConfig, apiUrl: e.target.value})}
                    sx={{ mb: 2 }}
                  />
                  
                  {/* Fields specific to Outlook */}
                  {calendarConfig.type === 'outlook' && (
                    <>
                      <TextField
                        fullWidth
                        label="Client ID"
                        value={calendarConfig.clientId}
                        onChange={(e) => setCalendarConfig({...calendarConfig, clientId: e.target.value})}
                        sx={{ mb: 2 }}
                      />
                      
                      <TextField
                        fullWidth
                        label="Client Secret"
                        value={calendarConfig.clientSecret}
                        onChange={(e) => setCalendarConfig({...calendarConfig, clientSecret: e.target.value})}
                        sx={{ mb: 2 }}
                      />
                      
                      <TextField
                        fullWidth
                        label="Tenant ID"
                        value={calendarConfig.tenantId}
                        onChange={(e) => setCalendarConfig({...calendarConfig, tenantId: e.target.value})}
                        sx={{ mb: 2 }}
                      />
                      
                      <TextField
                        fullWidth
                        label="Refresh Token"
                        value={calendarConfig.refreshToken}
                        onChange={(e) => setCalendarConfig({...calendarConfig, refreshToken: e.target.value})}
                        sx={{ mb: 2 }}
                      />
                    </>
                  )}
                  
                  <TextField
                    fullWidth
                    label="API Key"
                    type="password"
                    value={calendarConfig.apiKey}
                    onChange={(e) => setCalendarConfig({...calendarConfig, apiKey: e.target.value})}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Username"
                    value={calendarConfig.username}
                    onChange={(e) => setCalendarConfig({...calendarConfig, username: e.target.value})}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={calendarConfig.password}
                    onChange={(e) => setCalendarConfig({...calendarConfig, password: e.target.value})}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Calendar ID"
                    value={calendarConfig.calendarId}
                    onChange={(e) => setCalendarConfig({...calendarConfig, calendarId: e.target.value})}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Sync Frequency (minutes)"
                    type="number"
                    value={calendarConfig.syncFrequency}
                    onChange={(e) => setCalendarConfig({...calendarConfig, syncFrequency: parseInt(e.target.value) || 15})}
                    sx={{ mb: 2 }}
                  />
                  
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoSync.calendar}
                          onChange={(e) => setAutoSync({...autoSync, calendar: e.target.checked})}
                        />
                      }
                      label="Auto-sync enabled"
                    />
                  </FormGroup>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Optimization */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title="Performance Optimization"
              subheader="Tools to optimize integration performance"
              avatar={<FlashOnIcon />}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Button
                    variant="outlined"
                    startIcon={<CacheIcon />}
                    onClick={clearCaches}
                    disabled={isSyncing}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    Clear All Caches
                  </Button>
                  <Typography variant="body2" color="textSecondary">
                    Clear cached data to force fresh API calls
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Button
                    variant="outlined"
                    startIcon={<SyncIcon />}
                    onClick={flushBatchProcessors}
                    disabled={isSyncing}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    Flush Batch Processors
                  </Button>
                  <Typography variant="body2" color="textSecondary">
                    Force processing of all pending batch operations
                  </Typography>
                </Grid>
              </Grid>
              
              {lastSync && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Last sync: {lastSync.toLocaleString()}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {isSyncing && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Syncing data...</Typography>
        </Box>
      )}
    </Box>
  );
};

export default IntegrationDashboard;
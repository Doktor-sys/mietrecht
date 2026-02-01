import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { addMessage, setTyping, setConversationId, clearChat } from '../store/slices/chatSlice';
import { chatAPI, documentAPI } from '../services/chatbotAPI';
import ChatMessage from '../components/ChatMessage';
import FileUploadDialog from '../components/FileUploadDialog';

const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { messages, isTyping, conversationId } = useSelector((state: RootState) => state.chat);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;
    let heartbeatInterval: NodeJS.Timeout;
    
    // WebSocket-Verbindung herstellen
    const connectWebSocket = () => {
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError(t('chat.error.notAuthenticated'));
        return;
      }

      setIsConnecting(true);
      const ws = new WebSocket(`${wsUrl}?token=${token}`);

      ws.onopen = () => {
        console.log('WebSocket verbunden');
        setIsConnecting(false);
        setError(null);
        
        // Starte Heartbeat
        heartbeatInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Alle 30 Sekunden
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'typing') {
          dispatch(setTyping(data.isTyping));
        } else if (data.type === 'message') {
          dispatch(addMessage({
            id: data.id,
            role: 'assistant',
            content: data.content,
            timestamp: new Date(data.timestamp),
            legalReferences: data.legalReferences,
          }));
          dispatch(setTyping(false));
        } else if (data.type === 'conversationId') {
          dispatch(setConversationId(data.conversationId));
        } else if (data.type === 'pong') {
          // Heartbeat-Antwort empfangen
          console.log('Heartbeat OK');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket Fehler:', error);
        setError(t('chat.error.connection'));
        setIsConnecting(false);
      };

      ws.onclose = () => {
        console.log('WebSocket getrennt');
        setIsConnecting(false);
        clearInterval(heartbeatInterval);
        
        // Automatisch neu verbinden nach 3 Sekunden
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };

      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimeout);
      clearInterval(heartbeatInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [dispatch, t]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: inputMessage,
      timestamp: new Date(),
    };

    dispatch(addMessage(userMessage));
    setInputMessage('');
    dispatch(setTyping(true));

    try {
      if (!conversationId) {
        // Neue Konversation starten
        const response = await chatAPI.startConversation(inputMessage);
        dispatch(setConversationId(response.conversationId));
      } else {
        // Nachricht in bestehender Konversation senden
        await chatAPI.sendMessage(conversationId, inputMessage);
      }
    } catch (err) {
      console.error('Fehler beim Senden der Nachricht:', err);
      setError(t('chat.error.sendFailed'));
      dispatch(setTyping(false));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (file: File, documentType: string) => {
    try {
      const response = await documentAPI.upload(file, documentType);
      
      // Nachricht mit Dokumentenreferenz hinzufügen
      const fileMessage = {
        id: Date.now().toString(),
        role: 'user' as const,
        content: `${t('chat.fileUploaded')}: ${file.name}`,
        timestamp: new Date(),
      };
      
      dispatch(addMessage(fileMessage));
      setUploadDialogOpen(false);
      
      // Automatisch Analyse starten
      dispatch(setTyping(true));
      await documentAPI.analyze(response.documentId);
    } catch (err) {
      console.error('Fehler beim Hochladen:', err);
      setError(t('chat.error.uploadFailed'));
    }
  };

  const handleNewConversation = () => {
    dispatch(clearChat());
    setInputMessage('');
    setError(null);
  };

  return (
    <Container maxWidth="lg" sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          {t('chat.title')}
        </Typography>
        <IconButton
          color="primary"
          onClick={handleNewConversation}
          aria-label={t('chat.newConversation')}
          disabled={messages.length === 0}
        >
          <AddIcon />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isConnecting && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('chat.connecting')}
        </Alert>
      )}

      <Paper
        elevation={3}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Nachrichten-Bereich */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {messages.length === 0 && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body1" color="text.secondary">
                {t('chat.welcome')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t('chat.welcomeHint')}
              </Typography>
            </Box>
          )}

          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isTyping && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                {t('chat.typing')}
              </Typography>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* Eingabe-Bereich */}
        <Box
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            gap: 1,
            alignItems: 'flex-end',
          }}
        >
          <IconButton
            color="primary"
            onClick={() => setUploadDialogOpen(true)}
            aria-label={t('chat.attachFile')}
          >
            <AttachFileIcon />
          </IconButton>

          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('chat.placeholder')}
            disabled={isTyping || isConnecting}
            variant="outlined"
            size="small"
          />

          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping || isConnecting}
            aria-label={t('chat.send')}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>

      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleFileUpload}
      />
    </Container>
  );
};

export default ChatPage;
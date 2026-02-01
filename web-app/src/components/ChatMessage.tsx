import React from 'react';
import { Box, Paper, Typography, Chip, Link, IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

interface LegalReference {
  reference: string;
  title: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  legalReferences?: LegalReference[];
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { t } = useTranslation();
  const isUser = message.role === 'user';

  // Function to handle text-to-speech for web
  const handleTextToSpeech = () => {
    try {
      // Check if speech synthesis is supported
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        // Create speech utterance
        const utterance = new SpeechSynthesisUtterance(message.content);
        utterance.lang = 'de-DE'; // German as default for legal content
        utterance.rate = 0.9; // Slightly slower for better comprehension
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Event handlers
        utterance.onstart = () => {
          console.log('Text-to-speech started for message:', message.id);
        };
        
        utterance.onend = () => {
          console.log('Text-to-speech completed for message:', message.id);
        };
        
        utterance.onerror = (event) => {
          console.error('Text-to-speech error:', event);
        };
        
        // Speak the text
        window.speechSynthesis.speak(utterance);
      } else {
        console.warn('Speech synthesis not supported in this browser');
      }
    } catch (error) {
      console.error('Error triggering text-to-speech:', error);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isUser ? 'row-reverse' : 'row',
          gap: 1,
          maxWidth: '75%',
        }}
      >
        {/* Avatar */}
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: isUser ? 'primary.main' : 'secondary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            flexShrink: 0,
          }}
          aria-label={isUser ? t('chat.user') : t('chat.assistant')}
        >
          {isUser ? <PersonIcon /> : <SmartToyIcon />}
        </Box>

        {/* Nachrichteninhalt */}
        <Paper
          elevation={1}
          sx={{
            p: 2,
            bgcolor: isUser ? 'primary.light' : 'grey.100',
            color: isUser ? 'primary.contrastText' : 'text.primary',
            position: 'relative',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                flex: 1,
                pr: 1,
              }}
            >
              {message.content}
            </Typography>
            {!isUser && (
              <IconButton
                size="small"
                onClick={handleTextToSpeech}
                aria-label={t('chat.textToSpeech')}
                sx={{ 
                  alignSelf: 'flex-start',
                  ml: 1,
                }}
              >
                <VolumeUpIcon fontSize="small" />
              </IconButton>
            )}
          </Box>

          {/* Rechtliche Referenzen */}
          {message.legalReferences && message.legalReferences.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                {t('chat.legalReferences')}:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {message.legalReferences.map((ref, index) => (
                  <Chip
                    key={index}
                    label={ref.reference}
                    size="small"
                    component={Link}
                    href="#"
                    clickable
                    title={ref.title}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Zeitstempel */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 1,
              opacity: 0.7,
            }}
          >
            {new Date(message.timestamp).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default ChatMessage;
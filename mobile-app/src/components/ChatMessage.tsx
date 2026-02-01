import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Avatar, Chip, Surface, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import textToSpeechService from '../services/textToSpeechService';

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

  // Function to handle text-to-speech
  const handleTextToSpeech = async () => {
    try {
      // Check if text-to-speech is available
      const isAvailable = await textToSpeechService.isAvailable();
      if (!isAvailable) {
        console.warn('Text-to-speech is not available on this device');
        return;
      }

      // Trigger text-to-speech for the message content
      await textToSpeechService.speak(message.content, {
        language: 'de-DE', // German as default for legal content
        pitch: 1.0,
        rate: 0.9, // Slightly slower for better comprehension
        volume: 1.0,
        onDone: () => {
          console.log('Text-to-speech completed for message:', message.id);
        },
        onError: (error: any) => {
          console.error('Text-to-speech error:', error);
        }
      });
    } catch (error) {
      console.error('Error triggering text-to-speech:', error);
    }
  };

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={[styles.messageWrapper, isUser && styles.userMessageWrapper]}>
        {/* Avatar */}
        <Avatar.Icon
          size={36}
          icon={isUser ? 'account' : 'robot'}
          style={[styles.avatar, isUser ? styles.userAvatar : styles.assistantAvatar]}
        />

        {/* Message Content */}
        <Surface style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <View style={styles.messageHeader}>
            <Text style={[styles.messageText, isUser && styles.userMessageText]}>
              {message.content}
            </Text>
            {!isUser && (
              <IconButton
                icon="volume-high"
                size={20}
                onPress={handleTextToSpeech}
                style={styles.ttsButton}
              />
            )}
          </View>

          {/* Legal References */}
          {message.legalReferences && message.legalReferences.length > 0 && (
            <View style={styles.referencesContainer}>
              <Text style={styles.referencesLabel}>{t('chat.legalReferences')}:</Text>
              <View style={styles.chipsContainer}>
                {message.legalReferences.map((ref, index) => (
                  <Chip
                    key={index}
                    mode="outlined"
                    compact
                    style={styles.chip}
                    textStyle={styles.chipText}
                  >
                    {ref.reference}
                  </Chip>
                ))}
              </View>
            </View>
          )}

          {/* Timestamp */}
          <Text style={styles.timestamp}>
            {new Date(message.timestamp).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </Surface>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  messageWrapper: {
    flexDirection: 'row',
    maxWidth: '85%',
    gap: 8,
  },
  userMessageWrapper: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    marginTop: 4,
  },
  userAvatar: {
    backgroundColor: '#1976d2',
  },
  assistantAvatar: {
    backgroundColor: '#757575',
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
    elevation: 1,
    flex: 1,
  },
  userBubble: {
    backgroundColor: '#1976d2',
  },
  assistantBubble: {
    backgroundColor: '#f5f5f5',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#000',
    flex: 1,
    paddingRight: 8,
  },
  userMessageText: {
    color: '#fff',
  },
  ttsButton: {
    margin: 0,
    alignSelf: 'flex-start',
  },
  referencesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  referencesLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 6,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    height: 28,
  },
  chipText: {
    fontSize: 11,
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 6,
    textAlign: 'right',
  },
});

export default ChatMessage;
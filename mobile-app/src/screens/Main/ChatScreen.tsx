import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, IconButton, FAB } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { sendMessage } from '../../store/slices/chatSlice';
import ChatMessage from '../../components/ChatMessage';
import TypingIndicator from '../../components/TypingIndicator';
import websocketService from '../../services/websocket';
// Import push notification service
import pushNotificationService from '../../services/pushNotifications';

const ChatScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { messages, isTyping, activeConversationId } = useSelector((state: RootState) => state.chat);
  const { token } = useSelector((state: RootState) => state.auth);
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Connect WebSocket when screen mounts
    if (token) {
      websocketService.connect(token);
      
      if (activeConversationId) {
        websocketService.joinConversation(activeConversationId);
      }
    }

    return () => {
      // Leave conversation when screen unmounts
      if (activeConversationId) {
        websocketService.leaveConversation(activeConversationId);
      }
    };
  }, [token, activeConversationId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = () => {
    if (messageText.trim() && activeConversationId) {
      dispatch(sendMessage({
        conversationId: activeConversationId,
        content: messageText.trim(),
      }) as any);
      
      // Schedule a reminder notification if this is a legal question
      if (messageText.toLowerCase().includes('mietrecht') || messageText.toLowerCase().includes('recht')) {
        pushNotificationService.scheduleDelayedNotification(
          'Rechtliche Beratung',
          'Denken Sie daran, Ihre rechtliche Frage zu dokumentieren',
          300, // 5 minutes
          { screen: 'Chat', conversationId: activeConversationId },
          'legal_updates'
        );
      }
      
      setMessageText('');
    }
  };

  const handleAttachment = () => {
    // TODO: Implement file attachment
    console.log('Attach file');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatMessage message={item} />}
        contentContainerStyle={styles.messageList}
        ListFooterComponent={isTyping ? <TypingIndicator /> : null}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      
      <View style={styles.inputContainer}>
        <IconButton
          icon="attachment"
          size={24}
          onPress={handleAttachment}
          style={styles.attachButton}
        />
        <TextInput
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Ihre Frage zum Mietrecht..."
          mode="outlined"
          style={styles.input}
          multiline
          maxLength={1000}
          dense
        />
        <FAB
          icon="send"
          size="small"
          onPress={handleSend}
          disabled={!messageText.trim()}
          style={styles.sendButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messageList: {
    paddingVertical: 16,
    flexGrow: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  attachButton: {
    margin: 0,
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    maxHeight: 100,
  },
  sendButton: {
    margin: 0,
  },
});

export default ChatScreen;
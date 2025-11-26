import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  legalReferences?: Array<{ reference: string; title: string }>;
}

interface ChatState {
  messages: Message[];
  isTyping: boolean;
  conversationId: string | null;
}

const initialState: ChatState = {
  messages: [],
  isTyping: false,
  conversationId: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    setConversationId: (state, action: PayloadAction<string>) => {
      state.conversationId = action.payload;
    },
    clearChat: (state) => {
      state.messages = [];
      state.conversationId = null;
    },
  },
});

export const { addMessage, setTyping, setConversationId, clearChat } = chatSlice.actions;
export default chatSlice.reducer;

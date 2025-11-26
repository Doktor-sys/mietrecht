import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: Date;
  status: 'uploading' | 'analyzing' | 'completed' | 'error';
  analysisResult?: any;
}

interface DocumentState {
  documents: Document[];
  selectedDocument: Document | null;
  uploading: boolean;
}

const initialState: DocumentState = {
  documents: [],
  selectedDocument: null,
  uploading: false,
};

const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    addDocument: (state, action: PayloadAction<Document>) => {
      state.documents.push(action.payload);
    },
    updateDocument: (state, action: PayloadAction<Document>) => {
      const index = state.documents.findIndex(doc => doc.id === action.payload.id);
      if (index !== -1) {
        state.documents[index] = action.payload;
      }
    },
    selectDocument: (state, action: PayloadAction<Document | null>) => {
      state.selectedDocument = action.payload;
    },
    setUploading: (state, action: PayloadAction<boolean>) => {
      state.uploading = action.payload;
    },
  },
});

export const { addDocument, updateDocument, selectDocument, setUploading } = documentSlice.actions;
export default documentSlice.reducer;
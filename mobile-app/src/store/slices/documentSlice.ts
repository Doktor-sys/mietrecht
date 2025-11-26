import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import * as FileSystem from 'expo-file-system';

interface DocumentIssue {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  reference?: string;
}

interface Document {
  id: string;
  name: string;
  type: 'rental_contract' | 'utility_bill' | 'warning_letter' | 'termination' | 'other';
  uploadedAt: Date;
  analyzed: boolean;
  issues?: DocumentIssue[];
  analysisResult?: any;
}

interface DocumentState {
  documents: Document[];
  selectedDocument: Document | null;
  uploadProgress: number;
  loading: boolean;
  error: string | null;
}

const initialState: DocumentState = {
  documents: [],
  selectedDocument: null,
  uploadProgress: 0,
  loading: false,
  error: null,
};

// Async thunks
export const fetchDocuments = createAsyncThunk(
  'document/fetchDocuments',
  async () => {
    const response = await api.get('/documents');
    return response.data;
  }
);

export const uploadDocument = createAsyncThunk(
  'document/uploadDocument',
  async ({ uri, type, name }: { uri: string; type: string; name: string }, { dispatch }) => {
    // Create form data
    const formData = new FormData();
    
    // Read file info
    const fileInfo = await FileSystem.getInfoAsync(uri);
    
    // Append file
    formData.append('file', {
      uri,
      name,
      type: 'image/jpeg',
    } as any);
    
    formData.append('documentType', type);

    // Upload with progress tracking
    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const progress = progressEvent.total
          ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
          : 0;
        dispatch(setUploadProgress(progress));
      },
    });

    return response.data;
  }
);

export const analyzeDocument = createAsyncThunk(
  'document/analyzeDocument',
  async (documentId: string) => {
    const response = await api.post(`/documents/${documentId}/analyze`);
    return response.data;
  }
);

export const deleteDocument = createAsyncThunk(
  'document/deleteDocument',
  async (documentId: string) => {
    await api.delete(`/documents/${documentId}`);
    return documentId;
  }
);

const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    setSelectedDocument: (state, action: PayloadAction<Document | null>) => {
      state.selectedDocument = action.payload;
    },
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch documents
      .addCase(fetchDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = action.payload;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch documents';
      })
      // Upload document
      .addCase(uploadDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.uploadProgress = 0;
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.documents.push(action.payload);
        state.uploadProgress = 0;
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to upload document';
        state.uploadProgress = 0;
      })
      // Analyze document
      .addCase(analyzeDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(analyzeDocument.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.documents.findIndex(doc => doc.id === action.payload.id);
        if (index !== -1) {
          state.documents[index] = action.payload;
        }
      })
      .addCase(analyzeDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to analyze document';
      })
      // Delete document
      .addCase(deleteDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = state.documents.filter(doc => doc.id !== action.payload);
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete document';
      });
  },
});

export const { 
  setSelectedDocument, 
  setUploadProgress, 
  clearError 
} = documentSlice.actions;

export default documentSlice.reducer;

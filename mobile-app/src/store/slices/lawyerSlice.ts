import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Lawyer {
  id: string;
  name: string;
  specializations: string[];
  location: string;
  rating: number;
  reviewCount: number;
  hourlyRate?: number;
}

interface LawyerState {
  lawyers: Lawyer[];
  selectedLawyer: Lawyer | null;
  loading: boolean;
  error: string | null;
}

const initialState: LawyerState = {
  lawyers: [],
  selectedLawyer: null,
  loading: false,
  error: null,
};

const lawyerSlice = createSlice({
  name: 'lawyer',
  initialState,
  reducers: {
    setLawyers: (state, action: PayloadAction<Lawyer[]>) => {
      state.lawyers = action.payload;
    },
    setSelectedLawyer: (state, action: PayloadAction<Lawyer | null>) => {
      state.selectedLawyer = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setLawyers, setSelectedLawyer, setLoading, setError } = lawyerSlice.actions;
export default lawyerSlice.reducer;

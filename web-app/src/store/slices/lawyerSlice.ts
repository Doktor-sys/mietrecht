import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Lawyer } from '../../../../shared/types/src';

interface Review {
  rating: number;
  comment: string;
  author: string;
  date: string;
}

interface ExtendedLawyer extends Lawyer {
  email?: string;
  phone?: string;
  description?: string;
  reviews?: Review[];
}

interface LawyerState {
  lawyers: ExtendedLawyer[];
  selectedLawyer: ExtendedLawyer | null;
  searchCriteria: {
    location?: string;
    specialization?: string;
  };
  loading: boolean;
}

const initialState: LawyerState = {
  lawyers: [],
  selectedLawyer: null,
  searchCriteria: {},
  loading: false,
};

const lawyerSlice = createSlice({
  name: 'lawyer',
  initialState,
  reducers: {
    setLawyers: (state, action: PayloadAction<ExtendedLawyer[]>) => {
      state.lawyers = action.payload;
    },
    selectLawyer: (state, action: PayloadAction<ExtendedLawyer | null>) => {
      state.selectedLawyer = action.payload;
    },
    setSearchCriteria: (state, action: PayloadAction<{ location?: string; specialization?: string }>) => {
      state.searchCriteria = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setLawyers, selectLawyer, setSearchCriteria, setLoading } = lawyerSlice.actions;
export default lawyerSlice.reducer;

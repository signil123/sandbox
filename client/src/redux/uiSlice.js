import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuthModalOpen: false,
  authModalInitialStep: 'method', // 'method', 'login-form', 'email-form'
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openAuthModal: (state, action) => {
      state.isAuthModalOpen = true;
      state.authModalInitialStep = action.payload?.step || 'method';
    },
    closeAuthModal: (state) => {
      state.isAuthModalOpen = false;
      state.authModalInitialStep = 'method';
    },
  },
});

export const { openAuthModal, closeAuthModal } = uiSlice.actions;

export const selectIsAuthModalOpen = (state) => state.ui.isAuthModalOpen;
export const selectAuthModalInitialStep = (state) => state.ui.authModalInitialStep;

export default uiSlice.reducer;

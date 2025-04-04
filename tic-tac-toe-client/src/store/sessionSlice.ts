import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SessionState {
  sessionID: string | null;
  userID: string | null;
  username: string | null;
}

const initialState: SessionState = {
  sessionID: null,
  userID: null,
  username: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<SessionState>) => {
      state.sessionID = action.payload.sessionID;
      state.userID = action.payload.userID;
      state.username = action.payload.username;
    },
    clearSession: (state) => {
      state.sessionID = null;
      state.userID = null;
      state.username = null;
    },
  },
});

export const { setSession, clearSession } = sessionSlice.actions;
export default sessionSlice.reducer;
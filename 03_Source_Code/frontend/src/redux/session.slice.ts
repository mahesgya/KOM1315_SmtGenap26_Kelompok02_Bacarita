import {createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TestSessionSuccess } from "@/types/story.types";

interface SessionState {
    activeSession: TestSessionSuccess | null;
}

const initialState: SessionState = {
    activeSession: null,
}

const sessionSlice = createSlice({
    name: "session",
    initialState,
    reducers: {
        setTestSession: (state, action: PayloadAction<TestSessionSuccess>) => {
            state.activeSession = action.payload;
        },
        clearTestSession: (state) => {
            state.activeSession = null;
        },
    }
});

export const { setTestSession, clearTestSession } = sessionSlice.actions;
export default sessionSlice.reducer;
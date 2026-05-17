import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isLoading: false,
}

const generateSlice = createSlice({
    name: 'general',
    initialState,
    reducers: {
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
    },
})

export const { setLoading } = generateSlice.actions;
export default generateSlice.reducer;
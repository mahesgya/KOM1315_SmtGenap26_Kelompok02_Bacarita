import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { QuestionWithNumber } from "@/types/question.types";

interface QuestionState {
  activeQuestions: QuestionWithNumber[] | null;
}

const initialState: QuestionState = {
  activeQuestions: null,
};

const questionSlice = createSlice({
  name: "question",
  initialState,
  reducers: {
    setQuestionData: (state, action: PayloadAction<QuestionWithNumber[]>) => {
      state.activeQuestions = action.payload;
    },
    clearQuestionData: (state) => {
      state.activeQuestions = null;
    },
  },
});

export const { setQuestionData, clearQuestionData} = questionSlice.actions;
export default questionSlice.reducer;
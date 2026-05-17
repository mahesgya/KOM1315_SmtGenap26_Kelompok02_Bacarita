import axios, { AxiosError } from 'axios';
import Cookies from '../../node_modules/@types/js-cookie';
import { AppDispatch } from '@/redux/store';
import { setLoading } from '@/redux/general.slice';
import { ErrorPayload } from '@/types/general.types';
import { TestSessionResponse } from '@/types/story.types';
import { QuestionAnswerResponse, QuestionListResponse, QuestionListSuccessPayload, QuestionWithNumber } from '@/types/question.types';
import { clearQuestionData, setQuestionData } from '@/redux/question.slice';
import { clearTestSession } from '@/redux/session.slice';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const TestSessionServices = {
  StartTest: async (dispatch: AppDispatch, storyId: number) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearQuestionData());
      dispatch(clearTestSession());
      const token = Cookies.get('token');
      if (!token) {
        const fallbackError = {
          success: false,
          statusCode: 401,
          error: 'Unauthorized: token tidak tersedia.',
        } as ErrorPayload;
        return fallbackError;
      }
      const response = await axios.post<TestSessionResponse>(
        `${BASE_URL}/students/test-sessions`,
        { storyId: storyId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ErrorPayload>;

      if (axiosError.response?.data) {
        return axiosError.response.data;
      }

      const fallbackError = {
        success: false,
        statusCode: 500,
        error: 'Network or server error occurred.',
      } as ErrorPayload;

      return fallbackError;
    } finally {
      dispatch(setLoading(false));
    }
  },
  GetTestSessionStatus: async (dispatch: AppDispatch, testSessionId: string) => {
    try {
      dispatch(setLoading(true));
      const token = Cookies.get('token');
      if (!token) {
        const fallbackError = {
          success: false,
          statusCode: 401,
          error: 'Unauthorized: token tidak tersedia.',
        } as ErrorPayload;
        return fallbackError;
      }

      const response = await axios.get<TestSessionResponse>(`${BASE_URL}/students/test-sessions/${testSessionId}/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ErrorPayload>;

      if (axiosError.response?.data) {
        return axiosError.response.data;
      }

      const fallbackError = {
        success: false,
        statusCode: 500,
        error: 'Network or server error occurred.',
      } as ErrorPayload;
      return fallbackError;
    } finally {
      dispatch(setLoading(false));
    }
  },
  StartQuestion: async (dispatch: AppDispatch, testSessionId: string, storyId: number) => {
    try {
      dispatch(setLoading(true));
      const token = Cookies.get('token');
      if (!token) {
        const fallbackError = {
          success: false,
          statusCode: 401,
          error: 'Unauthorized: token tidak tersedia.',
        } as ErrorPayload;
        return fallbackError;
      }

      const response = await axios.post<QuestionListResponse>(
        `${BASE_URL}/students/test-sessions/${testSessionId}/stt-questions`,
        { storyId: storyId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.data.success) {
        throw new Error((response.data as ErrorPayload).error);
      }
      const successData = response.data as QuestionListSuccessPayload;
      const dataWithNumbers: QuestionWithNumber[] = successData.data.map((question, index) => ({
        ...question,
        number: index + 1,
      }));
      dispatch(setQuestionData(dataWithNumbers));

      return {
        ...dataWithNumbers,
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error) {
      const axiosError = error as AxiosError<ErrorPayload>;

      if (axiosError.response?.data) {
        return axiosError.response.data;
      }

      const fallbackError = {
        success: false,
        statusCode: 500,
        error: 'Network or server error occurred.',
      } as ErrorPayload;
      return fallbackError;
    } finally {
      dispatch(setLoading(false));
    }
  },
  AnswerQuestion: async (dispatch: AppDispatch, testSessionId: string, questionId: string, form: { spokenWord: string; accuracy: number }) => {
    try {
      dispatch(setLoading(true));
      const token = Cookies.get('token');
      if (!token) {
        const fallbackError = {
          success: false,
          statusCode: 401,
          error: 'Unauthorized: token tidak tersedia.',
        } as ErrorPayload;
        return fallbackError;
      }

      const response = await axios.post<QuestionAnswerResponse>(
        `${BASE_URL}/students/test-sessions/${testSessionId}/stt-questions/${questionId}/answer`,
        {
          spokenWord: form.spokenWord,
          accuracy: form.accuracy,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ErrorPayload>;

      if (axiosError.response?.data) {
        return axiosError.response.data;
      }

      const fallbackError = {
        success: false,
        statusCode: 500,
        error: 'Network or server error occurred.',
      } as ErrorPayload;
      return fallbackError;
    } finally {
      dispatch(setLoading(false));
    }
  },
  FinishTest: async (dispatch: AppDispatch, testSessionId: string) => {
    try {
      dispatch(setLoading(true));
      const token = Cookies.get('token');
      if (!token) {
        const fallbackError = {
          success: false,
          statusCode: 401,
          error: 'Unauthorized: token tidak tersedia.',
        } as ErrorPayload;
        return fallbackError;
      }
      const response = await axios.post<TestSessionResponse>(
        `${BASE_URL}/students/test-sessions/${testSessionId}/finish`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      dispatch(clearQuestionData());
      dispatch(clearTestSession());

      return response.data;
    } catch (error) {
      dispatch(clearQuestionData());
      dispatch(clearTestSession());
      const axiosError = error as AxiosError<ErrorPayload>;

      if (axiosError.response?.data) {
        return axiosError.response.data;
      }

      const fallbackError = {
        success: false,
        statusCode: 500,
        error: 'Network or server error occurred.',
      } as ErrorPayload;

      return fallbackError;
    } finally {
      dispatch(setLoading(false));
    }
  },
};

export default TestSessionServices;

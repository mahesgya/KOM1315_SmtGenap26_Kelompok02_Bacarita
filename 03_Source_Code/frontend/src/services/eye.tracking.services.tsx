import axios, { AxiosError } from 'axios';
import { ErrorPayload } from '@/types/general.types';
import type { AppDispatch } from '@/redux/store';
import { setLoading } from '@/redux/general.slice';
import { DistractionEvent, SessionSummary } from '@/hooks/useSessionDataCollector';
import { buildAuthConfig, isErrorPayload } from './_helper';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const EyeTrackingServices = {
  PostDistractedEvent: async (dispatch: AppDispatch, testSessionId: string, payload: DistractionEvent) => {
    try {
      dispatch(setLoading(true));
      const authConfig = await buildAuthConfig();
      if (isErrorPayload(authConfig)) return authConfig;

      payload.distractionType = payload.distractionType.toUpperCase();

      const response = await axios.post(`${BASE_URL}/students/test-sessions/${testSessionId}/distraction`, payload, authConfig);

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
  PostDistractedEventSummary: async (dispatch: AppDispatch, testSessionId: string, payload: SessionSummary) => {
    try {
      dispatch(setLoading(true));
      const authConfig = await buildAuthConfig();
      if (isErrorPayload(authConfig)) return authConfig;

      const response = await axios.post(`${BASE_URL}/students/test-sessions/${testSessionId}/distraction/summary`, payload, authConfig);

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
};

export default EyeTrackingServices;

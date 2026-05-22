import axios, { AxiosError } from 'axios';
import { ErrorPayload } from '@/types/general.types';
import type { AppDispatch, RootState } from '@/redux/store';
import { setLoading } from '@/redux/general.slice';
import { IWaitingStoriesResponse, IStoryDetailResponse, IApproveRejectRequest, IApproveRejectResponse } from '@/types/curator.types';
import { buildAuthConfig, isErrorPayload } from './_helper';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const CuratorServices = {
  GetWaitingStories: async (dispatch: AppDispatch, getState?: () => RootState): Promise<IWaitingStoriesResponse> => {
    try {
      dispatch(setLoading(true));
      const authConfig = await buildAuthConfig(getState);
      if (isErrorPayload(authConfig)) return authConfig;
      const response = await axios.get<IWaitingStoriesResponse>(`${BASE_URL}/curator/stories/waiting`, authConfig);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ErrorPayload>;
      if (axiosError.response?.data) return axiosError.response.data;
      return { success: false, statusCode: 500, error: 'Network or server error occurred.' };
    } finally {
      dispatch(setLoading(false));
    }
  },

  GetStoryDetail: async (storyId: number, dispatch: AppDispatch, getState?: () => RootState): Promise<IStoryDetailResponse> => {
    try {
      dispatch(setLoading(true));
      const authConfig = await buildAuthConfig(getState);
      if (isErrorPayload(authConfig)) return authConfig;
      const response = await axios.get<IStoryDetailResponse>(`${BASE_URL}/curator/stories/${storyId}`, authConfig);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ErrorPayload>;
      if (axiosError.response?.data) return axiosError.response.data;
      return { success: false, statusCode: 500, error: 'Network or server error occurred.' };
    } finally {
      dispatch(setLoading(false));
    }
  },

  ApproveRejectStory: async (storyId: number, payload: IApproveRejectRequest, dispatch: AppDispatch, getState?: () => RootState): Promise<IApproveRejectResponse> => {
    try {
      dispatch(setLoading(true));
      const authConfig = await buildAuthConfig(getState, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (isErrorPayload(authConfig)) return authConfig;
      const response = await axios.post<IApproveRejectResponse>(`${BASE_URL}/curator/stories/${storyId}/approve`, payload, authConfig);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ErrorPayload>;
      if (axiosError.response?.data) return axiosError.response.data;
      return { success: false, statusCode: 500, error: 'Network or server error occurred.' };
    } finally {
      dispatch(setLoading(false));
    }
  },
};

export default CuratorServices;

import axios, { AxiosError } from 'axios';
import Cookies from '../../node_modules/@types/js-cookie';
import { ErrorPayload } from '@/types/general.types';
import type { AppDispatch } from '@/redux/store';
import { setLoading } from '@/redux/general.slice';
import { IWaitingStoriesResponse, IStoryDetailResponse, IApproveRejectRequest, IApproveRejectResponse } from '@/types/curator.types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const CuratorServices = {
  GetWaitingStories: async (dispatch: AppDispatch): Promise<IWaitingStoriesResponse> => {
    try {
      dispatch(setLoading(true));
      const response = await axios.get<IWaitingStoriesResponse>(`${BASE_URL}/curator/stories/waiting`, {
        headers: {
          Authorization: `Bearer ${Cookies.get('token')}`,
        },
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ErrorPayload>;
      if (axiosError.response?.data) return axiosError.response.data;
      return { success: false, statusCode: 500, error: 'Network or server error occurred.' };
    } finally {
      dispatch(setLoading(false));
    }
  },

  GetStoryDetail: async (storyId: number, dispatch: AppDispatch): Promise<IStoryDetailResponse> => {
    try {
      dispatch(setLoading(true));
      const response = await axios.get<IStoryDetailResponse>(`${BASE_URL}/curator/stories/${storyId}`, {
        headers: {
          Authorization: `Bearer ${Cookies.get('token')}`,
        },
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ErrorPayload>;
      if (axiosError.response?.data) return axiosError.response.data;
      return { success: false, statusCode: 500, error: 'Network or server error occurred.' };
    } finally {
      dispatch(setLoading(false));
    }
  },

  ApproveRejectStory: async (storyId: number, payload: IApproveRejectRequest, dispatch: AppDispatch): Promise<IApproveRejectResponse> => {
    try {
      dispatch(setLoading(true));
      const response = await axios.post<IApproveRejectResponse>(`${BASE_URL}/curator/stories/${storyId}/approve`, payload, {
        headers: {
          Authorization: `Bearer ${Cookies.get('token')}`,
          'Content-Type': 'application/json',
        },
      });
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

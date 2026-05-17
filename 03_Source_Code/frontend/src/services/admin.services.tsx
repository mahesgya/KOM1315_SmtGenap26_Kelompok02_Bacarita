import axios, { AxiosError } from 'axios';
import Cookies from '../../node_modules/@types/js-cookie';
import { ErrorPayload } from '@/types/general.types';
import type { AppDispatch } from '@/redux/store';
import { setLoading } from '@/redux/general.slice';
import { IAdminOverviewResponse, ILevelDetailResponse, ICreateStoryRequest, ICreateStoryResponse, IUpdateStoryRequest, IUpdateStoryResponse, IDeleteStoryResponse } from '@/types/admin.types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const AdminServices = {
  GetOverview: async (dispatch: AppDispatch): Promise<IAdminOverviewResponse> => {
    try {
      dispatch(setLoading(true));
      const response = await axios.get<IAdminOverviewResponse>(`${BASE_URL}/admin/stories/overview`, {
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

  GetStoriesByLevel: async (levelId: number, dispatch: AppDispatch): Promise<ILevelDetailResponse> => {
    try {
      dispatch(setLoading(true));
      const response = await axios.get<ILevelDetailResponse>(`${BASE_URL}/admin/levels/${levelId}/stories`, {
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

  CreateStory: async (levelId: number, payload: ICreateStoryRequest, dispatch: AppDispatch): Promise<ICreateStoryResponse> => {
    try {
      dispatch(setLoading(true));
      const formData = new FormData();
      formData.append('title', payload.title);
      formData.append('description', payload.description);
      formData.append('imageCover', payload.imageCover);
      formData.append('passage', payload.passage);

      const response = await axios.post<ICreateStoryResponse>(`${BASE_URL}/admin/levels/${levelId}/stories`, formData, {
        headers: {
          Authorization: `Bearer ${Cookies.get('token')}`,
          'Content-Type': 'multipart/form-data',
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

  UpdateStory: async (storyId: number, payload: IUpdateStoryRequest, dispatch: AppDispatch): Promise<IUpdateStoryResponse> => {
    try {
      dispatch(setLoading(true));
      const formData = new FormData();
      if (payload.title) formData.append('title', payload.title);
      if (payload.description) formData.append('description', payload.description);
      if (payload.imageCover) formData.append('imageCover', payload.imageCover);
      if (payload.passage) formData.append('passage', payload.passage);

      const response = await axios.put<IUpdateStoryResponse>(`${BASE_URL}/admin/stories/${storyId}`, formData, {
        headers: {
          Authorization: `Bearer ${Cookies.get('token')}`,
          'Content-Type': 'multipart/form-data',
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

  DeleteStory: async (storyId: number, dispatch: AppDispatch): Promise<IDeleteStoryResponse> => {
    try {
      dispatch(setLoading(true));
      const response = await axios.delete<IDeleteStoryResponse>(`${BASE_URL}/admin/stories/${storyId}`, {
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
};

export default AdminServices;

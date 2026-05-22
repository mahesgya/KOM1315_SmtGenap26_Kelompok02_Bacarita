import axios, { AxiosError } from 'axios';
import { ErrorPayload } from '@/types/general.types';
import type { AppDispatch, RootState } from '@/redux/store';
import { setLoading } from '@/redux/general.slice';
import { IAdminOverviewResponse, ILevelDetailResponse, ICreateStoryRequest, ICreateStoryResponse, IUpdateStoryRequest, IUpdateStoryResponse, IDeleteStoryResponse, IAuthAuditLogDashboardResponse, IAuthAuditLogQuery } from '@/types/admin.types';
import { buildAuthConfig, isErrorPayload } from './_helper';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const AdminServices = {
  GetOverview: async (dispatch: AppDispatch, getState?: () => RootState): Promise<IAdminOverviewResponse> => {
    try {
      dispatch(setLoading(true));
      const authConfig = await buildAuthConfig(getState);
      if (isErrorPayload(authConfig)) return authConfig;
      const response = await axios.get<IAdminOverviewResponse>(`${BASE_URL}/admin/stories/overview`, authConfig);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ErrorPayload>;
      if (axiosError.response?.data) return axiosError.response.data;
      return { success: false, statusCode: 500, error: 'Network or server error occurred.' };
    } finally {
      dispatch(setLoading(false));
    }
  },

  GetStoriesByLevel: async (levelId: number, dispatch: AppDispatch, getState?: () => RootState): Promise<ILevelDetailResponse> => {
    try {
      dispatch(setLoading(true));
      const authConfig = await buildAuthConfig(getState);
      if (isErrorPayload(authConfig)) return authConfig;
      const response = await axios.get<ILevelDetailResponse>(`${BASE_URL}/admin/levels/${levelId}/stories`, authConfig);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ErrorPayload>;
      if (axiosError.response?.data) return axiosError.response.data;
      return { success: false, statusCode: 500, error: 'Network or server error occurred.' };
    } finally {
      dispatch(setLoading(false));
    }
  },

  CreateStory: async (levelId: number, payload: ICreateStoryRequest, dispatch: AppDispatch, getState?: () => RootState): Promise<ICreateStoryResponse> => {
    try {
      dispatch(setLoading(true));
      const formData = new FormData();
      formData.append('title', payload.title);
      formData.append('description', payload.description);
      formData.append('imageCover', payload.imageCover);
      formData.append('passage', payload.passage);

      const authConfig = await buildAuthConfig(getState, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (isErrorPayload(authConfig)) return authConfig;
      const response = await axios.post<ICreateStoryResponse>(`${BASE_URL}/admin/levels/${levelId}/stories`, formData, authConfig);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ErrorPayload>;
      if (axiosError.response?.data) return axiosError.response.data;
      return { success: false, statusCode: 500, error: 'Network or server error occurred.' };
    } finally {
      dispatch(setLoading(false));
    }
  },

  UpdateStory: async (storyId: number, payload: IUpdateStoryRequest, dispatch: AppDispatch, getState?: () => RootState): Promise<IUpdateStoryResponse> => {
    try {
      dispatch(setLoading(true));
      const formData = new FormData();
      if (payload.title) formData.append('title', payload.title);
      if (payload.description) formData.append('description', payload.description);
      if (payload.imageCover) formData.append('imageCover', payload.imageCover);
      if (payload.passage) formData.append('passage', payload.passage);

      const authConfig = await buildAuthConfig(getState, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (isErrorPayload(authConfig)) return authConfig;
      const response = await axios.put<IUpdateStoryResponse>(`${BASE_URL}/admin/stories/${storyId}`, formData, authConfig);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ErrorPayload>;
      if (axiosError.response?.data) return axiosError.response.data;
      return { success: false, statusCode: 500, error: 'Network or server error occurred.' };
    } finally {
      dispatch(setLoading(false));
    }
  },

  DeleteStory: async (storyId: number, dispatch: AppDispatch, getState?: () => RootState): Promise<IDeleteStoryResponse> => {
    try {
      dispatch(setLoading(true));
      const authConfig = await buildAuthConfig(getState);
      if (isErrorPayload(authConfig)) return authConfig;
      const response = await axios.delete<IDeleteStoryResponse>(`${BASE_URL}/admin/stories/${storyId}`, authConfig);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ErrorPayload>;
      if (axiosError.response?.data) return axiosError.response.data;
      return { success: false, statusCode: 500, error: 'Network or server error occurred.' };
    } finally {
      dispatch(setLoading(false));
    }
  },

  GetAuditLogs: async (query: IAuthAuditLogQuery, dispatch: AppDispatch, getState?: () => RootState): Promise<IAuthAuditLogDashboardResponse> => {
    try {
      dispatch(setLoading(true));
      const authConfig = await buildAuthConfig(getState, {
        params: query,
      });
      if (isErrorPayload(authConfig)) return authConfig;
      const response = await axios.get<IAuthAuditLogDashboardResponse>(`${BASE_URL}/auth/admin/audit-logs`, authConfig);
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

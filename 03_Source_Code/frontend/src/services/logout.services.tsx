import axios, { AxiosError } from 'axios';
import { LogoutResponse } from '@/types/auth.types';
import { ErrorPayload } from '@/types/general.types';
import type { AppDispatch, RootState } from '@/redux/store';
import { setLoading } from '@/redux/general.slice';
import { setLogout } from '@/redux/auth.slice';
import { buildAuthConfig, isErrorPayload } from './_helper';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function logoutUser(role: 'teachers' | 'parents' | 'students' | 'admins' | 'curators', dispatch: AppDispatch, getState?: () => RootState): Promise<LogoutResponse | ErrorPayload> {
  try {
    dispatch(setLoading(true));
    const authConfig = await buildAuthConfig(getState);
    if (isErrorPayload(authConfig)) {
      dispatch(setLogout());
      await fetch('/api/auth/remove-session', {
        method: 'POST',
      });
      return authConfig;
    }

    const response = await axios.post<LogoutResponse>(
      `${BASE_URL}/auth/${role}/logout`,
      {},
      authConfig,
    );

    if (response.data.success) {
      dispatch(setLogout());

      await fetch('/api/auth/remove-session', {
        method: 'POST',
      });
    }

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<LogoutResponse>;
    dispatch(setLogout());
    await fetch('/api/auth/remove-session', {
      method: 'POST',
    });

    if (axiosError.response?.data) {
      return axiosError.response.data;
    }

    return {
      success: false,
      statusCode: 500,
      error: 'Network or server error occurred.',
    };
  } finally {
    dispatch(setLoading(false));
  }
}

const LogoutServices = {
  LogoutGuru: (dispatch: AppDispatch, getState?: () => RootState) => logoutUser('teachers', dispatch, getState),
  LogoutOrangTua: (dispatch: AppDispatch, getState?: () => RootState) => logoutUser('parents', dispatch, getState),
  LogoutSiswa: (dispatch: AppDispatch, getState?: () => RootState) => logoutUser('students', dispatch, getState),
  LogoutAdmin: (dispatch: AppDispatch, getState?: () => RootState) => logoutUser('admins', dispatch, getState),
  LogoutKurator: (dispatch: AppDispatch, getState?: () => RootState) => logoutUser('curators', dispatch, getState),
};

export default LogoutServices;

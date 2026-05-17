import axios, { AxiosError } from 'axios';
import Cookies from '../../node_modules/@types/js-cookie';
import { LogoutResponse } from '@/types/auth.types';
import { ErrorPayload } from '@/types/general.types';
import type { AppDispatch } from '@/redux/store';
import { setLoading } from '@/redux/general.slice';
import { setLogout } from '@/redux/auth.slice';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function logoutUser(role: 'teachers' | 'parents' | 'students' | 'admins' | 'curators', dispatch: AppDispatch): Promise<LogoutResponse | ErrorPayload> {
  try {
    dispatch(setLoading(true));
    const response = await axios.post<LogoutResponse>(
      `${BASE_URL}/auth/${role}/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${Cookies.get('token')}`,
        },
      },
    );

    if (response.data.success) {
      Cookies.remove('token');
      dispatch(setLogout());

      await fetch('/api/auth/remove-session', {
        method: 'POST',
      });
    }

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<LogoutResponse>;
    Cookies.remove('token');
    dispatch(setLogout());

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
  LogoutGuru: (dispatch: AppDispatch) => logoutUser('teachers', dispatch),
  LogoutOrangTua: (dispatch: AppDispatch) => logoutUser('parents', dispatch),
  LogoutSiswa: (dispatch: AppDispatch) => logoutUser('students', dispatch),
  LogoutAdmin: (dispatch: AppDispatch) => logoutUser('admins', dispatch),
  LogoutKurator: (dispatch: AppDispatch) => logoutUser('curators', dispatch),
};

export default LogoutServices;

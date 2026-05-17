import Cookies from '../../node_modules/@types/js-cookie';
import { AxiosError, AxiosResponse } from 'axios';
import { setLoading } from '@/redux/general.slice';
import type { AppDispatch } from '@/redux/store';
import type { ErrorPayload } from '@/types/general.types';

type ApiRunner = <T>(dispatch: AppDispatch, call: (token: string) => Promise<AxiosResponse<T>>) => Promise<T | ErrorPayload>;

export const runWithAuth: ApiRunner = async (dispatch, call) => {
  try {
    dispatch(setLoading(true));
    const token = Cookies.get('token');
    if (!token) {
      return {
        success: false,
        statusCode: 401,
        error: 'Unauthorized: Token tidak tersedia.',
      } as ErrorPayload;
    }

    const res = await call(token);
    return res.data;
  } catch (error) {
    const axiosError = error as AxiosError<ErrorPayload>;
    if (axiosError.response?.data) {
      return axiosError.response.data;
    }
    return {
      success: false,
      statusCode: 500,
      error: 'Network or server error occurred.',
    } as ErrorPayload;
  } finally {
    dispatch(setLoading(false));
  }
};

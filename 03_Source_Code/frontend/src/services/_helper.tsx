import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { setLoading } from '@/redux/general.slice';
import type { AppDispatch, RootState } from '@/redux/store';
import type { ErrorPayload } from '@/types/general.types';

type ApiRunner = <T>(dispatch: AppDispatch, call: (token: string) => Promise<AxiosResponse<T>>) => Promise<T | ErrorPayload>;

export function isErrorPayload(value: unknown): value is ErrorPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as { success?: unknown }).success === false &&
    'statusCode' in value &&
    'error' in value
  );
}

export async function getSessionToken(getState?: () => RootState): Promise<string | null> {
  const stateToken = getState?.()?.auth?.token ?? null;
  if (stateToken) {
    return stateToken;
  }

  try {
    const res = await fetch('/api/auth/token', {
      credentials: 'same-origin',
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as { token?: string | null };
    return data.token ?? null;
  } catch {
    return null;
  }
}

export async function buildAuthConfig(
  getState?: () => RootState,
  config: AxiosRequestConfig = {},
): Promise<AxiosRequestConfig | ErrorPayload> {
  const token = await getSessionToken(getState);

  if (!token) {
    return {
      success: false,
      statusCode: 401,
      error: 'Unauthorized: Token tidak tersedia.',
    };
  }

  return {
    ...config,
    headers: {
      ...(config.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  };
}

export const runWithAuth: ApiRunner = async (dispatch, call) => {
  try {
    dispatch(setLoading(true));
    const token = await getSessionToken();
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

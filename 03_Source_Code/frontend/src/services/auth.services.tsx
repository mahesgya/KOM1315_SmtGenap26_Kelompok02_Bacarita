import axios, { AxiosError } from 'axios';
import { AdminProfileResponse, KuratorProfileResponse, LoginResponse, RegisterGuruPayload, RegisterResponse } from '@/types/auth.types';
import { ErrorPayload } from '@/types/general.types';
import { setLogin } from '@/redux/auth.slice';
import type { AppDispatch, RootState } from '@/redux/store';
import { setLoading } from '@/redux/general.slice';
import { TeacherProfileResponse, StudentProfileResponse, ParentProfileResponse } from '@/types/auth.types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

type LoginPayloadMap = {
  teachers: { email: string; password: string };
  parents: { email: string; password: string };
  students: { username: string; password: string };
  admins: { email: string; password: string };
  curators: { email: string; password: string };
};

type LoginRole = keyof LoginPayloadMap;

// Retrieve the JWT from the HttpOnly cookie via the BFF relay route.
// The cookie cannot be read directly by JS; the server-side relay returns it.
async function getSessionToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/token');
    const data = await res.json();
    return data.token ?? null;
  } catch {
    return null;
  }
}

async function Login<Role extends LoginRole>(role: Role, payload: LoginPayloadMap[Role], dispatch: AppDispatch): Promise<LoginResponse | ErrorPayload> {
  try {
    dispatch(setLoading(true));
    const response = await axios.post<LoginResponse>(`${BASE_URL}/auth/${role}/login`, payload);

    if (response.data.success) {
      const token = response.data.data.token;

      // Store token in HttpOnly cookie via server-side route (AUTH-05 remediation).
      // token is no longer set in a JS-accessible cookie.
      await fetch('/api/auth/set-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, token }),
      });

      dispatch(setLogin({ token }));
    }

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<LoginResponse>;
    if (axiosError.response?.data) {
      return axiosError.response.data;
    }

    const fallbackError: ErrorPayload = {
      success: false,
      statusCode: 500,
      error: 'Network or server error occurred.',
    };

    return fallbackError;
  } finally {
    dispatch(setLoading(false));
  }
}

async function GetProfile<T>(dispatch: AppDispatch, getState?: () => RootState): Promise<T | ErrorPayload> {
  try {
    dispatch(setLoading(true));

    // Prefer in-memory Redux token (available within the same session).
    // Fall back to BFF relay (reads HttpOnly cookie) after page refresh.
    let token: string | null = getState?.()?.auth?.token ?? null;
    if (!token) {
      token = await getSessionToken();
    }

    const response = await axios.get<T>(`${BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
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
}

const AuthServices = {
  //PART LOGIN
  LoginGuru: (email: string, password: string, dispatch: AppDispatch) => Login('teachers', { email, password }, dispatch),
  LoginOrangTua: (email: string, password: string, dispatch: AppDispatch) => Login('parents', { email, password }, dispatch),
  LoginSiswa: (username: string, password: string, dispatch: AppDispatch) => Login('students', { username, password }, dispatch),
  LoginAdmin: (email: string, password: string, dispatch: AppDispatch) => Login('admins', { email, password }, dispatch),
  LoginKurator: (email: string, password: string, dispatch: AppDispatch) => Login('curators', { email, password }, dispatch),

  //PART REGISTER
  RegisterGuru: async (form: RegisterGuruPayload, dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response = await axios.post<RegisterResponse>(`${BASE_URL}/teachers`, form);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<RegisterResponse>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }

      const fallbackError: ErrorPayload = {
        success: false,
        statusCode: 500,
        error: 'Network or server error occurred.',
      };

      return fallbackError;
    } finally {
      dispatch(setLoading(false));
    }
  },

  //PART GET PROFILE
  GetProfileStudent: (dispatch: AppDispatch, getState?: () => RootState) => GetProfile<StudentProfileResponse>(dispatch, getState),
  GetProfileTeacher: (dispatch: AppDispatch, getState?: () => RootState) => GetProfile<TeacherProfileResponse>(dispatch, getState),
  GetProfileParent: (dispatch: AppDispatch, getState?: () => RootState) => GetProfile<ParentProfileResponse>(dispatch, getState),
  GetProfileAdmin: (dispatch: AppDispatch, getState?: () => RootState) => GetProfile<AdminProfileResponse>(dispatch, getState),
  GetProfileKurator: (dispatch: AppDispatch, getState?: () => RootState) => GetProfile<KuratorProfileResponse>(dispatch, getState),
};

export default AuthServices;

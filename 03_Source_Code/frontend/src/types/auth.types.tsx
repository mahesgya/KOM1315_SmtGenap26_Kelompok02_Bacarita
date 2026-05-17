import {SuccessPayload, ErrorPayload } from "./general.types";

//LOGIN PAYLOAD TYPES

export interface LoginSuccessPayload extends SuccessPayload {
    data: {
        token: string;
    };
}

export interface AuthFailurePayloadValidation extends ErrorPayload {
    errors: string[];
}

export type LoginResponse = LoginSuccessPayload | ErrorPayload | AuthFailurePayloadValidation;

//REGISTER PAYLOAD TYPES

export type RegisterGuruPayload = {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  schoolName: string;
};

export interface RegisterSuccessPayload extends SuccessPayload {
    data: {
        id: string;
        email: string;
        username: string;
        fullName: string;
        schoolName: string;
        createdAt: string;
        updatedAt: string;
    }
}

export type RegisterResponse = RegisterSuccessPayload | ErrorPayload | AuthFailurePayloadValidation;

//LOGOUT PAYLOAD TYPES
export type LogoutResponse = SuccessPayload | ErrorPayload;

//PROFILE DATA

export interface BaseProfilePayload {
    id: string;
    username: string;
    fullName: string;
    createdAt: string;
    updatedAt: string;
}

export interface TeacherProfilePayload extends BaseProfilePayload {
    email: string;
    schoolName: string;
}

export interface AdminProfilePayload extends BaseProfilePayload {
    email: string;
}

export interface KuratorProfilePayload extends BaseProfilePayload {
    email: string;
}

export interface ParentProfilePayload extends BaseProfilePayload {
    email: string
}

export interface StudentProfileSuccessPayload extends SuccessPayload {
    data: BaseProfilePayload
}

export interface TeacherProfileSuccessPayload extends SuccessPayload {
    data: TeacherProfilePayload;
}

export interface ParentProfileSuccessPayload extends SuccessPayload {
    data: ParentProfilePayload;
}

export interface AdminProfileSuccessPayload extends SuccessPayload {
    data: AdminProfilePayload;
}

export interface KuratorProfileSuccessPayload extends SuccessPayload {
    data: KuratorProfilePayload;
}

export type StudentProfileResponse = StudentProfileSuccessPayload | ErrorPayload
export type TeacherProfileResponse = TeacherProfileSuccessPayload | ErrorPayload
export type ParentProfileResponse = ParentProfileSuccessPayload | ErrorPayload
export type AdminProfileResponse = AdminProfileSuccessPayload | ErrorPayload
export type KuratorProfileResponse = KuratorProfileSuccessPayload | ErrorPayload
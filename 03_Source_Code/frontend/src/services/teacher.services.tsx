import axios from "axios";
import { GetAllStudentResponse, ParentsEmailResponse, RegisterStudentPayload, RegisterStudentResponse, TeacherOverviewResponse, TestSessionOfStudentResponse, TestSessionSingleStudentResponse } from "@/types/teacher.types";
import { AppDispatch } from "@/redux/store";
import { runWithAuth } from "./_helper";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const TeacherServices = {
    GetParentsEmail: async (dispatch: AppDispatch) => {
        return runWithAuth<ParentsEmailResponse>(dispatch, (token) =>
        axios.get(`${BASE_URL}/teachers/students/parents-email`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        )
    },

    RegisterStudent: async (form: RegisterStudentPayload, dispatch: AppDispatch) => {
        return runWithAuth<RegisterStudentResponse>(dispatch, (token) =>
        axios.post(`${BASE_URL}/teachers/students`, form, {
            headers: { Authorization: `Bearer ${token}` },
        })
        )
    },

    GetOverview: async (dispatch: AppDispatch) => {
        return runWithAuth<TeacherOverviewResponse>(dispatch, (token) =>
        axios.get(`${BASE_URL}/teachers/dashboard/overview`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        );
    },

    GetAllStudent: async (dispatch: AppDispatch) => {
        return runWithAuth<GetAllStudentResponse>(dispatch, (token) =>
        axios.get(`${BASE_URL}/teachers/dashboard/students`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        );
    },

    GetAllTestOfStudent: async (dispatch: AppDispatch, studentId: string) => {
        return runWithAuth<TestSessionOfStudentResponse>(dispatch, (token) =>
        axios.get(`${BASE_URL}/teachers/dashboard/students/${studentId}/test-sessions`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        );
    },

    GetSingleTestOfStudent: async (
        dispatch: AppDispatch,
        studentId: string,
        sessionId: string
    ) => {
        return runWithAuth<TestSessionSingleStudentResponse>(dispatch, (token) =>
        axios.get(
            `${BASE_URL}/teachers/dashboard/students/${studentId}/test-sessions/${sessionId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        )
        );
    },
}

export default TeacherServices;
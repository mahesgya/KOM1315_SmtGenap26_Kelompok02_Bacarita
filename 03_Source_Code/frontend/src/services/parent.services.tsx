import axios from "axios";
import { GetAllStudentResponse, TeacherOverviewResponse, TestSessionOfStudentResponse, TestSessionSingleStudentResponse } from "@/types/teacher.types";
import { AppDispatch } from "@/redux/store";
import { runWithAuth } from "./_helper";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const ParentServices = {
    GetOverview: async (dispatch: AppDispatch) => {
        return runWithAuth<TeacherOverviewResponse>(dispatch, (token) =>
        axios.get(`${BASE_URL}/parents/dashboard/overview`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        );
    },

    GetAllStudent: async (dispatch: AppDispatch) => {
        return runWithAuth<GetAllStudentResponse>(dispatch, (token) =>
        axios.get(`${BASE_URL}/parents/dashboard/children`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        );
    },

    GetAllTestOfStudent: async (dispatch: AppDispatch, studentId: string) => {
        return runWithAuth<TestSessionOfStudentResponse>(dispatch, (token) =>
        axios.get(`${BASE_URL}/parents/dashboard/children/${studentId}/test-sessions`, {
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
            `${BASE_URL}/parents/dashboard/children/${studentId}/test-sessions/${sessionId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        )
        );
    },
}

export default ParentServices;
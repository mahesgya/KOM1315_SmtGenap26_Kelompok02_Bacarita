import { SuccessPayload, ErrorPayload } from "./general.types";
import { TestSessionResult, LevelProgressPayload } from "./teacher.types";

// OVERVIEW PAYLOAD

export interface OverviewData {
    totalStudents: number;
    totalTestSessions: number;
    completedTestSessions: number;
    inProgressTestSessions: number;
    averageScore: number;
    testSessions: TestSessionResult[];
}

export interface ParentOverviewSuccessPayload extends SuccessPayload {
    data: OverviewData;
}

export type ParentOverviewResponse = ParentOverviewSuccessPayload | ErrorPayload;

//ALL CHILDREN PAYLOAD

export interface TeacherPayload {
    id: string;
    username:string;
    fullName: string;
}

export interface ChildrenData {
    id: string;
    username: string;
    fullName: string;
    teacher: TeacherPayload;
    totalTestSessions: number;
    completedTestSessions: number;
    inProgressTestSessions: number;
    averageScore: number;
    lastTestSessionAt: string | null;
    levelProgresses: LevelProgressPayload[]
    createdAt: string;
}

export interface GetAllChildrenSuccessPayload extends SuccessPayload{
    data: ChildrenData[]
}

export type GetAllChildrenResponse = GetAllChildrenSuccessPayload | ErrorPayload

//TEST SESSION OF STUDENTS PAYLOAD

export interface TestSessionOfStudentSuccessPayload extends SuccessPayload {
    data : TestSessionResult[];
}

export type TestSessionOfStudentResponse = TestSessionOfStudentSuccessPayload | ErrorPayload;

//TEST SESSION SINGLE STUDENT PAYLOAD

export interface TestSessionSingleStudentSuccessPayload extends SuccessPayload {
    data : TestSessionResult;
}

export type TestSessionSingleStudentResponse = TestSessionSingleStudentSuccessPayload | ErrorPayload;
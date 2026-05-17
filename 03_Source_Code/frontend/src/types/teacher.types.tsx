import { SuccessPayload, ErrorPayload } from "./general.types";

// GET PARENTS EMAIL PAYLOAD TYPES

export interface ParentsEmailandFullName {
    email: string;
    fullName: string;
}

export interface ParentsEmailPayload extends SuccessPayload {
    data: ParentsEmailandFullName[];
}

export type ParentsEmailResponse = ParentsEmailPayload | ErrorPayload;

// REGISTER STUDENT PAYLOAD TYPES

export interface RegisterStudentPayload { 
    studentUsername: string;
    studentFullName: string;
    parentEmail: string;
    parentFullName?: string;
    jumpLevelTo?: number;
}
export interface Student {
    id: string;
    username: string;
    fullName: string;
    createdAt: string;
    updatedAt: string;
}

export interface Parent {
    id: string;
    email: string;
    username: string;
    fullName: string;
    createdAt: string;
    updatedAt: string;
}

export interface Teacher {
    id: string;
    email: string;
    username: string;
    fullName: string;
    schoolName: string;
    createdAt: string;
    updatedAt: string;
}

export interface ParentWithStudents extends Parent {
    students: Student[];
}

export interface RegisterStudentSuccessPayload extends SuccessPayload { 
    data: {
        id: string;
        username: string;
        fullName: string;
        teacher: Teacher;
        parent: Parent;
        createdAt: string;
        updatedAt: string;
    }
}

export interface RegisterStudentSuccessPayloadWithParent extends SuccessPayload {
    data: {
        id: string;
        username: string;
        fullName: string;
        teacher: Teacher;
        parent: ParentWithStudents;
        createdAt: string;
        updatedAt: string;
    }
} 

export type RegisterStudentResponse = RegisterStudentSuccessPayload | RegisterStudentSuccessPayloadWithParent | ErrorPayload;

// OVERVIEW PAYLOAD

export interface DistractedEyeEventSummary {
    id: string;
    totalSessionDurationSec: number;
    timeBreakdownFocus: number;
    timeBreakdownTurning: number;
    timeBreakdownGlance: number;
    timeBreakdownNotDetected: number;
    turningTriggersCount: number;
    glanceTriggersCount: number;
    avgPoseVariance: number;
    longFixationCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface DistractedEyeEventData{
    id: string;
    distractionType: string;
    triggerDurationMs: number;
    occurredAtWord: string;
    createdAt: string;
    updatedAt: string;
}

export interface SttWordResult {
    id: string;
    intruction: string | null;
    expectedWord: string;
    spokenWord: string;
    accuracy: number;
    createdAt: string;
}

export interface StudentData {
    id: string;
    username: string;
    fullName: string;
}

export interface TestSessionResult {
    id: string;
    student: StudentData;
    levelFullName: string;
    titleAtTaken: string;
    startedAt: string;
    finishedAt: string;
    medal: string;
    score: number;
    isCompleted: boolean;
    sttWordResults: SttWordResult[];
    distractedEyeEvents: DistractedEyeEventData[];
    distractedEyeEventsSummary: DistractedEyeEventSummary;
}

export interface OverviewData {
    totalStudents: number;
    totalTestSessions: number;
    completedTestSessions: number;
    inProgressTestSessions: number;
    averageScore: number;
    testSessions: TestSessionResult[];
}

export interface TeacherOverviewSuccessPayload extends SuccessPayload {
    data: OverviewData;
}

export type TeacherOverviewResponse = TeacherOverviewSuccessPayload | ErrorPayload;

//ALL STUDENT PAYLOAD

export interface ParentPayload {
    id: string;
    email: string;
    username:string;
    fullName: string;
}

export interface LevelProgressPayload{
    levelId: number;
    levelNo: number;
    levelName: string;
    levelFullName: string;
    isUnlocked: boolean;
    isCompleted: boolean;
    isSkipped: boolean;
    currentPoints: number;
    maxPoints: number;
    progress: number | null;
    requiredPoints: number;
    goldCount: number;
    silverCount: number;
    bronzeCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface StudentData {
    id: string;
    username: string;
    fullName: string;
    parent: ParentPayload;
    totalTestSessions: number;
    completedTestSessions: number;
    inProgressTestSessions: number;
    averageScore: number;
    lastTestSessionAt: string | null;
    levelProgresses: LevelProgressPayload[]
    createdAt: string;
}

export interface GetAllStudentSuccessPayload extends SuccessPayload{
    data: StudentData[]
}

export type GetAllStudentResponse = GetAllStudentSuccessPayload | ErrorPayload

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
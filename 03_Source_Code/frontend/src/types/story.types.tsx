import { SuccessPayload, ErrorPayload } from "@/types/general.types";
import { Student } from "./teacher.types";

export interface Level {
    id: number;
    no: number;
    name: string;
    fullName: string;
    isUnlocked: boolean;
    isSkipped?: boolean;
    requiredPoints: number;
    isBonusLevel: boolean;
    maxPoints: number;
    goldCount: number;
    silverCount: number;
    bronzeCount: number;
    isCompleted: boolean;
    progress: number;
    createdAt: string;
    updatedAt: string;
    stories: Story[];
}

export interface Story {
    id: number;
    title: string;
    description: string;
    imageUrl: string | null;
    isGoldMedal: boolean;
    isSilverMedal: boolean;
    isBronzeMedal:boolean;
    createdAt: string;
    updatedAt: string;
}

export interface LevelsData extends SuccessPayload {
    data: Level[];
}

export type GetLevelsResponse = LevelsData | ErrorPayload;

export interface StoryTest {
    id: number;
    title: string;
    description: string;
    image: string;
    passage : string;
    status : string;
    createdAt: string;
    updatedAt: string;
}

export interface TestSessionData {
    id: string;
    student : Student;
    story : StoryTest;
    levelFullName: string;
    titleAtTaken: string;
    imageAtTaken: string;
    imageAtTakenUrl: string;
    descriptionAtTaken: string;
    passageAtTaken: string;
    passagesAtTaken: string[];
    startedAt: string;
    finishedAt: string;
    remainingTimeInSeconds: number;
    medal: string | null;
    score: number | null;
    isCompleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface TestSessionSuccess extends SuccessPayload {
    data: TestSessionData;
}

export type TestSessionResponse = TestSessionSuccess | ErrorPayload;

export interface IPostDistractedEyeEventSummary {
    totalSessionDurationSec: number;
    timeBreakdownFocus: number;
    timeBreakdownTurning: number;
    timeBreakdownGlance: number;
    timeBreakdownNotDetected: number;
    turningTriggersCount: number;
    glanceTriggersCount: number;
    avgPoseVariance: number;
    longFixationCount: number;
}

export interface IPostDistractedEyeEvent{
    distractionType: string;
    triggerDurationMs: number;
    occurredAtWord: string;
}
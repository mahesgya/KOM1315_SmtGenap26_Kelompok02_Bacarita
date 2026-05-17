import { ErrorPayload, SuccessPayload } from "./general.types";

export interface IStoryCurator {
  id: number;
  title: string;
  description: string;
  image: string;
  imageUrl: string;
  passage: string;
  sentences: string[];
  status: string;
  levelId: number;
  levelName: string;
  levelFullName: string;
  createdAt: string;
  updatedAt: string;
}

export interface IWaitingStories {
  stories: IStoryCurator[];
  totalWaiting: number;
}

export interface IWaitingStoriesSuccess extends SuccessPayload {
  data: IWaitingStories;
}

export type IWaitingStoriesResponse = IWaitingStoriesSuccess | ErrorPayload;

export interface IApprovalLogCurator {
  id: number;
  storyId: number;
  fromStatus: string;
  toStatus: string;
  reason: string;
  curatorId: number | null;
  curatorName: string | null;
  createdAt: string;
}

export interface IStoryDetailCurator {
  id: number;
  title: string;
  description: string;
  image: string;
  imageUrl: string;
  passage: string;
  sentences: string[];
  status: string;
  levelId: number;
  levelName: string;
  levelFullName: string;
  createdAt: string;
  updatedAt: string;
  approvalLogs: IApprovalLogCurator[];
}

export interface IStoryDetailSuccess extends SuccessPayload {
  data: IStoryDetailCurator;
}

export type IStoryDetailResponse = IStoryDetailSuccess | ErrorPayload;

export interface IApproveRejectRequest {
  status: string;
  reason: string;
}

export interface IApproveRejectData {
  id: number;
  title: string;
  description: string;
  image: string;
  imageUrl: string;
  passage: string;
  sentences: string[];
  status: string;
  levelId: number;
  levelName: string;
  levelFullName: string;
  createdAt: string;
  updatedAt: string;
  approvalLogs: IApprovalLogCurator[];
}

export interface IApproveRejectSuccess extends SuccessPayload {
  data: IApproveRejectData;
}

export type IApproveRejectResponse = IApproveRejectSuccess | ErrorPayload;

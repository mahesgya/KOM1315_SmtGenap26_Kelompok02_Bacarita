import { ErrorPayload, SuccessPayload } from "./general.types";

export interface ILevelAdmin {
  id: number;
  no: number;
  name: string;
  fullName: string;
  storyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IAdminOverview {
  levels: ILevelAdmin[];
  levelsCount: number;
  storiesCount: number;
}

export interface IAdminOverviewSuccess extends SuccessPayload {
  data: IAdminOverview;
}

export type IAdminOverviewResponse = IAdminOverviewSuccess | ErrorPayload;

export interface IApprovalLog {
  id: number;
  storyId: number;
  fromStatus: string;
  toStatus: string;
  reason: string;
  curatorId: number | null;
  curatorName: string | null;
  createdAt: string;
}

export interface IStoryAdmin {
  id: number;
  title: string;
  description: string;
  image: string;
  imageUrl: string;
  passage: string;
  sentences: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  approvalLogs: IApprovalLog[];
}

export interface ILevelDetail {
  id: number;
  no: number;
  name: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
  stories: IStoryAdmin[];
}

export interface ILevelDetailSuccess extends SuccessPayload {
  data: ILevelDetail;
}

export type ILevelDetailResponse = ILevelDetailSuccess | ErrorPayload;

export interface ICreateStoryRequest {
  title: string;
  description: string;
  imageCover: File;
  passage: string;
}

export interface ICreateStoryData {
  id: number;
  title: string;
  description: string;
  image: string;
  imageUrl: string;
  passage: string;
  sentences: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateStorySuccess extends SuccessPayload {
  data: ICreateStoryData;
}

export type ICreateStoryResponse = ICreateStorySuccess | ErrorPayload;

export interface IUpdateStoryRequest {
  title?: string;
  description?: string;
  imageCover?: File;
  passage?: string;
}

export interface IUpdateStoryData {
  id: number;
  title: string;
  description: string;
  image: string;
  imageUrl: string;
  passage: string;
  sentences: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUpdateStorySuccess extends SuccessPayload {
  data: IUpdateStoryData;
}

export type IUpdateStoryResponse = IUpdateStorySuccess | ErrorPayload;

export type IDeleteStoryResponse = SuccessPayload | ErrorPayload;

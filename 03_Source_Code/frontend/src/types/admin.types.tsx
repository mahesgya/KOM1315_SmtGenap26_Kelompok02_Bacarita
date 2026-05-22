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

export type AuditEventType = "LOGIN_OK" | "LOGIN_FAIL" | "LOGOUT" | "LOCKED";
export type AuditRoleType = "admin" | "teacher" | "student" | "parent" | "curator";
export type AuditWindowType = "24h" | "7d" | "30d" | "90d";

export interface IAuthAuditLogItem {
  id: number;
  userId: string | null;
  role: AuditRoleType | null;
  event: AuditEventType;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface IAuthAuditLogTrendPoint {
  label: string;
  total: number;
  loginSuccessCount: number;
  loginFailCount: number;
  lockoutCount: number;
  logoutCount: number;
}

export interface IAuthAuditLogSummary {
  totalEvents: number;
  loginSuccessCount: number;
  loginFailCount: number;
  logoutCount: number;
  lockoutCount: number;
  uniqueUsers: number;
  recentAlertCount: number;
  trend: IAuthAuditLogTrendPoint[];
}

export interface IAuthAuditLogPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface IAuthAuditLogDashboard {
  filters: {
    event: AuditEventType | null;
    role: AuditRoleType | null;
    window: AuditWindowType;
  };
  summary: IAuthAuditLogSummary;
  pagination: IAuthAuditLogPagination;
  items: IAuthAuditLogItem[];
}

export interface IAuthAuditLogQuery {
  event?: AuditEventType;
  role?: AuditRoleType;
  window?: AuditWindowType;
  page?: number;
  limit?: number;
}

export interface IAuthAuditLogDashboardSuccess extends SuccessPayload {
  data: IAuthAuditLogDashboard;
}

export type IAuthAuditLogDashboardResponse = IAuthAuditLogDashboardSuccess | ErrorPayload;

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

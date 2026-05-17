export interface IBonusStudent {
  id: number;
  name: string;
  nisn: string;
  kelas: string;
  selected?: boolean;
}

export interface IBonusStory {
  id: number;
  title: string;
  description: string;
  passage: string;
  imageUrl: string;
  imageCover?: string;
  guruId?: number;
  guruName?: string;
  recipientCount: number;
  recipients?: IBonusStudent[];
  createdAt: string;
  updatedAt?: string;
  status?: 'draft' | 'waiting' | 'published' | 'archived';
}

export interface ICreateBonusStoryRequest {
  title: string;
  description: string;
  passage: string;
  imageCover: File | null;
  studentIds: number[];
}

export interface ICreateBonusStoryResponse {
  success: boolean;
  data?: IBonusStory;
  error?: string;
}

export interface IUpdateBonusStoryRequest {
  title?: string;
  description?: string;
  passage?: string;
  imageCover?: File;
  studentIds?: number[];
}

export interface IUpdateBonusStoryResponse {
  success: boolean;
  data?: IBonusStory;
  error?: string;
}

export interface IBonusStoriesListResponse {
  success: boolean;
  data?: IBonusStory[];
  total?: number;
  error?: string;
}

export interface IBonusStoryDetailResponse {
  success: boolean;
  data?: IBonusStory;
  error?: string;
}

export interface IBonusDeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

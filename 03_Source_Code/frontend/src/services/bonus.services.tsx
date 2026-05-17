import { AppDispatch } from '@/redux/store';
import { setLoading } from '@/redux/general.slice';
import { IBonusStory, ICreateBonusStoryRequest, IBonusStoriesListResponse, ICreateBonusStoryResponse, IUpdateBonusStoryRequest, IUpdateBonusStoryResponse, IBonusStoryDetailResponse, IBonusDeleteResponse, IBonusStudent } from '@/types/bonus.types';

const STORAGE_KEY = 'bacarita_bonus_stories';
const STORAGE_ID_KEY = 'bacarita_bonus_story_id';

let bonusStoriesDB: IBonusStory[] = [];
let storyIdCounter = 1;

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
};

const loadFromStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      bonusStoriesDB = JSON.parse(stored);
    }
    const storedId = localStorage.getItem(STORAGE_ID_KEY);
    if (storedId) {
      storyIdCounter = parseInt(storedId) + 1;
    }
  } catch (error) {
    console.error('Error loading bonus stories from storage:', error);
  }
};

const saveToStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bonusStoriesDB));
    localStorage.setItem(STORAGE_ID_KEY, String(storyIdCounter - 1));
  } catch (error) {
    console.error('Error saving bonus stories to storage:', error);
  }
};

loadFromStorage();

const BonusServices = {
  GetBonusStoriesList: async (dispatch: AppDispatch): Promise<IBonusStoriesListResponse> => {
    try {
      dispatch(setLoading(true));
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      return {
        success: true,
        data: bonusStoriesDB,
        total: bonusStoriesDB.length,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Gagal memuat bacaan bonus',
      };
    } finally {
      dispatch(setLoading(false));
    }
  },

  GetBonusStoryDetail: async (storyId: number, dispatch: AppDispatch): Promise<IBonusStoryDetailResponse> => {
    try {
      dispatch(setLoading(true));
      await new Promise((resolve) => setTimeout(resolve, 200));

      const story = bonusStoriesDB.find((s) => s.id === storyId);
      if (!story) {
        return {
          success: false,
          error: 'Bacaan bonus tidak ditemukan',
        };
      }

      return {
        success: true,
        data: story,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Gagal memuat detail bacaan bonus',
      };
    } finally {
      dispatch(setLoading(false));
    }
  },

  CreateBonusStory: async (payload: ICreateBonusStoryRequest, students: IBonusStudent[], dispatch: AppDispatch): Promise<ICreateBonusStoryResponse> => {
    try {
      dispatch(setLoading(true));
      
      if (!payload.title.trim()) {
        return { success: false, error: 'Judul tidak boleh kosong' };
      }
      if (!payload.passage.trim()) {
        return { success: false, error: 'Passage tidak boleh kosong' };
      }
      if (!payload.imageCover) {
        return { success: false, error: 'Gambar harus dipilih' };
      }
      if (payload.studentIds.length === 0) {
        return { success: false, error: 'Pilih minimal satu siswa' };
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      const imageUrl = payload.imageCover ? await fileToBase64(payload.imageCover) : '';

      const recipients = students.filter((s) => payload.studentIds.includes(s.id));

      const newStory: IBonusStory = {
        id: storyIdCounter++,
        title: payload.title,
        description: payload.description,
        passage: payload.passage,
        imageUrl,
        imageCover: payload.imageCover.name,
        guruId: 1,
        guruName: 'Guru Budi',
        recipientCount: payload.studentIds.length,
        recipients,
        createdAt: new Date().toISOString(),
        status: 'waiting',
      };

      bonusStoriesDB.push(newStory);
      saveToStorage();

      return {
        success: true,
        data: newStory,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Gagal membuat bacaan bonus: ' + String(error),
      };
    } finally {
      dispatch(setLoading(false));
    }
  },

  UpdateBonusStory: async (storyId: number, payload: IUpdateBonusStoryRequest, students: IBonusStudent[], dispatch: AppDispatch): Promise<IUpdateBonusStoryResponse> => {
    try {
      dispatch(setLoading(true));
      await new Promise((resolve) => setTimeout(resolve, 500));

      const storyIdx = bonusStoriesDB.findIndex((s) => s.id === storyId);
      if (storyIdx === -1) {
        return { success: false, error: 'Bacaan bonus tidak ditemukan' };
      }

      const story = bonusStoriesDB[storyIdx];

      if (payload.title) story.title = payload.title;
      if (payload.description) story.description = payload.description;
      if (payload.passage) story.passage = payload.passage;
      if (payload.imageCover) {
        story.imageUrl = await fileToBase64(payload.imageCover);
        story.imageCover = payload.imageCover.name;
      }
      if (payload.studentIds) {
        story.recipients = students.filter((s) => payload.studentIds?.includes(s.id));
        story.recipientCount = payload.studentIds.length;
      }
      story.updatedAt = new Date().toISOString();

      bonusStoriesDB[storyIdx] = story;
      saveToStorage();

      return {
        success: true,
        data: story,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Gagal update bacaan bonus: ' + String(error),
      };
    } finally {
      dispatch(setLoading(false));
    }
  },

  DeleteBonusStory: async (storyId: number, dispatch: AppDispatch): Promise<IBonusDeleteResponse> => {
    try {
      dispatch(setLoading(true));
      await new Promise((resolve) => setTimeout(resolve, 300));

      const idx = bonusStoriesDB.findIndex((s) => s.id === storyId);
      if (idx === -1) {
        return { success: false, error: 'Bacaan bonus tidak ditemukan' };
      }

      bonusStoriesDB.splice(idx, 1);
      saveToStorage();

      return {
        success: true,
        message: 'Bacaan bonus berhasil dihapus',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Gagal menghapus bacaan bonus',
      };
    } finally {
      dispatch(setLoading(false));
    }
  },
};

export default BonusServices;

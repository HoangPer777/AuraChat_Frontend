import { create } from 'zustand'

/**
 * Media Store - Manages media upload state
 *
 * State:
 * - uploads: Uploaded media items in current session
 * - isLoading: Loading state for upload actions
 * - error: Error message from upload actions
 */
const useMediaStore = create((set) => ({
  uploads: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
  selectedMedia: null,
  isLoading: false,
  error: null,

  setMediaPage: ({ content, page, size, totalElements, totalPages }) =>
    set({
      uploads: content || [],
      page: page ?? 0,
      size: size ?? 20,
      totalElements: totalElements ?? 0,
      totalPages: totalPages ?? 0,
      error: null,
    }),
  setUploads: (uploads) => set({ uploads, error: null }),
  addUpload: (upload) => set((state) => ({ uploads: [upload, ...state.uploads] })),
  removeUpload: (mediaId) =>
    set((state) => ({
      uploads: state.uploads.filter((item) => item.id !== mediaId),
      totalElements: state.totalElements > 0 ? state.totalElements - 1 : 0,
    })),
  setSelectedMedia: (selectedMedia) => set({ selectedMedia }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))

export default useMediaStore

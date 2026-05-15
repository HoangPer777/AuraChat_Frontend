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
  isLoading: false,
  error: null,

  setUploads: (uploads) => set({ uploads, error: null }),
  addUpload: (upload) => set((state) => ({ uploads: [upload, ...state.uploads] })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))

export default useMediaStore

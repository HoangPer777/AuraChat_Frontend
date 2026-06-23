import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { deleteMedia, getMediaDetail, listMedia, uploadFile, uploadImage } from '../../services/mediaService'
import PrimaryButton from '../../components/buttons/PrimaryButton'
import SecondaryButton from '../../components/buttons/SecondaryButton'
import ErrorMessage from '../../components/notifications/ErrorMessage'
import SuccessMessage from '../../components/notifications/SuccessMessage'
import FileInput from '../../components/forms/FileInput'
import useMediaStore from '../../store/mediaStore'
import { formatErrorMessage, logError } from '../../utils/errorHandler'
import { validateMediaFile } from '../../utils/validation'

const MAX_SIZE_BYTES = 10 * 1024 * 1024

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let index = 0
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }
  return `${value.toFixed(value < 10 && index > 0 ? 1 : 0)} ${units[index]}`
}

export default function MediaLibraryPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [mode, setMode] = useState('image')
  const [selectedFile, setSelectedFile] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const {
    uploads,
    selectedMedia,
    addUpload,
    removeUpload,
    setMediaPage,
    setSelectedMedia,
    isLoading,
    error,
    setError,
    clearError,
    setLoading,
  } = useMediaStore()
  const [inputKey, setInputKey] = useState(0)

  const acceptText = useMemo(() => {
    return mode === 'image' ? 'image/*' : '.pdf,.docx,.xlsx,.txt'
  }, [mode])

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true)
      clearError()
      try {
        const response = await listMedia({ page: 0, size: 24 })
        if (response?.success && response?.data) {
          setMediaPage(response.data)
        }
      } catch (err) {
        logError(err, 'media-list')
        setError(formatErrorMessage(err, 'media-list'))
      } finally {
        setLoading(false)
      }
    }

    fetchMedia()
  }, [clearError, setError, setLoading, setMediaPage])

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null
    clearError()
    setSuccessMessage('')
    setSelectedFile(file)

    if (file) {
      const validation = validateMediaFile(file, mode)
      if (!validation.isValid) {
        setError(validation.error)
      }
    }
  }

  const handleUpload = async (event) => {
    event.preventDefault()
    clearError()
    setSuccessMessage('')

    const validation = validateMediaFile(selectedFile, mode)
    if (!validation.isValid) {
      setError(validation.error)
      return
    }

    setLoading(true)

    try {
      const result = mode === 'image'
        ? await uploadImage(selectedFile)
        : await uploadFile(selectedFile)

      if (result?.success) {
        const payload = result.data || {}
        addUpload(payload)
        setSuccessMessage(result.message || 'Tai tep thanh cong.')
        setSelectedFile(null)
        setInputKey((prev) => prev + 1)
      } else {
        setError(result?.message || 'Tai tep that bai. Vui long thu lai.')
      }
    } catch (error) {
      logError(error, 'media-upload', { mode })
      setError(formatErrorMessage(error, 'media-upload'))
    } finally {
      setLoading(false)
    }
  }

  const handleCopyUrl = async (url) => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setSuccessMessage('Da sao chep duong dan vao clipboard.')
    } catch (error) {
      logError(error, 'media-copy-url')
      setError('Khong the sao chep duong dan. Vui long thu lai.')
    }
  }

  const handleSelectMedia = async (mediaId) => {
    if (!mediaId) return
    setDetailsLoading(true)
    try {
      const response = await getMediaDetail(mediaId)
      if (response?.success) {
        setSelectedMedia(response.data)
      }
    } catch (err) {
      logError(err, 'media-detail', { mediaId })
      setError(formatErrorMessage(err, 'media-detail'))
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleDelete = async (mediaId) => {
    if (!mediaId) return
    const confirmed = window.confirm('Ban co chac chan muon xoa media nay?')
    if (!confirmed) return

    setDeletingId(mediaId)
    clearError()
    try {
      const response = await deleteMedia(mediaId)
      if (response?.success) {
        removeUpload(mediaId)
        if (selectedMedia?.id === mediaId) {
          setSelectedMedia(null)
        }
        setSuccessMessage(response.message || 'Da xoa media thanh cong.')
      }
    } catch (err) {
      logError(err, 'media-delete', { mediaId })
      setError(formatErrorMessage(err, 'media-delete'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-surface-bright text-on-surface h-screen overflow-hidden flex font-sans">
      <aside className="z-30 flex flex-col justify-between h-screen bg-surface-container-low border-r border-outline-variant w-[80px] items-center py-4 shrink-0">
        <div className="flex flex-col items-center w-full gap-1">
          <button onClick={() => navigate('/chat')} className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">chat</span>
          </button>
          <button onClick={() => navigate('/friends')} className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">group</span>
          </button>
          <button onClick={() => navigate('/notifications')} className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="text-primary border-l-4 border-primary w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">perm_media</span>
          </button>
        </div>
        <button onClick={() => navigate('/profile')} className="mb-2">
          <img
            src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}`}
            alt="me"
            className="w-10 h-10 rounded-full object-cover border-2 border-outline-variant"
          />
        </button>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto px-8 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Thu vien media</h1>
          <p className="text-sm text-on-surface-variant">Quan ly tep da tai len va xoa media khong can thiet.</p>
        </header>

        {error && <ErrorMessage message={error} onDismiss={clearError} />}
        {successMessage && <SuccessMessage message={successMessage} onDismiss={() => setSuccessMessage('')} />}

        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr_360px] gap-6">
          <section className="bg-white rounded-2xl border border-outline-variant/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Tai len nhanh</h2>
              <div className="flex gap-2">
                <SecondaryButton
                  size="sm"
                  onClick={() => {
                    setMode('image')
                    setSelectedFile(null)
                    clearError()
                    setInputKey((prev) => prev + 1)
                  }}
                  className={mode === 'image' ? 'bg-primary text-on-primary' : ''}
                >
                  Anh
                </SecondaryButton>
                <SecondaryButton
                  size="sm"
                  onClick={() => {
                    setMode('file')
                    setSelectedFile(null)
                    clearError()
                    setInputKey((prev) => prev + 1)
                  }}
                  className={mode === 'file' ? 'bg-primary text-on-primary' : ''}
                >
                  Tep
                </SecondaryButton>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant">
              {mode === 'image' ? 'JPG, PNG, GIF, WebP (toi da 10MB).' : 'PDF, DOCX, XLSX, TXT (toi da 10MB).'}
            </p>

            <form onSubmit={handleUpload} className="space-y-4">
              {mode === 'image' ? (
                <FileInput
                  key={`image-${inputKey}`}
                  label="Chon anh"
                  name="media-image"
                  accept={acceptText}
                  maxSize={MAX_SIZE_BYTES}
                  onChange={handleFileChange}
                />
              ) : (
                <div key={`file-${inputKey}`} className="space-y-2">
                  <label className="block text-sm font-medium text-on-surface">Chon tai lieu</label>
                  <input
                    type="file"
                    accept={acceptText}
                    onChange={handleFileChange}
                    className="block w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-surface-container-high file:text-on-surface file:font-medium hover:file:bg-surface-container"
                  />
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <PrimaryButton type="submit" loading={isLoading} disabled={!selectedFile}>
                  Tai len
                </PrimaryButton>
                {selectedFile && <span className="text-sm text-on-surface-variant">{selectedFile.name} • {formatBytes(selectedFile.size)}</span>}
              </div>
            </form>
          </section>

          <section className="bg-white rounded-2xl border border-outline-variant/40 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Danh sach media</h2>
              <span className="text-xs text-on-surface-variant">{uploads.length} muc</span>
            </div>

            {isLoading ? (
              <p className="text-sm text-on-surface-variant">Dang tai...</p>
            ) : uploads.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Chua co media nao.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 max-h-[620px] overflow-y-auto pr-2">
                {uploads.map((item) => (
                  <div key={item.id || item.fileName} className="border border-outline-variant/40 rounded-xl p-3">
                    <button
                      type="button"
                      onClick={() => handleSelectMedia(item.id)}
                      className="w-full text-left"
                    >
                      <div className="h-36 bg-surface-container rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        {item.mediaType === 'IMAGE' && item.url ? (
                          <img src={item.url} alt={item.originalFileName || 'Media'} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-primary text-3xl">description</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold truncate">{item.originalFileName || item.fileName}</p>
                      <p className="text-xs text-on-surface-variant mt-1">{item.contentType || 'Unknown'} • {formatBytes(item.size)}</p>
                    </button>
                    <div className="mt-3 flex gap-2">
                      <SecondaryButton size="sm" onClick={() => handleCopyUrl(item.url)}>
                        Sao chep URL
                      </SecondaryButton>
                      <SecondaryButton
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="bg-red-100 text-red-700"
                      >
                        {deletingId === item.id ? 'Dang xoa...' : 'Xoa'}
                      </SecondaryButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-outline-variant/40 p-5">
            <h2 className="font-bold mb-4">Chi tiet media</h2>
            {detailsLoading ? (
              <p className="text-sm text-on-surface-variant">Dang tai chi tiet...</p>
            ) : selectedMedia ? (
              <div className="space-y-4">
                <div className="h-48 bg-surface-container rounded-xl flex items-center justify-center overflow-hidden">
                  {selectedMedia.mediaType === 'IMAGE' && selectedMedia.url ? (
                    <img src={selectedMedia.url} alt={selectedMedia.originalFileName || 'Selected media'} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-primary">description</span>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Ten file:</span> {selectedMedia.originalFileName || selectedMedia.fileName}</p>
                  <p><span className="font-semibold">Loai:</span> {selectedMedia.contentType || 'Unknown'}</p>
                  <p><span className="font-semibold">Dung luong:</span> {formatBytes(selectedMedia.size)}</p>
                  <p><span className="font-semibold">Uploaded:</span> {selectedMedia.createdAt ? new Date(selectedMedia.createdAt).toLocaleString('vi-VN') : '-'}</p>
                </div>
                <SecondaryButton size="sm" onClick={() => handleCopyUrl(selectedMedia.url)}>
                  Sao chep URL
                </SecondaryButton>
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">Chon mot media de xem chi tiet.</p>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

import { useMemo, useState } from 'react'
import MainLayout from '../../components/MainLayout'
import { uploadFile, uploadImage } from '../../services/mediaService'
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
  const [mode, setMode] = useState('image')
  const [selectedFile, setSelectedFile] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const { uploads, addUpload, isLoading, error, setError, clearError, setLoading } = useMediaStore()
  const [inputKey, setInputKey] = useState(0)

  const acceptText = useMemo(() => {
    return mode === 'image' ? 'image/*' : '.pdf,.docx,.xlsx,.txt'
  }, [mode])

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
        addUpload({
          ...payload,
          mode,
          uploadedAt: result.timestamp || new Date().toISOString(),
        })
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

  return (
    <MainLayout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff6e9_0%,#f3fbf9_45%,#eef1ff_100%)] font-body-main text-on-surface">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <header className="flex flex-col gap-4 mb-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-primary text-3xl">cloud_upload</span>
              </div>
              <div>
                <p className="text-sm text-on-surface-variant">Quan ly tep tai len</p>
                <h1 className="text-h1-display text-on-surface">Thu vien Media</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-on-surface-variant">
              <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-1">
                <span className="material-symbols-outlined text-base text-primary">schedule</span>
                10 luot tai moi gio
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-1">
                <span className="material-symbols-outlined text-base text-primary">verified_user</span>
                Yeu cau JWT
              </span>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8">
            <section className="bg-surface-container-lowest/80 backdrop-blur rounded-3xl border border-outline-variant/60 shadow-sm p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-h2-sidebar text-on-surface">Tai len nhanh</h2>
                <div className="flex gap-2">
                  <SecondaryButton
                    size="sm"
                    onClick={() => {
                      setMode('image')
                      setSelectedFile(null)
                      setInputKey((prev) => prev + 1)
                      setErrorMessage('')
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
                      setInputKey((prev) => prev + 1)
                      setErrorMessage('')
                    }}
                    className={mode === 'file' ? 'bg-primary text-on-primary' : ''}
                  >
                    Tai lieu
                  </SecondaryButton>
                </div>
              </div>

              <p className="mt-3 text-sm text-on-surface-variant">
                {mode === 'image'
                  ? 'Ho tro JPG, PNG, GIF, WebP. Dung luong toi da 10MB.'
                  : 'Ho tro PDF, DOCX, XLSX, TXT. Dung luong toi da 10MB.'}
              </p>

              <form onSubmit={handleUpload} className="mt-6 space-y-4">
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

                {error && <ErrorMessage message={error} onDismiss={clearError} />}
                {successMessage && <SuccessMessage message={successMessage} onDismiss={() => setSuccessMessage('')} />}

                <div className="flex flex-wrap items-center gap-3">
                  <PrimaryButton type="submit" loading={isLoading} disabled={!selectedFile}>
                    Tai len
                  </PrimaryButton>
                  {selectedFile && (
                    <span className="text-sm text-on-surface-variant">
                      {selectedFile.name} • {formatBytes(selectedFile.size)}
                    </span>
                  )}
                </div>
              </form>
            </section>

            <section className="bg-surface-container-lowest/80 backdrop-blur rounded-3xl border border-outline-variant/60 shadow-sm p-8">
              <div className="flex items-center justify-between">
                <h2 className="text-h2-sidebar text-on-surface">Tep vua tai</h2>
                <span className="text-xs text-on-surface-variant">{uploads.length} muc</span>
              </div>

              {uploads.length === 0 ? (
                <div className="mt-6 flex flex-col items-center text-center text-on-surface-variant gap-3">
                  <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-primary">cloud_done</span>
                  </div>
                  <p className="text-sm">Chua co tep nao duoc tai len. Hay bat dau tai media dau tien.</p>
                </div>
              ) : (
                <div className="mt-6 space-y-4 max-h-[420px] overflow-auto pr-2">
                  {uploads.map((item, index) => (
                    <div
                      key={`${item.fileName || item.originalFileName}-${index}`}
                      className="rounded-2xl border border-outline-variant/50 bg-white/70 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center overflow-hidden">
                          {item.mode === 'image' && item.url ? (
                            <img src={item.url} alt={item.originalFileName || 'Media'} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-primary">description</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-on-surface truncate">{item.originalFileName || item.fileName}</p>
                          <p className="text-xs text-on-surface-variant">
                            {item.contentType || 'Unknown'} • {formatBytes(item.size)}
                          </p>
                        </div>
                      </div>
                      {item.url && (
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            value={item.url}
                            readOnly
                            className="flex-1 text-xs text-on-surface-variant bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-3 py-2"
                          />
                          <SecondaryButton size="sm" onClick={() => handleCopyUrl(item.url)}>
                            Sao chep
                          </SecondaryButton>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { deleteAdminMedia, getAdminMedia, getAdminMediaStats } from '../../services/adminService'
import ConfirmModal from '../../components/modals/ConfirmModal'
import Modal from '../../components/modals/Modal'
import Toast from '../../components/notifications/Toast'

const typeLabel = { IMAGE: 'Ảnh', FILE: 'Tệp', AUDIO: 'Âm thanh' }

const formatBytes = (bytes) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let i = 0
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i += 1 }
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export default function MediaPage() {
  const [result, setResult] = useState({ content: [], totalElements: 0, totalPages: 0 })
  const [stats, setStats] = useState(null)
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [mediaType, setMediaType] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => { setPage(0); setQuery(searchInput.trim()) }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  const loadMedia = useCallback(async () => {
    setLoading(true); setError('')
    try {
      setResult(await getAdminMedia({
        page, size: 12, q: query || undefined, mediaType: mediaType || undefined,
      }))
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách media.')
    } finally { setLoading(false) }
  }, [page, query, mediaType])

  const loadStats = useCallback(async () => {
    try { setStats(await getAdminMediaStats()) } catch { /* stats optional */ }
  }, [])

  useEffect(() => { loadMedia() }, [loadMedia])
  useEffect(() => { loadStats() }, [loadStats])

  const submitDelete = async () => {
    if (!confirmDelete) return
    setSubmitting(true)
    try {
      await deleteAdminMedia(confirmDelete.id)
      setConfirmDelete(null)
      if (selected?.id === confirmDelete.id) setSelected(null)
      setToast({ type: 'success', message: 'Đã xóa media.' })
      await loadMedia()
      await loadStats()
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Xóa media thất bại.' })
    } finally { setSubmitting(false) }
  }

  return (
    <>
      <header className="h-16 px-8 flex items-center bg-surface/80 border-b border-outline-variant sticky top-0 z-30">
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <span>Hệ thống</span><span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-primary font-bold">Quản lý media</span>
        </div>
      </header>
      {toast && <div className="fixed top-20 right-6 z-[70] w-80"><Toast {...toast} onDismiss={() => setToast(null)} /></div>}
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Thư viện media</h2>
          <p className="text-sm text-on-surface-variant">
            {stats ? `${stats.activeCount} file đang hoạt động · ${formatBytes(stats.totalBytes)} dung lượng` : `Tổng số: ${result.totalElements} file`}
          </p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Ảnh', value: stats.imageCount, icon: 'image' },
              { label: 'Tệp', value: stats.fileCount, icon: 'description' },
              { label: 'Âm thanh', value: stats.audioCount, icon: 'mic' },
              { label: 'Đã xóa', value: stats.deletedCount, icon: 'delete' },
            ].map((item) => (
              <div key={item.label} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-on-surface-variant uppercase">{item.label}</span>
                  <span className="material-symbols-outlined text-primary text-lg">{item.icon}</span>
                </div>
                <p className="text-2xl font-bold mt-2">{Number(item.value || 0).toLocaleString('vi-VN')}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant flex flex-wrap gap-4 items-center mb-6">
          <div className="relative flex-1 min-w-[240px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm" placeholder="Tìm theo tên file, email chủ sở hữu..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
          <select value={mediaType} onChange={(e) => { setMediaType(e.target.value); setPage(0) }} className="px-4 py-2.5 bg-surface-container-low rounded-xl text-sm border-none">
            <option value="">Tất cả loại</option>
            <option value="IMAGE">Ảnh</option>
            <option value="FILE">Tệp</option>
            <option value="AUDIO">Âm thanh</option>
          </select>
        </div>

        {error && <div className="mb-5 p-4 bg-red-50 text-red-700 rounded-xl flex justify-between"><span>{error}</span><button onClick={loadMedia} className="font-bold">Thử lại</button></div>}

        {loading ? (
          <div className="p-16 text-center text-on-surface-variant">Đang tải...</div>
        ) : result.content.length === 0 ? (
          <div className="p-16 text-center text-on-surface-variant bg-surface-container-lowest rounded-2xl border">Chưa có media nào.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.content.map((item) => (
              <div key={item.id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden">
                <div className="aspect-video bg-surface-container-high flex items-center justify-center">
                  {item.mediaType === 'IMAGE' ? (
                    <img src={item.url} alt={item.originalFileName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-5xl text-on-surface-variant">
                      {item.mediaType === 'AUDIO' ? 'mic' : 'description'}
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-bold text-sm truncate flex-1" title={item.originalFileName}>{item.originalFileName || item.fileName}</p>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-primary-container text-on-primary-container shrink-0">{typeLabel[item.mediaType] || item.mediaType}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant truncate">{item.ownerDisplayName || '—'} · {item.ownerEmail || item.ownerId}</p>
                  <p className="text-xs text-on-surface-variant">{formatBytes(item.size)} · {new Date(item.createdAt).toLocaleString('vi-VN')}</p>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setSelected(item)} className="flex-1 px-3 py-1.5 text-sm border border-outline-variant rounded-lg hover:bg-surface-container-low">Chi tiết</button>
                    <button onClick={() => setConfirmDelete(item)} className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg">Xóa</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {result.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 rounded-lg border disabled:opacity-40">Trước</button>
            <span className="px-4 py-2 text-sm text-on-surface-variant">Trang {page + 1} / {result.totalPages}</span>
            <button disabled={page >= result.totalPages - 1} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-lg border disabled:opacity-40">Sau</button>
          </div>
        )}
      </div>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Chi tiết media">
        {selected && (
          <div className="space-y-4">
            {selected.mediaType === 'IMAGE' && (
              <img src={selected.url} alt={selected.originalFileName} className="w-full max-h-64 object-contain rounded-lg bg-surface-container-high" />
            )}
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-on-surface-variant">Tên gốc</dt><dd className="font-medium break-all">{selected.originalFileName}</dd></div>
              <div><dt className="text-on-surface-variant">Loại</dt><dd className="font-medium">{typeLabel[selected.mediaType]}</dd></div>
              <div><dt className="text-on-surface-variant">Chủ sở hữu</dt><dd className="font-medium">{selected.ownerDisplayName}</dd></div>
              <div><dt className="text-on-surface-variant">Email</dt><dd className="font-medium break-all">{selected.ownerEmail}</dd></div>
              <div><dt className="text-on-surface-variant">Dung lượng</dt><dd className="font-medium">{formatBytes(selected.size)}</dd></div>
              <div><dt className="text-on-surface-variant">Ngày tạo</dt><dd className="font-medium">{new Date(selected.createdAt).toLocaleString('vi-VN')}</dd></div>
            </dl>
            <a href={selected.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary font-bold text-sm">
              <span className="material-symbols-outlined text-base">open_in_new</span> Mở file gốc
            </a>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setSelected(null)} className="px-4 py-2 border rounded-lg">Đóng</button>
              <button onClick={() => { setConfirmDelete(selected); setSelected(null) }} className="px-4 py-2 bg-red-600 text-white rounded-lg">Xóa media</button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Xóa media"
        message={`Xóa vĩnh viễn "${confirmDelete?.originalFileName || confirmDelete?.fileName}" khỏi ImageKit và hệ thống?`}
        confirmText="Xóa"
        loading={submitting}
        onConfirm={submitDelete}
      />
    </>
  )
}

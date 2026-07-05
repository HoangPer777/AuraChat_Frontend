import { useCallback, useEffect, useState } from 'react'
import {
  addModerationKeyword,
  deleteModerationKeyword,
  dismissModerationFlag,
  getModerationFlags,
  getModerationKeywords,
  getModerationStats,
  removeModerationContent,
  warnModerationUser,
} from '../../services/adminService'
import ConfirmModal from '../../components/modals/ConfirmModal'
import Modal from '../../components/modals/Modal'
import Toast from '../../components/notifications/Toast'

const typeLabel = { POST: 'Bài đăng', COMMENT: 'Bình luận', MEDIA: 'Media' }
const reasonLabel = { SENSITIVE_TEXT: 'Từ nhạy cảm', SENSITIVE_IMAGE: 'Ảnh nhạy cảm (AI)', MANUAL: 'Admin đánh dấu' }

const highlightText = (text, keywords = []) => {
  if (!text || keywords.length === 0) return text
  const pattern = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  if (!pattern) return text
  const parts = text.split(new RegExp(`(${pattern})`, 'gi'))
  return parts.map((part, i) =>
    keywords.some((k) => k.toLowerCase() === part.toLowerCase())
      ? <mark key={i} className="bg-red-200 text-red-900 rounded px-0.5">{part}</mark>
      : part
  )
}

export default function ModerationPage() {
  const [tab, setTab] = useState('')
  const [result, setResult] = useState({ content: [], totalElements: 0, totalPages: 0 })
  const [stats, setStats] = useState(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [keywords, setKeywords] = useState([])
  const [keywordInput, setKeywordInput] = useState('')
  const [showKeywords, setShowKeywords] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [warnMessage, setWarnMessage] = useState('Nội dung của bạn vi phạm tiêu chuẩn cộng đồng AuraChat. Vui lòng tuân thủ quy tắc để tránh bị khóa tài khoản.')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  const loadFlags = useCallback(async () => {
    setLoading(true); setError('')
    try {
      setResult(await getModerationFlags({
        page, size: 10, status: 'PENDING', contentType: tab || undefined,
      }))
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải hàng đợi kiểm duyệt.')
    } finally { setLoading(false) }
  }, [page, tab])

  const loadStats = useCallback(async () => {
    try { setStats(await getModerationStats()) } catch { /* optional */ }
  }, [])

  const loadKeywords = useCallback(async () => {
    try { setKeywords(await getModerationKeywords()) } catch { setKeywords([]) }
  }, [])

  useEffect(() => { loadFlags() }, [loadFlags])
  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => { if (showKeywords) loadKeywords() }, [showKeywords, loadKeywords])

  const refreshAll = async () => { await loadFlags(); await loadStats() }

  const executeAction = async () => {
    if (!confirm) return
    setSubmitting(true)
    try {
      if (confirm.type === 'dismiss') await dismissModerationFlag(confirm.flag.id)
      else if (confirm.type === 'remove') await removeModerationContent(confirm.flag.id)
      else if (confirm.type === 'warn') await warnModerationUser(confirm.flag.id, warnMessage)
      setConfirm(null)
      setToast({ type: 'success', message: 'Đã xử lý nội dung kiểm duyệt.' })
      await refreshAll()
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Thao tác thất bại.' })
    } finally { setSubmitting(false) }
  }

  const submitKeyword = async (event) => {
    event.preventDefault()
    if (!keywordInput.trim()) return
    setSubmitting(true)
    try {
      await addModerationKeyword(keywordInput.trim())
      setKeywordInput('')
      setToast({ type: 'success', message: 'Đã thêm từ khóa.' })
      await loadKeywords()
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Không thể thêm từ khóa.' })
    } finally { setSubmitting(false) }
  }

  const removeKeyword = async (id) => {
    try {
      await deleteModerationKeyword(id)
      setToast({ type: 'success', message: 'Đã xóa từ khóa.' })
      await loadKeywords()
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Không thể xóa từ khóa.' })
    }
  }

  const tabs = [
    { value: '', label: 'Tất cả', count: stats?.pendingTotal },
    { value: 'POST', label: 'Bài đăng', count: stats?.pendingPosts },
    { value: 'COMMENT', label: 'Bình luận', count: stats?.pendingComments },
    { value: 'MEDIA', label: 'Media', count: stats?.pendingMedia },
  ]

  return (
    <>
      <header className="h-16 px-8 flex items-center justify-between bg-surface/80 border-b border-outline-variant sticky top-0 z-30">
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <span>Hệ thống</span><span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-primary font-bold">Nội dung nhạy cảm</span>
        </div>
        <button onClick={() => setShowKeywords(true)} className="text-sm font-bold text-primary flex items-center gap-1">
          <span className="material-symbols-outlined text-base">list</span> Từ khóa
        </button>
      </header>
      {toast && <div className="fixed top-20 right-6 z-[70] w-80"><Toast {...toast} onDismiss={() => setToast(null)} /></div>}
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Hàng đợi kiểm duyệt</h2>
          <p className="text-sm text-on-surface-variant">
            {stats ? `${stats.pendingTotal} mục đang chờ xử lý` : 'Tự động phát hiện từ nhạy cảm và ảnh NSFW (Sightengine)'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((item) => (
            <button
              key={item.value}
              onClick={() => { setTab(item.value); setPage(0) }}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${
                tab === item.value ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant'
              }`}
            >
              {item.label}
              {item.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === item.value ? 'bg-white/20' : 'bg-red-100 text-red-700'}`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {error && <div className="mb-5 p-4 bg-red-50 text-red-700 rounded-xl flex justify-between"><span>{error}</span><button onClick={loadFlags} className="font-bold">Thử lại</button></div>}

        <div className="space-y-4">
          {loading ? (
            <div className="p-16 text-center text-on-surface-variant">Đang tải...</div>
          ) : result.content.length === 0 ? (
            <div className="p-16 text-center text-on-surface-variant bg-surface-container-lowest rounded-2xl border">Không có nội dung nhạy cảm đang chờ.</div>
          ) : result.content.map((flag) => (
            <div key={flag.id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5">
              <div className="flex flex-wrap justify-between gap-3 mb-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-bold uppercase px-2 py-1 rounded bg-primary-container text-on-primary-container">{typeLabel[flag.contentType]}</span>
                  <span className="text-xs font-bold uppercase px-2 py-1 rounded bg-surface-container-high text-on-surface-variant">{reasonLabel[flag.reason] || flag.reason}</span>
                </div>
                <span className="text-xs text-on-surface-variant">{new Date(flag.createdAt).toLocaleString('vi-VN')}</span>
              </div>

              <p className="text-sm mb-1"><span className="font-bold">{flag.authorDisplayName || '—'}</span> · {flag.authorEmail}</p>

              {flag.contentType === 'MEDIA' && flag.preview ? (
                <img src={flag.preview} alt="" className="mt-2 max-h-48 rounded-lg object-contain bg-surface-container-high" />
              ) : (
                <p className="mt-2 text-sm bg-surface-container-low p-3 rounded-xl whitespace-pre-wrap">
                  {highlightText(flag.preview, flag.matchedKeywords)}
                </p>
              )}

              {flag.matchedKeywords?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {flag.matchedKeywords.map((kw) => (
                    <span key={kw} className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold">{kw}</span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-outline-variant">
                <button onClick={() => setConfirm({ type: 'dismiss', flag })} className="px-4 py-2 text-sm border border-outline-variant rounded-lg">Bỏ qua</button>
                <button onClick={() => setConfirm({ type: 'warn', flag })} className="px-4 py-2 text-sm bg-amber-100 text-amber-800 rounded-lg font-bold">Cảnh báo</button>
                <button onClick={() => setConfirm({ type: 'remove', flag })} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-bold">Xóa nội dung</button>
              </div>
            </div>
          ))}
        </div>

        {result.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 rounded-lg border disabled:opacity-40">Trước</button>
            <span className="px-4 py-2 text-sm">Trang {page + 1} / {result.totalPages}</span>
            <button disabled={page >= result.totalPages - 1} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-lg border disabled:opacity-40">Sau</button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!confirm && confirm.type !== 'warn'}
        onClose={() => setConfirm(null)}
        title={confirm?.type === 'dismiss' ? 'Bỏ qua' : 'Xóa nội dung'}
        message={confirm?.type === 'dismiss'
          ? 'Nội dung sẽ được giữ nguyên và đánh dấu đã xem xét.'
          : 'Nội dung vi phạm sẽ bị xóa khỏi hệ thống.'}
        confirmText={confirm?.type === 'dismiss' ? 'Bỏ qua' : 'Xóa'}
        loading={submitting}
        onConfirm={executeAction}
      />

      <Modal isOpen={!!confirm && confirm.type === 'warn'} onClose={() => setConfirm(null)} title="Cảnh báo người dùng">
        <form onSubmit={(e) => { e.preventDefault(); executeAction() }} className="space-y-4">
          <p className="text-sm text-on-surface-variant">Gửi cảnh báo tới <strong>{confirm?.flag?.authorDisplayName}</strong>. Số lần cảnh báo sẽ tăng trên tài khoản.</p>
          <textarea required rows="4" maxLength="500" className="w-full border rounded-lg px-3 py-2 text-sm" value={warnMessage} onChange={(e) => setWarnMessage(e.target.value)} />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setConfirm(null)} className="px-4 py-2 border rounded-lg">Hủy</button>
            <button disabled={submitting} className="px-4 py-2 bg-amber-500 text-white rounded-lg font-bold disabled:opacity-50">Gửi cảnh báo</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showKeywords} onClose={() => setShowKeywords(false)} title="Quản lý từ khóa nhạy cảm">
        <form onSubmit={submitKeyword} className="flex gap-2 mb-4">
          <input className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="Thêm từ khóa mới..." value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} />
          <button disabled={submitting} className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm">Thêm</button>
        </form>
        <div className="max-h-64 overflow-y-auto flex flex-wrap gap-2">
          {keywords.length === 0 ? <p className="text-sm text-on-surface-variant">Chưa có từ khóa.</p> : keywords.map((kw) => (
            <span key={kw.id} className="inline-flex items-center gap-1 px-3 py-1 bg-surface-container-low rounded-full text-sm">
              {kw.word}
              <button type="button" onClick={() => removeKeyword(kw.id)} className="text-red-600 material-symbols-outlined text-base leading-none">close</button>
            </span>
          ))}
        </div>
      </Modal>
    </>
  )
}

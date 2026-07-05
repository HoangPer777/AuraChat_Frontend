import { useCallback, useEffect, useState } from 'react'
import {
  deleteAdminComment,
  deleteAdminPost,
  getAdminPostComments,
  getAdminPosts,
} from '../../services/adminService'
import ConfirmModal from '../../components/modals/ConfirmModal'
import Modal from '../../components/modals/Modal'
import Toast from '../../components/notifications/Toast'

export default function PostsPage() {
  const [result, setResult] = useState({ content: [], totalElements: 0, totalPages: 0 })
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState(null)
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => { setPage(0); setQuery(searchInput.trim()) }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  const loadPosts = useCallback(async () => {
    setLoading(true); setError('')
    try {
      setResult(await getAdminPosts({ page, size: 10, q: query || undefined }))
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách bài đăng.')
    } finally { setLoading(false) }
  }, [page, query])

  useEffect(() => { loadPosts() }, [loadPosts])

  const openDetail = async (post) => {
    setDetail(post)
    setCommentsLoading(true)
    try {
      const res = await getAdminPostComments(post.id, { page: 0, size: 100 })
      setComments(res.content || [])
    } catch {
      setComments([])
    } finally { setCommentsLoading(false) }
  }

  const executeConfirm = async () => {
    if (!confirm) return
    setSubmitting(true)
    try {
      if (confirm.type === 'post') {
        await deleteAdminPost(confirm.target.id)
        setDetail(null)
        setToast({ type: 'success', message: 'Đã xóa bài đăng.' })
        await loadPosts()
      } else {
        await deleteAdminComment(confirm.target.id)
        setComments((prev) => prev.filter((c) => c.id !== confirm.target.id && c.parentCommentId !== confirm.target.id))
        setToast({ type: 'success', message: 'Đã xóa bình luận.' })
      }
      setConfirm(null)
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Thao tác thất bại.' })
    } finally { setSubmitting(false) }
  }

  return (
    <>
      <header className="h-16 px-8 flex items-center bg-surface/80 border-b border-outline-variant sticky top-0 z-30">
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <span>Hệ thống</span><span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-primary font-bold">Quản lý bài đăng</span>
        </div>
      </header>
      {toast && <div className="fixed top-20 right-6 z-[70] w-80"><Toast {...toast} onDismiss={() => setToast(null)} /></div>}
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Bài đăng trên feed</h2>
          <p className="text-sm text-on-surface-variant">Tổng số: {result.totalElements} bài đăng</p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant flex flex-wrap gap-4 items-center mb-6">
          <div className="relative flex-1 min-w-[280px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm" placeholder="Tìm theo nội dung, tên hoặc email tác giả..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
        </div>

        {error && <div className="mb-5 p-4 bg-red-50 text-red-700 rounded-xl flex justify-between"><span>{error}</span><button onClick={loadPosts} className="font-bold">Thử lại</button></div>}

        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-xs uppercase text-on-surface-variant">
                <th className="px-6 py-4">Nội dung</th>
                <th className="px-6 py-4">Tác giả</th>
                <th className="px-6 py-4">Tương tác</th>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan="5" className="p-10 text-center">Đang tải...</td></tr>
              ) : result.content.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-on-surface-variant">Chưa có bài đăng nào.</td></tr>
              ) : result.content.map((post) => (
                <tr key={post.id} className="hover:bg-surface-container-low/50">
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-sm line-clamp-2">{post.content || (post.imageUrls?.length ? `[${post.imageUrls.length} ảnh]` : '—')}</p>
                    {post.originalPostId && <span className="text-[10px] font-bold text-secondary uppercase">Bài chia sẻ</span>}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm">{post.authorDisplayName || '—'}</p>
                    <p className="text-xs text-on-surface-variant truncate max-w-[160px]">{post.authorEmail}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">
                    {post.likeCount} thích · {post.commentCount} bình luận · {post.shareCount} chia sẻ
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">
                    {new Date(post.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openDetail(post)} className="px-3 py-1.5 text-sm border border-outline-variant rounded-lg">Chi tiết</button>
                    <button onClick={() => setConfirm({ type: 'post', target: post })} className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {result.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 rounded-lg border disabled:opacity-40">Trước</button>
            <span className="px-4 py-2 text-sm text-on-surface-variant">Trang {page + 1} / {result.totalPages}</span>
            <button disabled={page >= result.totalPages - 1} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-lg border disabled:opacity-40">Sau</button>
          </div>
        )}
      </div>

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="Chi tiết bài đăng">
        {detail && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              {detail.authorAvatarUrl && <img src={detail.authorAvatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />}
              <div>
                <p className="font-bold">{detail.authorDisplayName}</p>
                <p className="text-xs text-on-surface-variant">{detail.authorEmail}</p>
              </div>
            </div>
            {detail.content && <p className="text-sm whitespace-pre-wrap">{detail.content}</p>}
            {detail.imageUrls?.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {detail.imageUrls.map((url) => (
                  <img key={url} src={url} alt="" className="rounded-lg w-full aspect-square object-cover" />
                ))}
              </div>
            )}
            <p className="text-xs text-on-surface-variant">
              {detail.likeCount} thích · {detail.commentCount} bình luận · {new Date(detail.createdAt).toLocaleString('vi-VN')}
            </p>

            <div className="border-t pt-4">
              <h4 className="font-bold text-sm mb-3">Bình luận ({comments.length})</h4>
              {commentsLoading ? (
                <p className="text-sm text-on-surface-variant">Đang tải bình luận...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-on-surface-variant">Chưa có bình luận.</p>
              ) : (
                <ul className="space-y-3">
                  {comments.map((comment) => (
                    <li key={comment.id} className="bg-surface-container-low p-3 rounded-xl">
                      <div className="flex justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold">{comment.authorDisplayName || '—'}</p>
                          <p className="text-sm mt-1">{comment.content}</p>
                          {comment.parentCommentId && <span className="text-[10px] text-on-surface-variant">↳ Trả lời</span>}
                        </div>
                        <button
                          onClick={() => setConfirm({ type: 'comment', target: comment })}
                          className="shrink-0 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-lg h-fit"
                        >
                          Xóa
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t">
              <button onClick={() => setDetail(null)} className="px-4 py-2 border rounded-lg">Đóng</button>
              <button onClick={() => setConfirm({ type: 'post', target: detail })} className="px-4 py-2 bg-red-600 text-white rounded-lg">Xóa bài đăng</button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.type === 'comment' ? 'Xóa bình luận' : 'Xóa bài đăng'}
        message={confirm?.type === 'comment'
          ? 'Xóa bình luận này? Nếu là bình luận gốc, các trả lời cũng sẽ bị xóa.'
          : 'Bài đăng sẽ bị ẩn khỏi feed. Hành động này không thể hoàn tác.'}
        confirmText="Xóa"
        loading={submitting}
        onConfirm={executeConfirm}
      />
    </>
  )
}

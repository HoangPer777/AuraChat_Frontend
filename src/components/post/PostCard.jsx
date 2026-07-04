import { useEffect, useState } from 'react'
import useAuthStore from '../../store/authStore'
import {
  addComment,
  deletePost,
  getComments,
  sharePost,
  toggleLike,
} from '../../services/postService'

function formatTime(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Vừa xong'
  if (diffMin < 60) return `${diffMin} phút trước`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} giờ trước`
  return date.toLocaleDateString('vi-VN')
}

function AuthorAvatar({ author, size = 10 }) {
  const src =
    author?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(author?.displayName || 'User')}`
  return (
    <img
      src={src}
      alt=""
      className={`w-${size} h-${size} rounded-full object-cover shrink-0`}
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
    />
  )
}

function SharedPostPreview({ originalPost }) {
  if (!originalPost) return null
  return (
    <div className="mt-3 border border-outline-variant rounded-xl p-3 bg-surface-container-lowest">
      <div className="flex items-center gap-2 mb-2">
        <AuthorAvatar author={originalPost.author} size={8} />
        <div>
          <p className="text-sm font-bold">{originalPost.author?.displayName}</p>
          <p className="text-xs text-on-surface-variant">{formatTime(originalPost.createdAt)}</p>
        </div>
      </div>
      {originalPost.content && <p className="text-sm whitespace-pre-wrap">{originalPost.content}</p>}
      {originalPost.imageUrls?.length > 0 && (
        <img
          src={originalPost.imageUrls[0]}
          alt=""
          className="mt-2 w-full max-h-64 object-cover rounded-lg"
        />
      )}
    </div>
  )
}

export default function PostCard({ post, onUpdate, onDelete, onShare, showActions = true }) {
  const currentUser = useAuthStore((s) => s.user)
  const [localPost, setLocalPost] = useState(post)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    setLocalPost(post)
  }, [post])

  const isOwner = currentUser?.id === localPost.author?.id

  const handleLike = async () => {
    setActionError('')
    try {
      const res = await toggleLike(localPost.id)
      const updated = res?.data
      if (updated) {
        setLocalPost(updated)
        onUpdate?.(updated)
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Không thể thích bài viết')
    }
  }

  const handleShare = async () => {
    const caption = window.prompt('Thêm ghi chú khi chia sẻ (tuỳ chọn):', '')
    if (caption === null) return

    setSharing(true)
    setActionError('')
    try {
      const res = await sharePost(localPost.id, caption)
      if (res?.success !== false) {
        onShare?.(res?.data)
        alert('Đã chia sẻ bài viết lên bảng tin của bạn!')
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Chia sẻ thất bại')
    } finally {
      setSharing(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Xóa bài đăng này?')) return
    try {
      await deletePost(localPost.id)
      onDelete?.(localPost.id)
    } catch (err) {
      setActionError(err.response?.data?.message || 'Xóa bài thất bại')
    }
  }

  const loadComments = async () => {
    setLoadingComments(true)
    try {
      const res = await getComments(localPost.id)
      setComments(res?.data?.content || [])
    } catch {
      setComments([])
    } finally {
      setLoadingComments(false)
    }
  }

  const toggleComments = async () => {
    const next = !showComments
    setShowComments(next)
    if (next && comments.length === 0) await loadComments()
  }

  const handleAddComment = async () => {
    if (!commentText.trim()) return
    setSubmittingComment(true)
    try {
      const res = await addComment(localPost.id, commentText.trim())
      const newComment = res?.data
      if (newComment) {
        setComments((prev) => [...prev, newComment])
        setCommentText('')
        setLocalPost((prev) => ({
          ...prev,
          commentCount: (prev.commentCount || 0) + 1,
        }))
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Không thể bình luận')
    } finally {
      setSubmittingComment(false)
    }
  }

  return (
    <article className="bg-white rounded-2xl border border-outline-variant/50 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <AuthorAvatar author={localPost.author} />
            <div>
              <p className="font-bold text-sm">{localPost.author?.displayName}</p>
              <p className="text-xs text-on-surface-variant">{formatTime(localPost.createdAt)}</p>
            </div>
          </div>
          {isOwner && showActions && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-on-surface-variant hover:text-error p-1"
              title="Xóa bài"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
          )}
        </div>

        {localPost.content && (
          <p className="mt-3 text-sm whitespace-pre-wrap leading-relaxed">{localPost.content}</p>
        )}

        {localPost.originalPost && <SharedPostPreview originalPost={localPost.originalPost} />}

        {!localPost.originalPost && localPost.imageUrls?.length > 0 && (
          <div className={`mt-3 grid gap-2 ${localPost.imageUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {localPost.imageUrls.map((url) => (
              <img key={url} src={url} alt="" className="w-full rounded-xl object-cover max-h-96" />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-outline-variant/40 flex items-center gap-4 text-xs text-on-surface-variant">
        <span>{localPost.likeCount || 0} lượt thích</span>
        <span>{localPost.commentCount || 0} bình luận</span>
        <span>{localPost.shareCount || 0} lượt chia sẻ</span>
      </div>

      {showActions && (
        <div className="px-2 py-1 border-t border-outline-variant/40 grid grid-cols-3">
          <button
            type="button"
            onClick={handleLike}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              localPost.likedByMe ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: localPost.likedByMe ? "'FILL' 1" : "'FILL' 0" }}>
              favorite
            </span>
            Thích
          </button>
          <button
            type="button"
            onClick={toggleComments}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
            Bình luận
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
            Chia sẻ
          </button>
        </div>
      )}

      {actionError && <p className="px-4 pb-2 text-error text-xs">{actionError}</p>}

      {showComments && (
        <div className="px-4 pb-4 border-t border-outline-variant/40 bg-surface-container-lowest/50">
          {loadingComments ? (
            <p className="py-3 text-sm text-on-surface-variant">Đang tải bình luận...</p>
          ) : (
            <div className="space-y-3 py-3 max-h-64 overflow-y-auto">
              {comments.length === 0 && (
                <p className="text-sm text-on-surface-variant">Chưa có bình luận nào.</p>
              )}
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <AuthorAvatar author={comment.author} size={8} />
                  <div className="bg-white rounded-xl px-3 py-2 flex-1 border border-outline-variant/30">
                    <p className="text-xs font-bold">{comment.author?.displayName}</p>
                    <p className="text-sm mt-0.5">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Viết bình luận..."
              className="flex-1 px-3 py-2 rounded-xl border border-outline-variant text-sm outline-none focus:ring-2 focus:ring-primary/20"
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <button
              type="button"
              onClick={handleAddComment}
              disabled={submittingComment}
              className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50"
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

import { useCallback, useEffect, useState } from 'react'
import PostComposer from '../../components/post/PostComposer'
import PostCard from '../../components/post/PostCard'
import { getFeed } from '../../services/postService'

export default function MediaFeedPage() {
  const [posts, setPosts] = useState([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const loadFeed = useCallback(async (pageNum = 0, append = false) => {
    if (pageNum === 0) setLoading(true)
    else setLoadingMore(true)
    setError('')
    try {
      const res = await getFeed({ page: pageNum, size: 10 })
      const data = res?.data
      const content = data?.content || []
      setPosts((prev) => (append ? [...prev, ...content] : content))
      setHasMore(!data?.last)
      setPage(pageNum)
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải bảng tin')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    loadFeed(0, false)
  }, [loadFeed])

  const handlePosted = (newPost) => {
    if (newPost) setPosts((prev) => [newPost, ...prev])
    else loadFeed(0, false)
  }

  const handleSharePosted = (sharedPost) => {
    if (sharedPost) setPosts((prev) => [sharedPost, ...prev])
  }

  const handleUpdate = (updatedPost) => {
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)))
  }

  const handleDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-surface-container-low">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <header className="mb-2">
          <h1 className="text-2xl font-bold text-on-surface">Bảng tin</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Xem bài đăng từ bạn bè và chia sẻ khoảnh khắc của bạn
          </p>
        </header>

        <PostComposer onPosted={handlePosted} />

        {error && (
          <div className="p-4 rounded-xl bg-error-container text-on-error-container text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-outline-variant/50">
            <span className="material-symbols-outlined text-5xl text-outline mb-3">dynamic_feed</span>
            <p className="font-bold text-on-surface">Chưa có bài đăng nào</p>
            <p className="text-sm text-on-surface-variant mt-1">
              Hãy đăng bài đầu tiên hoặc kết bạn để xem bảng tin
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onShare={handleSharePosted}
              />
            ))}
          </div>
        )}

        {hasMore && !loading && posts.length > 0 && (
          <button
            type="button"
            onClick={() => loadFeed(page + 1, true)}
            disabled={loadingMore}
            className="w-full py-3 rounded-xl border border-outline-variant bg-white text-sm font-bold text-primary hover:bg-primary/5 disabled:opacity-50"
          >
            {loadingMore ? 'Đang tải...' : 'Xem thêm bài đăng'}
          </button>
        )}
      </div>
    </div>
  )
}

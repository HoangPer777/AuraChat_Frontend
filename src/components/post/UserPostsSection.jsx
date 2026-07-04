import { useEffect, useState } from 'react'
import PostCard from './PostCard'
import { getUserPosts } from '../../services/postService'

export default function UserPostsSection({ userId, title = 'Bài đăng của tôi' }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) return
    let active = true

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getUserPosts(userId, { page: 0, size: 20 })
        if (active) setPosts(res?.data?.content || [])
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Không thể tải bài đăng')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [userId])

  const handleUpdate = (updated) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  const handleDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-on-surface">{title}</h2>
      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}
      {error && <p className="text-error text-sm">{error}</p>}
      {!loading && posts.length === 0 && (
        <p className="text-sm text-on-surface-variant text-center py-6 bg-surface-container-lowest rounded-xl">
          Chưa có bài đăng nào.
        </p>
      )}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  )
}

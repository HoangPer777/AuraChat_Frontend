import { useRef, useState } from 'react'
import useAuthStore from '../../store/authStore'
import { uploadImage } from '../../services/mediaService'
import { createPost } from '../../services/postService'

export default function PostComposer({ onPosted }) {
  const user = useAuthStore((s) => s.user)
  const [content, setContent] = useState('')
  const [imageUrls, setImageUrls] = useState([])
  const [uploading, setUploading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const avatarSrc =
    user?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}`

  const handleImageSelect = async (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    setError('')
    setUploading(true)
    try {
      const uploaded = []
      for (const file of files.slice(0, 10 - imageUrls.length)) {
        const res = await uploadImage(file)
        const url = res?.data?.url
        if (url) uploaded.push(url)
      }
      setImageUrls((prev) => [...prev, ...uploaded].slice(0, 10))
    } catch (err) {
      setError(err.response?.data?.message || 'Tải ảnh thất bại')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleSubmit = async () => {
    if (!content.trim() && imageUrls.length === 0) {
      setError('Hãy nhập nội dung hoặc thêm ảnh')
      return
    }

    setPosting(true)
    setError('')
    try {
      const res = await createPost({ content: content.trim(), imageUrls })
      if (res?.success !== false) {
        setContent('')
        setImageUrls([])
        onPosted?.(res?.data)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng bài thất bại')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-outline-variant/50 shadow-sm p-4 space-y-3">
      <div className="flex gap-3">
        <img src={avatarSrc} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Bạn đang nghĩ gì?"
          className="flex-1 min-h-[80px] p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm resize-none"
          maxLength={5000}
        />
      </div>

      {imageUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {imageUrls.map((url) => (
            <div key={url} className="relative aspect-square rounded-xl overflow-hidden">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setImageUrls((prev) => prev.filter((u) => u !== url))}
                className="absolute top-1 right-1 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-error text-sm">{error}</p>}

      <div className="flex items-center justify-between pt-1 border-t border-outline-variant/40">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || imageUrls.length >= 10}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px]">image</span>
          {uploading ? 'Đang tải ảnh...' : 'Thêm ảnh'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageSelect}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={posting || uploading}
          className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 disabled:opacity-50"
        >
          {posting ? 'Đang đăng...' : 'Đăng bài'}
        </button>
      </div>
    </div>
  )
}

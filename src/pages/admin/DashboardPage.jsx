import { useCallback, useEffect, useState } from 'react'
import { getAdminStatistics } from '../../services/adminService'

const ranges = [
  { days: 1, label: 'Hôm nay' },
  { days: 7, label: '7 ngày' },
  { days: 30, label: '30 ngày' },
]

const toDateParam = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function DashboardPage() {
  const [days, setDays] = useState(1)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStats = useCallback(async () => {
    setLoading(true)
    setError('')
    const end = new Date()
    const start = new Date(end)
    start.setDate(end.getDate() - days + 1)
    try {
      setStats(await getAdminStatistics({ startDate: toDateParam(start), endDate: toDateParam(end) }))
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải thống kê hệ thống.')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => { loadStats() }, [loadStats])

  const cards = [
    { label: 'Người dùng online', value: stats?.onlineUsersCount, icon: 'person', color: 'text-primary' },
    { label: 'Người dùng mới', value: stats?.newUsersCount, icon: 'person_add', color: 'text-secondary' },
    { label: 'Tin nhắn', value: stats?.messageVolume, icon: 'chat', color: 'text-tertiary' },
    { label: 'Hoạt động (DAU)', value: stats?.dailyActiveUsers, icon: 'monitoring', color: 'text-primary' },
    { label: 'Bài đăng', value: stats?.totalPostsCount, icon: 'article', color: 'text-secondary' },
    { label: 'Media', value: stats?.totalMediaCount, icon: 'perm_media', color: 'text-tertiary' },
  ]

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    let value = bytes
    let i = 0
    while (value >= 1024 && i < units.length - 1) { value /= 1024; i += 1 }
    return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
  }

  return (
    <>
      <header className="h-16 px-8 flex justify-between items-center bg-surface/80 backdrop-blur-md border-b border-outline-variant sticky top-0 z-40">
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <span>Hệ thống</span><span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-primary font-bold">Tổng quan</span>
        </div>
      </header>
      <div className="p-8">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold">Thống kê hệ thống</h2>
            <p className="text-sm text-on-surface-variant">
              {stats?.generatedAt ? `Cập nhật: ${new Date(stats.generatedAt).toLocaleString('vi-VN')}` : 'Dữ liệu thực từ MongoDB và Redis'}
            </p>
          </div>
          <div className="flex items-center bg-surface-container-low p-1 rounded-lg border border-outline-variant">
            {ranges.map((range) => (
              <button key={range.days} onClick={() => setDays(range.days)} className={`px-4 py-1.5 text-xs rounded-md ${days === range.days ? 'bg-white text-primary font-bold shadow-sm' : 'text-on-surface-variant'}`}>
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 flex justify-between"><span>{error}</span><button onClick={loadStats} className="font-bold">Thử lại</button></div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {cards.map((card) => (
            <div key={card.label} className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{card.label}</span>
                <span className={`material-symbols-outlined ${card.color}`}>{card.icon}</span>
              </div>
              {loading ? <div className="h-9 w-24 bg-surface-container-high animate-pulse rounded" /> : <span className="text-3xl font-bold">{Number(card.value || 0).toLocaleString('vi-VN')}</span>}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
          <h3 className="font-bold text-lg mb-2">Cách tính số liệu</h3>
          <p className="text-sm text-on-surface-variant">
            DAU là số người dùng khác nhau đã gửi ít nhất một tin nhắn trong khoảng ngày đã chọn.
            Số online được lấy từ heartbeat còn hiệu lực trong Redis.
            Bài đăng và media là tổng số đang hoạt động trên toàn hệ thống
            {stats?.totalMediaBytes ? ` (${formatBytes(stats.totalMediaBytes)} dung lượng media)` : ''}.
          </p>
        </div>
      </div>
    </>
  )
}

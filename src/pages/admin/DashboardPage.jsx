import { useCallback, useEffect, useMemo, useState } from 'react'
import { format, parseISO, subDays } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getAdminStatistics, getAdminStatisticsTrends } from '../../services/adminService'
import AdminDateRangePicker, { toIsoDate } from '../../components/admin/AdminDateRangePicker'

const CHART_COLORS = {
  messages: '#6750A4',
  newUsers: '#006A6A',
  dau: '#7D5260',
  posts: '#625B71',
  media: '#386A20',
  online: '#B3261E',
}

const formatChartDate = (isoDate) => {
  if (!isoDate) return ''
  const parts = isoDate.split('-').map(Number)
  if (parts.length === 3) {
    const [, month, day] = parts
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`
  }
  return isoDate
}

const parseLocalDate = (value) => {
  if (!value) return null
  const parts = value.split('-').map(Number)
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null
  const [year, month, day] = parts
  return new Date(year, month - 1, day)
}

const formatRangeLabel = (startDate, endDate) => {
  if (!startDate || !endDate) return 'khoảng đã chọn'
  const start = parseLocalDate(startDate)
  const end = parseLocalDate(endDate)
  if (!start || !end) return `${startDate} – ${endDate}`
  const startLabel = format(start, 'dd/MM/yyyy', { locale: vi })
  const endLabel = format(end, 'dd/MM/yyyy', { locale: vi })
  return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`
}

const formatBytes = (bytes) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let i = 0
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i += 1 }
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  const parsed = point?.date ? parseLocalDate(point.date) : null
  const dateLabel = parsed
    ? format(parsed, 'dd/MM/yyyy', { locale: vi })
    : point?.label
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="font-bold mb-1">{dateLabel}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {Number(entry.value).toLocaleString('vi-VN')}
        </p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const today = useMemo(() => new Date(), [])
  const defaultEnd = toIsoDate(today)
  const defaultStart = toIsoDate(subDays(today, 6))

  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)
  const [presetDays, setPresetDays] = useState(7)
  const [stats, setStats] = useState(null)
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const dateRange = useMemo(
    () => ({ startDate, endDate }),
    [startDate, endDate]
  )

  const handleRangeChange = ({ startDate: nextStart, endDate: nextEnd, presetDays: nextPreset }) => {
    setStartDate(nextStart)
    setEndDate(nextEnd)
    setPresetDays(nextPreset)
  }

  const loadStats = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [summary, trendData] = await Promise.all([
        getAdminStatistics(dateRange),
        getAdminStatisticsTrends(dateRange),
      ])
      setStats(summary)
      setTrends((trendData?.points || []).map((p) => ({
        ...p,
        label: formatChartDate(p.date),
      })))
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải thống kê hệ thống.')
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => { loadStats() }, [loadStats])

  const cards = [
    { label: 'Người dùng online', value: stats?.onlineUsersCount, icon: 'person', color: 'text-primary' },
    { label: 'Người dùng mới', value: stats?.newUsersCount, icon: 'person_add', color: 'text-secondary' },
    { label: 'Tin nhắn', value: stats?.messageVolume, icon: 'chat', color: 'text-tertiary' },
    { label: 'Hoạt động (DAU)', value: stats?.dailyActiveUsers, icon: 'monitoring', color: 'text-primary' },
    { label: 'Bài đăng', value: stats?.totalPostsCount, icon: 'article', color: 'text-secondary' },
    { label: 'Media', value: stats?.totalMediaCount, icon: 'perm_media', color: 'text-tertiary' },
  ]

  const activityChartData = trends.map((p) => ({
    date: p.date,
    label: p.label,
    'Tin nhắn': p.messageVolume,
    'User mới': p.newUsersCount,
    DAU: p.dailyActiveUsers,
  }))

  const periodSummary = [
    { name: 'Tin nhắn', value: stats?.messageVolume || 0, color: CHART_COLORS.messages },
    { name: 'User mới', value: stats?.newUsersCount || 0, color: CHART_COLORS.newUsers },
    { name: 'DAU', value: stats?.dailyActiveUsers || 0, color: CHART_COLORS.dau },
  ].filter((item) => item.value > 0)

  const platformData = [
    { name: 'Bài đăng', value: stats?.totalPostsCount || 0, color: CHART_COLORS.posts },
    { name: 'Media', value: stats?.totalMediaCount || 0, color: CHART_COLORS.media },
    { name: 'Online', value: stats?.onlineUsersCount || 0, color: CHART_COLORS.online },
  ].filter((item) => item.value > 0)

  return (
    <>
      <header className="h-16 px-8 flex justify-between items-center bg-surface/80 backdrop-blur-md border-b border-outline-variant sticky top-0 z-40">
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <span>Hệ thống</span><span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-primary font-bold">Tổng quan</span>
        </div>
      </header>
      <div className="p-8">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8 overflow-visible relative z-10">
          <div>
            <h2 className="text-2xl font-bold">Thống kê hệ thống</h2>
            <p className="text-sm text-on-surface-variant">
              {stats?.generatedAt ? `Cập nhật: ${new Date(stats.generatedAt).toLocaleString('vi-VN')}` : 'Dữ liệu thực từ MongoDB và Redis'}
            </p>
          </div>
          <AdminDateRangePicker
            startDate={startDate}
            endDate={endDate}
            presetDays={presetDays}
            onChange={handleRangeChange}
          />
        </div>

        {error && <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 flex justify-between"><span>{error}</span><button onClick={loadStats} className="font-bold">Thử lại</button></div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <div className="xl:col-span-2 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
            <h3 className="font-bold text-lg mb-1">Xu hướng hoạt động</h3>
            <p className="text-sm text-on-surface-variant mb-4">Tin nhắn, người dùng mới và DAU theo ngày</p>
            {loading ? (
              <div className="h-[280px] bg-surface-container-high animate-pulse rounded-xl" />
            ) : activityChartData.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-on-surface-variant text-sm">Chưa có dữ liệu trong khoảng thời gian này.</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={activityChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradMessages" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.messages} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={CHART_COLORS.messages} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.newUsers} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={CHART_COLORS.newUsers} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E0EC" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#79747E" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#79747E" allowDecimals={false} width={36} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="Tin nhắn" stroke={CHART_COLORS.messages} fill="url(#gradMessages)" strokeWidth={2} />
                  <Area type="monotone" dataKey="User mới" stroke={CHART_COLORS.newUsers} fill="url(#gradUsers)" strokeWidth={2} />
                  <Area type="monotone" dataKey="DAU" stroke={CHART_COLORS.dau} fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
            <h3 className="font-bold text-lg mb-1">Hoạt động trong kỳ</h3>
            <p className="text-sm text-on-surface-variant mb-4">Tổng hợp {formatRangeLabel(startDate, endDate)}</p>
            {loading ? (
              <div className="h-[280px] bg-surface-container-high animate-pulse rounded-xl" />
            ) : periodSummary.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-on-surface-variant text-sm">Chưa có hoạt động.</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={periodSummary}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {periodSummary.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => Number(value).toLocaleString('vi-VN')} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
            <h3 className="font-bold text-lg mb-1">Tin nhắn theo ngày</h3>
            <p className="text-sm text-on-surface-variant mb-4">Khối lượng tin nhắn gửi trong kỳ</p>
            {loading ? (
              <div className="h-[240px] bg-surface-container-high animate-pulse rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={activityChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E0EC" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#79747E" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#79747E" allowDecimals={false} width={36} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="Tin nhắn" fill={CHART_COLORS.messages} radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
            <h3 className="font-bold text-lg mb-1">Nền tảng hiện tại</h3>
            <p className="text-sm text-on-surface-variant mb-4">
              Bài đăng, media và user online
              {stats?.totalMediaBytes ? ` · ${formatBytes(stats.totalMediaBytes)} lưu trữ` : ''}
            </p>
            {loading ? (
              <div className="h-[240px] bg-surface-container-high animate-pulse rounded-xl" />
            ) : platformData.length === 0 ? (
              <div className="h-[240px] flex items-center justify-center text-on-surface-variant text-sm">Chưa có dữ liệu nền tảng.</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={platformData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E0EC" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#79747E" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#79747E" width={72} />
                  <Tooltip formatter={(value) => Number(value).toLocaleString('vi-VN')} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={32}>
                    {platformData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="mt-8 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
          <h3 className="font-bold text-lg mb-2">Cách tính số liệu</h3>
          <p className="text-sm text-on-surface-variant">
            DAU là số người dùng khác nhau đã gửi ít nhất một tin nhắn mỗi ngày trong khoảng đã chọn.
            Biểu đồ xu hướng lấy số liệu theo từng ngày (múi giờ Việt Nam).
            Bài đăng và media là tổng đang hoạt động trên toàn hệ thống.
          </p>
        </div>
      </div>
    </>
  )
}

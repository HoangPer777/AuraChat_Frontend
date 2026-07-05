import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { DayPicker } from 'react-day-picker'
import { vi } from 'date-fns/locale'
import { format, isAfter, startOfDay, subDays } from 'date-fns'
import 'react-day-picker/style.css'

const presets = [
  { id: 'today', label: 'Hôm nay', days: 1 },
  { id: 'week', label: '7 ngày', days: 7 },
  { id: 'month', label: '30 ngày', days: 30 },
]

const toIsoDate = (date) => format(date, 'yyyy-MM-dd')

/** Parse yyyy-MM-dd as local date (tránh lệch timezone của parseISO). */
const parseLocalDate = (value) => {
  if (!value) return undefined
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return undefined
  const [, y, m, d] = match.map(Number)
  const date = new Date(y, m - 1, d)
  return Number.isNaN(date.getTime()) ? undefined : startOfDay(date)
}

export default function AdminDateRangePicker({ startDate, endDate, presetDays, onChange }) {
  const [open, setOpen] = useState(false)
  const [draftRange, setDraftRange] = useState(undefined)
  const [activePreset, setActivePreset] = useState('week')
  const [panelStyle, setPanelStyle] = useState({ top: 0, left: 0, width: 340 })
  const containerRef = useRef(null)
  const toggleRef = useRef(null)
  const panelRef = useRef(null)
  const wasOpenRef = useRef(false)

  const selectedFrom = parseLocalDate(startDate)
  const selectedTo = parseLocalDate(endDate)
  const today = startOfDay(new Date())
  const maxStart = subDays(today, 365)

  // Chỉ khởi tạo draft khi mở popup — không reset khi user đang chọn ngày.
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      const from = parseLocalDate(startDate)
      const to = parseLocalDate(endDate)
      if (from && to) {
        setDraftRange({ from, to })
      } else if (from) {
        setDraftRange({ from, to: undefined })
      } else {
        setDraftRange(undefined)
      }
    }
    wasOpenRef.current = open
  }, [open, startDate, endDate])

  useEffect(() => {
    const preset = presets.find((p) => p.days === presetDays)
    setActivePreset(preset ? preset.id : 'custom')
  }, [presetDays])

  useLayoutEffect(() => {
    if (!open || !toggleRef.current) return undefined

    const updatePosition = () => {
      const rect = toggleRef.current.getBoundingClientRect()
      const panelWidth = Math.min(360, window.innerWidth - 16)
      let left = rect.right - panelWidth
      left = Math.max(8, Math.min(left, window.innerWidth - panelWidth - 8))
      const top = rect.bottom + 8
      setPanelStyle({ top, left, width: panelWidth })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (event) => {
      const target = event.target
      if (containerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const applyPreset = (preset) => {
    const end = today
    const start = subDays(end, preset.days - 1)
    setActivePreset(preset.id)
    onChange({ startDate: toIsoDate(start), endDate: toIsoDate(end), presetDays: preset.days })
    setOpen(false)
  }

  const applyCustomRange = () => {
    if (!draftRange?.from) return
    const from = startOfDay(draftRange.from)
    const to = startOfDay(draftRange.to || draftRange.from)
    if (isAfter(from, to)) return

    setActivePreset('custom')
    onChange({ startDate: toIsoDate(from), endDate: toIsoDate(to), presetDays: null })
    setOpen(false)
  }

  const displayLabel = selectedFrom && selectedTo
    ? `${format(selectedFrom, 'dd/MM/yyyy', { locale: vi })} – ${format(selectedTo, 'dd/MM/yyyy', { locale: vi })}`
    : 'Chọn khoảng thời gian'

  const calendarPanel = open ? (
    <div
      ref={panelRef}
      className="admin-date-picker fixed z-[9999] bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl p-4"
      style={{ top: panelStyle.top, left: panelStyle.left, width: panelStyle.width }}
      role="dialog"
      aria-label="Chọn khoảng ngày"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <p className="text-sm font-bold mb-3 text-on-surface">Chọn từ ngày đến ngày</p>
      <div className="flex justify-center overflow-x-auto">
        <DayPicker
          mode="range"
          locale={vi}
          selected={draftRange}
          onSelect={setDraftRange}
          resetOnSelect
          disabled={{ after: today, before: maxStart }}
          defaultMonth={draftRange?.from || selectedFrom || today}
          showOutsideDays
          fixedWeeks
        />
      </div>
      <div className="mt-3 pt-3 border-t border-outline-variant space-y-3">
        <p className="text-xs text-on-surface-variant">
          {draftRange?.from
            ? draftRange.to
              ? `${format(draftRange.from, 'dd/MM/yyyy')} → ${format(draftRange.to, 'dd/MM/yyyy')}`
              : `Từ ${format(draftRange.from, 'dd/MM/yyyy')} — chọn ngày kết thúc`
            : 'Bước 1: chọn ngày bắt đầu · Bước 2: chọn ngày kết thúc'}
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-3 py-1.5 text-sm border border-outline-variant rounded-lg hover:bg-surface-container-low"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={applyCustomRange}
            disabled={!draftRange?.from}
            className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg font-bold disabled:opacity-40"
          >
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  ) : null

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center bg-surface-container-low p-1 rounded-lg border border-outline-variant">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                activePreset === preset.id
                  ? 'bg-white text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all ${
            open || activePreset === 'custom'
              ? 'border-primary bg-primary-container/30 text-primary font-bold'
              : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary/40'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">calendar_month</span>
          <span className="max-w-[240px] truncate">{displayLabel}</span>
          <span className="material-symbols-outlined text-[18px]">{open ? 'expand_less' : 'expand_more'}</span>
        </button>
      </div>

      {typeof document !== 'undefined' && createPortal(calendarPanel, document.body)}
    </div>
  )
}

export { toIsoDate }

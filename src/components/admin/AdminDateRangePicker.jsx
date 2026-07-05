import { useEffect, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { vi } from 'date-fns/locale'
import { format, isAfter, isBefore, parseISO, startOfDay, subDays } from 'date-fns'
import 'react-day-picker/style.css'

const presets = [
  { id: 'today', label: 'Hôm nay', days: 1 },
  { id: 'week', label: '7 ngày', days: 7 },
  { id: 'month', label: '30 ngày', days: 30 },
]

const toIsoDate = (date) => format(date, 'yyyy-MM-dd')

const parseDate = (value) => {
  if (!value) return undefined
  const parsed = parseISO(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

export default function AdminDateRangePicker({ startDate, endDate, presetDays, onChange }) {
  const [open, setOpen] = useState(false)
  const [draftRange, setDraftRange] = useState(undefined)
  const [activePreset, setActivePreset] = useState('week')
  const containerRef = useRef(null)

  const selectedFrom = parseDate(startDate)
  const selectedTo = parseDate(endDate)
  const today = startOfDay(new Date())
  const maxStart = subDays(today, 365)

  useEffect(() => {
    if (open) {
      setDraftRange(
        selectedFrom && selectedTo
          ? { from: selectedFrom, to: selectedTo }
          : selectedFrom
            ? { from: selectedFrom, to: selectedFrom }
            : undefined
      )
    }
  }, [open, startDate, endDate, selectedFrom, selectedTo])

  useEffect(() => {
    const preset = presets.find((p) => p.days === presetDays)
    if (preset) setActivePreset(preset.id)
    else setActivePreset('custom')
  }, [presetDays])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const applyPreset = (preset) => {
    const end = today
    const start = subDays(end, preset.days - 1)
    setActivePreset(preset.id)
    onChange({ startDate: toIsoDate(start), endDate: toIsoDate(end), presetDays: preset.days })
    setOpen(false)
  }

  const applyCustomRange = () => {
    if (!draftRange?.from) return
    const from = draftRange.from
    const to = draftRange.to || draftRange.from
    if (isAfter(from, to)) return

    setActivePreset('custom')
    onChange({ startDate: toIsoDate(from), endDate: toIsoDate(to), presetDays: null })
    setOpen(false)
  }

  const displayLabel = selectedFrom && selectedTo
    ? `${format(selectedFrom, 'dd/MM/yyyy', { locale: vi })} – ${format(selectedTo, 'dd/MM/yyyy', { locale: vi })}`
    : 'Chọn khoảng thời gian'

  const disabledDays = (date) => isAfter(date, today) || isBefore(date, maxStart)

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
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all ${
            open || activePreset === 'custom'
              ? 'border-primary bg-primary-container/30 text-primary font-bold'
              : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary/40'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">calendar_month</span>
          <span className="max-w-[220px] truncate">{displayLabel}</span>
          <span className="material-symbols-outlined text-[18px]">{open ? 'expand_less' : 'expand_more'}</span>
        </button>
      </div>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl p-4 min-w-[320px] admin-date-picker">
          <p className="text-sm font-bold mb-3 text-on-surface">Chọn từ ngày đến ngày</p>
          <DayPicker
            mode="range"
            locale={vi}
            selected={draftRange}
            onSelect={setDraftRange}
            disabled={disabledDays}
            numberOfMonths={1}
            defaultMonth={draftRange?.from || selectedFrom || today}
            classNames={{
              root: 'rdp-root text-sm',
              month_caption: 'font-bold text-on-surface mb-2 capitalize',
              weekday: 'text-on-surface-variant text-xs font-medium',
              day: 'rounded-lg',
              selected: 'bg-primary text-white font-bold',
              range_start: 'bg-primary text-white rounded-l-lg',
              range_end: 'bg-primary text-white rounded-r-lg',
              range_middle: 'bg-primary-container text-on-primary-container',
              today: 'font-bold text-primary underline',
              chevron: 'fill-primary',
            }}
          />
          <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-outline-variant">
            <p className="text-xs text-on-surface-variant">
              {draftRange?.from
                ? draftRange.to
                  ? `${format(draftRange.from, 'dd/MM/yyyy')} → ${format(draftRange.to, 'dd/MM/yyyy')}`
                  : `Từ ${format(draftRange.from, 'dd/MM/yyyy')} — chọn ngày kết thúc`
                : 'Nhấn ngày bắt đầu, rồi ngày kết thúc'}
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 text-sm border border-outline-variant rounded-lg"
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
      )}
    </div>
  )
}

export { toIsoDate }

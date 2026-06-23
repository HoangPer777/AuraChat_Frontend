import React, { useEffect, useRef, useState } from 'react'
import { STICKER_PACKS } from '../../utils/stickers'

export default function StickerPicker({ open, onClose, onSelect }) {
  const [activePackId, setActivePackId] = useState(STICKER_PACKS[0]?.id)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose?.()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, onClose])

  if (!open) return null

  const activePack = STICKER_PACKS.find((pack) => pack.id === activePackId) || STICKER_PACKS[0]

  return (
    <div
      ref={panelRef}
      className="mb-3 rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-lg overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant/60">
        <span className="text-sm font-semibold text-on-surface">Sticker</span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full text-outline hover:bg-surface-container-high hover:text-on-surface"
          aria-label="Đóng sticker"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <div className="flex gap-1 px-2 py-2 border-b border-outline-variant/40 overflow-x-auto">
        {STICKER_PACKS.map((pack) => (
          <button
            key={pack.id}
            type="button"
            onClick={() => setActivePackId(pack.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm transition-colors ${
              activePackId === pack.id
                ? 'bg-primary text-white'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="mr-1">{pack.icon}</span>
            {pack.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 p-3 max-h-52 overflow-y-auto">
        {activePack.stickers.map((sticker) => (
          <button
            key={sticker.id}
            type="button"
            title={sticker.emoji}
            onClick={() => onSelect(sticker)}
            className="p-1.5 rounded-xl hover:bg-primary/10 active:scale-95 transition-transform"
          >
            <img
              src={sticker.url}
              alt={sticker.emoji}
              className="w-10 h-10 object-contain mx-auto"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      <p className="px-4 pb-2 text-[10px] text-outline text-center">
        Sticker từ Twemoji (CC BY 4.0)
      </p>
    </div>
  )
}

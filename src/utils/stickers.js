const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72'

export function emojiToStickerId(emoji) {
  return [...emoji].map((char) => char.codePointAt(0).toString(16)).join('-')
}

export function getTwemojiUrl(emoji) {
  return `${TWEMOJI_BASE}/${emojiToStickerId(emoji)}.png`
}

function packStickers(emojis) {
  return emojis.map((emoji) => ({
    id: emojiToStickerId(emoji),
    emoji,
    url: getTwemojiUrl(emoji),
  }))
}

/** Bộ sticker mặc định — nguồn hình: Twemoji (Twitter, CC BY 4.0) */
export const STICKER_PACKS = [
  {
    id: 'emotions',
    label: 'Cảm xúc',
    icon: '😀',
    stickers: packStickers([
      '😀', '😃', '😄', '😁', '😆', '😂', '🤣', '😊',
      '😇', '🙂', '😉', '😍', '🥰', '😘', '😗', '😋',
      '😛', '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔',
    ]),
  },
  {
    id: 'reactions',
    label: 'Phản ứng',
    icon: '👍',
    stickers: packStickers([
      '👍', '👎', '👏', '🙌', '🤝', '🙏', '💪', '✌️',
      '🤞', '🤟', '🤘', '👌', '🤌', '👋', '🫶', '❤️',
      '🔥', '⭐', '✨', '💯', '🎉', '🎊', '💐', '🌸',
    ]),
  },
  {
    id: 'moods',
    label: 'Tâm trạng',
    icon: '😢',
    stickers: packStickers([
      '😢', '😭', '😤', '😠', '😡', '🥺', '😱', '😨',
      '😰', '😥', '😓', '🤯', '😴', '🥱', '😷', '🤒',
      '🤕', '🤑', '🤠', '😎', '🤓', '🧐', '😈', '👻',
    ]),
  },
]

export function findStickerById(stickerId) {
  for (const pack of STICKER_PACKS) {
    const match = pack.stickers.find((item) => item.id === stickerId)
    if (match) return match
  }
  return null
}

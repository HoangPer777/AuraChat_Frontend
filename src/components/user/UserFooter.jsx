export default function UserFooter() {
  return (
    <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-full shadow-sm z-20 pointer-events-none">
      <div className="w-2 h-2 bg-green-500 rounded-full" />
      <span className="text-[12px] text-on-surface-variant">Hệ thống đang hoạt động</span>
    </div>
  )
}

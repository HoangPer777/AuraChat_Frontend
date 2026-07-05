export function CallTopBar({ remoteName, timer, statusLabel, isConnected }) {
  return (
    <header className="absolute top-0 left-0 w-full pt-10 sm:pt-12 flex flex-col items-center z-20 pointer-events-none">
      <div className="bg-white/10 backdrop-blur-2xl px-6 py-2.5 rounded-full border border-white/10 flex items-center gap-3 shadow-2xl">
        {statusLabel && (
          <span className="text-[10px] font-bold tracking-widest text-primary uppercase hidden sm:inline">
            {statusLabel}
          </span>
        )}
        {statusLabel && isConnected && (
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse hidden sm:block" />
        )}
        <div className="flex flex-col items-center">
          <h1 className="text-sm font-bold tracking-tight">{remoteName}</h1>
          <span className="text-[10px] font-bold text-primary-fixed-dim tracking-[0.2em]">{timer}</span>
        </div>
      </div>
    </header>
  )
}

export function CallSignalBadge({ callStatus, statusText }) {
  return (
    <div className="absolute bottom-28 sm:bottom-10 left-4 sm:left-8 flex items-center gap-3 bg-white/5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl border border-white/10 backdrop-blur-xl z-20">
      <span className="material-symbols-outlined text-green-500 text-[20px]">signal_cellular_alt</span>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-none">
          {callStatus === 'connected' ? 'HD Quality' : 'Kết nối cuộc gọi'}
        </span>
        <span className="text-[9px] font-medium text-white/30 mt-1 max-w-[160px] truncate">{statusText}</span>
      </div>
    </div>
  )
}

export function CallAvatarStage({ remoteName, remoteAvatar, statusText, isRinging, isConnected }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6 pointer-events-none">
      <div className="relative mb-6">
        {isRinging && (
          <>
            <div className="absolute inset-[-20px] border border-primary/20 rounded-full animate-ping opacity-20" />
            <div className="absolute inset-[-36px] border border-primary/10 rounded-full animate-ping opacity-10" style={{ animationDelay: '300ms' }} />
          </>
        )}
        <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full p-1 bg-gradient-to-tr from-primary to-secondary shadow-2xl shadow-primary/30">
          <img
            src={remoteAvatar}
            className="w-full h-full rounded-full object-cover border-4 border-[#1e1e2e]"
            alt={remoteName}
          />
        </div>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">{remoteName}</h2>
      <p className="text-white/50 text-sm mt-2 text-center">{statusText}</p>
      {isConnected && (
        <div className="flex items-center gap-1.5 h-12 mt-8 justify-center">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-primary/60 animate-pulse"
              style={{ height: `${20 + (i % 4) * 12}%`, animationDelay: `${i * 0.08}s` }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CallControls({
  isMicOn,
  isCamOn,
  showCamera = true,
  showScreenShare = true,
  onToggleMic,
  onToggleCam,
  onEndCall,
}) {
  return (
    <div className="absolute bottom-6 sm:bottom-10 left-0 w-full flex justify-center z-40 px-4 sm:px-6">
      <div className="bg-white/10 backdrop-blur-3xl rounded-[32px] p-3 sm:p-4 flex items-center gap-3 sm:gap-4 border border-white/10 shadow-2xl">
        <button
          type="button"
          onClick={onToggleMic}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all ${isMicOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600'}`}
          aria-label={isMicOn ? 'Tắt mic' : 'Bật mic'}
        >
          <span className="material-symbols-outlined">{isMicOn ? 'mic' : 'mic_off'}</span>
        </button>

        {showCamera && (
          <button
            type="button"
            onClick={onToggleCam}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all ${isCamOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600'}`}
            aria-label={isCamOn ? 'Tắt camera' : 'Bật camera'}
          >
            <span className="material-symbols-outlined">{isCamOn ? 'videocam' : 'videocam_off'}</span>
          </button>
        )}

        {showScreenShare && (
          <button
            type="button"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white text-primary flex items-center justify-center hover:bg-white/90 transition-all shadow-lg hidden sm:flex"
            aria-label="Chia sẻ màn hình"
          >
            <span className="material-symbols-outlined">screen_share</span>
          </button>
        )}

        <div className="w-px h-10 bg-white/10 mx-1 hidden sm:block" />

        <button
          type="button"
          onClick={onEndCall}
          className="h-12 sm:h-14 px-6 sm:px-10 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center gap-2 sm:gap-3 transition-all shadow-xl shadow-red-500/20 active:scale-95"
        >
          <span className="material-symbols-outlined">call_end</span>
          <span className="hidden sm:inline">Kết thúc</span>
        </button>
      </div>
    </div>
  )
}

export function CallBackgroundGlow() {
  return (
    <>
      <div className="absolute top-[-15%] left-[-10%] w-[400px] h-[400px] bg-primary/15 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] bg-secondary/15 rounded-full blur-[120px] animate-pulse pointer-events-none" />
    </>
  )
}

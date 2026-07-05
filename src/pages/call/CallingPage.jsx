import React, { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { loadCallSession } from '../../utils/callSession'
import {
  CallAvatarStage,
  CallBackgroundGlow,
  CallControls,
  CallSignalBadge,
  CallTopBar,
} from '../../components/call/CallUi'

export default function CallingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const callIntent = useMemo(() => location.state || loadCallSession(), [location.state])

  const isAudioCall = (callIntent?.type || 'VIDEO') === 'AUDIO'
  const remoteName = callIntent?.receiverName || 'Người nhận'
  const remoteAvatar = callIntent?.receiverAvatar
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(remoteName)}`
  const callTypeLabel = isAudioCall ? 'Cuộc gọi thoại' : 'Cuộc gọi video'

  return (
    <div className="bg-[#0f0f13] h-screen w-screen overflow-hidden text-white font-sans relative">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1e1e2e] to-[#0f0f13]">
        <CallBackgroundGlow />
      </div>

      <CallTopBar
        remoteName={remoteName}
        timer="00:00"
        statusLabel={callTypeLabel}
        isConnected={false}
      />

      <CallAvatarStage
        remoteName={remoteName}
        remoteAvatar={remoteAvatar}
        statusText="Đang gọi..."
        isRinging
        isConnected={false}
      />

      <CallSignalBadge callStatus="ringing" statusText="Đang đổ chuông..." />

      <CallControls
        isMicOn
        isCamOn={!isAudioCall}
        showCamera={!isAudioCall}
        showScreenShare={!isAudioCall}
        onToggleMic={() => {}}
        onToggleCam={() => {}}
        onEndCall={() => navigate(-1)}
      />
    </div>
  )
}

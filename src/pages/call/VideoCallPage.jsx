import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function VideoCallPage() {
  const navigate = useNavigate();
  const [timer, setTimer] = useState(0);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#0f0f13] h-screen w-screen overflow-hidden text-white font-sans relative">
      {/* Remote Video (Background) */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://i.pravatar.cc/800?u=tu" 
          className="w-full h-full object-cover opacity-80" 
          alt="Remote User" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
      </div>

      {/* Top Header */}
      <header className="absolute top-0 left-0 w-full pt-12 flex flex-col items-center z-20">
        <div className="bg-white/10 backdrop-blur-2xl px-6 py-2.5 rounded-full border border-white/10 flex items-center gap-4 shadow-2xl">
          <div className="flex flex-col items-center">
             <h1 className="text-sm font-bold tracking-tight">Nguyễn Minh Tú</h1>
             <span className="text-[10px] font-bold text-primary-fixed-dim tracking-[0.2em]">{formatTime(timer)}</span>
          </div>
        </div>
      </header>

      {/* Picture in Picture (Self View) */}
      <div className="absolute bottom-32 right-8 z-30 w-48 aspect-[4/3] rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl group transition-transform hover:scale-105">
        {isCamOn ? (
           <img 
             src="https://i.pravatar.cc/400?u=me" 
             className="w-full h-full object-cover" 
             alt="Self View" 
           />
        ) : (
          <div className="w-full h-full bg-[#1e1e2e] flex items-center justify-center">
             <span className="material-symbols-outlined text-4xl text-white/20">videocam_off</span>
          </div>
        )}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/40 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest backdrop-blur-md">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          Bạn
        </div>
      </div>

      {/* Side Toolbar */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20">
         {[
           { icon: 'chat', label: 'Chat' },
           { icon: 'group', label: 'People' },
           { icon: 'settings', label: 'Settings' }
         ].map(item => (
           <button key={item.icon} className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all group relative">
             <span className="material-symbols-outlined text-[22px] text-white/70 group-hover:text-white">{item.icon}</span>
             <span className="absolute right-14 bg-black/80 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{item.label}</span>
           </button>
         ))}
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-10 left-0 w-full flex justify-center z-40 px-6">
        <div className="bg-white/10 backdrop-blur-3xl rounded-[32px] p-4 flex items-center gap-4 border border-white/10 shadow-2xl">
          <button 
            onClick={() => setIsMicOn(!isMicOn)}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isMicOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600'}`}
          >
            <span className="material-symbols-outlined">{isMicOn ? 'mic' : 'mic_off'}</span>
          </button>
          
          <button 
            onClick={() => setIsCamOn(!isCamOn)}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isCamOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600'}`}
          >
            <span className="material-symbols-outlined">{isCamOn ? 'videocam' : 'videocam_off'}</span>
          </button>

          <button className="w-14 h-14 rounded-2xl bg-white text-primary flex items-center justify-center hover:bg-white/90 transition-all shadow-lg">
            <span className="material-symbols-outlined">screen_share</span>
          </button>

          <button className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>

          <div className="w-[1px] h-10 bg-white/10 mx-2"></div>

          <button 
            onClick={() => navigate(-1)}
            className="h-14 px-10 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center gap-3 transition-all shadow-xl shadow-red-500/20 active:scale-95"
          >
            <span className="material-symbols-outlined">call_end</span>
            <span>Kết thúc</span>
          </button>
        </div>
      </div>

      {/* Signal Info */}
      <div className="absolute bottom-10 left-8 flex items-center gap-3 bg-white/5 px-5 py-3 rounded-2xl border border-white/10 backdrop-blur-xl">
        <span className="material-symbols-outlined text-green-500">signal_cellular_alt</span>
        <div className="flex flex-col">
           <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-none">HD Quality</span>
           <span className="text-[9px] font-medium text-white/30 mt-1">LATENCY: 24ms</span>
        </div>
      </div>
    </div>
  );
}

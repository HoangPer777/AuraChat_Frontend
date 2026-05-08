import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function IncomingCallPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-background font-sans text-on-background min-h-screen flex">
      {/* Side Rail (Static) */}
      <aside className="fixed left-0 top-0 h-full w-[80px] flex flex-col items-center py-4 z-50 bg-surface-container-low border-r border-outline-variant shrink-0">
         <div className="text-primary font-bold text-2xl mb-8">AC</div>
      </aside>

      {/* Main Content (Blurred) */}
      <main className="ml-[80px] flex-1 flex flex-col blur-[2px] opacity-40 pointer-events-none">
        <header className="h-16 border-b border-outline-variant px-6 flex items-center">
          <h1 className="text-xl font-bold">Tin nhắn</h1>
        </header>
        <div className="flex-1 bg-surface-bright p-8">
           <div className="max-w-md bg-white p-6 rounded-2xl shadow-sm border border-outline-variant">
              <div className="flex gap-4">
                 <div className="w-12 h-12 bg-surface-container rounded-full"></div>
                 <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-container rounded w-3/4"></div>
                    <div className="h-3 bg-surface-container rounded w-1/2"></div>
                 </div>
              </div>
           </div>
        </div>
      </main>

      {/* Incoming Call Popup */}
      <div className="fixed top-8 right-8 z-[100] w-[320px] animate-in slide-in-from-right-10 fade-in duration-500">
        <div className="bg-[#1e1e2e] p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col items-center border border-white/5">
          {/* Pulsing Avatar */}
          <div className="relative mb-6">
            <div className="absolute inset-[-8px] border-2 border-primary/40 rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-[-12px] border-2 border-primary/20 rounded-full animate-ping delay-150 opacity-10"></div>
            <div className="w-20 h-20 rounded-full border-2 border-white/10 p-1">
              <img 
                src="https://i.pravatar.cc/150?u=duong" 
                className="w-full h-full rounded-full object-cover" 
                alt="Caller"
              />
            </div>
          </div>

          <h3 className="text-white font-bold text-xl mb-1">Lê Thùy Dương</h3>
          <p className="text-white/50 text-xs font-medium tracking-widest uppercase mb-8">Cuộc gọi video đến</p>

          <div className="flex gap-8 items-center justify-center w-full">
            <div className="flex flex-col items-center gap-3">
              <button 
                onClick={() => navigate(-1)}
                className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-red-500/20"
              >
                <span className="material-symbols-outlined text-[28px]">call_end</span>
              </button>
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Từ chối</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <button 
                onClick={() => navigate('/test-ui/video-call')}
                className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-green-500/20"
              >
                <span className="material-symbols-outlined text-[28px]">videocam</span>
              </button>
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Chấp nhận</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

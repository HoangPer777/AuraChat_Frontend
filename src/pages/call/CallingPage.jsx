import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CallingPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#121218] font-sans text-white min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl aspect-video bg-gradient-to-br from-[#1e1e2e] to-[#121218] rounded-[40px] shadow-2xl border border-white/5 flex flex-col items-center justify-between py-16 px-12 relative overflow-hidden">
        {/* Animated Background Glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[150px] animate-pulse delay-1000"></div>

        {/* Status */}
        <div className="flex items-center gap-2 px-5 py-2 bg-white/5 rounded-full border border-white/10 z-10">
          <span className="material-symbols-outlined text-[16px] text-primary-fixed-dim">lock</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Mã hóa đầu cuối</span>
        </div>

        {/* Central Content */}
        <div className="flex flex-col items-center gap-8 z-10">
          <div className="relative">
            <div className="absolute inset-[-20px] border border-primary/20 rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-[-40px] border border-primary/10 rounded-full animate-ping delay-300 opacity-10"></div>
            <div className="w-44 h-44 rounded-full p-1 bg-gradient-to-tr from-primary to-secondary shadow-2xl shadow-primary/40">
              <img 
                src="https://i.pravatar.cc/150?u=chi" 
                className="w-full h-full rounded-full object-cover border-4 border-[#1e1e2e]" 
                alt="Linh Chi" 
              />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-5xl font-bold tracking-tight">Linh Chi</h1>
            <div className="flex items-center justify-center gap-1.5 text-primary-fixed-dim">
              <p className="text-lg font-medium opacity-80">Đang gọi</p>
              <span className="flex gap-1 mb-1">
                <span className="w-1.5 h-1.5 bg-primary-fixed-dim rounded-full animate-bounce delay-0"></span>
                <span className="w-1.5 h-1.5 bg-primary-fixed-dim rounded-full animate-bounce delay-150"></span>
                <span className="w-1.5 h-1.5 bg-primary-fixed-dim rounded-full animate-bounce delay-300"></span>
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-12 w-full z-10">
          <div className="flex gap-10">
            <button className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 transition-all hover:scale-110 active:scale-95">
              <span className="material-symbols-outlined text-[28px]">mic</span>
            </button>
            <button className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 transition-all hover:scale-110 active:scale-95">
              <span className="material-symbols-outlined text-[28px]">videocam</span>
            </button>
            <button className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 transition-all hover:scale-110 active:scale-95">
              <span className="material-symbols-outlined text-[28px]">volume_up</span>
            </button>
          </div>
          
          <button 
            onClick={() => navigate(-1)}
            className="group flex flex-col items-center gap-4 transition-all"
          >
            <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center text-white shadow-2xl shadow-red-500/20 hover:bg-red-600 transition-all hover:scale-110 active:scale-90">
              <span className="material-symbols-outlined text-[36px] rotate-[135deg]">call_end</span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-red-400 opacity-80 group-hover:opacity-100">Hủy cuộc gọi</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="absolute bottom-8 right-10 flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-full border border-white/10">
          <span className="material-symbols-outlined text-green-500 text-[20px]">signal_cellular_alt</span>
          <span className="text-[10px] font-bold text-white/60 tracking-widest uppercase">Chất lượng HD</span>
        </div>
      </div>

      {/* App Branding */}
      <div className="absolute top-8 left-10 flex items-center gap-3 opacity-40">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
           <span className="material-symbols-outlined text-white">chat</span>
        </div>
        <span className="text-xl font-bold tracking-tighter">AuraChat</span>
      </div>
    </div>
  );
}

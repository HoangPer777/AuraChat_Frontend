import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AudioCallPage() {
  const navigate = useNavigate();
  const [timer, setTimer] = useState(0);

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
    <div className="bg-[#121218] font-sans text-white min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] h-[600px] bg-gradient-to-br from-[#1e1e2e] to-[#121218] rounded-[40px] shadow-2xl border border-white/5 flex flex-col items-center justify-between p-10 relative overflow-hidden">
        {/* Animated Background Glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-secondary/20 rounded-full blur-[100px] animate-pulse delay-700"></div>

        {/* Header */}
        <div className="w-full flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-widest text-primary uppercase">AuraChat</span>
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
          </div>
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-all">
            <span className="material-symbols-outlined text-white/50">close</span>
          </button>
        </div>

        {/* Caller Info */}
        <div className="flex flex-col items-center z-10 mt-4">
          <div className="relative mb-8">
            <div className="absolute inset-[-15px] border border-primary/20 rounded-full animate-ping opacity-20"></div>
            <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-primary to-secondary shadow-2xl shadow-primary/20">
              <img 
                src="https://i.pravatar.cc/150?u=chi" 
                className="w-full h-full rounded-full object-cover border-4 border-[#1e1e2e]" 
                alt="Linh Chi" 
              />
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Linh Chi</h2>
          <p className="text-primary-fixed-dim text-sm font-bold tracking-widest mt-2">{formatTime(timer)}</p>
        </div>

        {/* Visualizer */}
        <div className="flex items-center gap-1.5 h-12 w-full justify-center z-10">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
            <div 
              key={i} 
              className="w-1 bg-primary/40 rounded-full animate-bounce" 
              style={{ 
                height: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`
              }}
            ></div>
          ))}
        </div>

        {/* Controls */}
        <div className="w-full bg-white/5 backdrop-blur-2xl rounded-[32px] p-6 flex items-center justify-around z-10 border border-white/10">
          <button className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/10 transition-all active:scale-90 group">
            <span className="material-symbols-outlined text-white/60 group-hover:text-white">mic</span>
          </button>
          <button className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/10 transition-all active:scale-90 group">
            <span className="material-symbols-outlined text-white/60 group-hover:text-white">volume_up</span>
          </button>
          <button 
            onClick={() => navigate(-1)}
            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-xl shadow-red-500/20 hover:scale-110 active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-[32px]">call_end</span>
          </button>
        </div>
      </div>
    </div>
  );
}

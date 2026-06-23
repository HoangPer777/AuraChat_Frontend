import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || "Trần Lê Quốc Khánh");
  const [bio, setBio] = useState("Yêu công nghệ, đam mê sáng tạo nội dung và mong muốn kết nối với mọi người qua những giải pháp kỹ thuật số hiện đại. 🚀");
  const [isEditing, setIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSave = () => {
    // Mock save logic
    setShowToast(true);
    setIsEditing(false);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="bg-background text-on-background font-sans h-screen overflow-hidden flex">
      {/* Background/Backdrop Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Side Rail */}
        <aside className="z-50 flex flex-col justify-between h-screen bg-surface-container-low border-r border-outline-variant w-[80px] items-center py-4 shrink-0">
          <div className="flex flex-col items-center w-full gap-4">
            <button onClick={() => navigate('/chat')} className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">chat</span>
            </button>
            <button onClick={() => navigate('/friends')} className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">group</span>
            </button>
            <button onClick={() => navigate('/notifications')} className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
          <div className="text-primary border-l-4 border-primary w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">account_circle</span>
          </div>
        </aside>

        {/* Content Area (Mocking the background) */}
        <div className="flex-1 bg-surface-bright p-8">
           <h1 className="text-2xl font-bold text-outline opacity-20">AuraChat Content Background</h1>
        </div>
      </div>

      {/* Profile Sidebar Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-white/95 backdrop-blur-xl z-[70] shadow-[-20px_0_40px_rgba(0,0,0,0.05)] border-l border-outline-variant flex flex-col">
        {showToast && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[80] animate-in fade-in zoom-in duration-300">
            <div className="bg-green-600 text-white px-6 py-2.5 rounded-full flex items-center gap-2 shadow-2xl border border-white/20">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span className="text-sm font-bold">Cập nhật hồ sơ thành công!</span>
            </div>
          </div>
        )}

        <header className="px-6 h-16 flex justify-between items-center border-b border-outline-variant sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <h2 className="text-lg font-bold">Hồ sơ của tôi</h2>
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full ring-4 ring-primary/10 overflow-hidden shadow-2xl transition-transform group-hover:scale-[1.02]">
                <img 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                  src={user?.avatar || "https://ui-avatars.com/api/?name=" + (displayName || "User")} 
                />
              </div>
              <button className="absolute bottom-1 right-1 w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              </button>
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Đang hoạt động
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tên hiển thị</label>
              <div className="relative">
                <input 
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setIsEditing(true);
                  }}
                  className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-sm transition-all"
                  placeholder="Nhập tên của bạn"
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary opacity-50">edit</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email</label>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface-variant/70 text-sm">
                <span>{user?.email || "khanh.tranle@aurachat.com"}</span>
                <span className="material-symbols-outlined text-[18px]">lock</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Giới thiệu</label>
                <span className="text-[10px] text-outline">{bio.length}/200</span>
              </div>
              <textarea 
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                  setIsEditing(true);
                }}
                className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm min-h-[120px] resize-none transition-all"
                maxLength="200"
                placeholder="Nhập giới thiệu..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Đăng nhập bằng</label>
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-outline-variant bg-white text-sm font-medium">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
                </svg>
                <span>Google Account</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <button 
              disabled={!isEditing}
              onClick={handleSave}
              className={`w-full py-3.5 rounded-xl font-bold transition-all ${isEditing ? 'bg-primary text-white shadow-lg hover:opacity-90 active:scale-[0.98]' : 'bg-surface-container-highest text-outline cursor-not-allowed'}`}
            >
              Lưu thay đổi
            </button>
            <button className="w-full py-3.5 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary/5 transition-all active:scale-[0.98]">
              Đổi mật khẩu
            </button>
            <button 
              onClick={handleLogout}
              className="w-full py-3.5 rounded-xl bg-error-container text-error font-bold hover:bg-error/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">logout</span>
              Đăng xuất
            </button>
          </div>
          <div className="h-6"></div>
        </div>
      </div>
    </div>
  );
}

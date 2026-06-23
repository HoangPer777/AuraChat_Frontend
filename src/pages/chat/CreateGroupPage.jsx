import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateGroupPage() {
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([
    { id: 1, name: 'Hoàng Nam', avatar: 'https://i.pravatar.cc/150?u=nam' },
    { id: 2, name: 'Thanh Trúc', avatar: 'https://i.pravatar.cc/150?u=truc' }
  ]);

  const toggleMember = (member) => {
    if (selectedMembers.find(m => m.id === member.id)) {
      setSelectedMembers(selectedMembers.filter(m => m.id !== member.id));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  return (
    <div className="flex-1 h-screen bg-surface-bright relative">
      <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Modal Header */}
          <header className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-white sticky top-0 z-10">
            <h2 className="text-xl font-bold">Tạo nhóm mới</h2>
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-container rounded-full transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined">close</span>
            </button>
          </header>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 no-scrollbar">
            {/* Avatar Section */}
            <div className="flex flex-col items-center group">
              <div className="relative w-24 h-24 bg-surface-container rounded-full flex items-center justify-center cursor-pointer hover:bg-surface-variant transition-all ring-4 ring-primary/5">
                <span className="material-symbols-outlined text-primary text-[40px]">groups</span>
                <div className="absolute bottom-0 right-0 bg-primary p-2 rounded-full shadow-lg border-2 border-white text-white">
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                </div>
              </div>
              <span className="mt-3 text-xs font-bold text-primary uppercase tracking-widest">Tải ảnh nhóm</span>
            </div>

            {/* Inputs */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tên nhóm</label>
                <input 
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-sm"
                  placeholder="Nhập tên nhóm..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Thêm thành viên</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-surface-container-low border border-transparent focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all text-sm"
                    placeholder="Tìm bạn bè..."
                  />
                </div>
              </div>
            </div>

            {/* Suggestions */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Gợi ý</h4>
              <div className="space-y-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-2 hover:bg-surface-container-low rounded-xl transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant/30">
                        <img src={`https://i.pravatar.cc/150?u=${i}`} alt="Avatar" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Người dùng {i}</p>
                        <p className="text-[11px] text-outline">user{i}@aura.com</p>
                      </div>
                    </div>
                    <button className="px-4 py-1.5 rounded-full border border-primary text-primary text-[11px] font-bold hover:bg-primary hover:text-white transition-all">Thêm</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Đã chọn ({selectedMembers.length})</h4>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {selectedMembers.map(member => (
                  <div key={member.id} className="flex-shrink-0 flex items-center gap-2 bg-primary/10 pr-2 pl-1 py-1 rounded-full border border-primary/20 animate-in fade-in slide-in-from-left-2">
                    <img src={member.avatar} className="w-8 h-8 rounded-full object-cover" alt={member.name} />
                    <span className="text-[11px] font-bold text-primary truncate max-w-[80px]">{member.name}</span>
                    <button onClick={() => toggleMember(member)} className="flex items-center justify-center text-primary/50 hover:text-error transition-colors">
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <footer className="px-6 py-6 border-t border-outline-variant bg-white space-y-4">
            {selectedMembers.length < 2 && (
              <div className="flex items-center gap-2 text-error animate-pulse">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <p className="text-[11px] font-bold uppercase tracking-wider">Cần thêm ít nhất 2 thành viên</p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3">
              <button 
                disabled={selectedMembers.length < 2}
                className="w-full py-4 rounded-xl text-white font-bold text-sm bg-primary shadow-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Tạo nhóm
              </button>
              <button onClick={() => navigate(-1)} className="w-full py-3 rounded-xl text-primary font-bold text-sm hover:bg-surface-container-low transition-colors">
                Hủy bỏ
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/admin/users'); // Hypothetical admin endpoint
        if (response.data && response.data.success) {
          setUsers(response.data.data);
        } else {
          // Mock data if API is not ready
          setUsers([
            { id: 1, name: 'Nguyễn Văn A', email: 'vana@example.com', status: 'ACTIVE', role: 'ADMIN', createdAt: '12/05/2023' },
            { id: 2, name: 'Trần Thị B', email: 'thib@example.com', status: 'DISABLED', role: 'USER', createdAt: '15/06/2023' },
            { id: 3, name: 'Lê Minh C', email: 'minhc@example.com', status: 'ACTIVE', role: 'USER', createdAt: '20/07/2023' },
          ]);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        // Fallback to mock
        setUsers([
            { id: 1, name: 'Nguyễn Văn A', email: 'vana@example.com', status: 'ACTIVE', role: 'ADMIN', createdAt: '12/05/2023' },
            { id: 2, name: 'Trần Thị B', email: 'thib@example.com', status: 'DISABLED', role: 'USER', createdAt: '15/06/2023' },
            { id: 3, name: 'Lê Minh C', email: 'minhc@example.com', status: 'ACTIVE', role: 'USER', createdAt: '20/07/2023' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-surface-bright text-on-surface min-h-screen flex font-sans">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-[240px] bg-surface-container-low border-r border-outline-variant flex flex-col py-6 px-3 gap-4 z-50">
        <div className="px-4 mb-6">
          <h1 className="text-2xl font-bold text-primary">AuraChat</h1>
          <p className="text-xs text-on-surface-variant font-medium">Quản trị viên</p>
        </div>
        <nav className="flex-1 space-y-1">
          <button onClick={() => navigate('/test-ui/admin-dashboard')} className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all rounded-lg text-left">
            <span className="material-symbols-outlined">dashboard</span>
            <span>Tổng quan</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-primary-container text-on-primary-container rounded-lg font-bold transition-all text-left">
            <span className="material-symbols-outlined">group</span>
            <span>Quản lý người dùng</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all rounded-lg text-left">
            <span className="material-symbols-outlined">monitoring</span>
            <span>Thống kê</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all rounded-lg text-left">
            <span className="material-symbols-outlined">settings</span>
            <span>Cài đặt</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-[240px] flex-1">
        <header className="h-16 px-8 flex justify-between items-center bg-surface/80 backdrop-blur-md border-b border-outline-variant sticky top-0 z-40">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <span>Hệ thống</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-primary font-bold">Quản lý người dùng</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">notifications</button>
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">account_circle</button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold text-on-surface">Danh sách người dùng</h2>
              <p className="text-sm text-on-surface-variant">Tổng số: {users.length} người dùng</p>
            </div>
            <button className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:opacity-90 transition-all">
              <span className="material-symbols-outlined">person_add</span>
              Thêm người dùng
            </button>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant flex flex-wrap gap-4 items-center mb-6">
            <div className="relative flex-1 min-w-[300px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input 
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-sm" 
                placeholder="Tìm theo tên, email..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex bg-surface-container p-1 rounded-xl">
              <button className="px-4 py-1.5 rounded-lg bg-white text-primary font-bold shadow-sm text-xs">Tất cả</button>
              <button className="px-4 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface text-xs">Hoạt động</button>
              <button className="px-4 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface text-xs">Bị khóa</button>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-6 py-4 font-bold text-on-surface-variant text-xs uppercase">Người dùng</th>
                  <th className="px-6 py-4 font-bold text-on-surface-variant text-xs uppercase">Email</th>
                  <th className="px-6 py-4 font-bold text-on-surface-variant text-xs uppercase">Trạng thái</th>
                  <th className="px-6 py-4 font-bold text-on-surface-variant text-xs uppercase">Vai trò</th>
                  <th className="px-6 py-4 font-bold text-on-surface-variant text-xs uppercase text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-sm">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">person</span>
                      </div>
                      <span className="font-bold">{user.name}</span>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                        {user.status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-surface-container text-on-surface-variant rounded-lg text-[10px] font-bold">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-surface-container rounded-full transition-colors">
                        <span className="material-symbols-outlined text-outline">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex justify-between items-center text-xs">
              <span className="text-on-surface-variant">Hiển thị {filteredUsers.length} người dùng</span>
              <div className="flex gap-2">
                <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-outline hover:bg-white transition-all">
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white font-bold">1</button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-outline hover:bg-white transition-all">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

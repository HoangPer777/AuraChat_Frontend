import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    onlineUsers: 1248,
    newUsers: 85,
    messagesToday: '45.2k',
    dau: 8420
  });

  // Mock fetching stats - in real app would use api.get('/api/admin/stats')
  useEffect(() => {
    // Logic to fetch stats if endpoint exists
  }, []);

  return (
    <div className="bg-surface-bright text-on-surface min-h-screen flex font-sans">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-[240px] bg-surface-container-low border-r border-outline-variant flex flex-col py-6 px-3 gap-4 z-50">
        <div className="px-4 mb-6">
          <h1 className="text-2xl font-bold text-primary">AuraChat</h1>
          <p className="text-xs text-on-surface-variant font-medium">Quản trị viên</p>
        </div>
        <nav className="flex-1 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-secondary-container text-on-secondary-container rounded-lg font-bold transition-all text-left">
            <span className="material-symbols-outlined">dashboard</span>
            <span>Tổng quan</span>
          </button>
          <button onClick={() => navigate('/test-ui/admin-users')} className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all rounded-lg text-left">
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
        <div className="mt-auto px-4 py-4 flex items-center gap-3 border-t border-outline-variant">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white">
            <span className="material-symbols-outlined">person</span>
          </div>
          <div className="overflow-hidden text-sm">
            <p className="font-bold truncate">Admin User</p>
            <p className="text-xs text-on-surface-variant">Trực tuyến</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-[240px] flex-1">
        <header className="h-16 px-8 flex justify-between items-center bg-surface/80 backdrop-blur-md border-b border-outline-variant sticky top-0 z-40">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <span>Hệ thống</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-primary font-bold">Tổng quan</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">notifications</button>
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">help_outline</button>
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">account_circle</button>
          </div>
        </header>

        <div className="p-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold text-on-surface">Thống kê hệ thống</h2>
              <p className="text-sm text-on-surface-variant">Cập nhật lần cuối: {new Date().toLocaleTimeString()}</p>
            </div>
            <div className="flex items-center bg-surface-container-low p-1 rounded-lg border border-outline-variant">
              <button className="px-4 py-1.5 text-xs font-medium rounded-md bg-white text-primary shadow-sm">Hôm nay</button>
              <button className="px-4 py-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors">7 ngày</button>
              <button className="px-4 py-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors">30 ngày</button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Người dùng online</span>
                <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">person</span>
                </div>
              </div>
              <span className="text-3xl font-bold text-primary">{stats.onlineUsers}</span>
              <div className="flex items-center gap-1 text-[13px] font-medium text-green-600">
                <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                <span>+12%</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Người dùng mới</span>
                <div className="w-10 h-10 rounded-full bg-secondary-container/10 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined">person_add</span>
                </div>
              </div>
              <span className="text-3xl font-bold text-on-surface">{stats.newUsers}</span>
              <div className="flex items-center gap-1 text-[13px] font-medium text-green-600">
                <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                <span>+5.4%</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Tin nhắn hôm nay</span>
                <div className="w-10 h-10 rounded-full bg-tertiary-container/10 flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined">chat</span>
                </div>
              </div>
              <span className="text-3xl font-bold text-on-surface">{stats.messagesToday}</span>
              <div className="flex items-center gap-1 text-[13px] font-medium text-error">
                <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                <span>-2.1%</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Hoạt động (DAU)</span>
                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">monitoring</span>
                </div>
              </div>
              <span className="text-3xl font-bold text-on-surface">{stats.dau}</span>
              <div className="text-[12px] text-on-surface-variant mt-1">Mục tiêu: 10,000</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Top người dùng tích cực</h3>
                <button className="text-primary text-sm font-bold hover:underline">Xem thêm</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs text-on-surface-variant uppercase border-b border-outline-variant/30">
                      <th className="pb-4">Người dùng</th>
                      <th className="pb-4">Vai trò</th>
                      <th className="pb-4">Tin nhắn</th>
                      <th className="pb-4 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10 text-sm">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-4 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-surface-container-high"></div>
                          <div>
                            <p className="font-bold">Người dùng {i}</p>
                            <p className="text-xs text-on-surface-variant">user{i}@aura.vn</p>
                          </div>
                        </td>
                        <td className="py-4">Premium</td>
                        <td className="py-4 font-bold">1,20{i}</td>
                        <td className="py-4 text-right">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">Trực tuyến</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
              <h3 className="font-bold text-lg mb-6">Loại đăng nhập</h3>
              <div className="flex flex-col items-center gap-6">
                <div className="w-32 h-32 rounded-full border-[12px] border-primary flex items-center justify-center">
                  <span className="text-xl font-bold">60%</span>
                </div>
                <div className="w-full space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-primary"></span>Hệ thống</div>
                    <span className="font-bold">60%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-secondary"></span>Google</div>
                    <span className="font-bold">25%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-secondary-fixed-dim"></span>Khác</div>
                    <span className="font-bold">15%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

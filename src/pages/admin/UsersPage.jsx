import { useCallback, useEffect, useState } from 'react'
import useAuthStore from '../../store/authStore'
import { activateUser, deactivateUser, getAdminUsers, terminateUser, updateAdminUser } from '../../services/adminService'
import Modal from '../../components/modals/Modal'
import ConfirmModal from '../../components/modals/ConfirmModal'
import Toast from '../../components/notifications/Toast'

const statusLabel = { ACTIVE: 'Hoạt động', DEACTIVATED: 'Vô hiệu hóa', TERMINATED: 'Chấm dứt' }

export default function UsersPage() {
  const currentUser = useAuthStore((state) => state.user)
  const [result, setResult] = useState({ content: [], totalElements: 0, totalPages: 0 })
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({ displayName: '', role: 'USER', bio: '' })
  const [confirm, setConfirm] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => { setPage(0); setQuery(searchInput.trim()) }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  const loadUsers = useCallback(async () => {
    setLoading(true); setError('')
    try {
      setResult(await getAdminUsers({ page, size: 10, q: query || undefined, status: status || undefined }))
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách người dùng.')
    } finally { setLoading(false) }
  }, [page, query, status])

  useEffect(() => { loadUsers() }, [loadUsers])

  const openEdit = (user) => {
    setEditing(user)
    setEditForm({ displayName: user.displayName || '', role: user.role || 'USER', bio: user.bio || '' })
  }

  const saveEdit = async (event) => {
    event.preventDefault(); setSubmitting(true)
    try {
      await updateAdminUser(editing.id, editForm)
      setEditing(null); setToast({ type: 'success', message: 'Đã cập nhật người dùng.' }); await loadUsers()
    } catch (err) { setToast({ type: 'error', message: err.response?.data?.message || 'Cập nhật thất bại.' }) }
    finally { setSubmitting(false) }
  }

  const executeAction = async () => {
    if (!confirm) return
    setSubmitting(true)
    try {
      const handlers = { activate: activateUser, deactivate: deactivateUser, terminate: terminateUser }
      await handlers[confirm.type](confirm.user.id)
      setConfirm(null); setToast({ type: 'success', message: 'Đã cập nhật trạng thái tài khoản.' }); await loadUsers()
    } catch (err) { setToast({ type: 'error', message: err.response?.data?.message || 'Thao tác thất bại.' }) }
    finally { setSubmitting(false) }
  }

  return (
    <>
      <header className="h-16 px-8 flex items-center bg-surface/80 border-b border-outline-variant sticky top-0 z-30">
        <div className="flex items-center gap-2 text-sm text-on-surface-variant"><span>Hệ thống</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-primary font-bold">Quản lý người dùng</span></div>
      </header>
      {toast && <div className="fixed top-20 right-6 z-[70] w-80"><Toast {...toast} onDismiss={() => setToast(null)} /></div>}
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8"><h2 className="text-2xl font-bold">Danh sách người dùng</h2><p className="text-sm text-on-surface-variant">Tổng số: {result.totalElements} người dùng</p></div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant flex flex-wrap gap-4 items-center mb-6">
          <div className="relative flex-1 min-w-[280px]"><span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span><input className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm" placeholder="Tìm theo tên, email..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} /></div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }} className="px-4 py-2.5 bg-surface-container-low rounded-xl text-sm border-none">
            <option value="">Tất cả trạng thái</option><option value="ACTIVE">Hoạt động</option><option value="DEACTIVATED">Vô hiệu hóa</option><option value="TERMINATED">Chấm dứt</option>
          </select>
        </div>
        {error && <div className="mb-5 p-4 bg-red-50 text-red-700 rounded-xl flex justify-between"><span>{error}</span><button onClick={loadUsers} className="font-bold">Thử lại</button></div>}
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead><tr className="bg-surface-container-low border-b border-outline-variant text-xs uppercase text-on-surface-variant"><th className="px-6 py-4">Người dùng</th><th className="px-6 py-4">Trạng thái</th><th className="px-6 py-4">Vai trò</th><th className="px-6 py-4">Cảnh báo</th><th className="px-6 py-4">Ngày tạo</th><th className="px-6 py-4 text-right">Hành động</th></tr></thead>
            <tbody className="divide-y divide-outline-variant/10 text-sm">
              {loading ? <tr><td colSpan="6" className="p-10 text-center">Đang tải...</td></tr> : result.content.length === 0 ? <tr><td colSpan="6" className="p-10 text-center text-on-surface-variant">Không tìm thấy người dùng.</td></tr> : result.content.map((user) => {
                const isSelf = user.id === currentUser?.id
                return <tr key={user.id} className="hover:bg-surface-container-low/50">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary">{user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover rounded-full" alt="" /> : <span className="material-symbols-outlined">person</span>}</div><div><p className="font-bold">{user.displayName || 'Chưa đặt tên'} {isSelf && '(Bạn)'}</p><p className="text-xs text-on-surface-variant">{user.email}</p></div></div></td>
                  <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-[10px] font-bold ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : user.status === 'TERMINATED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{statusLabel[user.status] || user.status}</span></td>
                  <td className="px-6 py-4 font-bold">{user.role}</td>
                  <td className="px-6 py-4">{user.warningCount > 0 ? <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">{user.warningCount}</span> : <span className="text-on-surface-variant">0</span>}</td>
                  <td className="px-6 py-4 text-on-surface-variant">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}</td>
                  <td className="px-6 py-4"><div className="flex justify-end gap-2"><button onClick={() => openEdit(user)} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-bold">Sửa</button>{user.status === 'ACTIVE' && !isSelf && <button onClick={() => setConfirm({ type: 'deactivate', user })} className="px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-700">Khóa</button>}{user.status === 'DEACTIVATED' && <button onClick={() => setConfirm({ type: 'activate', user })} className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700">Mở</button>}{user.status !== 'TERMINATED' && !isSelf && <button onClick={() => setConfirm({ type: 'terminate', user })} className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700">Chấm dứt</button>}</div></td>
                </tr>
              })}
            </tbody>
          </table>
          <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex justify-between text-xs"><span>Trang {result.totalPages ? page + 1 : 0}/{result.totalPages}</span><div className="flex gap-2"><button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 border rounded disabled:opacity-40">Trước</button><button disabled={page + 1 >= result.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border rounded disabled:opacity-40">Sau</button></div></div>
        </div>
      </div>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Chỉnh sửa người dùng">
        <form onSubmit={saveEdit} className="space-y-4"><label className="block text-sm font-bold">Tên hiển thị<input required maxLength="100" className="mt-1 w-full border rounded-lg px-3 py-2 font-normal" value={editForm.displayName} onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })} /></label><label className="block text-sm font-bold">Vai trò<select disabled={editing?.id === currentUser?.id} className="mt-1 w-full border rounded-lg px-3 py-2 font-normal" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}><option>USER</option><option>ADMIN</option></select></label><label className="block text-sm font-bold">Giới thiệu<textarea maxLength="500" rows="3" className="mt-1 w-full border rounded-lg px-3 py-2 font-normal" value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} /></label><div className="flex justify-end gap-3"><button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border rounded-lg">Hủy</button><button disabled={submitting} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">Lưu</button></div></form>
      </Modal>
      <ConfirmModal isOpen={!!confirm} onClose={() => setConfirm(null)} title="Xác nhận thao tác" message={`${confirm?.type === 'terminate' ? 'Chấm dứt vĩnh viễn' : confirm?.type === 'activate' ? 'Kích hoạt lại' : 'Vô hiệu hóa'} tài khoản ${confirm?.user?.displayName || ''}?`} confirmText="Xác nhận" confirmVariant={confirm?.type === 'activate' ? 'primary' : 'danger'} loading={submitting} onConfirm={executeAction} />
    </>
  )
}

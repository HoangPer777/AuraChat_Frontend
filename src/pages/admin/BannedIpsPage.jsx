import { useCallback, useEffect, useState } from 'react'
import { banIp, getBannedIps, unbanIp } from '../../services/adminService'
import Modal from '../../components/modals/Modal'
import ConfirmModal from '../../components/modals/ConfirmModal'
import Toast from '../../components/notifications/Toast'

export default function BannedIpsPage() {
  const [result, setResult] = useState({ content: [], totalElements: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ipAddress: '', reason: '' })
  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  const loadIps = useCallback(async () => {
    setLoading(true); setError('')
    try { setResult(await getBannedIps({ page: 0, size: 100 })) }
    catch (err) { setError(err.response?.data?.message || 'Không thể tải danh sách IP.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { loadIps() }, [loadIps])

  const submitBan = async (event) => {
    event.preventDefault(); setSubmitting(true)
    try { await banIp(form); setShowForm(false); setForm({ ipAddress: '', reason: '' }); setToast({ type: 'success', message: 'Đã chặn IP.' }); await loadIps() }
    catch (err) { setToast({ type: 'error', message: err.response?.data?.message || 'Không thể chặn IP.' }) }
    finally { setSubmitting(false) }
  }
  const submitUnban = async () => {
    setSubmitting(true)
    try { await unbanIp(selected.ipAddress); setSelected(null); setToast({ type: 'success', message: 'Đã bỏ chặn IP.' }); await loadIps() }
    catch (err) { setToast({ type: 'error', message: err.response?.data?.message || 'Không thể bỏ chặn IP.' }) }
    finally { setSubmitting(false) }
  }

  return <>
    <header className="h-16 px-8 flex items-center bg-surface/80 border-b border-outline-variant sticky top-0 z-30"><div className="flex items-center gap-2 text-sm text-on-surface-variant"><span>Hệ thống</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-primary font-bold">IP bị chặn</span></div></header>
    {toast && <div className="fixed top-20 right-6 z-[70] w-80"><Toast {...toast} onDismiss={() => setToast(null)} /></div>}
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between mb-8"><div><h2 className="text-2xl font-bold">Danh sách IP bị chặn</h2><p className="text-sm text-on-surface-variant">Tổng số: {result.totalElements}</p></div><button onClick={() => setShowForm(true)} className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold">Ban IP</button></div>
      {error && <div className="mb-5 p-4 bg-red-50 text-red-700 rounded-xl flex justify-between"><span>{error}</span><button onClick={loadIps} className="font-bold">Thử lại</button></div>}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden"><table className="w-full text-left"><thead><tr className="bg-surface-container-low text-xs uppercase text-on-surface-variant"><th className="px-6 py-4">IP</th><th className="px-6 py-4">Lý do</th><th className="px-6 py-4">Người ban</th><th className="px-6 py-4">Thời gian</th><th className="px-6 py-4 text-right">Hành động</th></tr></thead><tbody className="divide-y">{loading ? <tr><td colSpan="5" className="p-10 text-center">Đang tải...</td></tr> : result.content.length === 0 ? <tr><td colSpan="5" className="p-10 text-center text-on-surface-variant">Chưa có IP nào bị chặn.</td></tr> : result.content.map((item) => <tr key={item.id}><td className="px-6 py-4 font-mono font-bold">{item.ipAddress}</td><td className="px-6 py-4">{item.reason}</td><td className="px-6 py-4 text-on-surface-variant">{item.bannedBy}</td><td className="px-6 py-4 text-on-surface-variant">{new Date(item.createdAt).toLocaleString('vi-VN')}</td><td className="px-6 py-4 text-right"><button onClick={() => setSelected(item)} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg">Bỏ chặn</button></td></tr>)}</tbody></table></div>
    </div>
    <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Ban địa chỉ IP"><form onSubmit={submitBan} className="space-y-4"><label className="block text-sm font-bold">Địa chỉ IP<input required maxLength="45" placeholder="192.168.1.10" className="mt-1 w-full border rounded-lg px-3 py-2 font-mono font-normal" value={form.ipAddress} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })} /></label><label className="block text-sm font-bold">Lý do<textarea required maxLength="500" rows="3" className="mt-1 w-full border rounded-lg px-3 py-2 font-normal" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></label><div className="flex justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Hủy</button><button disabled={submitting} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">Ban IP</button></div></form></Modal>
    <ConfirmModal isOpen={!!selected} onClose={() => setSelected(null)} title="Bỏ chặn IP" message={`Cho phép IP ${selected?.ipAddress || ''} truy cập lại?`} confirmText="Bỏ chặn" loading={submitting} onConfirm={submitUnban} />
  </>
}

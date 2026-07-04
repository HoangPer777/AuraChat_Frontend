import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import PasswordInput from '../../components/forms/PasswordInput';
import UserPostsSection from '../../components/post/UserPostsSection';

function getProviderLabel(provider) {
  if (provider === 'GOOGLE') return 'Google Account';
  if (provider === 'FACEBOOK') return 'Facebook Account';
  return 'Email & mật khẩu';
}

function isLocalAccount(provider) {
  return !provider || provider === 'LOCAL';
}

function ChangePasswordModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setErrors({});
      setApiError('');
    }
  }, [open]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.currentPassword) nextErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    if (!form.newPassword) nextErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
    else if (form.newPassword.length < 8) nextErrors.newPassword = 'Mật khẩu mới phải có ít nhất 8 ký tự';
    if (!form.confirmPassword) nextErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
    else if (form.newPassword !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');
    try {
      await api.patch('/auth/me/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      setApiError(error.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-outline-variant overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
      >
        <header className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <h3 id="change-password-title" className="text-lg font-bold text-on-surface">
            Đổi mật khẩu
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-1">
          {apiError && (
            <div className="mb-4 rounded-xl border border-error/30 bg-error-container/30 px-4 py-3 text-sm text-error">
              {apiError}
            </div>
          )}

          <PasswordInput
            label="Mật khẩu hiện tại"
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
            error={errors.currentPassword}
            autoComplete="current-password"
            required
            className="[&_label]:text-xs [&_label]:font-bold [&_label]:uppercase [&_label]:tracking-wider [&_label]:text-on-surface-variant [&_input]:rounded-xl [&_input]:border-outline-variant [&_input]:py-3"
          />
          <PasswordInput
            label="Mật khẩu mới"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            error={errors.newPassword}
            autoComplete="new-password"
            required
            className="[&_label]:text-xs [&_label]:font-bold [&_label]:uppercase [&_label]:tracking-wider [&_label]:text-on-surface-variant [&_input]:rounded-xl [&_input]:border-outline-variant [&_input]:py-3"
          />
          <PasswordInput
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            autoComplete="new-password"
            required
            className="[&_label]:text-xs [&_label]:font-bold [&_label]:uppercase [&_label]:tracking-wider [&_label]:text-on-surface-variant [&_input]:rounded-xl [&_input]:border-outline-variant [&_input]:py-3"
          />

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-outline-variant font-bold text-sm text-on-surface-variant hover:bg-surface-container-low"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting ? 'Đang lưu...' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user, setUser, logout } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [provider, setProvider] = useState('LOCAL');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/auth/me');
        const profile = response.data?.data || response.data;
        setUser(profile);
        setDisplayName(profile.displayName || '');
        setBio(profile.bio || '');
        setAvatarUrl(profile.avatarUrl || profile.avatar || '');
        setProvider(profile.provider || 'LOCAL');
      } catch {
        setToast({ type: 'error', message: 'Không thể tải hồ sơ. Vui lòng thử lại.' });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [setUser]);

  const showSuccessToast = (message) => {
    setToast({ type: 'success', message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await api.patch('/auth/me', { displayName, bio });
      const profile = response.data?.data || response.data;
      setUser(profile);
      setProvider(profile.provider || provider);
      setIsEditing(false);
      showSuccessToast('Cập nhật hồ sơ thành công!');
    } catch (error) {
      setToast({
        type: 'error',
        message: error.response?.data?.message || 'Cập nhật hồ sơ thất bại.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/auth/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = response.data?.data || response.data;
      setAvatarUrl(url);
      setUser({ ...user, avatarUrl: url });
      showSuccessToast('Cập nhật ảnh đại diện thành công!');
    } catch (error) {
      setToast({
        type: 'error',
        message: error.response?.data?.message || 'Tải ảnh đại diện thất bại.',
      });
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      logout();
      navigate('/login');
    }
  };

  const avatarSrc =
    avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'User')}`;

  return (
    <div className="bg-surface-bright text-on-surface h-full min-h-0 overflow-hidden flex flex-col">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[90] animate-in fade-in zoom-in duration-300">
          <div
            className={`px-6 py-2.5 rounded-full flex items-center gap-2 shadow-2xl border border-white/20 text-sm font-bold ${
              toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-error text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {toast.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {toast.message}
          </div>
        </div>
      )}

      <main className="flex-1 min-h-0 overflow-y-auto px-4 py-8 sm:px-8">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 text-on-surface-variant">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm">Đang tải hồ sơ...</p>
          </div>
        ) : (
          <div className="w-full max-w-2xl mx-auto space-y-8">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-outline-variant/40 shadow-sm overflow-hidden">
              <header className="px-6 py-5 border-b border-outline-variant/50 text-center">
                <h1 className="text-2xl font-bold">Hồ sơ của tôi</h1>
                <p className="text-sm text-on-surface-variant mt-1">
                  Quản lý thông tin cá nhân và bảo mật tài khoản
                </p>
              </header>

              <div className="p-6 space-y-8">
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <div className="w-28 h-28 rounded-full ring-4 ring-primary/10 overflow-hidden shadow-xl">
                      <img
                        alt="Avatar"
                        className="w-full h-full object-cover"
                        src={avatarSrc}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute bottom-1 right-1 w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 active:scale-95 transition-all disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isUploadingAvatar ? 'progress_activity' : 'photo_camera'}
                      </span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[11px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Đang hoạt động
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Tên hiển thị
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        setIsEditing(true);
                      }}
                      className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-sm"
                      placeholder="Nhập tên của bạn"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Email
                    </label>
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface-variant/80 text-sm">
                      <span>{user?.email || '—'}</span>
                      <span className="material-symbols-outlined text-[18px]">lock</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                        Giới thiệu
                      </label>
                      <span className="text-[10px] text-outline">{bio.length}/200</span>
                    </div>
                    <textarea
                      value={bio}
                      onChange={(e) => {
                        setBio(e.target.value);
                        setIsEditing(true);
                      }}
                      className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm min-h-[120px] resize-none"
                      maxLength={200}
                      placeholder="Nhập giới thiệu..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Đăng nhập bằng
                    </label>
                    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-outline-variant bg-white text-sm font-medium">
                      {provider === 'GOOGLE' && (
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                      )}
                      {provider === 'FACEBOOK' && (
                        <span className="material-symbols-outlined text-[#1877F2]">facebook</span>
                      )}
                      {isLocalAccount(provider) && (
                        <span className="material-symbols-outlined text-primary">mail</span>
                      )}
                      <span>{getProviderLabel(provider)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    disabled={!isEditing || isSaving}
                    onClick={handleSave}
                    className={`w-full py-3.5 rounded-xl font-bold transition-all ${
                      isEditing && !isSaving
                        ? 'bg-primary text-white shadow-lg hover:opacity-90 active:scale-[0.98]'
                        : 'bg-surface-container-highest text-outline cursor-not-allowed'
                    }`}
                  >
                    {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>

                  {isLocalAccount(provider) ? (
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(true)}
                      className="w-full py-3.5 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary/5 transition-all active:scale-[0.98]"
                    >
                      Đổi mật khẩu
                    </button>
                  ) : (
                    <p className="text-xs text-center text-on-surface-variant px-2">
                      Tài khoản {getProviderLabel(provider)} không hỗ trợ đổi mật khẩu tại đây.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-3.5 rounded-xl bg-error-container text-error font-bold hover:bg-error/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">logout</span>
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>

            <UserPostsSection userId={user?.id} title="Bài đăng của tôi" />
          </div>
        )}
      </main>

      <ChangePasswordModal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => showSuccessToast('Đổi mật khẩu thành công!')}
      />
    </div>
  );
}

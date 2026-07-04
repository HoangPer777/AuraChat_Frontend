import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../services/api';

const FORGOT_EMAIL_KEY = 'forgotPasswordEmail';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userEmail, setUserEmail] = useState('');
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register: registerStep1, handleSubmit: handleSubmitStep1, formState: { errors: errorsStep1 } } = useForm();
  const { register: registerStep3, handleSubmit: handleSubmitStep3, watch, formState: { errors: errorsStep3 } } = useForm();
  const newPassword = watch('newPassword');

  useEffect(() => {
    const savedEmail = sessionStorage.getItem(FORGOT_EMAIL_KEY);
    if (!savedEmail) return;

    setUserEmail(savedEmail);
    api.get('/auth/forgot-password/status', { params: { email: savedEmail } })
      .then((response) => {
        const payload = response.data?.data ?? response.data;
        if (payload?.verified) {
          setStep(3);
          setApiSuccess('Email đã được xác thực. Vui lòng nhập mật khẩu mới.');
        } else {
          setStep(2);
        }
      })
      .catch(() => setStep(2));
  }, []);

  const onSubmitStep1 = async (data) => {
    setApiError(null);
    setApiSuccess(null);
    setIsLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: data.email });
      const payload = response.data?.data ?? response.data;

      if (payload?.status === 'OAUTH') {
        setApiError(payload.message);
        return;
      }

      setUserEmail(data.email);
      sessionStorage.setItem(FORGOT_EMAIL_KEY, data.email);
      setStep(2);
      setApiSuccess(payload?.message || 'Chúng tôi đã gửi liên kết xác thực đến email của bạn.');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckVerified = async () => {
    setApiError(null);
    setApiSuccess(null);
    setIsLoading(true);
    try {
      const response = await api.get('/auth/forgot-password/status', {
        params: { email: userEmail }
      });
      const payload = response.data?.data ?? response.data;

      if (payload?.verified) {
        setStep(3);
        setApiSuccess('Email đã được xác thực. Vui lòng nhập mật khẩu mới.');
      } else {
        setApiError('Email chưa được xác thực. Vui lòng kiểm tra hộp thư và nhấn vào liên kết xác nhận.');
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Không thể kiểm tra trạng thái xác thực.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitStep3 = async (data) => {
    setApiError(null);
    setApiSuccess(null);
    setIsLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        email: userEmail,
        newPassword: data.newPassword
      });

      if (response.data?.success !== false) {
        sessionStorage.removeItem(FORGOT_EMAIL_KEY);
        setApiSuccess('Đổi mật khẩu thành công. Đang chuyển hướng...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setApiError(response.data.message || 'Đổi mật khẩu thất bại.');
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const stepTitle = step === 1 ? 'Quên mật khẩu?' : step === 2 ? 'Xác thực email' : 'Đặt lại mật khẩu';
  const stepDescription = step === 1
    ? 'Nhập email của bạn. Nếu tài khoản đăng nhập bằng email/mật khẩu, chúng tôi sẽ gửi liên kết xác thực.'
    : step === 2
      ? `Vui lòng mở email ${userEmail}, nhấn vào liên kết xác thực, sau đó bấm "Đã xác thực Email" bên dưới.`
      : 'Nhập mật khẩu mới cho tài khoản của bạn.';

  return (
    <div className="bg-custom-gradient min-h-screen flex items-center justify-center p-gutter">
      <main className="w-full max-w-[480px] animate-fade-in">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <span className="material-symbols-outlined text-white text-4xl">chat</span>
          </div>
          <h2 className="font-h1-display text-h1-display text-primary tracking-tight">AuraChat</h2>
        </div>

        <div className="glass-card-solid shadow-[0_4px_12px_rgba(0,0,0,0.05)] rounded-2xl p-10 border border-white">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-container-low mb-6">
              <span className="material-symbols-outlined text-primary-container text-4xl">
                {step === 1 ? 'mail' : step === 2 ? 'mark_email_read' : 'lock_reset'}
              </span>
            </div>
            <h1 className="font-h1-display text-h1-display text-on-surface mb-3">{stepTitle}</h1>
            <p className="font-body-main text-body-main text-on-surface-variant max-w-[320px] mx-auto">{stepDescription}</p>
          </div>

          {apiError && (
            <div className="mb-6 p-4 rounded-xl bg-error-container text-on-error-container text-sm font-medium">
              {apiError}
            </div>
          )}
          {apiSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-green-100 text-green-800 text-sm font-medium">
              {apiSuccess}
            </div>
          )}

          {step === 1 && (
            <form className="space-y-6" onSubmit={handleSubmitStep1(onSubmitStep1)}>
              <div className="space-y-2">
                <label className="font-label-sm text-label-sm text-on-surface-variant ml-1">Địa chỉ email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-on-surface-variant group-focus-within:text-primary transition-colors">alternate_email</span>
                  </div>
                  <input
                    {...registerStep1('email', {
                      required: 'Email là bắt buộc',
                      pattern: {
                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                        message: 'Email không hợp lệ'
                      }
                    })}
                    className={`block w-full pl-11 pr-4 py-3.5 bg-surface border ${errorsStep1.email ? 'border-error' : 'border-outline-variant'} rounded-[12px] font-body-main text-body-main text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all`}
                    placeholder="username@example.com"
                    type="email"
                  />
                </div>
                {errorsStep1.email && <p className="text-error text-xs ml-1 mt-1">{errorsStep1.email.message}</p>}
              </div>
              <button
                disabled={isLoading}
                className={`btn-primary-gradient w-full py-4 rounded-[12px] text-white font-body-bold text-body-bold shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                type="submit"
              >
                <span>{isLoading ? 'Đang gửi...' : 'Gửi liên kết xác thực'}</span>
                {!isLoading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <button
                disabled={isLoading}
                onClick={handleCheckVerified}
                className={`btn-primary-gradient w-full py-4 rounded-[12px] text-white font-body-bold text-body-bold shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                type="button"
              >
                <span>{isLoading ? 'Đang kiểm tra...' : 'Đã xác thực Email'}</span>
                {!isLoading && <span className="material-symbols-outlined text-[20px]">verified</span>}
              </button>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem(FORGOT_EMAIL_KEY);
                  setStep(1);
                  setUserEmail('');
                  setApiError(null);
                  setApiSuccess(null);
                }}
                className="w-full py-3 text-primary-container font-body-bold hover:underline"
              >
                Gửi lại liên kết
              </button>
            </div>
          )}

          {step === 3 && (
            <form className="space-y-6" onSubmit={handleSubmitStep3(onSubmitStep3)}>
              <div className="space-y-2">
                <label className="font-label-sm text-label-sm text-on-surface-variant ml-1">Mật khẩu mới</label>
                <input
                  {...registerStep3('newPassword', {
                    required: 'Mật khẩu mới là bắt buộc',
                    minLength: { value: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' }
                  })}
                  className={`block w-full px-4 py-3.5 bg-surface border ${errorsStep3.newPassword ? 'border-error' : 'border-outline-variant'} rounded-[12px]`}
                  placeholder="••••••••"
                  type="password"
                />
                {errorsStep3.newPassword && <p className="text-error text-xs ml-1 mt-1">{errorsStep3.newPassword.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="font-label-sm text-label-sm text-on-surface-variant ml-1">Nhập lại mật khẩu</label>
                <input
                  {...registerStep3('confirmPassword', {
                    required: 'Vui lòng nhập lại mật khẩu',
                    validate: (value) => value === newPassword || 'Mật khẩu không khớp'
                  })}
                  className={`block w-full px-4 py-3.5 bg-surface border ${errorsStep3.confirmPassword ? 'border-error' : 'border-outline-variant'} rounded-[12px]`}
                  placeholder="••••••••"
                  type="password"
                />
                {errorsStep3.confirmPassword && <p className="text-error text-xs ml-1 mt-1">{errorsStep3.confirmPassword.message}</p>}
              </div>
              <button
                disabled={isLoading}
                className={`btn-primary-gradient w-full py-4 rounded-[12px] text-white font-body-bold shadow-md flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                type="submit"
              >
                <span>{isLoading ? 'Đang xử lý...' : 'Xác nhận đặt lại'}</span>
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 font-body-bold text-body-bold text-primary-container hover:text-primary transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Quay lại đăng nhập</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

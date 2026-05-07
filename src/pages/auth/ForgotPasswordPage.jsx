import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../services/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP and New Password
  const [userEmail, setUserEmail] = useState('');
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register: registerStep1, handleSubmit: handleSubmitStep1, formState: { errors: errorsStep1 } } = useForm();
  const { register: registerStep2, handleSubmit: handleSubmitStep2, formState: { errors: errorsStep2 } } = useForm();

  const onSubmitStep1 = async (data) => {
    setApiError(null);
    setApiSuccess(null);
    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/forgot-password', {
        email: data.email
      });

      if (response.data && response.data.success) {
        setUserEmail(data.email);
        setStep(2);
        setApiSuccess('Đã gửi mã OTP đến email của bạn.');
      } else {
        setApiError(response.data.message || 'Gửi yêu cầu thất bại.');
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitStep2 = async (data) => {
    setApiError(null);
    setApiSuccess(null);
    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/reset-password', {
        email: userEmail,
        otp: data.otp,
        newPassword: data.newPassword
      });

      if (response.data && response.data.success) {
        setApiSuccess('Đổi mật khẩu thành công. Đang chuyển hướng...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setApiError(response.data.message || 'Đổi mật khẩu thất bại.');
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng kiểm tra lại OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-custom-gradient min-h-screen flex items-center justify-center p-gutter">
      {/* Container for Forget Password Flow */}
      <main className="w-full max-w-[480px] animate-fade-in">
        {/* Branding Identity (Abstract Logo) */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <span className="material-symbols-outlined text-white text-4xl">chat</span>
          </div>
          <h2 className="font-h1-display text-h1-display text-primary tracking-tight">AuraChat</h2>
        </div>
        
        {/* Main Card */}
        <div className="glass-card-solid shadow-[0_4px_12px_rgba(0,0,0,0.05)] rounded-2xl p-10 border border-white">
          {/* Top Section: Icon & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-container-low mb-6">
              <span className="material-symbols-outlined text-primary-container text-4xl">
                {step === 1 ? 'mail' : 'lock_reset'}
              </span>
            </div>
            <h1 className="font-h1-display text-h1-display text-on-surface mb-3">
              {step === 1 ? 'Quên mật khẩu?' : 'Đặt lại mật khẩu'}
            </h1>
            <p className="font-body-main text-body-main text-on-surface-variant max-w-[320px] mx-auto">
              {step === 1 
                ? 'Nhập email của bạn, chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.' 
                : `Vui lòng kiểm tra email ${userEmail} và nhập mã OTP gồm 6 chữ số.`}
            </p>
          </div>

          {/* Feedback Messages */}
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

          {/* Form Section */}
          {step === 1 ? (
            <form className="space-y-6" onSubmit={handleSubmitStep1(onSubmitStep1)}>
              <div className="space-y-2">
                <label className="font-label-sm text-label-sm text-on-surface-variant ml-1">Địa chỉ email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-on-surface-variant group-focus-within:text-primary transition-colors">alternate_email</span>
                  </div>
                  <input 
                    {...registerStep1("email", { 
                      required: "Email là bắt buộc", 
                      pattern: {
                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                        message: "Email không hợp lệ"
                      }
                    })}
                    className={`block w-full pl-11 pr-4 py-3.5 bg-surface border ${errorsStep1.email ? 'border-error' : 'border-outline-variant'} rounded-[12px] font-body-main text-body-main text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all`} 
                    placeholder="username@example.com" 
                    type="email" 
                  />
                </div>
                {errorsStep1.email && <p className="text-error text-xs ml-1 mt-1">{errorsStep1.email.message}</p>}
              </div>
              {/* Action Button */}
              <button 
                disabled={isLoading}
                className={`btn-primary-gradient w-full py-4 rounded-[12px] text-white font-body-bold text-body-bold shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`} 
                type="submit"
              >
                <span>{isLoading ? 'Đang gửi...' : 'Gửi mã OTP'}</span>
                {!isLoading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmitStep2(onSubmitStep2)}>
              <div className="space-y-2">
                <label className="font-label-sm text-label-sm text-on-surface-variant ml-1">Mã OTP</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-on-surface-variant group-focus-within:text-primary transition-colors">pin</span>
                  </div>
                  <input 
                    {...registerStep2("otp", { 
                      required: "Mã OTP là bắt buộc",
                      minLength: { value: 6, message: "Mã OTP phải có 6 ký tự" },
                      maxLength: { value: 6, message: "Mã OTP phải có 6 ký tự" }
                    })}
                    className={`block w-full pl-11 pr-4 py-3.5 bg-surface border ${errorsStep2.otp ? 'border-error' : 'border-outline-variant'} rounded-[12px] font-body-main text-body-main tracking-widest text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all`} 
                    placeholder="123456" 
                    type="text" 
                    maxLength="6"
                  />
                </div>
                {errorsStep2.otp && <p className="text-error text-xs ml-1 mt-1">{errorsStep2.otp.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="font-label-sm text-label-sm text-on-surface-variant ml-1">Mật khẩu mới</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-on-surface-variant group-focus-within:text-primary transition-colors">lock</span>
                  </div>
                  <input 
                    {...registerStep2("newPassword", { 
                      required: "Mật khẩu mới là bắt buộc",
                      minLength: { value: 8, message: "Mật khẩu phải có ít nhất 8 ký tự" }
                    })}
                    className={`block w-full pl-11 pr-4 py-3.5 bg-surface border ${errorsStep2.newPassword ? 'border-error' : 'border-outline-variant'} rounded-[12px] font-body-main text-body-main text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all`} 
                    placeholder="••••••••" 
                    type="password" 
                  />
                </div>
                {errorsStep2.newPassword && <p className="text-error text-xs ml-1 mt-1">{errorsStep2.newPassword.message}</p>}
              </div>

              {/* Action Button */}
              <button 
                disabled={isLoading}
                className={`btn-primary-gradient w-full py-4 rounded-[12px] text-white font-body-bold text-body-bold shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`} 
                type="submit"
              >
                <span>{isLoading ? 'Đang xử lý...' : 'Xác nhận đặt lại'}</span>
                {!isLoading && <span className="material-symbols-outlined text-[20px]">check_circle</span>}
              </button>
            </form>
          )}

          {/* Footer Link */}
          <div className="mt-8 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 font-body-bold text-body-bold text-primary-container hover:text-primary transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Quay lại đăng nhập</span>
            </Link>
          </div>
        </div>

        {/* Decorative Illustration Element */}
        <div className="mt-12 flex justify-center opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
          <img alt="AuraChat Secure Messaging" className="w-48 h-auto object-contain rounded-xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-v8Yx5XWLX34ul6DWW5chxMT4-7L5KCIMxMoAwvMSIcb12zhJhwJY4yxmrTG01UTu4Qtg_7ggt3Y6QZyU_aIUrbKc0Mn1OxoiCy792De94JAEnG0EUwq-foYDq_UznSuES43rjQM61JRjus8dhAEzuty1DL4ENq_z1-A5PC8FdoJqYiS7LVGifD5kRyT-DWZ7qPILtpJtcpGiO8bauaSCyibtaYghux01SI6Z5TV3Z6QT32SQs_OdDFTig8qbaNL_defQYr5hh3sm" />
        </div>
        
        {/* Utility Footer */}
        <footer className="mt-12 text-center">
          <p className="font-caption text-caption text-outline">
            © 2024 AuraChat Cloud. Tất cả các quyền được bảo lưu.
          </p>
        </footer>
      </main>
    </div>
  );
}

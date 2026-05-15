import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { getRedirectResult, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '../../config/firebase';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    let isMounted = true;

    const handleRedirectLogin = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!result || !result.user) return;

        const idToken = await result.user.getIdToken();
        const response = await api.post('/auth/firebase/login', {
          idToken: idToken
        });

        if (!isMounted) return;

        if (response.data && response.data.success) {
          const { accessToken, refreshToken, user } = response.data.data;
          setAuth(user, accessToken, refreshToken);
          navigate('/chat');
        } else {
          setApiError(response.data.message || 'Đăng nhập bằng chuyển hướng thất bại.');
        }
      } catch (err) {
        console.error('Firebase Redirect Login Error:', err);
        if (!isMounted) return;
        // Ignore popup closed or cancelled requests during redirect check
        if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
          setApiError(err.response?.data?.message || err.message || 'Đã có lỗi xảy ra khi xử lý đăng nhập chuyển hướng.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    handleRedirectLogin();

    return () => {
      isMounted = false;
    };
  }, [navigate, setAuth]);

  const onSubmit = async (data) => {
    setApiError(null);
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password
      });

      if (response.data && response.data.success) {
        const { accessToken, refreshToken, user } = response.data.data;
        setAuth(user, accessToken, refreshToken);
        navigate('/chat');
      } else {
        setApiError(response.data.message || 'Đăng nhập thất bại.');
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (providerName, options = {}) => {
    if (isLoading) return;
    setApiError(null);
    setIsLoading(true);
    try {
      const provider = providerName === 'Google' ? googleProvider : facebookProvider;
      if (options.useRedirect) {
        await signInWithRedirect(auth, provider);
        return;
      }

      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      // Send the token to the backend
      const response = await api.post('/auth/firebase/login', {
        idToken: idToken
      });

      if (response.data && response.data.success) {
        const { accessToken, refreshToken, user } = response.data.data;
        setAuth(user, accessToken, refreshToken);
        navigate('/chat');
      } else {
        setApiError(response.data.message || `Đăng nhập bằng ${providerName} thất bại.`);
      }
    } catch (err) {
      console.error('Firebase Login Error:', {
        code: err?.code,
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status
      });
      // Xử lý lỗi huỷ popup
      if (err.code === 'auth/popup-closed-by-user') {
        return; // Không hiển thị lỗi nếu user tự đóng
      }
      if (err.code === 'auth/popup-blocked') {
        setApiError('Popup bị chặn. Hãy cho phép popup hoặc dùng chế độ đăng nhập chuyển hướng.');
        return;
      }
      if (err.code === 'auth/cancelled-popup-request') {
        setApiError('Đang có yêu cầu đăng nhập khác. Vui lòng thử lại.');
        return;
      }
      setApiError(err.response?.data?.message || err.message || `Đã có lỗi xảy ra khi đăng nhập bằng ${providerName}.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen flex items-stretch overflow-hidden">
      {/* Left Side: Brand Visuals (40%) */}
      <div className="hidden md:flex md:w-[40%] primary-gradient relative flex-col items-center justify-center p-gutter text-on-primary">
        {/* Abstract Background Shapes */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-white blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* AuraChat Logo */}
          <div className="w-24 h-24 mb-6 flex items-center justify-center glass-card rounded-xl">
            <span className="material-symbols-outlined text-6xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>graphic_eq</span>
          </div>
          <h1 className="font-h1-display text-4xl mb-4 font-extrabold tracking-tight">AuraChat</h1>
          <p className="font-body-main text-xl opacity-90 max-w-xs">Kết nối mọi lúc, mọi nơi</p>
          {/* Floating Decorative Element */}
          <div className="mt-20 p-6 glass-card rounded-2xl flex items-center gap-4 text-left max-w-sm">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/50">
              <img alt="AI Agent" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWV-PWkV3-jjaOx6guWCmWjTSIOY9gAObtZXFgroMRSqZOYE4oU9BMt1q_S6jH04iEMA12KqqrsNZGVt-FAWo9eegMcvUrPtNvI5u_MYi2SRHIzwTgubAOWAqcMk-7TgAJnTC8pgPzLFOSSMCk3fnqEF48FHcBkIekXdejNB5vrj9v3gsMPJ-vUA14RVddmq_OMp9usi7OKdciui-mCMcj-ox5o4qIccTnTkOamCTNEk1hTqm0mi7QdAwSIppz6JFIC-5np8YvrLIn" />
            </div>
            <div>
              <div className="font-body-bold text-white">Trợ lý Aura</div>
              <div className="text-caption text-white/80">Sẵn sàng hỗ trợ bạn trải nghiệm trò chuyện tốt nhất.</div>
            </div>
          </div>
        </div>
      </div>
      {/* Right Side: Login Form (60%) */}
      <div className="w-full md:w-[60%] bg-surface flex items-center justify-center p-gutter overflow-y-auto">
        <div className="w-full max-w-[480px] space-y-8 py-10">
          {/* Form Header */}
          <div className="text-center md:text-left">
            <h2 className="font-h1-display text-on-surface text-3xl mb-2">Chào mừng trở lại</h2>
            <p className="font-body-main text-on-surface-variant">Đăng nhập để tiếp tục trò chuyện</p>
          </div>
          
          {/* Global Error */}
          {apiError && (
            <div className="p-4 rounded-xl bg-error-container text-on-error-container text-sm font-medium">
              {apiError}
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Input */}
            <div className="space-y-2">
              <label className="font-label-sm text-on-surface-variant block ml-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline">mail</span>
                </div>
                <input 
                  {...register("email", { 
                    required: "Email là bắt buộc", 
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: "Email không hợp lệ"
                    }
                  })}
                  className={`w-full pl-11 pr-4 py-3 bg-white border ${errors.email ? 'border-error' : 'border-outline-variant'} rounded-xl focus:ring-2 focus:ring-primary-container focus:border-primary outline-none transition-all soft-glow text-on-surface`} 
                  placeholder="email@example.com" 
                  type="email" 
                />
              </div>
              {errors.email && <p className="text-error text-xs ml-1 mt-1">{errors.email.message}</p>}
            </div>
            {/* Password Input */}
            <div className="space-y-2">
              <label className="font-label-sm text-on-surface-variant block ml-1">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline">lock</span>
                </div>
                <input 
                  {...register("password", { required: "Mật khẩu là bắt buộc" })}
                  className={`w-full pl-11 pr-12 py-3 bg-white border ${errors.password ? 'border-error' : 'border-outline-variant'} rounded-xl focus:ring-2 focus:ring-primary-container focus:border-primary outline-none transition-all soft-glow text-on-surface`} 
                  placeholder="••••••••" 
                  type="password" 
                />
                <button className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-primary transition-colors" type="button">
                  <span className="material-symbols-outlined">visibility</span>
                </button>
              </div>
              {errors.password && <p className="text-error text-xs ml-1 mt-1">{errors.password.message}</p>}
            </div>
            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary transition-all cursor-pointer" type="checkbox" />
                <span className="font-label-sm text-on-surface-variant group-hover:text-on-surface">Ghi nhớ đăng nhập</span>
              </label>
              <Link to="/forgot-password" className="font-label-sm font-semibold text-primary hover:text-secondary-container transition-colors">Quên mật khẩu?</Link>
            </div>
            {/* Login Button */}
            <button 
              disabled={isLoading}
              className={`w-full primary-gradient text-white font-body-bold py-4 rounded-xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`} 
              type="submit"
            >
              <span>{isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
              {!isLoading && <span className="material-symbols-outlined text-[20px]">login</span>}
            </button>
          </form>
          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-surface px-4 font-label-sm text-outline">hoặc</span>
            </div>
          </div>
          {/* Social Login */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => handleSocialLogin('Google')}
              disabled={isLoading}
              className={`flex items-center justify-center gap-3 py-3 px-4 bg-white border border-outline-variant rounded-xl font-label-sm text-on-surface-variant transition-colors soft-glow ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-surface-container-low'}`}
              type="button"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Google</span>
            </button>
            <button
              onClick={() => handleSocialLogin('Facebook')}
              disabled={isLoading}
              className={`flex items-center justify-center gap-3 py-3 px-4 bg-[#1877F2] rounded-xl font-label-sm text-white transition-all soft-glow ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}
              type="button"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
              </svg>
              <span>Facebook</span>
            </button>
          </div>
          <div className="text-center font-body-main flex flex-col gap-2">
            <button
              onClick={() => handleSocialLogin('Google', { useRedirect: true })}
              disabled={isLoading}
              className={`font-label-sm font-semibold text-primary transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:text-secondary-container'}`}
              type="button"
            >
              Đăng nhập Google bằng chuyển hướng
            </button>
            <button
              onClick={() => handleSocialLogin('Facebook', { useRedirect: true })}
              disabled={isLoading}
              className={`font-label-sm font-semibold text-primary transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:text-secondary-container'}`}
              type="button"
            >
              Đăng nhập Facebook bằng chuyển hướng
            </button>
          </div>
          {/* Footer */}
          <div className="text-center font-body-main">
            <span className="text-on-surface-variant">Chưa có tài khoản?</span>
            <Link to="/register" className="font-bold text-primary hover:text-secondary-container transition-colors ml-1">Đăng ký ngay</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

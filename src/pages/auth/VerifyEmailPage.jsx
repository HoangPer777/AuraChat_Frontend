import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Liên kết xác nhận email không hợp lệ.');
      return;
    }

    api.get('/auth/verify-email', { params: { token } })
      .then(() => {
        setStatus('success');
        setMessage('Email đã được xác nhận. Bạn có thể đăng nhập ngay bây giờ.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Liên kết xác nhận đã hết hạn hoặc không hợp lệ.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Đang xác nhận email...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-green-600 text-3xl">verified</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">Xác nhận email thành công</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link to="/login" className="inline-block px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">
              Đăng nhập
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-600 text-3xl">error</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">Xác nhận thất bại</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link to="/register" className="text-indigo-500 hover:underline">
              Quay lại trang đăng ký
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

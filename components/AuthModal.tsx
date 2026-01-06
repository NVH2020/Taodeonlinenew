import React, { useState } from 'react';
import { DEFAULT_API_URL } from '../config';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (userData: any) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ phone: '', pass: '', confirmPass: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && formData.pass !== formData.confirmPass) return alert("Mật khẩu xác nhận không khớp!");
    
    setLoading(true);
    try {
      const response = await fetch(DEFAULT_API_URL, {
        method: 'POST',
        body: JSON.stringify({
          type: isLogin ? 'login' : 'register',
          phone: formData.phone,
          pass: formData.pass
        })
      });
      const res = await response.json();
      
      if (res.status === 'success') {
        alert(res.message);
        if (isLogin) {
          onSuccess(res.data); // Lưu user vào App.tsx
          onClose();
        } else {
          setIsLogin(true); // Đăng ký xong chuyển sang đăng nhập
        }
      } else {
        alert(res.message);
      }
    } catch (error) {
      alert("Lỗi kết nối máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-scale-up border-b-8 border-indigo-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
            <i className={`fas ${isLogin ? 'fa-lock' : 'fa-user-plus'}`}></i>
          </div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
            {isLogin ? 'Đăng Nhập Hệ Thống' : 'Tạo Tài Khoản Mới'}
          </h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase mt-1 tracking-widest">
            {isLogin ? 'Vui lòng nhập thông tin để tiếp tục' : 'Đăng ký để nhận nhiều ưu đãi VIP'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <i className="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input required type="tel" placeholder="Số điện thoại" className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold" 
              value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
          
          <div className="relative">
            <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input required type="password" placeholder="Mật khẩu" className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold"
              value={formData.pass} onChange={e => setFormData({...formData, pass: e.target.value})} />
          </div>

          {!isLogin && (
            <div className="relative animate-fade-in">
              <i className="fas fa-check-circle absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input required type="password" placeholder="Xác nhận mật khẩu" className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold"
                value={formData.confirmPass} onChange={e => setFormData({...formData, confirmPass: e.target.value})} />
            </div>
          )}

          <button disabled={loading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition active:scale-95 uppercase tracking-widest">
            {loading ? 'ĐANG XỬ LÝ...' : isLogin ? 'VÀO HỆ THỐNG' : 'HOÀN TẤT ĐĂNG KÝ'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-[11px] font-black text-indigo-500 uppercase hover:underline">
            {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
          </button>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button onClick={onClose} className="text-slate-400 text-[10px] font-black uppercase">Để sau</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

import React, { useState } from 'react';
import { DEFAULT_API_URL } from '../config';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (userData: any) => void;
}

const AuthModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: (u: any) => void }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false); // Chuyển đổi giữa Đăng nhập/Đăng ký
  // Sử dụng đúng biến bạn đã khai
  const [accountInfo, setAccountInfo] = useState({ phone: '', pass: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Tạo Payload gửi đi
    const payload = {
      type: isRegisterMode ? 'register' : 'login',
      phone: accountInfo.phone,
      pass: accountInfo.pass
    };

    try {
      // Gửi dữ liệu về Google Script (DANHGIA_URL)
      await fetch(DANHGIA_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload)
      });

      // Nếu là Đăng ký: Thông báo thành công và chuyển sang Đăng nhập
      if (isRegisterMode) {
        alert("Đăng ký thành công! Giờ em có thể đăng nhập.");
        setIsRegisterMode(false);
      } else {
        // Nếu là Đăng nhập: Lưu vào hệ thống
        onSuccess({ phoneNumber: accountInfo.phone, vip: 'Vip0' });
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative animate-fade-in border border-slate-100">
        <h2 className="text-2xl font-black text-slate-800 mb-6 uppercase tracking-tighter">
          {isRegisterMode ? 'Đăng ký tài khoản' : 'Đăng nhập hệ thống'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            required type="tel" placeholder="Số điện thoại của em" 
            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-blue-500"
            value={accountInfo.phone}
            onChange={e => setAccountInfo({...accountInfo, phone: e.target.value})}
          />
          <input 
            required type="password" placeholder="Mật khẩu tự chọn" 
            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-blue-500"
            value={accountInfo.pass}
            onChange={e => setAccountInfo({...accountInfo, pass: e.target.value})}
          />
          
          <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg border-b-4 border-indigo-900 uppercase active:scale-95 transition-all">
            {loading ? 'ĐANG XỬ LÝ...' : (isRegisterMode ? 'TẠO TÀI KHOẢN MỚI' : 'VÀO HỌC NGAY')}
          </button>
        </form>

        {/* NÚT CHUYỂN ĐỔI CHÈN Ở ĐÂY */}
        <button 
          onClick={() => setIsRegisterMode(!isRegisterMode)}
          className="w-full mt-6 text-slate-400 font-bold hover:text-indigo-600 transition text-sm uppercase tracking-tight"
        >
          {isRegisterMode ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký tại đây'}
        </button>

        <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 text-2xl">✕</button>
      </div>
    </div>
  );
};

export default AuthModal;

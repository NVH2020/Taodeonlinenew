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

  const handleAuthSubmit = async (isRegisterMode: boolean) => {
  setLoading(true);
  try {
    // 1. Tạo đường dẫn có chứa dữ liệu (Sử dụng GET để vượt qua lỗi CORS)
    const type = isRegisterMode ? 'register' : 'checkLogin';
    const finalUrl = `${DANHGIA_URL}?type=${type}&phone=${accountInfo.phone}&pass=${accountInfo.pass}`;

    // 2. Gọi fetch và chờ kết quả
    const response = await fetch(finalUrl);
    const result = await response.json();

    // 3. XỬ LÝ KẾT QUẢ TRẢ VỀ
    if (result.status === "success") {
      alert(result.message);
      if (!isRegisterMode) {
        // CHỈ KHI ĐÚNG PASS MỚI CHẠY DÒNG NÀY
        onSuccess({
          phoneNumber: result.data.phone,
          vip: result.data.vip
        });
      } else {
        setIsRegisterMode(false);
      }
    } else {
      // NẾU SAI PASS HOẶC TRÙNG SĐT, NÓ SẼ HIỆN LỖI Ở ĐÂY VÀ DỪNG LẠI
      alert("Thông báo từ hệ thống: " + result.message);
    }
  } catch (error) {
    console.error("Lỗi:", error);
    alert("Không thể xác thực. Em kiểm tra lại kết nối mạng nhé!");
  } finally {
    setLoading(false);
  }
};

 export default AuthModal;

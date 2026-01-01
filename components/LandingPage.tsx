import React, { useState, useEffect } from 'react';
import { NEWS_DATA, IMAGES_CAROUSEL, DANHGIA_URL } from '../config';
import { AppUser, Student } from '../types';

const formatPhoneHidden = (phone: string) => {
  if (!phone || phone.length < 7) return "09xxx****";
  return phone.slice(0, 2) + "xxx" + phone.slice(-4);
};

interface LandingPageProps {
  onSelectGrade: (grade: number) => void;
  onSelectQuiz: (num: number, pts: number, quizStudent: Partial<Student>) => void;
  user: AppUser | null;
  onOpenAuth: () => void;
  onOpenVip: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectGrade, onSelectQuiz, user, onOpenAuth, onOpenVip }) => {
  const [currentImg, setCurrentImg] = useState(0);
  const [showQuizModal, setShowQuizModal] = useState<{num: number, pts: number} | null>(null);
  const [quizInfo, setQuizInfo] = useState({ name: '', class: '', school: '', phone: '' });
  
  // Các state mới cho Ngân hàng và Trường học
  const [isOtherSchool, setIsOtherSchool] = useState(false);
  const [isOtherBank, setIsOtherBank] = useState(false);
  const [bankInfo, setBankInfo] = useState({ stk: '', bankName: '' });

  const [showRateModal, setShowRateModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingRate, setIsSubmittingRate] = useState(false);
  const [stats, setStats] = useState<{ratings: Record<number, number>, top10: any[]}>({
    ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    top10: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const resp = await fetch(`${DANHGIA_URL}?type=getStats&t=${Date.now()}`);
        const result = await resp.json();
        if (result.status === "success" && result.data) {
          setStats({
            ratings: result.data.ratings || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            top10: Array.isArray(result.data.top10) ? result.data.top10 : []
          });
        }
      } catch (e) { console.error("Lỗi lấy thống kê:", e); }
    };
    fetchStats();
    const statsInterval = setInterval(fetchStats, 120000);
    const imgInterval = setInterval(() => {
      setCurrentImg(prev => (prev + 1) % IMAGES_CAROUSEL.length);
    }, 4000);
    return () => { clearInterval(statsInterval); clearInterval(imgInterval); };
  }, []);

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizInfo.name || !quizInfo.phone) return alert("Vui lòng nhập đầy đủ họ tên và SĐT!");
    
    // Gửi kèm thông tin Ngân hàng và STK (có dấu ' để tránh mất số 0 trong Excel/Sheet)
    onSelectQuiz(showQuizModal!.num, showQuizModal!.pts, {
      name: quizInfo.name,
      class: quizInfo.class,
      school: quizInfo.school,
      phoneNumber: "'" + quizInfo.phone, 
      stk: "'" + bankInfo.stk,
      bank: bankInfo.bankName
    });
    setShowQuizModal(null);
  };

  const handleRateSubmit = async () => {
    if (isSubmittingRate) return;
    setIsSubmittingRate(true);
    try {
      const payload = {
        type: 'rating', stars: rating, comment: comment,
        name: quizInfo.name || (user?.name || "Khách"),
        class: quizInfo.class || "Tự do",
        idNumber: user?.phoneNumber || "GUEST",
        taikhoanapp: user?.isVip ? "VIP" : "FREE"
      };
      await fetch(DANHGIA_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
      alert(`❤️ Cảm ơn bạn đã đánh giá! ❤️`);
      setShowRateModal(false);
      setComment("");
    } catch (e) { alert("Lỗi gửi đánh giá!"); } finally { setIsSubmittingRate(false); }
  };

  const totalRatings = (Object.values(stats.ratings) as number[]).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-6 pb-12 font-sans overflow-x-hidden">
      {/* 1. Header (Giữ nguyên giao diện của bạn) */}
      <div className="bg-white p-2 rounded-3xl shadow-lg border border-slate-100 mt-4 overflow-hidden">
        <div className="flex flex-nowrap overflow-x-auto gap-3 pb-2 pt-1 px-1 no-scrollbar items-center">
          <div className="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-lg shrink-0 flex flex-col items-center justify-center h-[56px] border-b-4 border-red-800 animate-pulse">
            <span className="font-black text-sm uppercase">Kiểm tra Online →</span>
          </div>
          {[9, 10, 11, 12].map(g => (
            <button key={g} onClick={() => onSelectGrade(g)} className="px-5 py-3 bg-blue-600 text-white border-b-4 border-blue-800 rounded-2xl font-black text-sm h-[56px]">LỚP {g}</button>
          ))}
          <button onClick={() => setShowQuizModal({num: 10, pts: 1})} className="px-5 py-3 bg-orange-500 text-white border-b-4 border-orange-700 rounded-2xl font-black text-sm h-[56px] uppercase">Quiz 10 Câu</button>
          <button onClick={() => setShowQuizModal({num: 20, pts: 0.5})} className="px-5 py-3 bg-orange-500 text-white border-b-4 border-orange-700 rounded-2xl font-black text-sm h-[56px] uppercase">Quiz 20 Câu</button>
        </div>
      </div>

      {/* 2. Marquee */}
      <div className="bg-indigo-700 py-3 rounded-2xl overflow-hidden shadow-inner border-b-4 border-indigo-900 mx-1">
        <div className="animate-marquee whitespace-nowrap text-white font-black uppercase text-[11px] tracking-widest">
          Chào mừng các bạn đến với Hệ thống học tập trực tuyến môn Toán ! &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          Luyện tập chăm chỉ mỗi ngày để bứt phá điểm số! &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </div>
      </div>

      {/* 3. Khối nội dung chính */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* TOP 10 QUIZ */}
        <div className="lg:col-span-3 flex flex-col">
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden border-b-4 border-blue-200 h-full flex flex-col">
            <div className="bg-blue-600 p-4 text-white font-black text-xs uppercase text-center flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-2">
                <i className="fas fa-crown text-yellow-300"></i> TOP 10 QUIZ TUẦN
              </div>
              <span className="text-[9px] font-bold text-blue-200 normal-case italic">Chụp nhanh 18:00 chủ nhật</span>
            </div>
            <div className="p-2 space-y-1 flex-grow bg-slate-50 overflow-y-auto max-h-[420px] custom-scrollbar">
              {stats.top10.length > 0 ? stats.top10.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.01]">
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1 pr-1">
                    <span className="font-bold text-slate-800 text-[10px] truncate">{idx + 1}. {item.name}</span>
                    <span className="text-[9px] text-slate-400 font-bold">{formatPhoneHidden(item.phoneNumber)}</span>
                  </div>
                  <div className="text-right flex flex-col shrink-0">
                    <span className="font-black text-blue-600 text-[10px]">{(item.tongdiem || 0).toFixed(1)} đ</span>
                    <span className="text-[8px] text-slate-400 mt-0.5"><i className="far fa-clock mr-0.5"></i>{item.fulltime}</span>
                  </div>
                </div>
              )) : (
                <div className="p-10 text-center text-slate-400 text-xs uppercase font-bold">Đang cập nhật...</div>
              )}
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div className="lg:col-span-7">
          <div className="relative h-64 md:h-full min-h-[420px] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
            {IMAGES_CAROUSEL.map((img, idx) => (
              <img key={idx} src={img} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentImg ? 'opacity-100' : 'opacity-0'}`} alt="Carousel" />
            ))}
          </div>
        </div>

        {/* Nút chức năng */}
        <div className="lg:col-span-2 flex flex-col gap-3">
                    {[
            { label: "Trợ lý học tập", icon: "fas fa-headset", link: "https://new-chat-bot-two.vercel.app/" },
            { label: "Đăng ký học Toán", icon: "fas fa-users", link: "https://www.facebook.com/hoctoanthayha.bg" },
            { label: user ? `SĐT: ${user.phoneNumber}` : "Đăng Nhập", icon: "fas fa-sign-in-alt", action: onOpenAuth },
            { label: "Nâng Cấp VIP", icon: "fas fa-gem", action: onOpenVip },
            { label: "Kho Tài Liệu", icon: "fas fa-folder-open", link: "https://www.facebook.com/hoctoanthayha.bg" }

          ].map((btn, i) => (
            <button key={i} onClick={btn.action || (() => window.open(btn.link, '_blank'))}
              className="w-full flex-1 flex flex-col items-center justify-center gap-1 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase border-b-4 border-indigo-900 p-2 text-center">
              <i className={`${btn.icon} text-lg mb-1`}></i>
              <span className="leading-tight">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MODAL THÔNG TIN (PHẦN BẠN CẦN SỬA) */}
      {showQuizModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative border border-slate-100 overflow-y-auto max-h-[95vh]">
            <h2 className="text-xl font-black text-orange-500 mb-6 uppercase text-center">Thông tin nhận thưởng</h2>
            <form onSubmit={handleStartQuiz} className="space-y-3">
              <input required type="text" placeholder="Họ và tên" className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-orange-500" value={quizInfo.name} onChange={e=>setQuizInfo({...quizInfo, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Lớp" className="p-3 bg-slate-50 rounded-xl font-bold outline-none" value={quizInfo.class} onChange={e=>setQuizInfo({...quizInfo, class: e.target.value})} />
                <input required type="tel" placeholder="Số điện thoại" className="p-3 bg-slate-50 rounded-xl font-bold outline-none" value={quizInfo.phone} onChange={e=>setQuizInfo({...quizInfo, phone: e.target.value})} />
              </div>

              {/* CHỌN TRƯỜNG HỌC */}
              {!isOtherSchool ? (
                <select className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none" 
                  onChange={(e) => e.target.value === "Khác" ? setIsOtherSchool(true) : setQuizInfo({...quizInfo, school: e.target.value})}>
                  <option value="">Chọn trường học</option>
                  <option value="THPT YD1">THPT YD1</option>
                  <option value="THPT YD2">THPT YD2</option>
                  <option value="Khác">Trường khác (Nhập tay...)</option>
                </select>
              ) : (
                <input autoFocus type="text" placeholder="Nhập tên trường của bạn" className="w-full p-3 bg-blue-50 rounded-xl font-bold border-2 border-blue-200 outline-none" 
                  onChange={e => setQuizInfo({...quizInfo, school: e.target.value})} />
              )}

              {/* THÔNG TIN NGÂN HÀNG */}
              <div className="p-4 bg-orange-50 rounded-2xl space-y-3 border border-orange-100">
                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest text-center">Thông tin Bank nhận thưởng</p>
                <input type="text" placeholder="Số tài khoản" className="w-full p-3 bg-white rounded-xl font-bold outline-none" value={bankInfo.stk} onChange={e => setBankInfo({...bankInfo, stk: e.target.value})} />
                {!isOtherBank ? (
                  <select className="w-full p-3 bg-white rounded-xl font-bold outline-none" onChange={(e) => e.target.value === "Khác" ? setIsOtherBank(true) : setBankInfo({...bankInfo, bankName: e.target.value})}>
                    <option value="">Chọn ngân hàng</option>
                    <option value="Agribank">Agribank</option>
                    <option value="MB Bank">MB Bank</option>
                    <option value="Khác">Ngân hàng khác...</option>
                  </select>
                ) : (
                  <input autoFocus type="text" placeholder="Tên ngân hàng" className="w-full p-3 bg-white rounded-xl font-bold border-2 border-orange-200 outline-none" onChange={e => setBankInfo({...bankInfo, bankName: e.target.value})} />
                )}
              </div>

              <button className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-black shadow-lg uppercase">Vào thi ngay</button>
            </form>
            <button onClick={() => setShowQuizModal(null)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 text-2xl">✕</button>
          </div>
        </div>
      )}

      {/* Footer & CSS (Giữ nguyên như cũ) */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .animate-marquee { display: inline-block; padding-left: 100%; animation: marquee 30s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
      `}</style>
    </div>
  );
};

export default LandingPage;

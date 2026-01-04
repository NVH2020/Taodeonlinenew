
import React, { useState, useEffect } from 'react';
import { NEWS_DATA, IMAGES_CAROUSEL, DANHGIA_URL } from '../config';
import { AppUser, Student } from '../types';

const formatPhoneHidden = (phone: string) => {
  if (!phone || phone.length < 7) return "09xxx****";
  const p = phone.replace(/'/g, "");
  return p.slice(0, 2) + "xxx" + p.slice(-4);
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
  const [quizMode, setQuizMode] = useState<'free' | 'gift'>('free');
  const [quizPass, setQuizPass] = useState('');
  const [quizInfo, setQuizInfo] = useState({ name: '', class: '', phone: '', schoolType: 'THPT YD2', schoolOther: '' });
  const [bankInfo, setBankInfo] = useState({ stk: '', bankType: 'Agribank', bankOther: '' });
  
  const [showRateModal, setShowRateModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("Web tuyệt vời quá thầy ơi! 🔥");
  const [isSubmittingRate, setIsSubmittingRate] = useState(false);
  const [stats, setStats] = useState<any>({ total: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [top10, setTop10] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const statsResp = await fetch(`${DANHGIA_URL}?type=getStats&t=${Date.now()}`);
      if (statsResp.ok) {
        const res = await statsResp.json();
        if (res.status === "success") setStats(res.data);
      }
      const topResp = await fetch(`${DANHGIA_URL}?type=getTop10&t=${Date.now()}`);
      if (topResp.ok) {
        const res = await topResp.json();
        if (res.status === "success") setTop10(res.data);
      }
    } catch (e) { console.warn("Lỗi fetch data LandingPage", e); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => setCurrentImg(prev => (prev + 1) % IMAGES_CAROUSEL.length), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStartQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizInfo.name || !quizInfo.phone) return alert("Vui lòng nhập đầy đủ thông tin!");
    
    if (quizMode === 'gift') {
      const resp = await fetch(`${DANHGIA_URL}?type=checkQuizPass&pass=${quizPass}`);
      const res = await resp.json();
      if (res.status !== "success") return alert("Mật khẩu nhận quà không chính xác!");
    }

    const finalSchool = quizInfo.schoolType === 'Khác' ? quizInfo.schoolOther : quizInfo.schoolType;
    const finalBank = bankInfo.bankType === 'Khác' ? bankInfo.bankOther : bankInfo.bankType;
    
    if (showQuizModal) {
      onSelectQuiz(showQuizModal.num, showQuizModal.pts, {
        name: quizInfo.name,
        class: quizInfo.class,
        school: finalSchool,
        phoneNumber: quizInfo.phone,
        stk: quizMode === 'gift' ? bankInfo.stk : '',
        bank: quizMode === 'gift' ? finalBank : ''
      });
    }
    setShowQuizModal(null);
  };

  const handleRateSubmit = async () => {
    if (isSubmittingRate) return;
    setIsSubmittingRate(true);
    try {
      const payload = {
        type: 'rating', stars: rating, comment: comment,
        name: user?.name || "Khách", idNumber: user?.phoneNumber || "GUEST",
        taikhoanapp: user?.isVip ? "VIP" : "FREE"
      };
      await fetch(DANHGIA_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
      alert("Cảm ơn bạn đã đánh giá! ❤️");
      setShowRateModal(false);
      fetchData();
    } catch (e) { alert("Lỗi gửi đánh giá!"); } finally { setIsSubmittingRate(false); }
  };

  return (
    <div className="flex flex-col gap-6 pb-12 font-sans overflow-x-hidden">
      
      {/* 1. Header Buttons (Grade selection) */}
      <div className="bg-white p-2 rounded-3xl shadow-lg border border-slate-100 mt-4 overflow-hidden">
        <div className="flex flex-nowrap overflow-x-auto gap-3 pb-2 pt-1 px-1 no-scrollbar items-center">
          <div className="flex flex-col items-center shrink-0">
            <div className="bg-red-600 text-white px-6 rounded-2xl shadow-lg flex items-center justify-center h-[60px] border-b-4 border-red-800 animate-pulse">
              <span className="font-black text-sm uppercase">Thi Online →</span>
            </div>
          </div>
          {[9, 10, 11, 12].map(g => (
            <button key={g} onClick={() => onSelectGrade(g)} className="px-6 bg-blue-600 text-white border-b-4 border-blue-800 rounded-2xl font-black text-sm h-[60px] flex items-center gap-2 min-w-[120px] transition-transform active:scale-95">
              <i className="fas fa-graduation-cap"></i> LỚP {g}
            </button>
          ))}
          <button onClick={() => { setQuizMode('free'); setShowQuizModal({num: 10, pts: 1}); }} className="px-6 bg-orange-500 text-white border-b-4 border-orange-700 rounded-2xl font-black text-sm h-[60px] flex items-center gap-2 min-w-[130px] transition-transform active:scale-95">
            <i className="fas fa-bolt"></i> QUIZ 10
          </button>
          <button onClick={() => { setQuizMode('free'); setShowQuizModal({num: 20, pts: 0.5}); }} className="px-6 bg-orange-500 text-white border-b-4 border-orange-700 rounded-2xl font-black text-sm h-[60px] flex items-center gap-2 min-w-[130px] transition-transform active:scale-95">
            <i className="fas fa-brain"></i> QUIZ 20
          </button>
        </div>
      </div>

      {/* 2. Marquee */}
      <div className="bg-indigo-700 py-3 rounded-2xl overflow-hidden shadow-inner border-b-4 border-indigo-900 mx-1">
        <div className="animate-marquee whitespace-nowrap text-white font-black uppercase text-[11px] tracking-widest">
          ⭐ Chào mừng các bạn đến với Hệ thống học toán trực tuyến chuyên nghiệp ! &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          ⭐ Luyện tập chăm chỉ mỗi ngày để bứt phá điểm số! &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
          ⭐ Admin: Thầy Hà - 0988.948.882 ⭐ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </div>
      </div>

      {/* 3. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* TOP 10 QUIZ (DYNAMIC) */}
        <div className="lg:col-span-3 flex flex-col">
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden h-full flex flex-col">
            <div className="bg-blue-600 p-4 text-white font-black text-xs uppercase text-center flex items-center justify-center gap-2">
               <i className="fas fa-crown text-yellow-300"></i> BẢNG VÀNG TOP 10
            </div>
            <div className="p-3 space-y-3 flex-grow bg-slate-50 overflow-y-auto max-h-[550px] custom-scrollbar">
              {top10.length > 0 ? top10.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-2xl shadow-sm border-l-4 border-blue-500">
                  <div className="flex gap-3 items-center min-w-0 flex-1">
                    <span className="text-2xl shrink-0">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : (idx + 1)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-black text-slate-800 text-[11px] truncate">{item.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold">{formatPhoneHidden(item.phone)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-blue-600 text-sm">{item.score} đ</p>
                    <p className="text-[9px] text-slate-400 font-bold">{item.time}</p>
                  </div>
                </div>
              )) : <p className="text-center p-10 text-slate-400 font-black text-[10px]">Đang tải dữ liệu...</p>}
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div className="lg:col-span-7">
          <div className="relative h-64 md:h-full min-h-[420px] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
            {IMAGES_CAROUSEL.map((img, idx) => (
              <img key={idx} src={img} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentImg ? 'opacity-100' : 'opacity-0'}`} alt="" />
            ))}
          </div>
        </div>

        {/* Sidebar Buttons */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <button onClick={onOpenAuth} className="w-full flex-1 flex flex-col items-center justify-center gap-1 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-md p-2 transition-transform hover:scale-105 active:scale-95">
            <i className="fas fa-user-circle text-2xl mb-1"></i>
            <span>{user ? user.phoneNumber : "ĐĂNG NHẬP"}</span>
          </button>
          
          <button onClick={onOpenVip} className="w-full flex-1 flex flex-col items-center justify-center gap-1 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase shadow-md p-2 transition-transform hover:scale-105">
            <i className="fas fa-crown text-2xl mb-1"></i>
            <span>NÂNG CẤP VIP</span>
          </button>

          <button onClick={() => window.open('https://www.facebook.com/hoctoanthayha.bg', '_blank')} className="w-full flex-1 flex flex-col items-center justify-center gap-1 bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase shadow-md p-2 transition-transform hover:scale-105">
            <i className="fas fa-comments text-2xl mb-1"></i>
            <span>TRAO ĐỔI</span>
          </button>

          <button onClick={() => window.open('https://www.facebook.com/hoctoanthayha.bg', '_blank')} className="w-full flex-1 flex flex-col items-center justify-center gap-1 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-md p-2 transition-transform hover:scale-105">
            <i className="fas fa-file-pdf text-2xl mb-1"></i>
            <span>TÀI LIỆU</span>
          </button>
        </div>
      </div>

      {/* QUIZ MODAL - 2 MODES */}
      {showQuizModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative border border-slate-100 animate-fade-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black text-orange-500 mb-6 uppercase text-center">CHỌN CHẾ ĐỘ QUIZ</h2>
            
            <div className="flex gap-2 mb-8 bg-slate-100 p-1 rounded-2xl">
              <button onClick={() => setQuizMode('free')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all ${quizMode === 'free' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Làm Tự Do</button>
              <button onClick={() => setQuizMode('gift')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all ${quizMode === 'gift' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}>Quiz Nhận Quà</button>
            </div>

            <form onSubmit={handleStartQuiz} className="space-y-6">
              {quizMode === 'gift' && (
                <div className="space-y-2">
                  <p className="font-black text-orange-600 text-[10px] uppercase pl-1">Mật khẩu nhận quà</p>
                  <input required type="password" placeholder="Nhập Pass (Ô H2 sheet danhsach)" className="w-full p-4 bg-orange-50 border-2 border-orange-100 rounded-2xl font-bold outline-none focus:border-orange-300" value={quizPass} onChange={e=>setQuizPass(e.target.value)} />
                </div>
              )}

              <div className="space-y-4">
                <p className="font-black text-slate-400 text-[10px] uppercase border-l-4 border-blue-500 pl-3">Thông tin thí sinh</p>
                <input required placeholder="Họ tên" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={quizInfo.name} onChange={e=>setQuizInfo({...quizInfo, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="Số điện thoại" className="p-4 bg-slate-50 rounded-2xl font-bold" value={quizInfo.phone} onChange={e=>setQuizInfo({...quizInfo, phone: e.target.value})} />
                  <input placeholder="Lớp" className="p-4 bg-slate-50 rounded-2xl font-bold" value={quizInfo.class} onChange={e=>setQuizInfo({...quizInfo, class: e.target.value})} />
                </div>
                <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={quizInfo.schoolType} onChange={e=>setQuizInfo({...quizInfo, schoolType: e.target.value})}>
                  <option value="THPT YD1">THPT Yên Dũng 1</option>
                  <option value="THPT YD2">THPT Yên Dũng 2</option>
                  <option value="Khác">Trường khác (Nhập tay)...</option>
                </select>
                {quizInfo.schoolType === 'Khác' && <input required placeholder="Nhập tên trường" className="w-full p-4 bg-white border-2 border-blue-100 rounded-2xl font-bold" value={quizInfo.schoolOther} onChange={e=>setQuizInfo({...quizInfo, schoolOther: e.target.value})} />}
              </div>

              {quizMode === 'gift' && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <p className="font-black text-slate-400 text-[10px] uppercase border-l-4 border-green-500 pl-3">Thông tin nhận thưởng</p>
                  <input required placeholder="Số tài khoản (STK)" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={bankInfo.stk} onChange={e=>setBankInfo({...bankInfo, stk: e.target.value})} />
                  <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={bankInfo.bankType} onChange={e=>setBankInfo({...bankInfo, bankType: e.target.value})}>
                    <option value="Agribank">Agribank</option>
                    <option value="MB Bank">MB Bank</option>
                    <option value="Vietcombank">Vietcombank</option>
                    <option value="VietinBank">VietinBank</option>
                    <option value="Khác">Khác (Nhập tay)...</option>
                  </select>
                  {bankInfo.bankType === 'Khác' && <input required placeholder="Nhập tên ngân hàng" className="w-full p-4 bg-white border-2 border-green-100 rounded-2xl font-bold" value={bankInfo.bankOther} onChange={e=>setBankInfo({...bankInfo, bankOther: e.target.value})} />}
                </div>
              )}

              <button className={`w-full py-5 text-white rounded-2xl font-black shadow-xl uppercase text-xl transition-all active:scale-95 ${quizMode === 'gift' ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-blue-600'}`}>
                BẮT ĐẦU LÀM BÀI
              </button>
            </form>
            <button onClick={() => setShowQuizModal(null)} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 text-2xl">✕</button>
          </div>
        </div>
      )}

      {/* RATING MODAL WITH STATS */}
      {showRateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-lg">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl border border-slate-100 text-center space-y-6">
            <h3 className="text-xl font-black text-slate-800 uppercase">Đánh giá hệ thống</h3>
            
            {/* Simple Rating Stats Display */}
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase border-b pb-4">
              <div>Tổng: {stats.total}</div>
              <div className="text-yellow-500">5★: {stats[5]}</div>
              <div className="text-blue-500">4★: {stats[4]}</div>
            </div>

            <div className="flex justify-center gap-3 py-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setRating(star)} className="text-4xl transition-transform hover:scale-125 focus:outline-none">
                  {star <= rating ? <span className="text-yellow-400">★</span> : <span className="text-slate-200">★</span>}
                </button>
              ))}
            </div>
            
            <textarea className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm h-24 outline-none focus:ring-2 focus:ring-blue-100" placeholder="Cảm nghĩ của bạn về Web..." value={comment} onChange={e => setComment(e.target.value)}></textarea>
            
            <div className="flex gap-3">
              <button onClick={() => setShowRateModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs">Đóng</button>
              <button onClick={handleRateSubmit} disabled={isSubmittingRate} className="flex-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95">GỬI ĐÁNH GIÁ</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 pt-10 pb-10 border-t border-slate-100 text-center space-y-8 bg-slate-50/50 rounded-t-[3rem]">
        <div className="max-w-xs mx-auto">
          <button onClick={() => setShowRateModal(true)} className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full font-black text-sm shadow-xl hover:scale-105 active:scale-95 border-b-4 border-orange-600 uppercase tracking-widest flex items-center justify-center gap-2">
            <i className="fas fa-star"></i> ĐÁNH GIÁ WEB
          </button>
        </div>
        <div className="flex justify-center gap-10">
          <a href="https://www.facebook.com/hoctoanthayha.bg" target="_blank" rel="noreferrer" className="w-14 h-14 bg-[#1877F2] rounded-2xl text-white flex items-center justify-center text-2xl shadow-lg hover:rotate-12 transition-transform border-b-4 border-blue-900"><i className="fab fa-facebook-f"></i></a>
          <a href="https://zalo.me/0988948882" target="_blank" rel="noreferrer" className="w-14 h-14 bg-[#229ED9] rounded-2xl text-white flex items-center justify-center text-2xl shadow-lg hover:rotate-12 transition-transform border-b-4 border-blue-600"><i className="fab fa-telegram-plane"></i></a>
        </div>
        <div className="text-slate-400 space-y-1">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">© 2025 HỆ THỐNG HỌC TOÁN TRỰC TUYẾN CHUYÊN NGHIỆP</p>
            <p className="text-[9px] font-bold opacity-60 uppercase">Admin: Thầy Hà - THPT Yên Dũng số 2</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

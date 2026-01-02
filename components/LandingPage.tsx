import React, { useState, useEffect } from 'react';
import { NEWS_DATA, IMAGES_CAROUSEL, DANHGIA_URL } from '../config';
import { AppUser, Student } from '../types';

interface LandingPageProps {
  onSelectGrade: (grade: number) => void;
  onSelectQuiz: (num: number, pts: number, quizStudent: Partial<Student>) => void;
  user: AppUser | null;
  onOpenAuth: () => void;
  onOpenVip: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectGrade, onSelectQuiz, user, onOpenAuth, onOpenVip }) => {
  const [currentImg, setCurrentImg] = useState(0);
  const [showQuizModal, setShowQuizModal] = useState<{ num: number, pts: number } | null>(null);
  const [quizInfo, setQuizInfo] = useState({ name: '', class: '', school: '', phone: '' });
  const [bankInfo, setBankInfo] = useState({ stk: '', bankName: '' });
  const [isOtherSchool, setIsOtherSchool] = useState(false);
  const [isOtherBank, setIsOtherBank] = useState(false);
  
  const [showRateModal, setShowRateModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingRate, setIsSubmittingRate] = useState(false);
  const [stats, setStats] = useState<{ ratings: Record<number, number>, top10: any[] }>({
    ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    top10: []
  });

  const fetchStats = async () => {
    try {
      // Thêm tham số _t để phá cache Vercel
      const resp = await fetch(`${DANHGIA_URL}?type=getStats&_t=${Date.now()}`);
      const result = await resp.json();
      if (result.status === "success") {
        setStats(result.data);
      }
    } catch (e) {
      console.error("Lỗi lấy thống kê:", e);
    }
  };

  useEffect(() => {
    fetchStats();
    const statsInterval = setInterval(fetchStats, 30000);
    const imgInterval = setInterval(() => {
      setCurrentImg(prev => (prev + 1) % IMAGES_CAROUSEL.length);
    }, 4000);
    return () => {
      clearInterval(statsInterval);
      clearInterval(imgInterval);
    };
  }, []);

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizInfo.name || !quizInfo.phone) return alert("Vui lòng nhập đầy đủ họ tên và SĐT!");
    if (showQuizModal) {
      onSelectQuiz(showQuizModal.num, showQuizModal.pts, {
        name: quizInfo.name,
        class: quizInfo.class,
        school: quizInfo.school,
        phoneNumber: quizInfo.phone,
        stk: bankInfo.stk,
        bank: bankInfo.bankName
      });
    }
    setShowQuizModal(null);
  };

  const handleRateSubmit = async () => {
    if (isSubmittingRate) return;
    setIsSubmittingRate(true);
    try {
      await fetch(DANHGIA_URL, {
        method: 'POST',
        body: JSON.stringify({
          type: 'rating',
          stars: rating,
          comment: comment,
          name: user?.name || quizInfo.name || "Khách",
          class: user?.class || quizInfo.class || "Tự do",
          idNumber: user?.phoneNumber || "GUEST",
          taikhoanapp: user?.isVip ? "VIP" : "FREE"
        })
      });
      alert(rating >= 4 ? "❤️ Cảm ơn bạn đã đánh giá!" : "😡 Ghi nhận ý kiến, lần sau nhớ 5 sao nhé!");
      setShowRateModal(false);
      setComment("");
      setTimeout(fetchStats, 1500);
    } catch (e) {
      alert("Lỗi gửi đánh giá!");
    } finally {
      setIsSubmittingRate(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12 font-sans overflow-x-hidden">
      
      {/* 1. Thanh chọn Lớp & Quiz (Giữ nguyên phong cách cũ) */}
      <div className="bg-white p-2 rounded-3xl shadow-lg border border-slate-100 mt-4 overflow-hidden">
        <div className="flex flex-nowrap overflow-x-auto gap-3 pb-2 pt-1 px-1 no-scrollbar items-center">
          <div className="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-lg shrink-0 flex flex-col items-center justify-center h-[60px] border-b-4 border-red-800 animate-pulse">
            <span className="font-black text-sm uppercase">Kiểm tra Online →</span>
            <span className="text-[8px] font-bold opacity-90 leading-tight">( Vuốt sang trái ⬅️ )</span>
          </div>
          {[9, 10, 11, 12].map(g => (
            <button key={g} onClick={() => onSelectGrade(g)} className="px-6 bg-blue-600 text-white border-b-4 border-blue-800 rounded-2xl font-black text-sm shrink-0 hover:brightness-110 active:scale-95 transition-all h-[60px] flex items-center justify-center gap-2 min-w-[120px]">
              <i className={`fas ${g === 12 ? 'fa-user-graduate' : 'fa-school'}`}></i> LỚP {g}
            </button>
          ))}
          <button onClick={() => setShowQuizModal({num: 10, pts: 1})} className="px-6 bg-orange-500 text-white border-b-4 border-orange-700 rounded-2xl font-black text-sm shrink-0 hover:brightness-110 h-[60px] uppercase flex items-center justify-center gap-2 min-w-[130px]">
            <i className="fas fa-bolt"></i> QUIZ 10
          </button>
          <button onClick={() => setShowQuizModal({num: 20, pts: 0.5})} className="px-6 bg-orange-500 text-white border-b-4 border-orange-700 rounded-2xl font-black text-sm shrink-0 hover:brightness-110 h-[60px] uppercase flex items-center justify-center gap-2 min-w-[130px]">
            <i className="fas fa-brain"></i> QUIZ 20
          </button>
        </div>
      </div>

      {/* 2. Marquee */}
      <div className="bg-indigo-700 py-3 rounded-2xl overflow-hidden shadow-inner border-b-4 border-indigo-900 mx-1">
        <marquee className="text-white font-black uppercase text-[11px] tracking-widest block w-full">
          ⭐ ⭐ ⭐ ⭐ ⭐ LUYỆN TẬP CHĂM CHỈ MỖI NGÀY ĐỂ BỨT PHÁ ĐIỂM SỐ! &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ⭐ ⭐ ⭐ ⭐ ⭐ LIÊN HỆ: 0988948882 ĐỂ THAM GIA NHÓM VIẾT WEBAPP PHỤC VỤ CÔNG VIỆC NHÉ
        </marquee>
      </div>

      {/* 3. Nội dung chính */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Cột Trái: TOP 10 (Sửa lỗi hiển thị thời gian dài) */}
        <div className="lg:col-span-3 flex flex-col">
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden border-b-4 border-blue-200 h-full flex flex-col">
            <div className="bg-blue-600 p-4 text-white font-black text-[11px] uppercase text-center flex items-center justify-center gap-2">
              <i className="fas fa-crown text-yellow-300"></i> TOP 10 QUIZ TUẦN
            </div>
            <div className="p-2 space-y-1.5 flex-grow bg-slate-50 overflow-y-auto max-h-[420px] custom-scrollbar">
              {stats.top10 && stats.top10.length > 0 ? stats.top10.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm border-l-4 border-l-blue-500">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-black text-slate-800 text-[12px] truncate">
                      {idx + 1}. {item.name ? item.name.split(' ').slice(-2).join(' ') : "Học sinh"}
                    </span>
                    <span className="text-[11px] text-blue-600 font-bold">{item.phone}</span>
                  </div>
                  <div className="text-right flex flex-col shrink-0 items-end justify-center ml-2">
                    <span className="font-black text-red-600 text-[13px]">{(Number(item.score) || 0).toFixed(1)} đ</span>
                    <span className="text-[9px] text-slate-500 mt-1 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                      <i className="far fa-clock mr-1"></i>
                      {item.time?.includes("GMT") ? item.time.split(" ")[4] : item.time}
                    </span>
                  </div>
                </div>
              )) : <div className="p-10 text-center text-slate-400 text-[10px] uppercase font-black italic">Đang tải dữ liệu...</div>}
            </div>
          </div>
        </div>

        {/* Cột Giữa: Carousel (Bo góc cực lớn) */}
        <div className="lg:col-span-7">
          <div className="relative h-64 md:h-full min-h-[420px] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
            {IMAGES_CAROUSEL.map((img, idx) => (
              <img key={idx} src={img} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentImg ? 'opacity-100' : 'opacity-0'}`} alt="Carousel" />
            ))}
            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white font-black text-sm uppercase tracking-widest text-center">Hệ thống học tập chuyên nghiệp - Kết quả bứt phá</p>
            </div>
          </div>
        </div>

        {/* Cột Phải: Nút chức năng (Full icon & color) */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {[
            { label: "Trợ lý học tập", icon: "fas fa-headset", color: "bg-indigo-600", border: "border-indigo-900", link: "https://new-chat-bot-two.vercel.app/" },
            { label: user ? `SĐT: ${user.phoneNumber}` : "Đăng Nhập", icon: "fas fa-sign-in-alt", color: "bg-blue-600", border: "border-blue-900", action: onOpenAuth },
            { label: "Nâng Cấp VIP", icon: "fas fa-gem", color: "bg-orange-500", border: "border-orange-800", action: onOpenVip },
            { label: "Kho Tài Liệu", icon: "fas fa-book-open", color: "bg-teal-600", border: "border-teal-900", link: "https://www.facebook.com/hoctoanthayha.bg" }
          ].map((btn, i) => (
            <button key={i} onClick={btn.action || (() => window.open(btn.link, '_blank'))} className={`w-full flex-1 flex flex-col items-center justify-center gap-1 ${btn.color} text-white rounded-2xl font-black text-[10px] uppercase shadow-md border-b-4 ${btn.border} hover:brightness-110 active:scale-95 transition-all p-2 text-center`}>
              <i className={`${btn.icon} text-xl mb-1`}></i>
              <span className="leading-tight">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Tin tức */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 border-b-8 border-slate-200">
        <h4 className="font-black text-blue-700 uppercase text-xs tracking-widest border-l-4 border-blue-600 pl-4 mb-6">Thông báo hệ thống</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {NEWS_DATA.slice(0, 6).map((news, i) => (
            <a key={i} href={news.link} target="_blank" rel="noreferrer" className="block p-4 bg-slate-50 hover:bg-blue-50 rounded-2xl border border-slate-100 transition-all hover:shadow-md">
              <p className="text-[11px] font-bold text-slate-700 leading-snug line-clamp-2">{news.title}</p>
            </a>
          ))}
        </div>
      </div>

      {/* 5. Footer & Rate Button */}
      <footer className="mt-8 border-t border-slate-200 pt-10 pb-6 text-center space-y-8 bg-slate-50/50 rounded-t-[3rem]">
        <button onClick={() => setShowRateModal(true)} className="px-12 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full font-black text-sm shadow-xl hover:scale-105 active:scale-95 border-b-4 border-orange-600 uppercase tracking-widest">
          ⭐ ĐÁNH GIÁ WEB
        </button>
        <div className="text-slate-400 space-y-1">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">© 2025 KÊNH HỌC TOÁN TRỰC TUYẾN CHUYÊN NGHIỆP</p>
          <p className="text-[9px] font-bold opacity-60 uppercase">@ Nhóm Giáo Viên Toán. Admin: Nguyễn Văn Hà</p>
        </div>
      </footer>

      {/* Modal Quiz (Khôi phục form đầy đủ) */}
      {showQuizModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative border border-slate-100 animate-fade-in">
            <h2 className="text-xl font-black text-orange-500 mb-6 uppercase text-center">Thông tin luyện tập</h2>
            <form onSubmit={handleStartQuiz} className="space-y-4">
              <input required type="text" placeholder="Họ và tên" className="w-full p-4 bg-slate-50 rounded-2xl font-black outline-none focus:ring-2 focus:ring-orange-500" onChange={e=>setQuizInfo({...quizInfo, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Lớp" className="p-4 bg-slate-50 rounded-2xl font-black outline-none" onChange={e=>setQuizInfo({...quizInfo, class: e.target.value})} />
                <input required type="tel" placeholder="SĐT" className="p-4 bg-slate-50 rounded-2xl font-black outline-none" onChange={e=>setQuizInfo({...quizInfo, phone: e.target.value})} />
              </div>
              <button className="w-full py-5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-black shadow-xl uppercase active:scale-95 border-b-4 border-orange-700">Bắt đầu Quiz ngay</button>
            </form>
            <button onClick={() => setShowQuizModal(null)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 text-2xl">✕</button>
          </div>
        </div>
      )}

      {/* Modal Đánh giá (Khôi phục giao diện đẹp) */}
      {showRateModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-lg">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 text-center space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tighter">Đánh giá Web App</h3>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setRating(s)} className={`text-4xl transition-transform ${s <= rating ? 'text-yellow-400 scale-110' : 'text-slate-200'}`}>★</button>
              ))}
            </div>
            <textarea className="w-full p-4 bg-slate-50 rounded-2xl h-24 font-bold outline-none border-2 border-transparent focus:border-indigo-500" placeholder="Mời thầy/bạn nhập ý kiến..." value={comment} onChange={e => setComment(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setShowRateModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black uppercase text-xs">Hủy</button>
              <button onClick={handleRateSubmit} disabled={isSubmittingRate} className="flex-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95">
                {isSubmittingRate ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>
          </div>
        </div>
      )}

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        @keyframes fade-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default LandingPage;

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

  // 1. Hàm lấy dữ liệu thống kê
  const fetchStats = async () => {
    try {
      const resp = await fetch(`${DANHGIA_URL}?type=getStats&t=${Date.now()}`);
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
    const payload = {
      type: 'rating',
      stars: rating, 
      comment: comment,
      name: quizInfo.name || (user?.name || "Khách"),
      class: quizInfo.class || "Tự do",
      // Đảm bảo idNumber và taikhoanapp luôn có giá trị
      idNumber: user?.phoneNumber || "GUEST",
      taikhoanapp: user?.isVip ? "VIP" : "FREE"
    };

    await fetch(DANHGIA_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

      setStats(prev => ({
        ...prev,
        ratings: {
          ...prev.ratings,
          [rating]: (prev.ratings[rating] || 0) + 1
        }
      }));
      // Xử lý thông báo theo số sao
      if (rating >= 4) {
        alert(`❤️ Tuyệt vời! Cảm ơn bạn đã đánh giá ${rating} ⭐. Chúc bạn học tập thật tốt nhé! ❤️`);
      } else {
        // Dưới 4 sao (1, 2, 3 sao)
        alert(`😡 Này! Sao đánh giá có ${rating} ⭐ thôi? Học thì lười mà đánh giá thì khắt khe thế 😡! Thích ăn 👊 à. ❤️ Lần sau nhớ cho 5 sao nghe chưa!`);
      }

      setShowRateModal(false);
      setComment("");
      
    } catch (e) {
      console.error("Lỗi gửi đánh giá:", e);
      alert("Có lỗi xảy ra khi gửi đánh giá!");
    } finally {
      setIsSubmittingRate(false);
    }
  };

  const totalRatings = (Object.values(stats.ratings) as number[]).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-6 pb-12 font-sans overflow-x-hidden">
      {/* 1. Header */}
      <div className="bg-white p-2 rounded-3xl shadow-lg border border-slate-100 mt-4 overflow-hidden">
        <div className="flex flex-nowrap overflow-x-auto gap-3 pb-2 pt-1 px-1 no-scrollbar items-center">
          <div className="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-lg shrink-0 flex flex-col items-center justify-center h-[56px] border-b-4 border-red-800 animate-pulse">
            <span className="font-black text-sm uppercase">Kiểm tra Online →</span>
          </div>
          {[9, 10, 11, 12].map(g => (
            <button key={g} onClick={() => onSelectGrade(g)} className="px-6 bg-blue-600 text-white border-b-4 border-blue-800 rounded-2xl font-black text-sm shrink-0 h-[60px] min-w-[120px]">
              LỚP {g}
            </button>
          ))}
          <button onClick={() => setShowQuizModal({ num: 10, pts: 1 })} className="px-6 bg-orange-500 text-white border-b-4 border-orange-700 rounded-2xl font-black text-sm shrink-0 h-[60px] min-w-[130px]">QUIZ 10</button>
          <button onClick={() => setShowQuizModal({ num: 20, pts: 0.5 })} className="px-6 bg-orange-500 text-white border-b-4 border-orange-700 rounded-2xl font-black text-sm shrink-0 h-[60px] min-w-[130px]">QUIZ 20</button>
        </div>
      </div>

      {/* 2. Marquee */}
      <div className="bg-indigo-700 py-3 rounded-2xl overflow-hidden shadow-inner mx-1">
        <marquee className="text-white font-black uppercase text-[11px] tracking-widest block w-full">
          ⭐ Luyện tập chăm chỉ mỗi ngày để bứt phá điểm số! ⭐ Liên hệ: 0988948882 để tham gia học tập ⭐
        </marquee>
      </div>

      {/* 3. Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Top 10 */}
        <div className="lg:col-span-3 flex flex-col">
          <div className="bg-white rounded-[2rem] shadow-xl border-b-4 border-blue-200 overflow-hidden h-full flex flex-col">
            <div className="bg-blue-600 p-4 text-white font-black text-[11px] text-center uppercase">
              <i className="fas fa-crown text-yellow-300 mr-2"></i> TOP 10 QUIZ TUẦN
            </div>
            <div className="p-2 space-y-1.5 flex-grow bg-slate-50 overflow-y-auto max-h-[420px] custom-scrollbar">
              {stats.top10.length > 0 ? stats.top10.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border-l-4 border-l-blue-500 shadow-sm">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-black text-slate-800 text-[12px] truncate">{idx + 1}. {item.name}</span>
                    <span className="text-[11px] text-blue-600 font-bold">{item.phone}</span>
                  </div>
                  <div className="text-right ml-2">
                    <span className="font-black text-red-600 text-[13px]">{Number(item.score).toFixed(1)} đ</span>
                  </div>
                </div>
              )) : <div className="p-10 text-center text-slate-400 text-xs italic">Đang tải dữ liệu...</div>}
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div className="lg:col-span-7">
          <div className="relative h-64 md:h-full min-h-[420px] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
            {IMAGES_CAROUSEL.map((img, idx) => (
              <img key={idx} src={img} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentImg ? 'opacity-100' : 'opacity-0'}`} />
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <button onClick={onOpenAuth} className="w-full flex-1 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase border-b-4 border-indigo-900 p-4">
            <i className="fas fa-user mb-1 block text-lg"></i> {user ? user.phoneNumber : "Đăng Nhập"}
          </button>
          <button onClick={onOpenVip} className="w-full flex-1 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase border-b-4 border-amber-700 p-4">
            <i className="fas fa-gem mb-1 block text-lg"></i> Nâng cấp VIP
          </button>
        </div>
      </div>

      {/* Footer & Rate Button */}
      <footer className="mt-8 text-center space-y-6">
        <button onClick={() => setShowRateModal(true)} className="px-10 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full font-black shadow-xl uppercase">
          ⭐ ĐÁNH GIÁ WEB
        </button>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">© 2025 KÊNH HỌC TOÁN THẦY HÀ</p>
      </footer>

      {/* Modal Quiz */}
      {showQuizModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative">
            <h2 className="text-xl font-black text-orange-500 mb-6 text-center">THÔNG TIN LUYỆN TẬP</h2>
            <form onSubmit={handleStartQuiz} className="space-y-4">
              <input required placeholder="Họ và tên" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" onChange={e => setQuizInfo({ ...quizInfo, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Lớp" className="p-4 bg-slate-50 rounded-2xl outline-none" onChange={e => setQuizInfo({ ...quizInfo, class: e.target.value })} />
                <input required placeholder="Số điện thoại" className="p-4 bg-slate-50 rounded-2xl outline-none" onChange={e => setQuizInfo({ ...quizInfo, phone: e.target.value })} />
              </div>
              <button className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black">BẮT ĐẦU NGAY</button>
            </form>
            <button onClick={() => setShowQuizModal(null)} className="absolute top-4 right-4 text-2xl">✕</button>
          </div>
        </div>
      )}

      {/* Modal Đánh giá */}
      {showRateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-lg">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 text-center space-y-6">
            <h3 className="text-xl font-black uppercase">Đánh giá ứng dụng</h3>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setRating(s)} className="text-4xl">
                  {s <= rating ? <span className="text-yellow-400">★</span> : <span className="text-slate-200">★</span>}
                </button>
              ))}
            </div>
            <textarea className="w-full p-4 bg-slate-50 rounded-2xl h-24 outline-none" placeholder="Ý kiến của bạn..." value={comment} onChange={e => setComment(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setShowRateModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Đóng</button>
              <button onClick={handleRateSubmit} disabled={isSubmittingRate} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black">
                {isSubmittingRate ? "Đang gửi..." : "Gửi ngay"}
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
      `}</style>
    </div>
  );
};

export default LandingPage;

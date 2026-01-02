
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
  const [quizInfo, setQuizInfo] = useState({ name: '', class: '', phone: '', schoolType: 'YD2', schoolOther: '' });
  const [bankInfo, setBankInfo] = useState({ stk: '', bankType: 'Agribank', bankOther: '' });
  
  const [showRateModal, setShowRateModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("Web tuyệt vời quá thầy ơi! 🔥");
  const [isSubmittingRate, setIsSubmittingRate] = useState(false);
  const [stats, setStats] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [top10, setTop10] = useState<any[]>([]);

  const funnyComments = [
    "Web tuyệt vời quá thầy ơi! 🔥",
    "Giao diện xịn xò, học mãi không chán 😆",
    "Đề khó quá thầy ơi, nhưng mà cuốn! 📚",
    "Thầy Hà đẹp trai nhất trường! 😎",
    "Làm Quiz xong thấy mình thông minh hẳn ra 🧠",
    "Web mượt hơn cả người yêu cũ của em 🚀",
    "Cảm ơn thầy đã tạo ra sân chơi bổ ích ạ! ❤️"
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResp, topResp] = await Promise.all([
          fetch(`${DANHGIA_URL}?type=getStats&t=${Date.now()}`),
          fetch(`${DANHGIA_URL}?type=getTop10&t=${Date.now()}`)
        ]);
        const statsRes = await statsResp.json();
        const topResData = await topResp.json();
        if (statsRes.status === "success") setStats(statsRes.data);
        if (topResData.status === "success") setTop10(topResData.data);
      } catch (e) { console.error("Lỗi fetch data:", e); }
    };
    fetchData();
    const interval = setInterval(() => setCurrentImg(prev => (prev + 1) % IMAGES_CAROUSEL.length), 4000);
    return () => clearInterval(interval);
  }, []);

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizInfo.name || !quizInfo.phone) return alert("Vui lòng nhập đầy đủ thông tin!");
    const finalSchool = quizInfo.schoolType === 'Khác' ? quizInfo.schoolOther : quizInfo.schoolType;
    const finalBank = bankInfo.bankType === 'Khác' ? bankInfo.bankOther : bankInfo.bankType;
    if (showQuizModal) {
      onSelectQuiz(showQuizModal.num, showQuizModal.pts, {
        name: quizInfo.name,
        class: quizInfo.class,
        school: finalSchool,
        phoneNumber: quizInfo.phone,
        stk: bankInfo.stk,
        bank: finalBank
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
      alert(rating >= 4 ? `❤️ Cảm ơn bạn đã đánh giá ${rating} sao! ❤️` : `😡 Này! Sao đánh có ${rating} sao thôi? Thích ăn đấm không? 👊 Lần sau cho 5 sao nghe chưa!`);
      setShowRateModal(false);
    } catch (e) { alert("Lỗi!"); } finally { setIsSubmittingRate(false); }
  };

  const totalRatings = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-6 pb-12 font-sans overflow-x-hidden">
      
      {/* 1. Header Buttons */}
      <div className="bg-white p-2 rounded-3xl shadow-lg border border-slate-100 mt-4 overflow-hidden">
        <div className="flex flex-nowrap overflow-x-auto gap-3 pb-2 pt-1 px-1 no-scrollbar items-center">
          <div className="flex flex-col items-center shrink-0">
            <div className="bg-red-600 text-white px-6 rounded-2xl shadow-lg flex items-center justify-center h-[60px] border-b-4 border-red-800 animate-pulse">
              <span className="font-black text-sm uppercase">Kiểm tra Online →</span>
            </div>
            <div className="md:hidden text-[8px] font-black text-red-500 mt-1 flex items-center gap-1">
              <i className="fas fa-arrow-left"></i> Vuốt sang trái để xem tiếp
            </div>
          </div>
          {[9, 10, 11, 12].map(g => (
            <button key={g} onClick={() => onSelectGrade(g)} className="px-6 bg-blue-600 text-white border-b-4 border-blue-800 rounded-2xl font-black text-sm h-[60px] flex items-center gap-2 min-w-[120px]">
              <i className="fas fa-graduation-cap"></i> LỚP {g}
            </button>
          ))}
          <button onClick={() => setShowQuizModal({num: 10, pts: 1})} className="px-6 bg-orange-500 text-white border-b-4 border-orange-700 rounded-2xl font-black text-sm h-[60px] flex items-center gap-2 min-w-[130px]">
            <i className="fas fa-bolt"></i> QUIZ 10
          </button>
          <button onClick={() => setShowQuizModal({num: 20, pts: 0.5})} className="px-6 bg-orange-500 text-white border-b-4 border-orange-700 rounded-2xl font-black text-sm h-[60px] flex items-center gap-2 min-w-[130px]">
            <i className="fas fa-brain"></i> QUIZ 20
          </button>
        </div>
      </div>

      {/* 2. Marquee */}
      <div className="bg-indigo-700 py-3 rounded-2xl overflow-hidden shadow-inner border-b-4 border-indigo-900 mx-1">
        <div className="animate-marquee whitespace-nowrap text-white font-black uppercase text-[11px] tracking-widest">
          ⭐ Chào mừng các bạn đến với Hệ thống học tập trực tuyến môn Toán ! &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          ⭐ Luyện tập chăm chỉ mỗi ngày để bứt phá điểm số! &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
          ⭐ Ngân hàng câu hỏi sẽ thường xuyên được cập nhật để nâng cao hiệu quả ôn tập của học sinh. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          ⭐ Liên hệ: 0988948882 để tham gia nhóm viết Webapp phục vụ công việc nhé ⭐ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </div>
      </div>

      {/* 3. Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* TOP 10 */}
        <div className="lg:col-span-3 flex flex-col">
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden h-full flex flex-col">
            <div className="bg-blue-600 p-4 text-white font-black text-xs uppercase text-center flex items-center justify-center gap-2">
               <i className="fas fa-crown text-yellow-300"></i> TOP 10 QUIZ TUẦN
            </div>
            <div className="p-2 space-y-2 flex-grow bg-slate-50 overflow-y-auto max-h-[500px] custom-scrollbar">
              {top10.length > 0 ? top10.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex gap-3 items-center min-w-0 flex-1">
                    <span className="text-xl shrink-0">
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
              )) : <p className="text-center p-10 text-slate-400 font-black text-[10px] uppercase">Đang tải bảng xếp hạng...</p>}
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
          <button onClick={onOpenAuth} className="w-full flex-1 flex flex-col items-center justify-center gap-1 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-md p-2">
            <i className="fas fa-sign-in-alt text-xl mb-1"></i>
            <span>{user ? `SĐT: ${user.phoneNumber}` : "ĐĂNG NHẬP"}</span>
          </button>
          
          <div className="relative group w-full flex-1">
            <button className="w-full h-full flex flex-col items-center justify-center gap-1 bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase shadow-md p-2">
              <i className="fas fa-th-large text-xl mb-1"></i>
              <span>Ứng dụng khác</span>
            </button>
            <div className="absolute left-0 bottom-full mb-2 w-full bg-white rounded-xl shadow-2xl p-2 hidden group-hover:block z-50 animate-fade-in border border-slate-100">
              <a href="https://new-chat-bot-two.vercel.app/" target="_blank" className="block p-3 hover:bg-slate-50 rounded-lg text-slate-700 font-black text-[10px] uppercase border-b border-slate-100">🔥 Trợ lý học tập</a>
              <a href="https://www.facebook.com/hoctoanthayha.bg" target="_blank" className="block p-3 hover:bg-slate-50 rounded-lg text-slate-700 font-black text-[10px] uppercase">💎 Group ôn thi</a>
            </div>
          </div>

          <button onClick={onOpenVip} className="w-full flex-1 flex flex-col items-center justify-center gap-1 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase shadow-md p-2">
            <i className="fas fa-gem text-xl mb-1"></i>
            <span>NÂNG CẤP VIP</span>
          </button>

          <button onClick={() => window.open('https://www.facebook.com/hoctoanthayha.bg', '_blank')} className="w-full flex-1 flex flex-col items-center justify-center gap-1 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-md p-2">
            <i className="fas fa-book-open text-xl mb-1"></i>
            <span>KHO TÀI LIỆU</span>
          </button>
        </div>
      </div>

      {/* Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative border border-slate-100 animate-fade-in custom-scrollbar overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black text-orange-500 mb-8 uppercase text-center">THÔNG TIN LUYỆN TẬP</h2>
            <form onSubmit={handleStartQuiz} className="space-y-8">
              <div className="space-y-4">
                <p className="font-black text-slate-400 text-[10px] uppercase tracking-widest border-l-4 border-orange-500 pl-2">PHẦN 1: THÔNG TIN THÍ SINH</p>
                <input required placeholder="Họ và tên" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-orange-200" value={quizInfo.name} onChange={e=>setQuizInfo({...quizInfo, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="Số điện thoại" className="p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-orange-200" value={quizInfo.phone} onChange={e=>setQuizInfo({...quizInfo, phone: e.target.value})} />
                  <input placeholder="Lớp" className="p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-orange-200" value={quizInfo.class} onChange={e=>setQuizInfo({...quizInfo, class: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400">TRƯỜNG HỌC</p>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-orange-200" value={quizInfo.schoolType} onChange={e=>setQuizInfo({...quizInfo, schoolType: e.target.value})}>
                    <option value="THPT YD1">THPT Yên Dũng 1</option>
                    <option value="THPT YD2">THPT Yên Dũng 2</option>
                    <option value="Khác">Khác (Nhập tay)</option>
                  </select>
                  {quizInfo.schoolType === 'Khác' && <input required placeholder="Nhập tên trường của bạn" className="w-full p-4 bg-white border-2 border-orange-100 rounded-2xl font-bold" value={quizInfo.schoolOther} onChange={e=>setQuizInfo({...quizInfo, schoolOther: e.target.value})} />}
                </div>
              </div>

              <div className="space-y-4">
                <p className="font-black text-slate-400 text-[10px] uppercase tracking-widest border-l-4 border-green-500 pl-2">PHẦN 2: THÔNG TIN NHẬN THƯỞNG</p>
                <input placeholder="Số tài khoản (STK)" className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={bankInfo.stk} onChange={e=>setBankInfo({...bankInfo, stk: e.target.value})} />
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400">NGÂN HÀNG</p>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={bankInfo.bankType} onChange={e=>setBankInfo({...bankInfo, bankType: e.target.value})}>
                    <option value="Agribank">Agribank</option>
                    <option value="MB Bank">MB Bank</option>
                    <option value="Vietcombank">Vietcombank</option>
                    <option value="ViettinBank">ViettinBank</option>
                    <option value="Khác">Khác (Nhập tay)</option>
                  </select>
                  {bankInfo.bankType === 'Khác' && <input required placeholder="Nhập tên ngân hàng" className="w-full p-4 bg-white border-2 border-green-100 rounded-2xl font-bold" value={bankInfo.bankOther} onChange={e=>setBankInfo({...bankInfo, bankOther: e.target.value})} />}
                </div>
              </div>
              <button className="w-full py-5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-black shadow-xl uppercase active:scale-95 border-b-4 border-orange-700 text-xl">VÀO LÀM QUIZ</button>
            </form>
            <button onClick={() => setShowQuizModal(null)} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors text-2xl">✕</button>
          </div>
        </div>
      )}

      {/* Rate Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-lg">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl border border-slate-100 text-center space-y-6">
            <h3 className="text-xl font-black text-slate-800 uppercase">Đánh giá hệ thống</h3>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setRating(star)} className="text-4xl transition-transform hover:scale-125">
                  {star <= rating ? <span className="text-yellow-400">★</span> : <span className="text-slate-200">★</span>}
                </button>
              ))}
            </div>
            <select className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none" value={comment} onChange={e => setComment(e.target.value)}>
              {funnyComments.map((c, i) => <option key={i} value={c}>{c}</option>)}
              <option value="Tùy chỉnh">Khác (Nhập tay)</option>
            </select>
            {comment === "Tùy chỉnh" && <textarea className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm h-24" placeholder="Cảm nghĩ của bạn..." onChange={e => setComment(e.target.value)}></textarea>}
            <button onClick={handleRateSubmit} disabled={isSubmittingRate} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg uppercase active:scale-95 border-b-4 border-indigo-800">GỬI ĐÁNH GIÁ</button>
            <button onClick={() => setShowRateModal(false)} className="text-slate-400 text-[10px] font-black uppercase hover:text-red-500">Bỏ qua</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;

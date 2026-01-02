import React, { useState, useEffect } from 'react';
import { NEWS_DATA, IMAGES_CAROUSEL, DANHGIA_URL } from '../config';
import { AppUser, Student } from '../types';
const FUN_COMMENTS = [
  "Đề hay và QuiZ quá thầy ơi! 🔥", 
  "10 điểm không có nhưng! 💎", 
  "App xịn, học toán cực cuốn 🤣", 
  "Cảm ơn thầy vì những bộ đề chất lượng ❤️"
];

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
  const [bankInfo, setBankInfo] = useState({ stk: '', bankName: '' });
  const [isOtherSchool, setIsOtherSchool] = useState(false);
  const [isOtherBank, setIsOtherBank] = useState(false);
  
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
        // Thêm t=${Date.now()} để tránh bị Google lưu cache kết quả cũ
        const resp = await fetch(`${DANHGIA_URL}?type=getStats&t=${Date.now()}`);
        const result = await resp.json();
        if (result.status === "success") {
          setStats(result.data);
        }
      } catch (e) {
        console.error("Lỗi lấy thống kê:", e);
      }
    };

    fetchStats();
    
    // Cứ 30 giây tự cập nhật bảng xếp hạng 1 lần
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
      
      {/* 1. Header: Nút chọn lớp & Quiz */}
      <div className="bg-white p-2 rounded-3xl shadow-lg border border-slate-100 mt-4 overflow-hidden">
        <div className="flex flex-nowrap overflow-x-auto gap-3 pb-2 pt-1 px-1 no-scrollbar items-center">
          <div className="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-lg shrink-0 flex flex-col items-center justify-center h-[56px] whitespace-nowrap border-b-4 border-red-800 animate-pulse">
            <span className="font-black text-sm uppercase">Kiểm tra Online →</span>
            <span className="text-[8px] font-bold opacity-90 leading-tight">( Trên ĐT vuốt sang trái ⬅️ )</span>
          </div>          
          {[
            {g: 9, icon: 'fas fa-graduation-cap'},
            {g: 10, icon: 'fas fa-school'},
            {g: 11, icon: 'fas fa-university'},
            {g: 12, icon: 'fas fa-user-graduate'}
          ].map(item => (
            <button key={item.g} onClick={() => onSelectGrade(item.g)} className="px-6 bg-blue-600 text-white border-b-4 border-blue-800 rounded-2xl font-black text-sm shrink-0 hover:brightness-110 active:scale-95 transition-all h-[60px] flex items-center justify-center gap-2 min-w-[120px]">
              <i className={item.icon}></i> LỚP {item.g}
            </button>
          ))}
          <button onClick={() => setShowQuizModal({num: 10, pts: 1})} className="px-6 bg-orange-500 text-white border-b-4 border-orange-700 rounded-2xl font-black text-sm shrink-0 hover:brightness-110 h-[60px] uppercase whitespace-nowrap flex items-center justify-center gap-2 min-w-[130px]">
            <i className="fas fa-bolt"></i> QUIZ 10
          </button>
          <button onClick={() => setShowQuizModal({num: 20, pts: 0.5})} className="px-6 bg-orange-500 text-white border-b-4 border-orange-700 rounded-2xl font-black text-sm shrink-0 hover:brightness-110 h-[60px] uppercase whitespace-nowrap flex items-center justify-center gap-2 min-w-[130px]">
            <i className="fas fa-brain"></i> QUIZ 20
          </button>
        </div>
      </div>

      {/* 2. Marquee thông báo */}
      <div className="bg-indigo-700 py-3 rounded-2xl overflow-hidden shadow-inner border-b-4 border-indigo-900 mx-1"> {/* PHẦN 1: CHỮ CHẠY - Dùng thẻ marquee để đảm bảo luôn hoạt động */} <marquee className="text-white font-black uppercase text-[11px] tracking-widest block w-full"> 
      ⭐ ⭐ ⭐ ⭐ ⭐ Luyện tập chăm chỉ mỗi ngày để bứt phá điểm số! &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
      ⭐ ⭐ ⭐ ⭐ ⭐   Liên hệ: 0988948882 để tham gia nhóm viết Webapp phục vụ công việc nhé ⭐ ⭐ ⭐ ⭐ ⭐ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</marquee> {/* Khoảng cách nhỏ */} 
<div className="h-2"></div>
</div>

      {/* 3. Khối nội dung chính */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
       {/* 1. CẬP NHẬT CỘT TRÁI: TOP 10 QUIZ */}
<div className="lg:col-span-3 flex flex-col">
  <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden border-b-4 border-blue-200 h-full flex flex-col">
    <div className="bg-blue-600 p-4 text-white font-black text-[11px] uppercase text-center flex items-center justify-center gap-2">
       <i className="fas fa-crown text-yellow-300"></i> TOP 10 QUIZ TUẦN
    </div>
   {/* Phần hiển thị Top 10 trong LandingPage.tsx */}
{/* Phần hiển thị Top 10 mới - Gọn và Rõ nét */}
<div className="p-2 space-y-1.5 flex-grow bg-slate-50 overflow-y-auto max-h-[420px] custom-scrollbar">
  {stats.top10 && stats.top10.length > 0 ? (
    stats.top10.map((item, idx) => {
      // Hàm xử lý cắt bỏ phần GMT... chỉ lấy HH:mm:ss hoặc mm:ss
      const formatTimeShort = (timeStr: any) => {
        if (!timeStr) return "00:00";
        const s = String(timeStr);
        // Nếu chứa chuỗi GMT thì chỉ lấy phần thời gian ở đầu
        if (s.includes("GMT")) return s.split(" ")[4] || s.slice(0, 8);
        return s;
      };

      return (
        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm border-l-4 border-l-blue-500">
          {/* Cột Trái: Thứ hạng và Tên (Tên có thể ẩn bớt để bảo mật) */}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-black text-slate-800 text-[12px] truncate">
              {idx + 1}. {item?.name ? item.name.split(' ').slice(-2).join(' ') : "Học sinh"} 
            </span>
            <span className="text-[11px] text-blue-600 font-bold">
              {item?.phone || "09xxx****"}
            </span>
          </div>

          {/* Cột Phải: Điểm và Thời gian (Ngang hàng, rõ nét) */}
          <div className="text-right flex flex-col shrink-0 items-end justify-center ml-2">
            <span className="font-black text-red-600 text-[13px] leading-none">
              {(Number(item?.score) || 0).toFixed(1)} đ
            </span>
            <span className="text-[10px] text-slate-500 mt-1 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
              <i className="far fa-clock mr-1"></i>
              {formatTimeShort(item?.time)}
            </span>
          </div>
        </div>
      );
    })
  ) : (
    <div className="p-10 text-center text-slate-400 text-[10px] uppercase font-black italic">
      Đang tải dữ liệu...
    </div>
  )}
  </div>
</div>


        {/* CỘT GIỮA: ẢNH CAROUSEL */}
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

        {/* CỘT PHẢI: NÚT CHỨC NĂNG */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {[
            { label: "Trợ lý học tập", icon: "fas fa-headset", link: "https://new-chat-bot-two.vercel.app/" },
            { label: "Đăng ký học Toán", icon: "fas fa-users", link: "https://www.facebook.com/hoctoanthayha.bg" },
            { label: user ? `SĐT: ${user.phoneNumber}` : "Đăng Nhập", icon: "fas fa-sign-in-alt", action: onOpenAuth },
            { label: "Nâng Cấp VIP", icon: "fas fa-gem", action: onOpenVip },
            { label: "Kho Tài Liệu", icon: "fas fa-book-open", link: "https://www.facebook.com/hoctoanthayha.bg" }
            
          ].map((btn, i) => (
            <button 
              key={i} 
              onClick={btn.action || (() => window.open(btn.link, '_blank'))}
              className="w-full flex-1 flex flex-col items-center justify-center gap-1 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-md border-b-4 border-indigo-900 hover:brightness-110 transition-all p-2 text-center"
            >
              <i className={`${btn.icon} text-lg mb-1`}></i>
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
              <p className="text-[11px] font-bold text-slate-700 leading-snug line-clamp-2"> {news.title}</p>
            </a>
          ))}
        </div>
      </div>

      {/* 5. Footer */}
      <footer className="mt-8 border-t border-slate-200 pt-10 pb-6 text-center space-y-8 bg-slate-50/50 rounded-t-[3rem]">
        <div className="max-w-xs mx-auto">
          <button onClick={() => setShowRateModal(true)} className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full font-black text-sm shadow-xl hover:scale-105 transition-all active:scale-95 border-b-4 border-orange-600 uppercase tracking-widest flex items-center justify-center gap-2">
            <span className="text-xl">⭐</span> ĐÁNH GIÁ WEB
          </button>
        </div>
        <div className="flex justify-center gap-8">
          {[
            { id: 'fb', icon: 'fa-facebook-f', color: '#1877F2', link: 'https://www.facebook.com/hoctoanthayha.bg' },
            { id: 'tw', icon: 'fa-twitter', color: '#1DA1F2', link: 'https://x.com/Math_teacher_Ha' },
            { id: 'tg', icon: 'fa-telegram-plane', color: '#229ED9', link: 'https://www.telegram.org' }
          ].map((social) => (
            <a key={social.id} href={social.link} target="_blank" rel="noreferrer" style={{ backgroundColor: social.color }}
              className="w-12 h-12 rounded-2xl text-white flex items-center justify-center text-xl shadow-lg hover:rotate-12 hover:scale-110 transition-all border-b-4 border-black/20"
            >
              <i className={`fab ${social.icon}`}></i>
            </a>
          ))}
        </div>
        <div className="text-slate-400 space-y-1">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">© 2025 KÊNH HỌC TOÁN TRỰC TUYẾN CHUYÊN NGHIỆP</p>
            <p className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">@ Nhóm Giáo Viên Toán. Admin: Nguyễn Văn Hà</p>
        </div>
      </footer>

      {/* Modals */}
      {/* 5. Modals */}
      {showQuizModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative border border-slate-100 animate-fade-in">
            <h2 className="text-2xl font-black text-orange-500 mb-6 uppercase tracking-tighter text-center">Thông tin luyện tập</h2>
            <form onSubmit={handleStartQuiz} className="space-y-4">
              <input required type="text" placeholder="Họ và tên" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-black outline-none focus:ring-2 focus:ring-orange-500" value={quizInfo.name} onChange={e=>setQuizInfo({...quizInfo, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Lớp" className="p-4 bg-slate-50 rounded-2xl border-none font-black outline-none focus:ring-2 focus:ring-orange-500" value={quizInfo.class} onChange={e=>setQuizInfo({...quizInfo, class: e.target.value})} />
                <input required type="tel" placeholder="Số điện thoại" className="p-4 bg-slate-50 rounded-2xl border-none font-black outline-none focus:ring-2 focus:ring-orange-500" value={quizInfo.phone} onChange={e=>setQuizInfo({...quizInfo, phone: e.target.value})} />
              </div>

              {!isOtherSchool ? (
                <select className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-orange-500"
                  onChange={(e) => e.target.value === "Khác" ? setIsOtherSchool(true) : setQuizInfo({ ...quizInfo, school: e.target.value })}>
                  <option value="">Chọn trường học</option>
                  <option value="THPT YD1">THPT YD1</option>
                  <option value="THPT YD2">THPT YD2</option>
                  <option value="Khác">Trường khác (Nhập tay...)</option>
                </select>
              ) : (
                <input autoFocus type="text" placeholder="Nhập tên trường của bạn" className="w-full p-4 bg-blue-50 rounded-2xl border-2 border-blue-200 font-bold outline-none"
                  onChange={e => setQuizInfo({ ...quizInfo, school: e.target.value })} />
              )}

              <div className="p-4 bg-orange-50 rounded-2xl space-y-3 border border-orange-100">
                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest text-center">Thông tin Bank nhận thưởng</p>
                <input type="text" placeholder="Số tài khoản" className="w-full p-4 bg-white rounded-2xl border-none font-bold outline-none" value={bankInfo.stk} onChange={e => setBankInfo({ ...bankInfo, stk: e.target.value })} />
                {!isOtherBank ? (
                  <select className="w-full p-4 bg-white rounded-2xl border-none font-bold outline-none" onChange={(e) => e.target.value === "Khác" ? setIsOtherBank(true) : setBankInfo({ ...bankInfo, bankName: e.target.value })}>
                    <option value="">Chọn ngân hàng</option>
                    <option value="Agribank">Agribank</option>
                    <option value="MB Bank">MB Bank</option>
                    <option value="Techcombank">Techcombank</option>
                    <option value="Vietcombank">Vietcombank</option>
                    <option value="Viettinbank">Vietinbank</option>
                    <option value="Khác">Ngân hàng khác...</option>
                  </select>
                ) : (
                  <input autoFocus type="text" placeholder="Tên ngân hàng" className="w-full p-4 bg-white rounded-2xl border-2 border-orange-200 font-bold outline-none" onChange={e => setBankInfo({ ...bankInfo, bankName: e.target.value })} />
                )}
              </div>
              <button className="w-full py-5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-black shadow-xl uppercase active:scale-95 border-b-4 border-orange-700 mt-4 text-xl tracking-tighter">Bắt đầu Quiz ngay</button>
            </form>
            <button onClick={() => setShowQuizModal(null)} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors text-2xl">✕</button>
          </div>
        </div>
      )}

      {showRateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-lg">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl border border-slate-100 text-center space-y-5">
            <h3 className="text-xl font-black text-slate-800 uppercase italic">Đánh giá hệ thống</h3>
            
            <div className="flex flex-wrap justify-center gap-2">
              {FUN_COMMENTS.map((txt, i) => (
                <button 
                  key={i} 
                  type="button"
                  onClick={() => setComment(txt)}
                  className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all"
                >
                  {txt}
                </button>
              ))}
            </div>

            <textarea 
              className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-24" 
              placeholder="Gõ thêm ý kiến của bạn tại đây..." 
              value={comment} 
              onChange={e => setComment(e.target.value)}
            ></textarea>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowRateModal(false)}
                className="flex-1 py-3 bg-gray-200 rounded-xl font-bold"
              >
                Hủy
              </button>
              <button 
                onClick={handleRateSubmit}
                disabled={isSubmittingRate}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200"
              >
                {isSubmittingRate ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>
          </div>
        </div>
      )}

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
    </div>
  );
};

export default LandingPage;



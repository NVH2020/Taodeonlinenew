
import React, { useState, useEffect } from 'react';
import { NEWS_DATA, IMAGES_CAROUSEL } from '../config';
import { AppUser, Student } from '../types';

// Dữ liệu mẫu TOP 10 cho Leaderboard theo format mới
const MOCK_LEADERBOARD = Array.from({ length: 10 }, (_, i) => ({
  rank: i + 1,
  name: i === 0 ? "Nguyễn Văn Hà" : `Học sinh ${i + 1}`,
  phone: "09xxx" + Math.floor(1000 + Math.random() * 9000).toString().slice(-4),
  score: 10.0 - (i * 0.2),
  time: `0${4 + i}:20`
}));

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImg(prev => (prev + 1) % IMAGES_CAROUSEL.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizInfo.name || !quizInfo.phone) return alert("Vui lòng nhập đầy đủ họ tên và SĐT!");
    if (showQuizModal) {
      onSelectQuiz(showQuizModal.num, showQuizModal.pts, {
        name: quizInfo.name,
        class: quizInfo.class,
        school: quizInfo.school,
        phoneNumber: quizInfo.phone
      });
    }
    setShowQuizModal(null);
  };

  return (
    <div className="flex flex-col gap-6 pb-12 font-sans overflow-x-hidden">
      
      {/* 1. Header: Nút chọn lớp & Quiz */}
      <div className="bg-white p-2 rounded-3xl shadow-lg border border-slate-100 mt-4 overflow-hidden">
        <div className="flex flex-nowrap overflow-x-auto gap-3 pb-2 pt-1 px-1 no-scrollbar items-center">
          <div className="bg-red-600 text-white px-6 py-4 rounded-2xl font-black text-sm shadow-lg shrink-0 flex items-center h-[56px] whitespace-nowrap border-b-4 border-red-800 animate-pulse uppercase">
            Kiểm tra Online →
          </div>
          {[9, 10, 11, 12].map(g => (
            <button key={g} onClick={() => onSelectGrade(g)} className="px-5 py-3 bg-blue-600 text-white border-b-4 border-blue-800 rounded-2xl font-black text-sm shrink-0 hover:brightness-110 active:scale-95 transition-all h-[56px]">
              LỚP {g}
            </button>
          ))}
          <button onClick={() => setShowQuizModal({num: 10, pts: 1})} className="px-5 py-3 bg-orange-500 text-white border-b-4 border-orange-700 rounded-2xl font-black text-sm shrink-0 hover:brightness-110 h-[56px] uppercase whitespace-nowrap">
            Quiz 10 Câu
          </button>
          <button onClick={() => setShowQuizModal({num: 20, pts: 0.5})} className="px-5 py-3 bg-orange-500 text-white border-b-4 border-orange-700 rounded-2xl font-black text-sm shrink-0 hover:brightness-110 h-[56px] uppercase whitespace-nowrap">
            Quiz 20 Câu
          </button>
        </div>
      </div>

      {/* 2. Marquee thông báo */}
      <div className="bg-indigo-700 py-3 rounded-2xl overflow-hidden shadow-inner border-b-4 border-indigo-900 mx-1">
        <div className="animate-marquee whitespace-nowrap text-white font-black uppercase text-[11px] tracking-widest">
          Chào mừng các bạn đến với Hệ thống học tập trực tuyến môn Toán ! &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          Luyện tập chăm chỉ mỗi ngày để bứt phá điểm số! &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Ngân hàng câu hỏi sẽ thường xuyên được cập nhật để nâng cao hiệu quả ôn tập của học sinh. Liên hệ: 0988948882 !!! &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </div>
      </div>

      {/* 3. Khối nội dung chính */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* CỘT TRÁI: TOP QUIZ (Tinh gọn) */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden border-b-4 border-blue-200 h-full flex flex-col">
            <div className="bg-blue-600 p-4 text-white font-black text-xs uppercase text-center">
               🏆 TOP 10 QUIZ TUẦN
            </div>
            <div className="p-2 space-y-1 flex-grow bg-slate-50 overflow-y-auto max-h-[420px] custom-scrollbar">
              {MOCK_LEADERBOARD.map((item) => (
                <div key={item.rank} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-800 text-[11px] truncate w-32">{item.rank}. {item.name}</span>
                    <span className="text-[9px] text-slate-400 font-bold">{item.phone}</span>
                  </div>
                  <div className="text-right flex flex-col">
                    <span className="font-black text-blue-600 text-xs">{item.score.toFixed(1)}đ</span>
                    <span className="text-[9px] text-slate-400 italic">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CỘT GIỮA: ẢNH CAROUSEL */}
        <div className="lg:col-span-5">
          <div className="relative h-64 md:h-full min-h-[420px] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
            {IMAGES_CAROUSEL.map((img, idx) => (
              <img key={idx} src={img} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentImg ? 'opacity-100' : 'opacity-0'}`} alt="Carousel" />
            ))}
            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white font-black text-sm uppercase tracking-widest italic text-center">Học Tập Sáng Tạo</p>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: NÚT CHỨC NĂNG */}
        <div className="lg:col-span-3 flex flex-col gap-3 justify-between">
          {[
            { label: "Đăng ký học Toán", link: "https://www.facebook.com/groups/toanthpthaiduong" },
            { label: user ? `Chào, ${user.phoneNumber}` : "Đăng nhập hệ thống", action: onOpenAuth },
            { label: "Nâng cấp tài khoản VIP", action: onOpenVip },
            { label: "Kho tài liệu học tập", link: "https://www.facebook.com/groups/toanthpthaiduong" },
            { label: "Hỗ trợ học sinh 24/7", link: "https://www.facebook.com/groups/toanthpthaiduong" }
          ].map((btn, i) => (
            <button 
              key={i} 
              onClick={btn.action || (() => window.open(btn.link, '_blank'))}
              className="w-full h-full min-h-[65px] bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase shadow-md border-b-4 border-indigo-900 hover:brightness-110 hover:-translate-y-1 transition-all flex items-center justify-center text-center px-4 leading-tight"
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Tin tức */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 border-b-8 border-slate-200">
        <h4 className="font-black text-blue-700 uppercase text-xs tracking-widest border-l-4 border-blue-600 pl-4 mb-6 italic">Thông báo mới nhất</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {NEWS_DATA.slice(0, 6).map((news, i) => (
            <a key={i} href={news.link} target="_blank" rel="noreferrer" className="block p-4 bg-slate-50 hover:bg-blue-50 rounded-2xl border border-slate-100 transition-all hover:shadow-md">
              <p className="text-[11px] font-bold text-slate-700 leading-snug line-clamp-2"> {news.title}</p>
            </a>
          ))}
        </div>
      </div>

      {/* 5. Footer mới cập nhật */}
      <footer className="mt-8 border-t border-slate-200 pt-10 pb-6 text-center space-y-8 bg-slate-50/50 rounded-t-[3rem]">
        <div className="max-w-xs mx-auto">
          <button className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full font-black text-sm shadow-xl hover:scale-105 transition-all active:scale-95 border-b-4 border-orange-600 uppercase tracking-widest flex items-center justify-center gap-2">
            <span className="text-xl">⭐</span> ĐÁNH GIÁ CHÚNG TÔI
          </button>
        </div>

        <div className="flex justify-center gap-8">
          {[
            { id: 'fb', icon: 'fa-facebook-f', color: '#1877F2', link: '#' },
            { id: 'tw', icon: 'fa-twitter', color: '#1DA1F2', link: '#' },
            { id: 'tg', icon: 'fa-telegram-plane', color: '#229ED9', link: '#' }
          ].map((social) => (
            <a 
              key={social.id} 
              href={social.link} 
              target="_blank" 
              rel="noreferrer" 
              style={{ backgroundColor: social.color }}
              className="w-14 h-14 rounded-2xl text-white flex items-center justify-center text-2xl shadow-lg hover:rotate-12 hover:scale-110 transition-all border-b-4 border-black/20"
            >
              <i className={`fab ${social.icon}`}></i>
            </a>
          ))}
        </div>

        <div className="text-slate-400 space-y-1">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">© 2025 KÊNH HỌC TOÁN CHUYÊN NGHIỆP</p>
            <p className="text-[9px] font-bold opacity-60 italic uppercase tracking-tighter">THPT Yên Dũng số 2 - Bắc Giang • Admin: Nguyễn Văn Hà</p>
        </div>
      </footer>

      {/* Modal nhập thông tin Quiz */}
      {showQuizModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-fade-in relative border border-slate-100">
            <h2 className="text-2xl font-black text-orange-500 mb-6 uppercase tracking-tighter text-center">THÔNG TIN LUYỆN TẬP</h2>
            <form onSubmit={handleStartQuiz} className="space-y-4">
              <input required type="text" placeholder="Họ và tên" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-orange-500" value={quizInfo.name} onChange={e=>setQuizInfo({...quizInfo, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Lớp" className="p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-orange-500" value={quizInfo.class} onChange={e=>setQuizInfo({...quizInfo, class: e.target.value})} />
                <input required type="tel" placeholder="SĐT liên hệ" className="p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-orange-500" value={quizInfo.phone} onChange={e=>setQuizInfo({...quizInfo, phone: e.target.value})} />
              </div>
              <input type="text" placeholder="Trường học" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-orange-500" value={quizInfo.school} onChange={e=>setQuizInfo({...quizInfo, school: e.target.value})} />
              
              <button className="w-full py-5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-black shadow-xl uppercase active:scale-95 border-b-4 border-orange-700 mt-4 text-xl tracking-tighter">
                VÀO LUYỆN TẬP
              </button>
            </form>
            <button onClick={() => setShowQuizModal(null)} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors text-2xl">✕</button>
          </div>
        </div>
      )}

      {/* CSS Styles */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
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

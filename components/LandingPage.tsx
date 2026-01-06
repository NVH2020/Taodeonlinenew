import React, { useState } from 'react';
import { AppUser, NewsItem } from './types';
import { GRADES, NEWS_DATA, IMAGES_CAROUSEL } from './config';

interface LandingPageProps {
  user: AppUser | null;
  onOpenAuth: () => void;
  onOpenVip: () => void;
  onSelectGrade: (grade: number) => void;
  onSelectQuiz: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ 
  user, onOpenAuth, onOpenVip, onSelectGrade, onSelectQuiz 
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Header & Auth Section */}
      <div className="max-w-6xl mx-auto p-4 flex gap-3">
        <button 
          onClick={onOpenAuth}
          className={`flex-1 py-4 rounded-[2rem] font-black text-xs uppercase shadow-lg transition-all active:scale-95 border-b-4 
            ${user?.vip === 'Vip1' 
              ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-500 text-white border-orange-700 shadow-yellow-200' 
              : 'bg-indigo-600 text-white border-indigo-900'}`}
        >
          <i className={`fas ${user ? 'fa-user-check' : 'fa-sign-in-alt'} mb-1 text-lg`}></i><br/>
          {user ? `${user.phoneNumber} [${user.vip}]` : "Đăng Nhập"}
        </button>

        <button 
          onClick={onOpenVip}
          className="flex-1 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-[2rem] font-black text-xs uppercase shadow-lg border-b-4 border-orange-700 active:scale-95"
        >
          <i className="fas fa-crown mb-1 text-lg"></i><br/>
          {user?.vip === 'Vip1' ? "QUYỀN LỢI VIP" : "Nâng Cấp VIP"}
        </button>
      </div>

      {/* Hero Carousel */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="relative h-48 md:h-80 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white">
          <img src={IMAGES_CAROUSEL[currentSlide]} alt="banner" className="w-full h-full object-cover transition-opacity duration-500" />
          <div className="absolute inset-0 bg-black/20 flex items-end p-8">
            <h1 className="text-white text-2xl md:text-4xl font-black uppercase tracking-tighter drop-shadow-md">Hệ Thống Ôn Thi Trực Tuyến</h1>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Khối Lớp */}
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
          <h2 className="text-xl font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
            <i className="fas fa-graduation-cap text-blue-600"></i> Chọn Khối Lớp
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {GRADES.map(grade => (
              <button key={grade} onClick={() => onSelectGrade(grade)} className="py-6 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-[2rem] font-black text-2xl transition-all border-2 border-transparent hover:border-blue-700 active:scale-95 shadow-sm">
                LỚP {grade}
              </button>
            ))}
          </div>
        </div>

        {/* Luyện QuiZ */}
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col justify-center items-center text-center">
          <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-inner">
            <i className="fas fa-bolt"></i>
          </div>
          <h2 className="text-2xl font-black text-slate-800 uppercase mb-2">Luyện Tập QuiZ</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Thử thách kiến thức - Nhận quà VIP</p>
          <button onClick={onSelectQuiz} className="w-full py-6 bg-orange-500 text-white rounded-[2rem] font-black text-xl shadow-xl border-b-8 border-orange-700 active:scale-95 hover:brightness-110 transition-all">
            BẮT ĐẦU NGAY
          </button>
        </div>
      </div>

      {/* Tin tức */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100">
          <h3 className="text-sm font-black text-slate-800 uppercase mb-4 px-2">Tin tức giáo dục</h3>
          <div className="space-y-3">
            {NEWS_DATA.map((news, i) => (
              <a key={i} href={news.link} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-all group">
                <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-150 transition-all"></div>
                <span className="text-sm font-bold text-slate-600 group-hover:text-blue-600">{news.title}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

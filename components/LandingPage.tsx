
import React, { useState, useEffect } from 'react';
import { DANHGIA_URL, ADMIN_CONFIG, OTHER_APPS, API_ROUTING, DEFAULT_API_URL } from '../config';
import { AppUser, Student } from '../types';
import TeacherWordTask from './TeacherWordTask';

interface LandingPageProps {
  onSelectGrade: (grade: number) => void;
  onSelectQuiz: (num: number, pts: number, quizStudent: Partial<Student>) => void;
  user: AppUser | null;
  onOpenAuth: () => void;
  onOpenVip: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectGrade, onSelectQuiz, user, onOpenAuth, onOpenVip }) => {
  const [currentView, setCurrentView] = useState<'main' | 'teacher_task'>('main');
  const [stats, setStats] = useState<{ top10: any[] }>({ top10: [] });
  const [showQuizModal, setShowQuizModal] = useState<{ num: number, pts: number } | null>(null);
  const [quizMode, setQuizMode] = useState<'free' | 'gift' | null>(null);
  const [quizInfo, setQuizInfo] = useState({ name: '', class: '', school: '', phone: '' });
  const [bankInfo, setBankInfo] = useState({ stk: '', bankName: '' });
  const [inputPassword, setInputPassword] = useState('');
  const [serverPassword, setServerPassword] = useState("");
  const [carouselImages, setCarouselImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&q=80&w=1200"
  ]);
  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${DANHGIA_URL}?type=top10`);
        const json = await res.json();
        if (json.data) setStats({ top10: json.data });
      } catch (e) {}
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCurrentImg(p => (p + 1) % carouselImages.length), 4000);
    return () => clearInterval(interval);
  }, [carouselImages]);

  if (currentView === 'teacher_task') {
    return <TeacherWordTask onBack={() => setCurrentView('main')} />;
  }

  return (
    <div className="flex flex-col gap-6 pb-12 font-sans overflow-x-hidden">
      <div className="flex justify-center mt-6">
        <div className="bg-white p-2 rounded-3xl shadow-lg border border-slate-100 flex overflow-x-auto gap-3 px-4 no-scrollbar items-center max-w-full">
          <button onClick={() => setShowQuizModal({ num: 20, pts: 0.5 })} className="px-8 py-4 bg-orange-500 text-white rounded-2xl font-black text-sm uppercase shadow-lg border-b-4 border-orange-700 hover:brightness-110 flex items-center gap-2 whitespace-nowrap">
            <i className="fas fa-gift"></i> SĂN QUÀ QUIZ
          </button>
          {[10, 11, 12].map(g => (
            <button key={g} onClick={() => onSelectGrade(g)} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase shadow-lg border-b-4 border-blue-800 hover:brightness-110 flex items-center gap-2 whitespace-nowrap">
              <i className="fas fa-graduation-cap"></i> LỚP {g}
            </button>
          ))}
          <button 
            onClick={() => setCurrentView('teacher_task')} 
            className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase shadow-lg border-b-4 border-emerald-800 hover:brightness-110 flex items-center gap-2 whitespace-nowrap"
          >
            <i className="fas fa-chalkboard-teacher"></i> TẠO ĐỀ TỪ WORD
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full px-4 mt-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden flex flex-col h-[500px]">
            <div className="bg-slate-900 p-4 text-white font-black text-xs uppercase text-center tracking-widest flex items-center justify-center gap-2">
              <i className="fas fa-crown text-yellow-400"></i> TOP 10 CAO THỦ
            </div>
            <div className="p-2 space-y-2 overflow-y-auto no-scrollbar bg-slate-50 flex-grow">
              {stats.top10.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <span className="w-6 font-black text-slate-300 text-center">{i+1}</span>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[11px] font-black uppercase truncate">{item.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold italic">{item.idPhone}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[12px] font-black text-red-600">{item.score} đ</p>
                    <p className="text-[8px] text-slate-400">{item.time}s</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 h-[500px]">
          <div className="relative h-full rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-white bg-slate-100">
            <img src={carouselImages[currentImg]} className="w-full h-full object-cover transition-opacity duration-1000" alt="Hero" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-10 left-10 text-white">
              <h2 className="text-4xl font-black uppercase leading-tight italic">HỌC TOÁN THẦY HÀ</h2>
              <p className="text-orange-400 text-lg font-bold tracking-widest uppercase mt-2">Nâng tầm kiến thức - Vững bước tương lai</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-3">
          <button onClick={() => window.open('https://new-chat-bot-two.vercel.app/', '_blank')} className="p-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase border-b-4 border-indigo-900 shadow-lg active:scale-95 transition-all">
            <i className="fas fa-robot text-xl mb-1"></i><br/>TRỢ LÝ HỌC TẬP AI
          </button>
          <button onClick={onOpenVip} className="p-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl font-black text-[11px] uppercase border-b-4 border-orange-700 shadow-lg active:scale-95 transition-all">
            <i className="fas fa-gem text-xl mb-1"></i><br/>NÂNG CẤP TÀI KHOẢN VIP
          </button>
          <div className="flex-grow bg-slate-100 rounded-[2rem] p-6 text-center text-slate-400 border-2 border-dashed border-slate-200">
             <i className="fas fa-bullhorn text-3xl mb-4"></i>
             <p className="text-[10px] font-bold uppercase tracking-widest">Thông báo</p>
             <p className="text-xs italic mt-2">Hệ thống bóc tách Word thông minh đã sẵn sàng phục vụ thầy cô!</p>
          </div>
        </div>
      </div>

      {showQuizModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
           <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative animate-fade-in border border-slate-100">
             <h2 className="text-2xl font-black text-orange-500 mb-6 uppercase text-center tracking-tighter">🚀 CHỌN CHẾ ĐỘ CHƠI</h2>
             <div className="flex flex-col gap-4">
               <button onClick={() => setQuizMode('free')} className="py-4 bg-blue-500 text-white rounded-2xl font-bold uppercase flex items-center justify-center gap-2 hover:brightness-110 shadow-lg transition-all active:scale-95">
                 <i className="fas fa-gamepad text-xl"></i> CHƠI TỰ DO
               </button>
               <button onClick={() => setQuizMode('gift')} className="py-4 bg-orange-500 text-white rounded-2xl font-bold uppercase flex items-center justify-center gap-2 hover:brightness-110 shadow-lg shadow-orange-200 transition-all active:scale-95">
                 <i className="fas fa-gift text-xl"></i> QUÀ QUIZ
               </button>
               <button onClick={() => setShowQuizModal(null)} className="mt-2 text-slate-400 text-xs font-black uppercase text-center">Để sau nhé</button>
             </div>
           </div>
        </div>
      )}

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
    </div>
  );
};

export default LandingPage;

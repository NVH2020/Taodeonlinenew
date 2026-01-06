
import React, { useState, useEffect } from 'react';
import { NEWS_DATA, IMAGES_CAROUSEL, DEFAULT_API_URL } from '../config';
import { AppUser, Student } from '../types';

const formatPhoneHidden = (phone: string) => {
  if (!phone || phone.length < 7) return "09xxx****";
  const p = phone.replace(/'/g, "");
  return p.slice(0, 3) + "xxx" + p.slice(-3);
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
  
  const [top10, setTop10] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      // Tải Top 10
      const topResp = await fetch(`${DEFAULT_API_URL}?type=getTop10&t=${Date.now()}`);
      const topData = await topResp.json();
      if (topData.status === "success") setTop10(topData.data);
    } catch (e) { console.warn("Lỗi tải dữ liệu Landing", e); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => setCurrentImg(prev => (prev + 1) % IMAGES_CAROUSEL.length), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStartQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizInfo.name || !quizInfo.phone) return alert("Vui lòng điền thông tin!");
    
    if (quizMode === 'gift') {
      const resp = await fetch(`${DEFAULT_API_URL}?type=checkQuizPass&pass=${quizPass}`);
      const res = await resp.json();
      if (res.status !== "success") return alert("Mật khẩu nhận quà không đúng!");
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

  const getTrophyIcon = (rank: number) => {
    if (rank === 1) return <i className="fas fa-trophy text-yellow-400"></i>;
    if (rank === 2) return <i className="fas fa-trophy text-slate-300"></i>;
    if (rank === 3) return <i className="fas fa-trophy text-amber-600"></i>;
    return <i className="fas fa-medal text-blue-200"></i>;
  };

  return (
    <div className="flex flex-col gap-6 pb-12 font-sans overflow-x-hidden animate-fade-in">
      
      {/* 1. Header Navigation */}
      <div className="bg-white p-2 rounded-3xl shadow-lg border border-slate-100 mt-4 overflow-hidden">
        <div className="flex flex-nowrap overflow-x-auto gap-3 pb-2 pt-1 px-1 no-scrollbar items-center">
          <div className="bg-red-600 text-white px-6 rounded-2xl shadow-lg flex items-center justify-center h-[60px] border-b-4 border-red-800 shrink-0">
             <span className="font-black text-sm uppercase tracking-tighter">Thi Online →</span>
          </div>
          {[9, 10, 11, 12].map(g => (
            <button key={g} onClick={() => onSelectGrade(g)} className="px-6 bg-blue-600 text-white border-b-4 border-blue-800 rounded-2xl font-black text-sm h-[60px] flex items-center gap-2 min-w-[120px] transition-all hover:translate-y-[-2px] active:scale-95">
              <i className="fas fa-graduation-cap"></i> LỚP {g}
            </button>
          ))}
          <button onClick={() => { setQuizMode('free'); setShowQuizModal({num: 10, pts: 1}); }} className="px-6 bg-orange-500 text-white border-b-4 border-orange-700 rounded-2xl font-black text-sm h-[60px] flex items-center gap-2 min-w-[130px] transition-all hover:translate-y-[-2px] active:scale-95">
            <i className="fas fa-bolt"></i> QUIZ 10
          </button>
          <button onClick={() => { setQuizMode('free'); setShowQuizModal({num: 20, pts: 0.5}); }} className="px-6 bg-orange-500 text-white border-b-4 border-orange-700 rounded-2xl font-black text-sm h-[60px] flex items-center gap-2 min-w-[130px] transition-all hover:translate-y-[-2px] active:scale-95">
            <i className="fas fa-brain"></i> QUIZ 20
          </button>
        </div>
      </div>

      {/* 2. Marquee */}
      <div className="bg-blue-800 py-3 rounded-2xl overflow-hidden shadow-inner border-b-4 border-blue-950 mx-1">
        <div className="animate-marquee whitespace-nowrap text-white font-black uppercase text-[11px] tracking-widest">
          ⭐ Chào mừng các bạn đến với Hệ thống học toán trực tuyến chuyên nghiệp ! &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          ⭐ Admin: Thầy Hà - THPT Yên Dũng số 2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
          ⭐ Hotline: 0988.948.882 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </div>
      </div>

      {/* 3. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* TOP 10 DISPLAY */}
        <div className="lg:col-span-3 flex flex-col">
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden h-full flex flex-col">
            <div className="bg-blue-700 p-4 text-white font-black text-xs uppercase text-center flex items-center justify-center gap-2">
               <i className="fas fa-crown text-yellow-300"></i> BẢNG VÀNG TOP 10
            </div>
            <div className="p-3 space-y-3 flex-grow bg-slate-50 overflow-y-auto max-h-[550px] custom-scrollbar">
              {top10.length > 0 ? top10.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-2xl shadow-sm border-l-4 border-blue-600 group hover:bg-blue-50 transition-colors">
                  <div className="flex gap-3 items-center min-w-0 flex-1">
                    <span className="text-xl shrink-0">
                      {getTrophyIcon(item.rank)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-black text-slate-800 text-[11px] truncate uppercase tracking-tighter">{item.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold tracking-tighter">{formatPhoneHidden(item.phone)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-blue-700 text-sm">{item.score} đ</p>
                    <p className="text-[9px] text-slate-400 font-bold italic tracking-tighter">{item.time}</p>
                  </div>
                </div>
              )) : <p className="text-center p-10 text-slate-300 font-black text-[10px] uppercase">Đang tải dữ liệu...</p>}
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div className="lg:col-span-7">
          <div className="relative h-64 md:h-full min-h-[420px] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
            {IMAGES_CAROUSEL.map((img, idx) => (
              <img key={idx} src={img} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentImg ? 'opacity-100' : 'opacity-0'}`} alt="" />
            ))}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {IMAGES_CAROUSEL.map((_, idx) => (
                <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentImg ? 'w-8 bg-white' : 'bg-white/40'}`}></div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Buttons */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <button onClick={onOpenAuth} className="w-full flex-1 flex flex-col items-center justify-center gap-1 bg-blue-700 text-white rounded-3xl font-black text-[10px] uppercase shadow-md p-2 hover:bg-blue-800 hover:scale-105 transition-all border-b-4 border-blue-900 active:scale-95">
            <i className="fas fa-user-circle text-2xl mb-1"></i>
            <span className="truncate max-w-[90%]">{user ? user.phoneNumber : "TÀI KHOẢN"}</span>
          </button>
          
          <button onClick={onOpenVip} className="w-full flex-1 flex flex-col items-center justify-center gap-1 bg-amber-500 text-white rounded-3xl font-black text-[10px] uppercase shadow-md p-2 hover:bg-amber-600 hover:scale-105 transition-all border-b-4 border-amber-700 active:scale-95">
            <i className="fas fa-crown text-2xl mb-1"></i>
            <span>NÂNG CẤP VIP</span>
          </button>

          <button onClick={() => window.open('https://www.facebook.com/hoctoanthayha.bg', '_blank')} className="w-full flex-1 flex flex-col items-center justify-center gap-1 bg-indigo-500 text-white rounded-3xl font-black text-[10px] uppercase shadow-md p-2 hover:bg-indigo-600 hover:scale-105 transition-all border-b-4 border-indigo-700 active:scale-95">
            <i className="fas fa-comments text-2xl mb-1"></i>
            <span>TRAO ĐỔI</span>
          </button>

          <button onClick={() => window.open('https://www.facebook.com/hoctoanthayha.bg', '_blank')} className="w-full flex-1 flex flex-col items-center justify-center gap-1 bg-emerald-600 text-white rounded-3xl font-black text-[10px] uppercase shadow-md p-2 hover:bg-emerald-700 hover:scale-105 transition-all border-b-4 border-emerald-800 active:scale-95">
            <i className="fas fa-file-pdf text-2xl mb-1"></i>
            <span>KHO TÀI LIỆU</span>
          </button>
        </div>
      </div>

      {/* QUIZ MODAL */}
      {showQuizModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative border border-slate-100 animate-fade-in max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-2xl font-black text-blue-700 mb-6 uppercase text-center tracking-tighter">BẮT ĐẦU QUIZ</h2>
            
            <div className="flex gap-2 mb-8 bg-slate-100 p-1 rounded-2xl">
              <button onClick={() => setQuizMode('free')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all ${quizMode === 'free' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-400'}`}>Tự Do</button>
              <button onClick={() => setQuizMode('gift')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all ${quizMode === 'gift' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}>Nhận Quà</button>
            </div>

            <form onSubmit={handleStartQuiz} className="space-y-6">
              {quizMode === 'gift' && (
                <div className="space-y-2">
                  <p className="font-black text-orange-600 text-[10px] uppercase pl-1 tracking-widest">Mật khẩu (H2 Sheet danh sách)</p>
                  <input required type="password" placeholder="Nhập mã xác thực..." className="w-full p-4 bg-orange-50 border-2 border-orange-100 rounded-2xl font-bold outline-none focus:border-orange-300" value={quizPass} onChange={e=>setQuizPass(e.target.value)} />
                </div>
              )}

              <div className="space-y-4">
                <p className="font-black text-slate-400 text-[10px] uppercase border-l-4 border-blue-600 pl-3">Thông tin thí sinh</p>
                <input required placeholder="Họ tên học sinh" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-100" value={quizInfo.name} onChange={e=>setQuizInfo({...quizInfo, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="Số điện thoại" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={quizInfo.phone} onChange={e=>setQuizInfo({...quizInfo, phone: e.target.value})} />
                  <input placeholder="Lớp học" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={quizInfo.class} onChange={e=>setQuizInfo({...quizInfo, class: e.target.value})} />
                </div>
                <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-none cursor-pointer" value={quizInfo.schoolType} onChange={e=>setQuizInfo({...quizInfo, schoolType: e.target.value})}>
                  <option value="THPT YD1">THPT Yên Dũng 1</option>
                  <option value="THPT YD2">THPT Yên Dũng 2</option>
                  <option value="Khác">Trường khác (Nhập thủ công)</option>
                </select>
                {quizInfo.schoolType === 'Khác' && <input required placeholder="Tên trường học" className="w-full p-4 bg-white border-2 border-blue-50 rounded-2xl font-bold outline-none" value={quizInfo.schoolOther} onChange={e=>setQuizInfo({...quizInfo, schoolOther: e.target.value})} />}
              </div>

              {quizMode === 'gift' && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <p className="font-black text-slate-400 text-[10px] uppercase border-l-4 border-emerald-500 pl-3">Tài khoản nhận thưởng</p>
                  <input required placeholder="Số tài khoản ngân hàng" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={bankInfo.stk} onChange={e=>setBankInfo({...bankInfo, stk: e.target.value})} />
                  <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-none cursor-pointer" value={bankInfo.bankType} onChange={e=>setBankInfo({...bankInfo, bankType: e.target.value})}>
                    <option value="MB Bank">MB Bank</option>
                    <option value="Agribank">Agribank</option>
                    <option value="Vietcombank">Vietcombank</option>
                    <option value="Khác">Ngân hàng khác...</option>
                  </select>
                  {bankInfo.bankType === 'Khác' && <input required placeholder="Tên ngân hàng" className="w-full p-4 bg-white border-2 border-emerald-50 rounded-2xl font-bold outline-none" value={bankInfo.bankOther} onChange={e=>setBankInfo({...bankInfo, bankOther: e.target.value})} />}
                </div>
              )}

              <button className={`w-full py-5 text-white rounded-2xl font-black shadow-xl uppercase text-lg transition-all active:scale-95 border-b-4 ${quizMode === 'gift' ? 'bg-orange-500 hover:bg-orange-600 border-orange-700' : 'bg-blue-700 hover:bg-blue-800 border-blue-900'}`}>
                <i className="fas fa-play mr-2"></i> Bắt đầu làm bài
              </button>
            </form>
            <button onClick={() => setShowQuizModal(null)} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 text-2xl transition-colors">✕</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;

// *End

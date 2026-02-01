
import React, { useState, useEffect } from 'react';
import { IMAGES_CAROUSEL, DANHGIA_URL, ADMIN_CONFIG, OTHER_APPS } from '../config';
import { AppUser, Student } from '../types';

interface LandingPageProps {
  onSelectGrade: (grade: number) => void;
  onSelectQuiz: (num: number, pts: number, quizStudent: Partial<Student>) => void;
  user: AppUser | null;
  onOpenAuth: () => void;
  onOpenVip: () => void;
  onOpenTeacherTask: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectGrade, onSelectQuiz, user, onOpenAuth, onOpenVip, onOpenTeacherTask }) => {
  const [currentImg, setCurrentImg] = useState(0);
  const [showQuizModal, setShowQuizModal] = useState<{num: number, pts: number} | null>(null);
  const [quizMode, setQuizMode] = useState<'free' | 'gift' | null>(null);
  const [quizInfo, setQuizInfo] = useState({ name: '', class: '', school: '', phone: '' });
  const [bankInfo, setBankInfo] = useState({ stk: '', bankName: '' });
  const [inputPassword, setInputPassword] = useState('');
  const [serverPassword, setServerPassword] = useState("");
  const [stats, setStats] = useState<{top10: any[]}>({ top10: [] });
  const [isOtherClass, setIsOtherClass] = useState(false);
  const [isOtherSchool, setIsOtherSchool] = useState(false);
  const [isOtherBank, setIsOtherBank] = useState(false);

  useEffect(() => {
    if (IMAGES_CAROUSEL.length === 0) return;
    const interval = setInterval(() => setCurrentImg((prev) => (prev + 1) % IMAGES_CAROUSEL.length), 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchTop10 = async () => {
      try {
        const res = await fetch(`${DANHGIA_URL}?type=top10`);
        const json = await res.json();
        if (json.data) setStats({ top10: json.data.slice(0, 10) });
      } catch (e) {}
    };
    fetchTop10();
  }, []);

  useEffect(() => {
    const fetchPass = async () => {
      try {
        const res = await fetch(`${DANHGIA_URL}?type=getPass`);
        const data = await res.json();
        if(data.password) setServerPassword(data.password.toString());
      } catch (e) {}
    };
    fetchPass();
  }, []);

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (quizMode === 'gift' && inputPassword !== serverPassword) return alert("Sai mật khẩu săn quà!");
    onSelectQuiz(showQuizModal!.num, showQuizModal!.pts, {
      ...quizInfo,
      phoneNumber: quizInfo.phone,
      stk: quizMode === 'gift' ? bankInfo.stk : "Tự do",
      bank: quizMode === 'gift' ? bankInfo.bankName : "Tự do"
    });
    setShowQuizModal(null);
  };

  return (
    <div className="flex flex-col gap-6 pb-12 font-sans overflow-x-hidden">
      <div className="flex justify-center">
        <div className="bg-white p-2 rounded-3xl shadow-lg border border-slate-100 mt-4 overflow-hidden max-w-full">
          <div className="flex flex-nowrap overflow-x-auto gap-3 pb-2 pt-1 px-1 no-scrollbar items-center">
            <button onClick={() => setShowQuizModal({num: 20, pts: 0.5})} className="px-6 bg-orange-500 text-white border-b-4 border-orange-700 rounded-2xl font-black text-sm shrink-0 h-[60px] uppercase flex items-center justify-center gap-2 min-w-[130px]">
              <i className="fas fa-gift"></i> SĂN QUÀ 
            </button>      
            {[10, 11, 12].map(g => (
              <button key={g} onClick={() => onSelectGrade(g)} className="px-6 bg-blue-600 text-white border-b-4 border-blue-800 rounded-2xl font-black text-sm shrink-0 h-[60px] flex items-center justify-center gap-2 min-w-[120px]">
                <i className="fas fa-user-graduate"></i> LỚP {g}
              </button>
            ))}
            <button onClick={onOpenTeacherTask} className="px-6 bg-emerald-600 text-white border-b-4 border-emerald-800 rounded-2xl font-black text-sm shrink-0 h-[60px] uppercase flex items-center justify-center gap-2 whitespace-nowrap">
              <i className="fas fa-file-word"></i> TẠO ĐỀ WORD
            </button>
          </div>      
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-7xl mx-auto w-full px-2">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden h-full flex flex-col min-h-[500px]">
            <div className="bg-blue-600 p-4 text-white font-black text-xs uppercase text-center flex items-center justify-center gap-2">
              <i className="fas fa-crown text-yellow-300"></i> TOP 10 CAO THỦ
            </div>
            <div className="p-2 space-y-2 flex-grow bg-slate-50 overflow-y-auto">
              {stats.top10.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <div className="w-8 text-center">{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🏅"}</div>
                  <div className="flex-1 overflow-hidden">
                    <div className="text-[11px] font-black uppercase truncate">{item.name}</div>
                    <div className="text-[9px] text-slate-400 font-bold">{item.idPhone}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[12px] font-black text-red-600">{item.score}đ</div>
                    <div className="text-[9px] text-slate-400 italic">{item.time}s</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="relative h-64 md:h-full min-h-[420px] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
            {IMAGES_CAROUSEL.map((img, idx) => (
              <img key={idx} src={img} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentImg ? 'opacity-100' : 'opacity-0'}`} />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-10 left-10 text-white">
              <h2 className="text-3xl md:text-4xl font-black italic uppercase">Học Toán Thầy Hà</h2>
              <p className="text-orange-400 text-lg font-bold mt-2 uppercase tracking-widest">Chuyên tâm - Sáng tạo - Thành công</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-3">            
          <button onClick={() => window.open("https://new-chat-bot-two.vercel.app/", '_blank')} className="w-full flex-1 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase border-b-4 border-indigo-900 p-2">
            <i className="fas fa-headset text-lg"></i><br/>Trợ lý AI
          </button>
          <button onClick={() => window.open("https://www.facebook.com/hoctoanthayha.bg", '_blank')} className="w-full flex-1 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase border-b-4 border-indigo-900 p-2">
            <i className="fas fa-users text-lg"></i><br/>Đăng ký học
          </button>
          <button className="w-full flex-1 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase border-b-4 border-teal-800 p-2">
            <i className="fas fa-calendar-check text-lg"></i><br/>Lịch học
          </button>
          <button onClick={onOpenVip} className="w-full flex-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl font-black text-[10px] uppercase border-b-4 border-orange-700 p-2">
            <i className="fas fa-gem text-lg"></i><br/>Nâng Cấp VIP
          </button>
        </div>
      </div>

      {showQuizModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative border border-slate-100 overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black text-orange-500 mb-6 uppercase text-center">🚀 Chọn chế độ chơi</h2>
            {!quizMode ? (
              <div className="flex flex-col gap-4">
                <button onClick={() => setQuizMode('free')} className="py-4 bg-blue-500 text-white rounded-2xl font-bold uppercase">🎮 Chơi Tự Do</button>
                <button onClick={() => setQuizMode('gift')} className="py-4 bg-orange-500 text-white rounded-2xl font-bold uppercase">🎁 Săn Quà</button>
                <button onClick={() => setShowQuizModal(null)} className="mt-2 text-slate-400 text-sm font-bold">Để sau</button>
              </div>
            ) : (
              <form onSubmit={handleStartQuiz} className="space-y-4 animate-fade-in">
                {quizMode === 'gift' && (
                  <input required type="password" placeholder="Mật khẩu Admin" className="w-full p-4 bg-red-50 border-2 border-red-100 rounded-xl font-bold text-center" value={inputPassword} onChange={e => setInputPassword(e.target.value)} />
                )}
                <input required placeholder="Họ và tên" className="w-full p-3 bg-slate-100 rounded-xl font-bold" value={quizInfo.name} onChange={e=>setQuizInfo({...quizInfo, name: e.target.value})} />
                <input required type="tel" placeholder="Số điện thoại" className="w-full p-3 bg-slate-100 rounded-xl font-bold" value={quizInfo.phone} onChange={e=>setQuizInfo({...quizInfo, phone: e.target.value})} />
                
                <select className="w-full p-3 bg-slate-100 rounded-xl font-bold" onChange={e => { setIsOtherClass(e.target.value === 'Khác'); setQuizInfo({...quizInfo, class: e.target.value === 'Khác' ? '' : e.target.value}) }}>
                  <option value="">Chọn lớp</option>
                  {ADMIN_CONFIG.CLASS_ID.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {isOtherClass && <input required placeholder="Nhập lớp..." className="w-full p-3 bg-white border border-orange-200 rounded-xl font-bold" onChange={e => setQuizInfo({...quizInfo, class: e.target.value})} />}
                
                <select className="w-full p-3 bg-slate-100 rounded-xl font-bold" onChange={e => { setIsOtherSchool(e.target.value === 'Trường khác'); setQuizInfo({...quizInfo, school: e.target.value === 'Trường khác' ? '' : e.target.value}) }}>
                  <option value="">Chọn trường</option>
                  {ADMIN_CONFIG.schools.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {isOtherSchool && <input required placeholder="Nhập trường..." className="w-full p-3 bg-white border border-orange-200 rounded-xl font-bold" onChange={e => setQuizInfo({...quizInfo, school: e.target.value})} />}

                {quizMode === 'gift' && (
                  <div className="p-4 bg-orange-50 rounded-2xl space-y-3">
                    <input required placeholder="Số tài khoản ngân hàng" className="w-full p-3 bg-white rounded-xl" onChange={e=>setBankInfo({...bankInfo, stk: e.target.value})} />
                    <select className="w-full p-3 bg-white rounded-xl" onChange={e => { setIsOtherBank(e.target.value === 'Ngân hàng khác'); setBankInfo({...bankInfo, bankName: e.target.value === 'Ngân hàng khác' ? '' : e.target.value}) }}>
                      <option value="">Chọn ngân hàng</option>
                      {ADMIN_CONFIG.banks.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    {isOtherBank && <input required placeholder="Tên ngân hàng..." className="w-full p-3 bg-white rounded-xl" onChange={e => setBankInfo({...bankInfo, bankName: e.target.value})} />}
                  </div>
                )}
                <button className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black shadow-xl uppercase">Vào Thi</button>
                <button type="button" onClick={() => setQuizMode(null)} className="w-full text-slate-400 text-xs font-bold">Quay lại</button>
              </form>
            )}
          </div>
        </div>
      )}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
    </div>
  );
};

export default LandingPage;

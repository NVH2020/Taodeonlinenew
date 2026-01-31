
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
  onOpenAdmin: (tab: 'matrix' | 'cauhoi') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectGrade, onSelectQuiz, user, onOpenAuth, onOpenVip, onOpenTeacherTask, onOpenAdmin }) => {
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
  const [showLichOptions, setshowLichOptions] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");

  const SUBJECTS = ["Toán học", "Vật lí", "Hóa học", "Sinh học", "Văn học", "Lịch sử", "Địa lí", "Tin học", "Tiếng Anh", "GDKT&PL", "CNCN", "CNNN", "Khác"];
  const LEVELS = ["THPT", "THCS", "Tiểu học", "Đại học", "Cao học", "Trên cao học"];

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
      bank: quizMode === 'gift' ? bankInfo.bankName : "Tự do",
      class: quizInfo.class,
      school: quizInfo.school
    });
    setShowQuizModal(null);
  };

  return (
    <div className="flex flex-col gap-6 pb-12 font-sans overflow-x-hidden">
      {/* HEADER BUTTONS - ĐÃ KHÔI PHỤC CÁC NÚT LINH HỒN VÀ LỌC LỚP 10-12 */}
      <div className="flex justify-center">
        <div className="bg-white p-2 rounded-3xl shadow-lg border border-slate-100 mt-4 overflow-hidden max-w-full">
          <div className="flex flex-nowrap overflow-x-auto gap-3 pb-2 pt-1 px-1 no-scrollbar items-center">
            <div className="bg-red-600 text-white px-6 rounded-2xl shadow-lg flex items-center justify-center h-[60px] whitespace-nowrap border-b-4 border-red-800 animate-pulse">
              <span className="font-black text-sm uppercase flex items-center gap-2">
                <i className="fas fa-edit"></i> Kiểm tra và QuiZ ⇄
              </span>
            </div>
            <button onClick={() => setShowQuizModal({num: 20, pts: 0.5})} className="px-6 bg-orange-500 text-white border-b-4 border-orange-700 rounded-2xl font-black text-sm shrink-0 h-[60px] uppercase flex items-center justify-center gap-2 min-w-[130px]">
              <i className="fas fa-gift"></i> SĂN QUÀ 
            </button>      
            {[10, 11, 12].map(g => (
              <button key={g} onClick={() => onSelectGrade(g)} className="px-6 bg-blue-600 text-white border-b-4 border-blue-800 rounded-2xl font-black text-sm shrink-0 h-[60px] flex items-center justify-center gap-2 min-w-[100px]">
                LỚP {g}
              </button>
            ))}
            <button onClick={() => onOpenAdmin('matrix')} className="px-6 bg-indigo-600 text-white border-b-4 border-indigo-800 rounded-2xl font-black text-sm shrink-0 h-[60px] uppercase flex items-center justify-center gap-2">
              <i className="fas fa-layer-group"></i> QUẢN LÝ MA TRẬN
            </button>
            <button onClick={() => onOpenAdmin('cauhoi')} className="px-6 bg-blue-700 text-white border-b-4 border-blue-900 rounded-2xl font-black text-sm shrink-0 h-[60px] uppercase flex items-center justify-center gap-2">
              <i className="fas fa-database"></i> NGÂN HÀNG ĐỀ
            </button>
            <button onClick={onOpenTeacherTask} className="px-6 bg-emerald-600 text-white border-b-4 border-emerald-800 rounded-2xl font-black text-sm shrink-0 h-[60px] uppercase flex items-center justify-center gap-2 whitespace-nowrap">
              <i className="fas fa-file-word"></i> TẠO ĐỀ WORD
            </button>
          </div>      
        </div>
      </div>

      {/* MARQUEE */}
      <div className="flex flex-col items-center justify-center w-full px-4 mt-2">
        <div className="bg-indigo-700 py-1.5 rounded-full overflow-hidden shadow-lg border-b-4 border-indigo-900 w-full max-w-4xl">
            <div className="overflow-hidden bg-blue-600/20 py-1.5 backdrop-blur-sm">  
              <div className="whitespace-nowrap text-white font-bold uppercase text-[16px] tracking-widest inline-block animate-marquee-simple">
                ⭐ Chúc các em ôn tập tốt và luôn làm chủ kiến thức! ⭐ Thầy cô liên hệ: 0988.948.882 để được hướng dẫn sử dụng Apps và tạo Web miễn phí!
              </div>
            </div>
        </div>
        <style>{`@keyframes marquee-simple { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } } .animate-marquee-simple { animation: marquee-simple 25s linear infinite; }`}</style>
      </div>

      {/* MAIN CONTENT */}
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
            <i className="fas fa-headset text-lg"></i><br/>Trợ lý học tập
          </button>
          <button onClick={() => window.open("https://www.facebook.com/hoctoanthayha.bg", '_blank')} className="w-full flex-1 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase border-b-4 border-indigo-900 p-2">
            <i className="fas fa-users text-lg"></i><br/>Đăng ký học Toán
          </button>
          <button onClick={() => setshowLichOptions(true)} className="h-[85px] bg-white text-teal-600 rounded-[2rem] shadow-lg border-b-4 border-teal-200 font-black uppercase flex flex-col items-center justify-center transition-all">
            <i className="fas fa-calendar-check text-2xl mb-1"></i>
            <span className="text-[12px]">Lịch học Toán</span>
          </button> 
          <button onClick={() => setShowSubjectModal(true)} className="w-full flex-1 bg-purple-600 text-white rounded-2xl font-black text-[10px] uppercase border-b-4 border-purple-800 p-2">
            <i className="fas fa-graduation-cap text-lg"></i><br/>Chọn môn học
          </button>
          <div className="relative group w-full flex-1">
            <button className="w-full h-full bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase border-b-4 border-teal-800 p-2">
              <i className="fas fa-th text-lg"></i><br/>Ứng dụng khác
            </button>
            <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-2xl shadow-2xl border hidden group-hover:block z-[100] p-2">
              {OTHER_APPS.map((app, idx) => (
                <a key={idx} href={app.link} target="_blank" className="flex items-center gap-3 p-3 hover:bg-teal-50 rounded-xl">
                  <i className={`${app.icon} text-teal-600 w-5`}></i>
                  <span className="text-[10px] font-black text-slate-700 uppercase">{app.label}</span>
                </a>
              ))}
            </div>
          </div>
          <button onClick={onOpenVip} className="w-full flex-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl font-black text-[10px] uppercase border-b-4 border-orange-700 p-2">
            <i className="fas fa-gem text-lg"></i><br/>Nâng Cấp VIP
          </button>
        </div>
      </div>

      {/* MODALS */}
      {showLichOptions && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl border-4 border-white">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-8 text-center text-white">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">Lịch Học Offline</h3>
            </div>
            <div className="p-6">
              <button onClick={() => setshowLichOptions(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase">Đóng</button>
            </div>
          </div>
        </div>
      )}

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
                  <input required type="password" placeholder="Mật khẩu săn quà" className="w-full p-4 bg-red-50 border-2 border-red-100 rounded-xl font-bold text-center" value={inputPassword} onChange={e => setInputPassword(e.target.value)} />
                )}
                <input required placeholder="Họ và tên" className="w-full p-3 bg-slate-100 rounded-xl font-bold" value={quizInfo.name} onChange={e=>setQuizInfo({...quizInfo, name: e.target.value})} />
                <input required type="tel" placeholder="Số điện thoại" className="w-full p-3 bg-slate-100 rounded-xl font-bold" value={quizInfo.phone} onChange={e=>setQuizInfo({...quizInfo, phone: e.target.value})} />
                
                <select className="w-full p-3 bg-slate-100 rounded-xl font-bold" onChange={e => { setIsOtherClass(e.target.value === 'Khác'); setQuizInfo({...quizInfo, class: e.target.value === 'Khác' ? '' : e.target.value}) }}>
                  <option value="">Chọn lớp</option>
                  {ADMIN_CONFIG.CLASS_ID.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {isOtherClass && <input required placeholder="Nhập lớp..." className="w-full p-3 bg-orange-50 border border-orange-200 rounded-xl font-bold" onChange={e => setQuizInfo({...quizInfo, class: e.target.value})} />}
                
                <select className="w-full p-3 bg-slate-100 rounded-xl font-bold" onChange={e => { setIsOtherSchool(e.target.value === 'Khác'); setQuizInfo({...quizInfo, school: e.target.value === 'Khác' ? '' : e.target.value}) }}>
                  <option value="">Chọn trường</option>
                  {ADMIN_CONFIG.schools.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {isOtherSchool && <input required placeholder="Nhập trường..." className="w-full p-3 bg-orange-50 border border-orange-200 rounded-xl font-bold" onChange={e => setQuizInfo({...quizInfo, school: e.target.value})} />}

                {quizMode === 'gift' && (
                  <div className="p-4 bg-orange-50 rounded-2xl space-y-3">
                    <input required placeholder="Số tài khoản ngân hàng" className="w-full p-3 bg-white rounded-xl" onChange={e=>setBankInfo({...bankInfo, stk: e.target.value})} />
                    <select className="w-full p-3 bg-white rounded-xl" onChange={e => { setIsOtherBank(e.target.value === 'Khác'); setBankInfo({...bankInfo, bankName: e.target.value === 'Khác' ? '' : e.target.value}) }}>
                      <option value="">Ngân hàng</option>
                      {ADMIN_CONFIG.banks.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    {isOtherBank && <input required placeholder="Tên ngân hàng..." className="w-full p-3 bg-white rounded-xl" onChange={e => setBankInfo({...bankInfo, bankName: e.target.value})} />}
                  </div>
                )}
                <button className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black shadow-xl uppercase">Vào Thi</button>
                <button type="button" onClick={() => setQuizMode(null)} className="w-full text-slate-400 text-xs font-bold uppercase">Quay lại</button>
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

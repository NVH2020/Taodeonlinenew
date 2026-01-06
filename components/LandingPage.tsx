import React, { useState, useEffect } from 'react';
import { NEWS_DATA, IMAGES_CAROUSEL, DANHGIA_URL, ADMIN_CONFIG, OTHER_APPS } from '../config';
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
  // 1. Khai báo dữ liệu môn học
  const SUBJECTS = ["Toán học", "Vật lí", "Hóa học", "Sinh học", "Văn học", "Lịch sử", "Địa lí", "Tin học", "Tiếng Anh", "GDKT&PL", "CNCN", "CNNN", "Khác"];
  const LEVELS = ["THPT", "THCS", "Tiểu học", "Đại học", "Cao học", "Trên cao học"];
  const REDIRECT_LINKS: Record<string, string> = {
    "Toán học-THPT": "https://www.facebook.com/hoctoanthayha.bg",
    "Vật lí-THCS": "https://twitter.com/Math_teacher_Ha",
    "default": "https://www.facebook.com/hoctoanthayha.bg"
  };

  // 2. Các State quản lý
  const [isOtherBank, setIsOtherBank] = useState(false); 
 
  const [quizMode, setQuizMode] = useState<'free' | 'gift' | null>(null);
  const [inputPassword, setInputPassword] = useState('');  
  const [currentImg, setCurrentImg] = useState(0);
  const [showQuizModal, setShowQuizModal] = useState<{num: number, pts: number} | null>(null);
  const [quizInfo, setQuizInfo] = useState({ name: '', class: '', school: '', phone: '' });
  const [accountInfo, setAccountInfo] = useState({ phone: '', pass: '' });
  const [accountVipInfo, setAccountVipInfo] = useState({ phone: '', pass: '', vip: '' });
  const [bankInfo, setBankInfo] = useState({ stk: '', bankName: '' });
  const [serverPassword, setServerPassword] = useState("");  
  const [isOtherSchool, setIsOtherSchool] = useState(false);
  const [isOtherClass, setIsOtherClass] = useState(false);
  
  // State cho Modal chọn môn
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");

  const [stats, setStats] = useState<{ratings: Record<number, number>, top10: any[]}>({
        top10: []
  });
  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (quizMode === 'gift' && inputPassword !== serverPassword) return alert("Mật khẩu Quà QuiZ không chính xác!.Liên hệ: 0988.948.882 để được giải đáp!");
    if (!quizInfo.name || !quizInfo.phone) return alert("Vui lòng nhập đầy đủ thông tin!");
    
    onSelectQuiz(showQuizModal!.num, showQuizModal!.pts, {
      ...quizInfo,
      phoneNumber: quizInfo.phone,
      stk: quizMode === 'gift' ? bankInfo.stk : "Tự do",
      bank: quizMode === 'gift' ? bankInfo.bankName : "Tự do",
      className: quizInfo.class,
      school: quizInfo.school
    });
    setShowQuizModal(null);
    setQuizMode(null);
  };

  const handleRedirect = () => {
    const key = `${selectedSubject}-${selectedLevel}`;
    const link = REDIRECT_LINKS[key] || REDIRECT_LINKS["default"];
    window.open(link, '_blank');
    setShowSubjectModal(false);
  };
    // * Lấy pass QuiZ
  useEffect(() => {
  const fetchPassword = async () => {
    try {
      const res = await fetch(`${DANHGIA_URL}?type=getPass`);
      const data = await res.json();
      setServerPassword(data.password.toString()); // Lưu mật khẩu từ ô H2 vào state
    } catch (e) {
      console.error("Lỗi lấy mật khẩu:", e);
    }
  };
  fetchPassword();
}, []);
  // *TOP10chuan
  useEffect(() => {
  const fetchTop10 = async () => {
    try {
      // Đảm bảo DANHGIA_URL đã được định nghĩa trong file config
      const res = await fetch(`${DANHGIA_URL}?type=top10`);
      const json = await res.json();

      // Kiểm tra kỹ cấu trúc json trả về từ App Script của thầy
      // Nếu App Script trả về { data: [...] } thì dùng json.data
      // Nếu App Script trả về thẳng [...] thì dùng json
      const dataToMap = json.data || json; 

      if (Array.isArray(dataToMap)) {
        setStats(prev => ({
          ...prev,
          top10: dataToMap.slice(0, 10) // Lấy đúng 10 người
        }));
      }
    } catch (e) {
      console.error("Lỗi lấy dữ liệu Top 10:", e);
    }
  };

  fetchTop10();
  // Có thể thêm interval để tự động cập nhật sau mỗi 1 phút
  const interval = setInterval(fetchTop10, 60000);
  return () => clearInterval(interval);
}, []);
  return (
    <div className="flex flex-col gap-6 pb-12 font-sans overflow-x-hidden">
  {/* 1. HEADER BUTTONS */}
    <div className="flex flex-col gap-6 pb-12 font-sans overflow-x-hidden">
      
      {/* 1. Header: Nút chọn lớp & Quiz - Căn chỉnh đồng đều h-[60px] kèm hướng dẫn vuốt mobile */}
      <div className="flex justify-center">
      <div className="bg-white p-2 rounded-3xl shadow-lg border border-slate-100 mt-4 overflow-hidden">
        <div className="flex flex-nowrap overflow-x-auto gap-3 pb-2 pt-1 px-1 no-scrollbar items-center">
          <div className="flex flex-col items-center shrink-0">
            <div className="bg-red-600 text-white px-6 rounded-2xl shadow-lg flex items-center justify-center h-[60px] whitespace-nowrap border-b-4 border-red-800 animate-pulse">
              <span className="font-black text-sm uppercase flex items-center gap-2">
                <i className="fas fa-edit"></i> Kiểm tra và QuiZ ⇄
              </span>
            </div>
            <div className="md:hidden text-[8px] font-black text-red-500 mt-1 uppercase flex items-center gap-1">
              <i className="fas fa-arrow-left"></i> Trên điện thoại vuốt sang trái
            </div>
          </div>
          
          {[
            {g: 9, icon: 'fas fa-user-graduate'},
            {g: 10, icon: 'fas fa-user-graduate'},
            {g: 11, icon: 'fas fa-user-graduate'},
            {g: 12, icon: 'fas fa-user-graduate'}
          ].map(item => (
            <button key={item.g} onClick={() => onSelectGrade(item.g)} className="px-6 bg-blue-600 text-white border-b-4 border-blue-800 rounded-2xl font-black text-sm shrink-0 hover:brightness-110 active:scale-95 transition-all h-[60px] flex items-center justify-center gap-2 min-w-[120px]">
              <i className={item.icon}></i> LỚP {item.g}
            </button>
          ))}
          <button onClick={() => setShowQuizModal({num: 20, pts: 0.5})} className="px-6 bg-orange-500 text-white border-b-4 border-orange-700 rounded-2xl font-black text-sm shrink-0 hover:brightness-110 h-[60px] uppercase whitespace-nowrap flex items-center justify-center gap-2 min-w-[130px]">
            <i className="fas fa-gift"></i> SĂN QUÀ 
          </button>          
        </div>
      </div>
     </div>
      <div className="flex flex-col items-center justify-center w-full px-4 gap-4 mt-6">
  
  {/* Thanh chạy chữ - Đã bo tròn và căn giữa */}
  <div className="bg-indigo-700 py-1.5 rounded-full overflow-hidden shadow-lg border-b-4 border-indigo-900 w-full max-w-4xl relative">
    <div className="overflow-hidden bg-blue-600/20 py-1.5 backdrop-blur-sm">  
      <div  
        className="whitespace-nowrap text-white font-bold uppercase text-[10px] tracking-widest inline-block"
        style={{
          animation: 'marquee-simple 20s linear infinite',
          display: 'inline-block',
          paddingLeft: '100%'
        }} 
      >
        ⭐ Chúc các em ôn tập tốt và luôn làm chủ kiến thức! ⭐ Thầy cô liên hệ: 0988.948.882 để được hướng dẫn sử dụng Apps và tạo Web miễn phí!
      </div>
    </div>
  </div>

  {/* CSS cho hiệu ứng chữ chạy */}
  <style>{`
    @keyframes marquee-simple {
      0% { transform: translate(0, 0); }
      100% { transform: translate(-100%, 0); }
    }
  `}</style>
</div>  
    </div>

      {/* 2. MARQUEE */}
      {/* Container bao ngoài để căn giữa toàn bộ hệ thống nút */}
 
      {/* 3. MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-7xl mx-auto w-full">
               {/* CỘT TRÁI: TOP 10 */}
        <div className="lg:col-span-3 flex flex-col">
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden border-b-4 border-blue-200 h-full flex flex-col min-h-[500px]">
            <div className="bg-blue-600 p-4 text-white font-black text-xs uppercase text-center flex items-center justify-center gap-2">
              <i className="fas fa-crown text-yellow-300"></i> TOP 10 CAO THỦ QUIZ
            </div>
            <div className="p-2 space-y-2 flex-grow bg-slate-50 overflow-y-auto max-h-[600px]">
              {stats.top10 && stats.top10.length > 0 ? (
                stats.top10.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-8 text-xl text-center">{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🏅"}</div>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-[11px] font-black uppercase truncate">{item.name || "Học sinh"}</div>
                      <div className="text-[9px] text-slate-400 font-bold">{item.idPhone || "09xxxx"}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[12px] font-black text-red-600">{item.score} <span className="text-[8px]">đ</span></div>
                      <div className="text-[9px] text-slate-400 italic">{item.time}s</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-slate-400 text-[10px] font-black uppercase">🚀 Đang tải bảng vàng...</div>
              )}
            </div>
          </div>
        </div>

        {/* 3.CAROUSEL */}
        <div className="lg:col-span-7">
          <div className="relative h-64 md:h-full min-h-[420px] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
            {IMAGES_CAROUSEL.map((img, idx) => (
              <img key={idx} src={img} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentImg ? 'opacity-100' : 'opacity-0'}`} alt="Carousel" />
            ))}
          </div>
        </div>

        {/* 4. CỘT PHẢI ACTIONS */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <button onClick={onOpenAuth} className="w-full flex-1 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase border-b-4 border-indigo-900 p-2">
            <i className="fas fa-sign-in-alt text-lg"></i><br/>{user ? user.phoneNumber : "Đăng Nhập"}
          </button>
          <button onClick={() => window.open("https://new-chat-bot-two.vercel.app/", '_blank')} className="w-full flex-1 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase border-b-4 border-indigo-900 p-2">
            <i className="fas fa-headset text-lg"></i><br/>Trợ lý học tập
          </button>
          <button onClick={() => window.open("https://www.facebook.com/hoctoanthayha.bg", '_blank')} className="w-full flex-1 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase border-b-4 border-indigo-900 p-2">
            <i className="fas fa-users text-lg"></i><br/>Đăng ký học Toán
          </button>
          
         <button onClick={() => setShowSubjectModal(true)} className="w-full flex-1 bg-purple-600 text-white rounded-2xl font-black text-[10px] uppercase border-b-4 border-purple-800 p-2">
            <i className="fas fa-graduation-cap text-lg"></i><br/>Chọn môn học
          </button> 
           {/* Dropdown Ứng dụng khác */}
          <div className="relative group w-full flex-1">
            <button className="w-full h-full bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase border-b-4 border-teal-800 p-2">
              <i className="fas fa-th text-lg"></i><br/>Ứng dụng khác
            </button>
            <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-2xl shadow-2xl border hidden group-hover:block z-[100] p-2">
              {OTHER_APPS.map((app, idx) => (
                <a key={idx} href={app.link} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 hover:bg-teal-50 rounded-xl">
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
      {/* 5.MODAL CHỌN MÔN (2 CỘT) */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <h3 className="text-xl font-black text-indigo-700 uppercase text-center mb-6">Chọn môn học & cấp học</h3>
            <div className="grid grid-cols-2 gap-4 overflow-hidden">
              <div className="flex flex-col overflow-hidden">
                <div className="bg-indigo-50 p-2 font-black text-indigo-600 text-center uppercase text-[11px]">Môn học</div>
                <div className="overflow-y-auto space-y-1 mt-2 pr-2 no-scrollbar">
                  {SUBJECTS.map(sub => (
                    <button key={sub} onClick={() => setSelectedSubject(sub)} className={`w-full flex items-center gap-2 p-3 rounded-xl border-2 text-[11px] font-bold ${selectedSubject === sub ? 'bg-indigo-600 text-white' : 'bg-slate-50'}`}>
                      <div className="w-4 h-4 rounded border flex items-center justify-center bg-white text-indigo-600">
                        {selectedSubject === sub && "✓"}
                      </div> {sub}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col overflow-hidden">
                <div className="bg-orange-50 p-2 font-black text-orange-600 text-center uppercase text-[11px]">Cấp học</div>
                <div className="overflow-y-auto space-y-1 mt-2 pr-2 no-scrollbar">
                  {LEVELS.map(lvl => (
                    <button key={lvl} onClick={() => setSelectedLevel(lvl)} className={`w-full flex items-center gap-2 p-3 rounded-xl border-2 text-[11px] font-bold ${selectedLevel === lvl ? 'bg-orange-500 text-white' : 'bg-slate-50'}`}>
                      <div className="w-4 h-4 rounded border flex items-center justify-center bg-white text-orange-600">
                        {selectedLevel === lvl && "✓"}
                      </div> {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowSubjectModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-black uppercase text-xs">Hủy</button>
              <button onClick={handleRedirect} disabled={!selectedSubject || !selectedLevel} className={`flex-1 py-3 rounded-xl font-black uppercase text-xs ${selectedSubject && selectedLevel ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>Tiếp tục</button>
            </div>
          </div>
        </div>
      )}
        
  {/* 6.MODAL QUIZ (Sửa lỗi step-by-step) */}
      {showQuizModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative border border-slate-100 overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black text-orange-500 mb-6 uppercase text-center">
              {quizMode === 'gift' ? '🎁 Chế độ Quà QuiZ' : quizMode === 'free' ? '🎮 QuiZ Tự Do' : '🚀 Chọn chế độ chơi'}
            </h2>

            {!quizMode ? (
              <div className="flex flex-col gap-4">
                <button onClick={() => setQuizMode('free')} className="py-4 bg-blue-500 text-white rounded-2xl font-bold uppercase flex items-center justify-center gap-2 hover:brightness-110 shadow-lg">
                  <i className="fas fa-gamepad text-xl"></i> Chơi Tự Do
                </button>
                <button onClick={() => setQuizMode('gift')} className="py-4 bg-orange-500 text-white rounded-2xl font-bold uppercase flex items-center justify-center gap-2 hover:brightness-110 shadow-lg shadow-orange-200">
                  <i className="fas fa-gift text-xl"></i> Săn Quà QuiZ
                </button>
                <button onClick={() => setShowQuizModal(null)} className="mt-2 text-slate-400 text-sm font-bold">Để sau</button>
              </div>
            ) : (
              <form onSubmit={handleStartQuiz} className="space-y-4 animate-fade-in">
                {quizMode === 'gift' && (
                  <input required type="password" placeholder="Nhập mật khẩu Admin cấp " className="w-full p-4 bg-red-50 border-2 border-red-100 rounded-xl font-bold text-center" value={inputPassword} onChange={e => setInputPassword(e.target.value)} />
                )}
                {/* 1. Nhập Họ tên */}
                <input required placeholder="Họ và tên học sinh" 
                className="w-full p-3 bg-slate-100 rounded-xl font-bold" value={quizInfo.name} onChange={e=>setQuizInfo({...quizInfo, name: e.target.value})} />

                {/* 2. Nhập Số điện thoại */}
                <input required type="tel" placeholder="Số điện thoại" 
                className="w-full p-3 bg-slate-100 rounded-xl font-bold" value={quizInfo.phone} onChange={e=>setQuizInfo({...quizInfo, phone: e.target.value})} />

               {/* 3. Chọn Lớp */}
          <div className="space-y-2">
            <select required className="w-full p-3 bg-slate-100 rounded-xl font-bold" 
              onChange={(e) => {
                const val = e.target.value;
                setIsOtherClass(val === "Khác");
                setQuizInfo({...quizInfo, class: val === "Khác" ? "" : val});
              }}>
              <option value="">-- Chọn lớp học --</option>
              {(ADMIN_CONFIG.CLASS_ID || []).filter(c => c !== "Khác").map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="Khác">Lớp khác (Tự nhập...)</option>
            </select>
            {isOtherClass && (
              <input required placeholder="Nhập tên lớp của em..." 
                className="w-full p-3 bg-orange-50 border border-orange-200 rounded-xl font-bold"
                value={quizInfo.class} onChange={e => setQuizInfo({...quizInfo, class: e.target.value})} 
              />
            )}
          </div>
{/*  Chọn Trường học (Đoạn gốc của thầy) */}
<select required className="w-full p-3 bg-slate-100 rounded-xl font-bold" onChange={(e) => {
  const val = e.target.value;
  setIsOtherSchool(val === "Khác");
  setQuizInfo({...quizInfo, school: val});
}}>
  <option value="">-- Chọn trường học --</option>
  {ADMIN_CONFIG.schools.map(s => <option key={s} value={s}>{s}</option>)}
</select>

                {quizMode === 'gift' && (
                  <div className="p-4 bg-orange-50 rounded-2xl space-y-3 border border-orange-100">
                    <p className="text-[10px] font-black text-orange-400 uppercase text-center">Thông tin nhận thưởng</p>
                    <input required placeholder="Số tài khoản ngân hàng" className="w-full p-3 bg-white rounded-xl font-bold" value={bankInfo.stk} onChange={e=>setBankInfo({...bankInfo, stk: e.target.value})} />
                    <select required className="w-full p-3 bg-white rounded-xl font-bold" onChange={(e) => {
                      const val = e.target.value;
                      setIsOtherBank(val === "Khác");
                      setBankInfo({...bankInfo, bankName: val});
                    }}>
                      <option value="">-- Ngân hàng --</option>
                      {ADMIN_CONFIG.banks.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                )}
                <button className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black shadow-xl uppercase tracking-widest mt-4">Vào Thi Ngay</button>
                <button type="button" onClick={() => setQuizMode(null)} className="w-full text-slate-400 text-xs font-bold uppercase">Quay lại chọn chế độ</button>
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

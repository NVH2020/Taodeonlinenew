import React, { useState, useEffect } from 'react';
import { IMAGES_CAROUSEL, DANHGIA_URL, ADMIN_CONFIG, OTHER_APPS } from '../config';
import { AppUser, Student } from '../types';

interface LandingPageProps {
  onSelectGrade: (grade: number) => void;
  onSelectQuiz: (num: number, pts: number, quizStudent: Partial<Student>) => void;
  user: AppUser | null;
  onOpenAuth: () => void;
  onOpenVip: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({
  onSelectGrade,
  onSelectQuiz,
  user,
  onOpenAuth,
  onOpenVip
}) => {

  const SUBJECTS = ["Toán học", "Vật lí", "Hóa học", "Sinh học", "Văn học", "Lịch sử", "Địa lí", "Tin học", "Tiếng Anh", "GDKT&PL", "CNCN", "CNNN", "Khác"];
  const LEVELS = ["THPT", "THCS", "Tiểu học", "Đại học", "Cao học", "Trên cao học"];

  const REDIRECT_LINKS: Record<string, string> = {
    "Toán học-THPT": "https://www.facebook.com/hoctoanthayha.bg",
    "Vật lí-THCS": "https://twitter.com/Math_teacher_Ha",
    "default": "https://www.facebook.com/hoctoanthayha.bg"
  };

  const [isOtherBank, setIsOtherBank] = useState(false);
  const [quizMode, setQuizMode] = useState<'free' | 'gift' | null>(null);
  const [inputPassword, setInputPassword] = useState('');
  const [currentImg, setCurrentImg] = useState(0);
  const [showQuizModal, setShowQuizModal] = useState<{ num: number, pts: number } | null>(null);
  const [quizInfo, setQuizInfo] = useState({ name: '', class: '', school: '', phone: '' });
  const [bankInfo, setBankInfo] = useState({ stk: '', bankName: '' });
  const [serverPassword, setServerPassword] = useState("");
  const [isOtherSchool, setIsOtherSchool] = useState(false);
  const [isOtherClass, setIsOtherClass] = useState(false);
  const [showVipOptions, setShowVipOptions] = useState(false);
  const [showVipBenefits, setShowVipBenefits] = useState(false);
  const [showLichOptions, setshowLichOptions] = useState(false);

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");

  // ✅ FIX LỖI: thiếu ratings
  const [stats, setStats] = useState<{ ratings: Record<number, number>, top10: any[] }>({
    ratings: {},
    top10: []
  });

  const handleLichClick = () => {
    setshowLichOptions(true);
  };

  useEffect(() => {
    if (IMAGES_CAROUSEL.length === 0) return;
    const interval = setInterval(() => {
      setCurrentImg(prev => (prev + 1) % IMAGES_CAROUSEL.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();

    if (quizMode === 'gift' && inputPassword !== serverPassword)
      return alert("Mật khẩu Quà QuiZ không chính xác!. Liên hệ: 0988.948.882 để được giải đáp!");

    if (!quizInfo.name || !quizInfo.phone)
      return alert("Vui lòng nhập đầy đủ thông tin!");

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
    const link = REDIRECT_LINKS[key] || REDIRECT_LINKS.default;
    window.open(link, '_blank');
    setShowSubjectModal(false);
  };

  useEffect(() => {
    const fetchPassword = async () => {
      try {
        const res = await fetch(`${DANHGIA_URL}?type=getPass`);
        const data = await res.json();
        if (data?.password) setServerPassword(data.password.toString());
      } catch (e) {
        console.error("Lỗi lấy mật khẩu:", e);
      }
    };
    fetchPassword();
  }, []);

  useEffect(() => {
    const fetchTop10 = async () => {
      try {
        const res = await fetch(`${DANHGIA_URL}?type=top10`);
        const json = await res.json();
        const data = json.data || json;

        if (Array.isArray(data)) {
          setStats(prev => ({ ...prev, top10: data.slice(0, 10) }));
        }
      } catch (e) {
        console.error("Lỗi lấy dữ liệu Top 10:", e);
      }
    };

    fetchTop10();
    const interval = setInterval(fetchTop10, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-6 pb-12 font-sans overflow-x-hidden">
      
      {/* 1. Header: Nút chọn lớp & Quiz */}
      <div className="flex justify-center">
      <div className="bg-white p-2 rounded-3xl shadow-lg border border-slate-100 mt-4 overflow-hidden max-w-full">
        <div className="flex flex-nowrap overflow-x-auto gap-3 pb-2 pt-1 px-1 no-scrollbar items-center">
          <div className="flex flex-col items-center shrink-0">
            <div className="bg-red-600 text-white px-6 rounded-2xl shadow-lg flex items-center justify-center h-[60px] whitespace-nowrap border-b-4 border-red-800 animate-pulse">
              <span className="font-black text-sm uppercase flex items-center gap-2">
                <i className="fas fa-edit"></i> Kiểm tra và QuiZ ⇄
              </span>
            </div>            
          </div>
           <button onClick={() => setShowQuizModal({num: 20, pts: 0.5})} className="px-6 bg-orange-500 text-white border-b-4 border-orange-700 rounded-2xl font-black text-sm shrink-0 hover:brightness-110 h-[60px] uppercase whitespace-nowrap flex items-center justify-center gap-2 min-w-[130px]">
            <i className="fas fa-gift"></i> SĂN QUÀ 
          </button>      
          
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
              
        </div>      
     </div>
      </div>
      <div className="flex flex-col items-center justify-center w-full px-4 gap-4 mt-6">
  
        {/* Thanh chạy chữ */}
        <div className="bg-indigo-700 py-1.5 rounded-full overflow-hidden shadow-lg border-b-4 border-indigo-900 w-full max-w-4xl relative">
            <div className="overflow-hidden bg-blue-600/20 py-1.5 backdrop-blur-sm">  
            <div  
                className="whitespace-nowrap text-white font-bold uppercase text-[18px] tracking-widest inline-block"
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
  

      {/* 3. MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-7xl mx-auto w-full px-2">
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

        {/* 3. CAROUSEL - SỬA LỖI: HIỂN THỊ ẢNH */}
        <div className="lg:col-span-7">
          <div className="relative h-64 md:h-full min-h-[420px] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white group">
            {IMAGES_CAROUSEL.map((img, idx) => (
              <img 
                key={idx} 
                src={img} 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentImg ? 'opacity-100' : 'opacity-0'}`} 
                alt="Carousel" 
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-10 left-10 text-white drop-shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-black uppercase leading-none">Học Toán Thầy Hà</h2>
              <p className="text-orange-400 text-lg font-bold mt-2 tracking-widest uppercase">Chuyên tâm - Sáng tạo - Thành công</p>
            </div>
          </div>
        </div>

        {/* 4. CỘT PHẢI ACTIONS */}
        <div className="lg:col-span-2 flex flex-col gap-3">

  {/* Trợ lý học tập */}
  <button
    onClick={() => window.open("https://new-chat-bot-two.vercel.app/", "_blank")}
    className="w-full h-[88px] bg-indigo-600 text-white rounded-2xl
               border-b-4 border-indigo-900
               flex flex-col items-center justify-center
               font-black uppercase text-[15px]
               hover:bg-indigo-700 transition"
  >
    <i className="fas fa-headset text-2xl mb-1"></i>
    Trợ lý học tập
  </button>

  {/* Đăng ký học Toán */}
  <button
    onClick={() => window.open("https://www.facebook.com/hoctoanthayha.bg", "_blank")}
    className="w-full h-[88px] bg-indigo-600 text-white rounded-2xl
               border-b-4 border-indigo-900
               flex flex-col items-center justify-center
               font-black uppercase text-[15px]
               hover:bg-indigo-700 transition"
  >
    <i className="fas fa-users text-2xl mb-1"></i>
    Đăng ký học Toán
  </button>

  {/* Lịch học Toán – CHỈ ICON */}
  <button
    onClick={handleLichClick}
    className="w-full h-[88px] bg-indigo-600 text-white rounded-2xl
               border-b-4 border-indigo-900
               flex items-center justify-center
               hover:bg-indigo-700 transition"
  >
    <i className="fas fa-calendar-alt text-3xl"></i>
  </button>

  {/* Chọn môn khác */}
  <button
    onClick={() => setShowSubjectModal(true)}
    className="w-full h-[88px] bg-purple-600 text-white rounded-2xl
               border-b-4 border-purple-800
               flex flex-col items-center justify-center
               font-black uppercase text-[15px]
               hover:bg-purple-700 transition"
  >
    <i className="fas fa-graduation-cap text-2xl mb-1"></i>
    Chọn môn khác
  </button>

  {/* Ứng dụng khác */}
  <div className="relative group w-full">
    <button
      className="w-full h-[88px] bg-indigo-600 text-white rounded-2xl
                 border-b-4 border-indigo-900
                 flex flex-col items-center justify-center
                 font-black uppercase text-[15px]
                 hover:bg-indigo-700 transition"
    >
      <i className="fas fa-th text-2xl mb-1"></i>
      Ứng dụng khác
    </button>

    <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-2xl shadow-2xl
                    border hidden group-hover:block z-[100] p-2">
      {OTHER_APPS.map((app, idx) => (
        <a
          key={idx}
          href={app.link}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 p-3 hover:bg-teal-50 rounded-xl"
        >
          <i className={`${app.icon} text-teal-600 w-5`}></i>
          <span className="text-[12px] font-black text-slate-700 uppercase">
            {app.label}
          </span>
        </a>
      ))}
    </div>
  </div>

  {/* VIP */}
  <button
    onClick={onOpenVip}
    className="w-full h-[88px] bg-gradient-to-r from-amber-400 to-orange-500
               text-white rounded-2xl border-b-4 border-orange-700
               flex flex-col items-center justify-center
               font-black uppercase text-[15px]
               hover:from-amber-500 hover:to-orange-600 transition"
  >
    <i className="fas fa-gem text-2xl mb-1"></i>
    Nâng cấp VIP
  </button>

</div>


      {/* MODAL LỊCH HỌC */}
      {showLichOptions && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300 border-4 border-white">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-8 text-center text-white relative">
              <div className="absolute top-4 right-6 text-white/50 text-6xl font-black">CALENDAR</div>
              <i className="fas fa-calendar-alt text-5xl mb-3"></i>
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">Lịch Học Offline</h3>
              <p className="text-orange-100 font-bold">Cập nhật mới nhất học kỳ này</p>
            </div>
            <div className="p-6 bg-slate-50">
              <div className="grid gap-3">
                {[
                  { grade: "Lớp 9", time: "Thứ 2: 16h30", color: "bg-blue-500" },
                  { grade: "Lớp 10", time: "Thứ 4: 16h30 & Thứ 7: 14h15", color: "bg-indigo-500" },
                  { grade: "Lớp 11", time: "Thứ 3: 14h15 & Thứ 6: 14h15", color: "bg-purple-500" },
                  { grade: "Lớp 12", time: "Thứ 3: 16h30 & Thứ 5: 16h30", color: "bg-red-500" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-100 hover:scale-[1.02] transition-transform">
                    <div className={`${item.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0 shadow-lg`}>
                      {item.grade.split(" ")[1]}
                    </div>
                    <div className="ml-4">
                      <div className="text-slate-400 text-[10px] font-black uppercase">Khối {item.grade}</div>
                      <div className="text-slate-800 font-black text-lg">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 bg-white border-t border-slate-100">
              <button 
                onClick={() => setshowLichOptions(false)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-orange-600 transition-colors"
              >
                Đóng lịch học
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VIP OPTIONS */}
      {showVipOptions && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm text-center shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <h3 className="text-xl font-black text-slate-800 mb-6 uppercase">Em muốn thực hiện gì?</h3>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => { setShowVipBenefits(true); setShowVipOptions(false); }}
                className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black border-b-4 border-blue-700 active:translate-y-1 transition-all uppercase"
              >
                <i className="fas fa-list-check mr-2"></i> Quyền lợi VIP
              </button>

              <a 
                href="https://forms.gle/co6FiWndaaLjtFNR8" 
                target="_blank" 
                rel="noreferrer"
                className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black border-b-4 border-orange-700 active:translate-y-1 transition-all uppercase block"
              >
                <i className="fas fa-paper-plane mr-2"></i> Đăng ký VIP ngay
              </a>
            </div>

            <button onClick={() => setShowVipOptions(false)} className="mt-6 text-slate-400 font-bold hover:text-red-500 transition">Đóng</button>
          </div>
        </div>
      )}

      {/* MODAL VIP BENEFITS */}
      {showVipBenefits && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md relative animate-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-2xl font-black text-orange-600 mb-4 uppercase text-center italic">Đặc quyền VIP</h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 font-bold text-slate-700">
                <i className="fas fa-check-circle text-green-500 text-xl"></i> Mở khóa toàn bộ kho đề thi 10, 11, 12.
              </li>
              <li className="flex items-center gap-3 font-bold text-slate-700">
                <i className="fas fa-check-circle text-green-500 text-xl"></i> Xem lời giải chi tiết (Video + File PDF).
              </li>
              <li className="flex items-center gap-3 font-bold text-slate-700">
                <i className="fas fa-check-circle text-green-500 text-xl"></i> Không giới hạn lượt làm Quiz mỗi ngày.
              </li>
              <li className="flex items-center gap-3 font-bold text-slate-700">
                <i className="fas fa-check-circle text-green-500 text-xl"></i> Hỗ trợ trực tiếp từ Thầy qua Zalo VIP.
              </li>
            </ul>
            <button 
              onClick={() => setShowVipBenefits(false)}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold uppercase"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* MODAL CHỌN MÔN (2 CỘT) */}
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
        
      {/* MODAL QUIZ */}
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
                  <i className="fas fa-gift text-xl"></i>Quà QuiZ
                </button>
                <button onClick={() => setShowQuizModal(null)} className="mt-2 text-slate-400 text-sm font-bold">Để sau</button>
              </div>
            ) : (
              <form onSubmit={handleStartQuiz} className="space-y-4 animate-fade-in">
                {quizMode === 'gift' && (
                  <input required type="password" placeholder="Nhập mật khẩu Admin cấp " className="w-full p-4 bg-red-50 border-2 border-red-100 rounded-xl font-bold text-center" value={inputPassword} onChange={e => setInputPassword(e.target.value)} />
                )}
                
                <input required placeholder="Họ và tên học sinh" 
                className="w-full p-3 bg-slate-100 rounded-xl font-bold" value={quizInfo.name} onChange={e=>setQuizInfo({...quizInfo, name: e.target.value})} />

                <input required type="tel" placeholder="Số điện thoại" 
                className="w-full p-3 bg-slate-100 rounded-xl font-bold" value={quizInfo.phone} onChange={e=>setQuizInfo({...quizInfo, phone: e.target.value})} />

                {/* Chọn Lớp */}
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

                {/* Chọn Trường học - ĐÃ SỬA LỖI: Thêm ô nhập khi chọn 'Khác' */}
                <div className="space-y-2">
                    <select required className="w-full p-3 bg-slate-100 rounded-xl font-bold" onChange={(e) => {
                    const val = e.target.value;
                    setIsOtherSchool(val === "Khác");
                    setQuizInfo({...quizInfo, school: val === "Khác" ? "" : val});
                    }}>
                    <option value="">-- Chọn trường học --</option>
                    {ADMIN_CONFIG.schools.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {isOtherSchool && (
                        <input required placeholder="Nhập tên trường của em..." 
                        className="w-full p-3 bg-orange-50 border border-orange-200 rounded-xl font-bold"
                        value={quizInfo.school} onChange={e => setQuizInfo({...quizInfo, school: e.target.value})} 
                        />
                    )}
                </div>

                {quizMode === 'gift' && (
                  <div className="p-4 bg-orange-50 rounded-2xl space-y-3 border border-orange-100">
                    <p className="text-[10px] font-black text-orange-400 uppercase text-center">Thông tin nhận thưởng</p>
                    <input required placeholder="Số tài khoản ngân hàng" className="w-full p-3 bg-white rounded-xl font-bold" value={bankInfo.stk} onChange={e=>setBankInfo({...bankInfo, stk: e.target.value})} />
                    
                    <div className="space-y-2">
                        <select required className="w-full p-3 bg-white rounded-xl font-bold" onChange={(e) => {
                        const val = e.target.value;
                        setIsOtherBank(val === "Khác");
                        setBankInfo({...bankInfo, bankName: val === "Khác" ? "" : val});
                        }}>
                        <option value="">-- Ngân hàng --</option>
                        {ADMIN_CONFIG.banks.map(b => <option key={b} value={b}>{b}</option>)}
                        <option value="Khác">Ngân hàng khác</option>
                        </select>
                        {isOtherBank && (
                             <input required placeholder="Tên ngân hàng..." 
                             className="w-full p-3 bg-white border border-orange-200 rounded-xl font-bold"
                             value={bankInfo.bankName} onChange={e => setBankInfo({...bankInfo, bankName: e.target.value})} 
                             />
                        )}
                    </div>
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

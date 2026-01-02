
import React, { useState, useEffect } from 'react';
import { ExamConfig, Student, ExamResult, Question, AppUser } from './types';
import { API_ROUTING, DEFAULT_API_URL, VIP_SHEET_URL, DANHGIA_URL } from './config';
import LandingPage from './components/LandingPage';
import ExamPortal from './components/ExamPortal';
import QuizInterface from './components/QuizInterface';
import ResultView from './components/ResultView';
import { getRandomQuizQuestion } from './questionquiz';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'portal' | 'quiz' | 'result'>('landing');
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [activeExam, setActiveExam] = useState<any>(null);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [user, setUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('app_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [showAuth, setShowAuth] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);

  useEffect(() => {
    if (user) localStorage.setItem('app_user', JSON.stringify(user));
    else localStorage.removeItem('app_user');
  }, [user]);

  const handleStartExam = (config: any, student: Student, selectedQuestions: Question[]) => {
    setActiveExam(config);
    setActiveStudent(student);
    setQuestions(selectedQuestions);
    setCurrentView('quiz');
  };

  const handleStartQuizMode = (num: number, pts: number, quizStudent: any) => {
    const quizQuestions: Question[] = [];
    const usedIds = new Set<string | number>();
    for(let i=0; i<num; i++) {
      const q = getRandomQuizQuestion(Array.from(usedIds) as any);
      usedIds.add(q.id);
      quizQuestions.push({...q, shuffledOptions: q.o ? [...q.o].sort(() => 0.5 - Math.random()) : undefined});
    }
    setActiveExam({ id: 'QUIZ', title: `Luyện tập Quiz (${num} câu)`, time: 9999, mcqPoints: pts, tfPoints: pts, saPoints: pts, gradingScheme: 1 });
    setActiveStudent({ 
      sbd: quizStudent.phoneNumber || 'QUIZ_GUEST', 
      name: quizStudent.name || 'Khách', 
      class: quizStudent.class || 'Tự do',
      school: quizStudent.school || 'Tự do',
      phoneNumber: quizStudent.phoneNumber,
      stk: quizStudent.stk,
      bank: quizStudent.bank,
      limit: 99, limittab: 99, idnumber: 'QUIZ', 
      taikhoanapp: user?.isVip ? 'VIP' : 'FREE' 
    });
    setQuestions(quizQuestions);
    setCurrentView('quiz');
  };

  const handleFinishExam = async (result: ExamResult) => {
    setExamResult(result);
    setCurrentView('result');
    
    let targetUrl = (result.type === 'quiz') ? DANHGIA_URL : (activeStudent && API_ROUTING[activeStudent.idnumber] ? API_ROUTING[activeStudent.idnumber] : DEFAULT_API_URL);

    try {
      await fetch(targetUrl, { method: 'POST', mode: 'no-cors', body: JSON.stringify(result) });
    } catch (e) { console.error("Lỗi gửi kết quả:", e); }
  };

  const goHome = () => {
    setCurrentView('landing');
    setActiveExam(null);
    setActiveStudent(null);
    setExamResult(null);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-100 bg-slate-50">
      <header className="bg-blue-800 text-white py-12 shadow-2xl text-center relative overflow-hidden border-b-8 border-blue-900 px-4">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-2 drop-shadow-lg leading-tight">HỆ THỐNG KIỂM TRA ONLINE MÔN TOÁN</h1>
          <p className="text-sm md:text-lg opacity-90 font-black tracking-wide max-w-2xl mx-auto uppercase">Học tập chuyên nghiệp - Kết quả bứt phá</p>
        </div>
      </header>

      <main className="flex-grow max-w-[1400px] mx-auto w-full p-4 md:p-10">
        {currentView === 'landing' && (
          <LandingPage user={user} onOpenAuth={() => setShowAuth(true)} onOpenVip={() => user ? setShowVipModal(true) : setShowAuth(true)} onSelectGrade={(grade) => { setSelectedGrade(grade); setCurrentView('portal'); }} onSelectQuiz={handleStartQuizMode} />
        )}
        {currentView === 'portal' && selectedGrade && (
          <ExamPortal grade={selectedGrade} onBack={goHome} onStart={handleStartExam} />
        )}
        {currentView === 'quiz' && activeExam && activeStudent && (
          <QuizInterface config={activeExam} student={activeStudent} questions={questions} onFinish={handleFinishExam} isQuizMode={activeExam.id === 'QUIZ'} />
        )}
        {currentView === 'result' && examResult && (
          <ResultView result={examResult} questions={questions} onBack={goHome} />
        )}
      </main>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={(u) => { setUser(u); setShowAuth(false); }} />}
      {showVipModal && <VipModal user={user!} onClose={() => setShowVipModal(false)} />}

      <footer className="bg-slate-900 py-10 text-center text-slate-500 text-[10px] md:text-xs mt-10 px-4">
        <p className="font-black text-slate-400 mb-2 uppercase tracking-widest">Phát triển bởi nhóm GV Toán. Admin Nguyễn Văn Hà</p>
        <p>&copy; {new Date().getFullYear()} THPT Yên Dũng số 2 - Kiểm tra chuyên nghiệp.</p>
      </footer>
    </div>
  );
};

const AuthModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: (u: AppUser) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', phone: '', pass: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const resp = await fetch(`${DANHGIA_URL}?type=login&phone=${formData.phone}&pass=${formData.pass}`);
        const result = await resp.json();
        if (result.status === "success") {
          onSuccess({ phoneNumber: result.data.phone, isVip: result.data.isVip, name: result.data.name });
        } else alert(result.message);
      } else {
        const payload = { type: 'register', ...formData };
        await fetch(DANHGIA_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
        alert("Đăng ký thành công! Hãy đăng nhập lại.");
        setIsLogin(true);
      }
    } catch (e) { alert("Lỗi kết nối máy chủ!"); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative animate-fade-in border border-slate-100">
        <h2 className="text-3xl font-black text-slate-800 mb-6 uppercase tracking-tighter text-center">{isLogin ? 'ĐĂNG NHẬP' : 'TẠO TÀI KHOẢN'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && <input required placeholder="Họ và tên" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-blue-100" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />}
          <input required type="tel" placeholder="Số điện thoại" className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} />
          <input required type="password" placeholder="Mật khẩu" className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={formData.pass} onChange={e=>setFormData({...formData, pass: e.target.value})} />
          <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition active:scale-95 border-b-4 border-blue-800 uppercase text-lg">
            {loading ? 'ĐANG XỬ LÝ...' : (isLogin ? 'VÀO HỆ THỐNG' : 'ĐĂNG KÝ NGAY')}
          </button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-6 text-slate-400 font-black hover:text-blue-600 transition text-sm uppercase">
          {isLogin ? 'Chưa có tài khoản? Đăng ký tại đây' : 'Đã có tài khoản? Quay lại đăng nhập'}
        </button>
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 text-2xl">✕</button>
      </div>
    </div>
  );
};

const VipModal = ({ user, onClose }: { user: AppUser, onClose: () => void }) => {
  const [loading, setLoading] = useState(false);
  const handleVipRegister = async () => {
    setLoading(true);
    try {
      await fetch(DANHGIA_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ type: 'vip', phone: user.phoneNumber }) });
      alert("Đã gửi yêu cầu nâng cấp VIP. Admin sẽ phê duyệt sớm!");
      onClose();
    } catch (e) { alert("Lỗi!"); } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative border border-amber-100 text-center">
        <h2 className="text-3xl font-black text-amber-500 mb-4 uppercase">NÂNG CẤP VIP</h2>
        <div className="bg-amber-50 p-6 rounded-3xl mb-6 text-left space-y-2">
          <p className="text-xs font-bold text-amber-800">💎 Quyền lợi tài khoản VIP:</p>
          <ul className="text-[10px] text-amber-700 font-black space-y-1 uppercase">
            <li>✓ Không giới hạn lượt thi đề tự do</li>
            <li>✓ Xem giải thích chi tiết mọi câu hỏi</li>
            <li>✓ Ưu tiên hiển thị trên bảng vàng</li>
            <li>✓ Tham gia cộng đồng toán học VIP</li>
          </ul>
        </div>
        <button onClick={handleVipRegister} disabled={loading} className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black shadow-xl uppercase active:scale-95 border-b-4 border-amber-700 text-lg">
          {loading ? "ĐANG XỬ LÝ..." : "XÁC NHẬN ĐĂNG KÝ VIP"}
        </button>
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 text-2xl">✕</button>
      </div>
    </div>
  );
};

export default App;

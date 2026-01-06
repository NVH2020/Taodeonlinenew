import React, { useState } from 'react';
import { Student, ExamResult, Question, AppUser } from './types';
import { API_ROUTING, DEFAULT_API_URL, DANHGIA_URL } from './config';
import LandingPage from './components/LandingPage';
import ExamPortal from './components/ExamPortal';
import QuizInterface from './components/QuizInterface';
import ResultView from './components/ResultView';
import Footer from './components/Footer';
import { getRandomQuizQuestion } from './questionquiz';
import { AppProvider } from './contexts/AppContext';

const App: React.FC = () => {
  // 1. Quản lý người dùng và Giao diện
  const [user, setUser] = useState<AppUser | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [currentView, setCurrentView] = useState<'landing' | 'portal' | 'quiz' | 'result'>('landing');

  // 2. Quản lý dữ liệu bài thi
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [activeExam, setActiveExam] = useState<any>(null);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  // 3. Xử lý điều hướng
  const goHome = () => {
    setCurrentView('landing');
    setActiveExam(null);
    setActiveStudent(null);
    setExamResult(null);
  };

  const handleStartExam = (config: any, student: Student, selectedQuestions: Question[]) => {
    setActiveExam(config);
    setActiveStudent(student);
    setQuestions(selectedQuestions);
    setCurrentView('quiz');
  };

  const handleStartQuizMode = (num: number, pts: number, quizStudent: any) => {
    const quizQuestions: Question[] = [];
    const usedIds = new Set<string | number>();
    for (let i = 0; i < num; i++) {
      const q = getRandomQuizQuestion(Array.from(usedIds) as any);
      if (q) {
        usedIds.add(q.id);
        quizQuestions.push({
          ...q,
          shuffledOptions: q.o ? [...q.o].sort(() => 0.5 - Math.random()) : undefined
        });
      }
    }
    setActiveExam({ 
      id: 'QUIZ', 
      title: `Luyện tập Quiz (${num} câu)`, 
      time: 15, 
      mcqPoints: pts, 
      tfPoints: pts, 
      saPoints: pts, 
      gradingScheme: 1 
    });
    setActiveStudent({
      sbd: quizStudent.phoneNumber || 'QUIZ_GUEST',
      name: quizStudent.name || 'Khách',
      class: quizStudent.class || 'Tự do',
      school: quizStudent.school || 'Tự do',
      phoneNumber: quizStudent.phoneNumber,
      stk: quizStudent.stk,
      bank: quizStudent.bank,
      limit: 10,
      limittab: 10,
      idnumber: 'QUIZ',
      taikhoanapp: user?.vip === 'Vip1' ? 'VIP' : 'FREE'
    });
    setQuestions(quizQuestions);
    setCurrentView('quiz');
  };

  const handleFinishExam = async (result: ExamResult) => {
    setExamResult(result);
    setCurrentView('result');
    let targetUrl = DEFAULT_API_URL;
    if (result.type === 'quiz') {
      targetUrl = DANHGIA_URL;
    } else if (activeStudent && API_ROUTING[activeStudent.idnumber]) {
      targetUrl = API_ROUTING[activeStudent.idnumber];
    }
    try {
      await fetch(targetUrl, { method: 'POST', mode: 'no-cors', body: JSON.stringify(result) });
    } catch (e) {
      console.error("Lỗi gửi kết quả:", e);
    }
  };

  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col font-sans bg-slate-50">
        <header className="bg-blue-800 text-white py-12 shadow-2xl text-center relative overflow-hidden border-b-8 border-blue-900">
          <div className="relative z-10">
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-2">
              HỆ THỐNG HỌC TẬP VÀ KIỂM TRA ONLINE
            </h1>
            <p className="text-sm md:text-lg opacity-90 font-bold uppercase">Học tập chuyên nghiệp - Kết quả bứt phá</p>
          </div>
        </header>

        <main className="flex-grow max-w-[1400px] mx-auto w-full p-4 md:p-10">
          {currentView === 'landing' && (
            <LandingPage
              user={user}
              onOpenAuth={() => setShowAuth(true)}
              onOpenVip={() => user ? setShowVipModal(true) : setShowAuth(true)}
              onSelectGrade={(grade) => { setSelectedGrade(grade); setCurrentView('portal'); }}
              onSelectQuiz={handleStartQuizMode}
            />
          )}
          {currentView === 'portal' && selectedGrade && (
            <ExamPortal grade={selectedGrade} onBack={goHome} onStart={handleStartExam} />
          )}
          {currentView === 'quiz' && activeExam && activeStudent && (
            <QuizInterface
              config={activeExam}
              student={activeStudent}
              questions={questions}
              onFinish={handleFinishExam}
              isQuizMode={activeExam.id === 'QUIZ'}
            />
          )}
          {currentView === 'result' && examResult && (
            <ResultView result={examResult} questions={questions} onBack={goHome} />
          )}
        </main>

        {showAuth && (
          <AuthModal onClose={() => setShowAuth(false)} onSuccess={(u) => { setUser(u); setShowAuth(false); }} />
        )}
        {showVipModal && user && (
          <VipModal 
            user={user} 
            onClose={() => setShowVipModal(false)} 
            onSuccess={() => { setUser(prev => prev ? { ...prev, vip: 'Vip1' } : null); setShowVipModal(false); }} 
          />
        )}
        <Footer />
      </div>
    </AppProvider>
  );
};

// --- CÁC COMPONENT MODAL PHỤ ---
const AuthModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: (u: AppUser) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Giả lập xử lý thành công để tránh lỗi CORS khi build
      onSuccess({ phoneNumber: phone, vip: 'Vip0' });
    } catch (e) {
      alert("Lỗi kết nối!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative">
        <h2 className="text-2xl font-black mb-6 uppercase">{isLogin ? 'Đăng nhập' : 'Đăng ký'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required type="tel" placeholder="Số điện thoại" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={phone} onChange={e => setPhone(e.target.value)} />
          <input required type="password" placeholder="Mật khẩu" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={pass} onChange={e => setPass(e.target.value)} />
          <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase border-b-4 border-blue-800">
            {loading ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN'}
          </button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-4 text-sm font-bold text-slate-400 uppercase">
          {isLogin ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
        </button>
        <button onClick={onClose} className="absolute top-6 right-6 text-2xl">✕</button>
      </div>
    </div>
  );
};

const VipModal = ({ user, onClose, onSuccess }: { user: AppUser, onClose: () => void, onSuccess: () => void }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative border-4 border-amber-400">
        <h2 className="text-2xl font-black text-orange-500 mb-6 uppercase">NÂNG CẤP VIP</h2>
        <p className="mb-8 font-bold text-slate-500">Đăng ký để mở khóa toàn bộ tính năng ôn tập nâng cao.</p>
        <button onClick={onSuccess} className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-black uppercase border-b-4 border-orange-700">
          XÁC NHẬN ĐĂNG KÝ
        </button>
        <button onClick={onClose} className="absolute top-6 right-6 text-2xl">✕</button>
      </div>
    </div>
  );
};

export default App;

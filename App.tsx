
import React, { useState, useEffect } from 'react';
import { Student, ExamResult, Question, AppUser } from './types';
import { API_ROUTING, DEFAULT_API_URL, DANHGIA_URL, fetchApiRouting, fetchAdminConfig } from './config';
import LandingPage from './components/LandingPage';
import ExamPortal from './components/ExamPortal';
import QuizInterface from './components/QuizInterface';
import ResultView from './components/ResultView';
import Footer from './components/Footer';
import { getRandomQuizQuestion } from './questionquiz';
import { AppProvider } from './contexts/AppContext';
import AdminPanel from './components/AdminManager';
import { fetchQuestionsBank } from './questions';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'portal' | 'quiz' | 'result' | 'admin'>('landing');
  const [adminMode, setAdminMode] = useState<'matran' | 'cauhoi' | 'word'>('matran'); 
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [activeExam, setActiveExam] = useState<any>(null);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [user, setUser] = useState<AppUser | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        await Promise.all([
          fetchAdminConfig(),
          fetchApiRouting(),
          fetchQuestionsBank()
        ]);
      } catch (e) {
        console.error("Lỗi khởi tạo:", e);
      }
    };
    initApp();
  }, []);

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
    setActiveExam({ id: 'QUIZ', title: `Luyện tập Quiz (${num} câu)`, time: 15, mcqPoints: pts, tfPoints: pts, saPoints: pts, gradingScheme: 1 });
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
      taikhoanapp: user?.isVip ? 'VIP' : 'FREE' 
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
    } catch (e) {}
  };

  const goHome = () => {
    setCurrentView('landing');
    setActiveExam(null);
    setActiveStudent(null);
    setExamResult(null);
  };

  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col font-sans selection:bg-blue-100 bg-slate-50">
        <header className="bg-blue-800 text-white py-8 md:py-12 shadow-2xl text-center relative overflow-hidden border-b-8 border-blue-900 px-4">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <h1 className="text-2xl md:text-5xl font-black uppercase tracking-tighter mb-2 drop-shadow-lg leading-tight">
              HỆ THỐNG HỌC TẬP VÀ KIỂM TRA ONLINE <br className="md:hidden" /> MÔN TOÁN THPT
            </h1>
            <p className="text-sm md:text-lg opacity-90 font-black tracking-wide max-w-2xl mx-auto uppercase">
              Học tập chuyên nghiệp - Kết quả bứt phá
            </p>
          </div>
        </header>

        <main className="flex-grow max-w-[1400px] mx-auto w-full p-4 md:p-10">
          <div className="flex flex-col gap-6">
             {currentView === 'landing' && (
                <LandingPage 
                  user={user} 
                  onOpenAuth={() => setShowAuth(true)} 
                  onOpenVip={() => user ? setShowVipModal(true) : setShowAuth(true)}
                  onSelectGrade={(grade) => { setSelectedGrade(grade.toString()); setCurrentView('portal'); }} 
                  onSelectQuiz={handleStartQuizMode}
                />
              )}
              {currentView === 'admin' && (
                <AdminPanel mode={adminMode} onBack={goHome} />
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
          </div>
        </main>
        <Footer />
      </div>
    </AppProvider>
  );
};

export default App;

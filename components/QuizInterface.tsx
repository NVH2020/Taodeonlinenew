
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ExamConfig, Question, UserAnswer, ExamResult, Student } from '../types';
import MathText from './MathText';

interface QuizInterfaceProps {
  config: ExamConfig;
  student: Student;
  questions: Question[];
  onFinish: (result: ExamResult) => void;
  isQuizMode?: boolean;
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({ config, student, questions, onFinish, isQuizMode = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>(
    questions.map(q => ({ 
      questionId: q.id, 
      answer: q.type === 'true-false' ? [undefined, undefined, undefined, undefined] : null 
    }))
  );
  
  const TOTAL_TIME = config.time * 60; // giây
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [tabSwitches, setTabSwitches] = useState(0);
  const hasFinished = useRef(false);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSubmit = useCallback(() => {
    if (hasFinished.current) return;
    hasFinished.current = true;

    let score = 0;
    questions.forEach((q, idx) => {
      const u = answers[idx].answer;
      if (q.type === 'mcq' && u === q.a) {
        score += config.mcqPoints;
      } else if (q.type === 'short-answer' && u?.toString().trim().toLowerCase() === q.a?.toString().trim().toLowerCase()) {
        score += config.saPoints;
      } else if (q.type === 'true-false' && Array.isArray(u) && q.s) {
        const correctCount = q.s.reduce((acc, s, si) => acc + (u[si] === s.a ? 1 : 0), 0);
        // Quy tắc tính điểm Đúng/Sai (0.1, 0.25, 0.5, 1.0 cho 1, 2, 3, 4 ý đúng)
        const bonusMap = [0, 0.1, 0.25, 0.5, 1];
        score += config.tfPoints * (bonusMap[correctCount] || 0);
      }
    });

    const elapsedSeconds = TOTAL_TIME - timeLeft;
    const timeDisplay = formatTime(elapsedSeconds);

    onFinish({ 
      type: isQuizMode ? 'quiz' : 'exam',
      timestamp: new Date().toISOString(), 
      examCode: config.id, 
      sbd: student.sbd, 
      name: student.name, 
      className: student.class,
      school: student.school,
      phoneNumber: student.phoneNumber,   
      score, 
      totalTime: timeDisplay, 
      stk: student.stk || "",
      bank: student.bank || "",
      tabSwitches,
      details: answers 
    });
  }, [answers, config, questions, student, timeLeft, tabSwitches, isQuizMode, onFinish]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => {
          const newCount = prev + 1;
          if (newCount >= student.limittab) {
            alert(`Cảnh báo: Bạn đã chuyển tab ${newCount} lần, vượt quá giới hạn. Hệ thống tự động nộp bài!`);
            handleSubmit();
          } else {
            alert(`Cảnh báo: Bạn đã chuyển tab ${newCount} lần. Vượt quá ${student.limittab} lần sẽ bị nộp bài!`);
          }
          return newCount;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [student.limittab, handleSubmit]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) { clearInterval(timer); handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleSubmit]);

  const handleAnswer = (val: any) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex].answer = val;
    setAnswers(newAnswers);
  };

  const handleTFAnswer = (sIdx: number, val: boolean) => {
    const newAnswers = [...answers];
    const currentAns = [...(newAnswers[currentIndex].answer as boolean[])];
    currentAns[sIdx] = val;
    newAnswers[currentIndex].answer = currentAns;
    setAnswers(newAnswers);
  };

  const isAnswered = (idx: number) => {
    const ans = answers[idx].answer;
    if (questions[idx].type === 'true-false') return (ans as any[]).some(v => v !== undefined);
    return ans !== null && ans !== "";
  };

  const getQuestionStyle = (idx: number) => {
    const answered = isAnswered(idx);
    if (answered) return "bg-blue-800 text-white border-blue-900 shadow-md";
    const q = questions[idx];
    const p = q.part.toUpperCase();
    if (p.includes("PHẦN I")) return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200";
    if (p.includes("PHẦN II")) return "bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-200";
    if (p.includes("PHẦN III")) return "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200";
    return "bg-slate-100 text-slate-500 border-slate-200";
  };

  const currentQuestion = questions[currentIndex];
  const pStr = currentQuestion.part.toUpperCase();
  const colorSet = pStr.includes("PHẦN I") ? { bg: "bg-blue-600", text: "text-blue-600" } : 
                   pStr.includes("PHẦN II") ? { bg: "bg-pink-600", text: "text-pink-600" } :
                   { bg: "bg-orange-600", text: "text-orange-600" };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 font-sans animate-fade-in">
      {/* Sidebar điều hướng */}
      <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
           <div className="space-y-3 mb-6">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                 <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Tài khoản</p>
                 <p className="font-black text-blue-700 truncate">{student.taikhoanapp || "FREE"}</p>
              </div>
              <div className={`p-4 rounded-2xl border transition-colors ${tabSwitches > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vi phạm tab</p>
                 <p className={`font-black ${tabSwitches > 0 ? 'text-red-600' : 'text-slate-700'}`}>{tabSwitches} / {student.limittab}</p>
              </div>
           </div>

          <div className="grid grid-cols-5 gap-2 max-h-[400px] overflow-y-auto pr-1 no-scrollbar">
            {questions.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setCurrentIndex(i)} 
                className={`aspect-square rounded-xl font-black text-xs transition-all border-2 flex items-center justify-center ${getQuestionStyle(i)} ${currentIndex === i ? 'ring-4 ring-yellow-400 scale-110 z-10' : ''}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-[2rem] shadow-xl text-center border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Thời gian còn lại</p>
          <p className={`text-4xl font-black ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
            {formatTime(timeLeft)}
          </p>
          <button 
            onClick={() => confirm("Bạn có chắc chắn muốn nộp bài?") && handleSubmit()} 
            className="w-full mt-6 py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg hover:bg-red-700 transition active:scale-95 border-b-4 border-red-800 uppercase text-sm"
          >
            Nộp Bài Thi
          </button>
        </div>
      </div>

      {/* Vùng hiển thị câu hỏi */}
      <div className="lg:col-span-3 order-1 lg:order-2">
        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl border border-slate-50 min-h-[600px] flex flex-col relative overflow-hidden">
          
          {/* Watermark bảo mật */}
          <div className="absolute inset-0 pointer-events-none z-0 flex flex-wrap justify-around align-content-around opacity-[0.05] select-none">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="text-slate-900 font-black text-xl p-12 whitespace-nowrap" style={{ transform: 'rotate(-25deg)' }}>
                {student.phoneNumber} - {student.name}
              </div>
            ))}
          </div>

          <div className="relative z-10 flex flex-col flex-grow">
            <div className="mb-8">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className={`px-4 py-1.5 rounded-full text-white font-black text-[10px] uppercase tracking-wider ${colorSet.bg}`}>
                  {currentQuestion.part}
                </span>
                <span className="text-slate-400 font-bold text-xs">ID: {currentQuestion.id}</span>
              </div>
              
              <div className="flex gap-4 items-start">
                 <span className={`w-12 h-12 shrink-0 flex items-center justify-center rounded-2xl font-black text-2xl text-white shadow-lg ${colorSet.bg}`}>
                    {currentIndex + 1}
                 </span>
                 <div className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed pt-1">
                    <MathText content={currentQuestion.question} />
                 </div>
              </div>
            </div>

            {/* Render các loại câu hỏi */}
            <div className="flex-grow">
              {currentQuestion.type === 'mcq' && currentQuestion.o && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.shuffledOptions?.map((opt, i) => {
                    const label = opt.split('.')[0];
                    const isSelected = answers[currentIndex].answer === label;
                    return (
                      <button 
                        key={i} 
                        onClick={() => handleAnswer(label)}
                        className={`p-5 rounded-3xl border-2 text-left transition-all flex items-start gap-4 group ${isSelected ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-slate-100 bg-slate-50 hover:border-blue-200'}`}
                      >
                        <span className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center font-black text-sm transition-all ${isSelected ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-400 group-hover:text-blue-500 border'}`}>
                          {label}
                        </span>
                        <div className={`font-bold pt-1 ${isSelected ? 'text-blue-800' : 'text-slate-600'}`}>
                           <MathText content={opt.substring(opt.indexOf('.') + 1).trim()} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQuestion.type === 'true-false' && currentQuestion.s && (
                <div className="space-y-4">
                  {currentQuestion.s.map((item, si) => {
                    const currentVal = (answers[currentIndex].answer as boolean[])[si];
                    return (
                      <div key={si} className="p-5 rounded-3xl bg-slate-50 border-2 border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:bg-pink-50/30">
                        <div className="flex gap-4 items-start flex-1">
                          <span className="font-black text-pink-600">{String.fromCharCode(97 + si)}.</span>
                          <div className="font-bold text-slate-700"><MathText content={item.text} /></div>
                        </div>
                        <div className="flex bg-white p-1 rounded-2xl shadow-sm shrink-0 border border-slate-100">
                          <button 
                            onClick={() => handleTFAnswer(si, true)}
                            className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${currentVal === true ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-blue-500'}`}
                          >Đúng</button>
                          <button 
                            onClick={() => handleTFAnswer(si, false)}
                            className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${currentVal === false ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-red-500'}`}
                          >Sai</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {currentQuestion.type === 'short-answer' && (
                <div className="max-w-md">
                   <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3 ml-2">Nhập kết quả cuối cùng</p>
                   <input 
                    type="text" 
                    placeholder="Gõ đáp án của bạn tại đây..." 
                    className="w-full p-5 bg-orange-50 border-4 border-orange-100 rounded-3xl font-black text-xl text-orange-700 outline-none focus:border-orange-400 transition-all shadow-inner"
                    value={answers[currentIndex].answer as string || ""}
                    onChange={(e) => handleAnswer(e.target.value)}
                   />
                </div>
              )}
            </div>

            {/* Điều hướng Next/Prev */}
            <div className="mt-10 flex justify-between items-center pt-8 border-t border-slate-100">
              <button 
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => prev - 1)}
                className="px-8 py-3 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs disabled:opacity-30 hover:bg-slate-200 transition-all flex items-center gap-2"
              >
                <i className="fas fa-chevron-left"></i> Câu trước
              </button>
              
              <div className="hidden md:block font-black text-slate-300 tracking-widest text-xs uppercase">
                {currentIndex + 1} / {questions.length}
              </div>

              {currentIndex === questions.length - 1 ? (
                <button 
                  onClick={() => confirm("Bạn đã hoàn thành câu cuối cùng. Nộp bài ngay?") && handleSubmit()}
                  className="px-10 py-3 bg-red-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-red-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  Hoàn tất bài làm <i className="fas fa-check-circle"></i>
                </button>
              ) : (
                <button 
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                  className="px-10 py-3 bg-slate-800 text-white rounded-2xl font-black uppercase text-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  Câu tiếp theo <i className="fas fa-chevron-right"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizInterface;

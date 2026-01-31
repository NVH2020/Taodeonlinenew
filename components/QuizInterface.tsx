
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
      if (q.type === 'mcq' && u === q.a) score += config.mcqPoints;
      else if (q.type === 'short-answer' && u?.toString().trim().toLowerCase() === q.a?.toString().trim().toLowerCase()) score += config.saPoints;
      else if (q.type === 'true-false' && Array.isArray(u) && q.s) {
        const correctCount = q.s.reduce((acc, s, si) => acc + (u[si] === s.a ? 1 : 0), 0);
        const bonusMap = [0, 0.1, 0.25, 0.5, 1];
        score += config.tfPoints * (bonusMap[correctCount] || 0);
      }
    });

    const elapsedSeconds = TOTAL_TIME - timeLeft;
    onFinish({ 
      type: isQuizMode ? 'quiz' : 'exam',
      timestamp: new Date().toISOString(), 
      examCode: config.id, 
      sbd: student.sbd, 
      name: student.name, 
      className: student.class,
      score, 
      totalTime: formatTime(elapsedSeconds), 
      details: answers 
    });
  }, [answers, config, questions, student, timeLeft, onFinish, isQuizMode]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(p => p <= 0 ? 0 : p - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAnswer = (val: any) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex].answer = val;
    setAnswers(newAnswers);
  };

  const currentQuestion = questions[currentIndex];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white rounded-[2rem] shadow-xl">
      <div className="flex justify-between items-center mb-8 bg-slate-50 p-4 rounded-2xl">
        <div className="text-xl font-black text-blue-800">CÂU {currentIndex + 1} / {questions.length}</div>
        <div className="text-3xl font-black text-red-600">{formatTime(timeLeft)}</div>
      </div>

      <div className="min-h-[300px] mb-8">
        <div className="text-lg md:text-xl font-bold text-slate-800 mb-6 leading-relaxed">
          <MathText content={currentQuestion.question} />
        </div>
        
        {currentQuestion.type === 'mcq' && currentQuestion.o && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.shuffledOptions?.map((opt, i) => {
               const label = opt.split('.')[0];
               return (
                <button key={i} onClick={() => handleAnswer(label)} className={`p-4 rounded-xl border-2 text-left transition-all ${answers[currentIndex].answer === label ? 'bg-blue-600 text-white border-blue-700' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}>
                  <MathText content={opt} />
                </button>
              );
            })}
          </div>
        )}

        {currentQuestion.type === 'short-answer' && (
          <input 
            className="w-full p-4 bg-orange-50 border-2 border-orange-200 rounded-xl font-bold"
            placeholder="Nhập kết quả..."
            value={answers[currentIndex].answer as string || ""}
            onChange={e => handleAnswer(e.target.value)}
          />
        )}
      </div>

      <div className="flex justify-between gap-4 border-t pt-6">
        <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(p => p - 1)} className="px-6 py-2 bg-slate-200 rounded-xl font-bold disabled:opacity-50">CÂU TRƯỚC</button>
        {currentIndex < questions.length - 1 ? (
          <button onClick={() => setCurrentIndex(p => p + 1)} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">CÂU SAU</button>
        ) : (
          <button onClick={handleSubmit} className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold">NỘP BÀI</button>
        )}
      </div>
    </div>
  );
};

export default QuizInterface;

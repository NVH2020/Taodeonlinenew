import React from 'react';
import { AppUser } from '../types';
import { GRADES, NEWS_DATA, IMAGES_CAROUSEL } from '../config';

interface LandingPageProps {
  user: AppUser | null;
  onOpenAuth: () => void;
  onOpenVip: () => void;
  onSelectGrade: (grade: number) => void;
  onSelectQuiz: (num: number, pts: number, student: any) => void;
}

const LandingPage: React.FC<LandingPageProps> = (props) => {
  const { user, onOpenAuth, onOpenVip, onSelectGrade, onSelectQuiz } = props;

  return (
    <div className="space-y-8 pb-20">
      {/* Auth Bar */}
      <div className="flex gap-4">
        <button onClick={onOpenAuth} className="flex-1 p-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase shadow-xl">
          {user ? `SBD: ${user.phoneNumber}` : "ĐĂNG NHẬP"}
        </button>
        <button onClick={onOpenVip} className="flex-1 p-6 bg-amber-500 text-white rounded-[2rem] font-black uppercase shadow-xl">
          NÂNG CẤP VIP
        </button>
      </div>

      {/* Grade Selection */}
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
        <h2 className="text-2xl font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded-full"></span> CHỌN KHỐI LỚP
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {GRADES.map(grade => (
            <button key={grade} onClick={() => onSelectGrade(grade)} className="py-8 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-[2rem] font-black text-3xl transition-all active:scale-95 shadow-sm border-2 border-transparent">
              LỚP {grade}
            </button>
          ))}
        </div>
      </div>

      {/* Quiz Section */}
      <div className="bg-gradient-to-br from-orange-400 to-red-500 p-10 rounded-[3rem] text-white shadow-2xl">
        <h2 className="text-3xl font-black uppercase mb-2">LUYỆN TẬP QUIZ</h2>
        <p className="font-bold opacity-80 mb-6 uppercase tracking-widest text-sm">Thử thách kiến thức nhanh</p>
        <button 
          onClick={() => onSelectQuiz(10, 1, { phoneNumber: user?.phoneNumber || 'GUEST' })}
          className="w-full py-5 bg-white text-orange-600 rounded-2xl font-black text-xl shadow-lg active:scale-95 uppercase"
        >
          BẮT ĐẦU NGAY
        </button>
      </div>
    </div>
  );
};

export default LandingPage;


import React from 'react';

interface FooterProps {
  onOpenRate: () => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenRate }) => {
  return (
    <footer className="mt-12 pt-12 pb-10 border-t border-slate-100 text-center space-y-8 bg-white rounded-t-[4rem] shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.05)] font-sans">
      <div className="max-w-xs mx-auto px-4">
        <button 
          onClick={onOpenRate} 
          className="w-full py-5 bg-blue-700 text-white rounded-full font-black text-sm shadow-2xl hover:translate-y-[-5px] hover:shadow-blue-200 transition-all border-b-8 border-blue-950 uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 group"
        >
          <i className="fas fa-star text-yellow-300 group-hover:rotate-[360deg] transition-transform duration-500"></i>
          <span>ĐÁNH GIÁ HỆ THỐNG</span>
        </button>
      </div>

      <div className="flex justify-center gap-8">
        <a 
          href="https://www.facebook.com/hoctoanthayha.bg" 
          target="_blank" 
          rel="noreferrer" 
          className="w-14 h-14 bg-[#1877F2] rounded-2xl text-white flex items-center justify-center text-2xl shadow-lg hover:scale-110 hover:-rotate-6 transition-all border-b-4 border-[#0e4da1]"
        >
          <i className="fab fa-facebook-f"></i>
        </a>
        <a 
          href="https://zalo.me/0988948882" 
          target="_blank" 
          rel="noreferrer" 
          className="w-14 h-14 bg-[#0068FF] rounded-2xl text-white flex items-center justify-center text-2xl shadow-lg hover:scale-110 hover:rotate-6 transition-all border-b-4 border-[#0047b3]"
        >
          <i className="fas fa-comment-dots"></i>
        </a>
        <a 
          href="tel:0988948882" 
          className="w-14 h-14 bg-emerald-500 rounded-2xl text-white flex items-center justify-center text-2xl shadow-lg hover:scale-110 hover:-rotate-6 transition-all border-b-4 border-emerald-700"
        >
          <i className="fas fa-phone-alt"></i>
        </a>
      </div>

      <div className="space-y-2 px-6">
        <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em]">
          © 2025 HỆ THỐNG HỌC TOÁN TRỰC TUYẾN CHUYÊN NGHIỆP
        </p>
        <p className="text-[10px] font-bold text-slate-400 uppercase">
          Thiết kế bởi <span className="text-blue-600">Thầy Hà - THPT Yên Dũng số 2</span>
        </p>
        <div className="flex justify-center items-center gap-2 pt-2 opacity-50">
          <div className="w-1 h-1 rounded-full bg-slate-400"></div>
          <p className="text-[8px] font-bold text-slate-400 uppercase">Bắc Ninh • Việt Nam</p>
          <div className="w-1 h-1 rounded-full bg-slate-400"></div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

// *End


import React from 'react';

interface FooterProps {
  onOpenRate: () => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenRate }) => {
  return (
    <footer className="mt-20 bg-[#0f172a] text-white pt-20 pb-16 font-sans px-8 md:px-16 border-t-4 border-blue-900">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
        
        {/* Left Side: Brand & Slogan */}
        <div className="space-y-4 max-w-2xl">
          <h2 className="text-4xl font-black tracking-tighter uppercase italic text-blue-400">Toán Thầy Hà - Bắc Ninh</h2>
          <p className="text-slate-400 font-bold text-lg leading-relaxed">Đồng hành cùng các em trên con đường chinh phục tri thức và bứt phá điểm số.</p>
        </div>

        {/* Right Side: Socials & Rate Button */}
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex gap-5">
            <a href="https://facebook.com/hoctoanthayha.bg" target="_blank" className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-2xl hover:bg-blue-600 transition-all hover:scale-110 shadow-2xl border border-slate-700">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="https://zalo.me/0988948882" target="_blank" className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-sm font-black hover:bg-blue-500 transition-all hover:scale-110 shadow-2xl border border-slate-700 uppercase">
              Zalo
            </a>
            <a href="https://t.me/" target="_blank" className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-2xl hover:bg-blue-400 transition-all hover:scale-110 shadow-2xl border border-slate-700">
              <i className="fab fa-telegram-plane"></i>
            </a>
          </div>

          <button 
            onClick={onOpenRate} 
            className="flex items-center gap-4 bg-slate-800 hover:bg-slate-700 px-10 py-4.5 rounded-full border-2 border-yellow-500/50 transition-all group active:scale-95 shadow-[0_0_30px_rgba(234,179,8,0.2)]"
          >
            <i className="fas fa-star text-yellow-400 text-xl group-hover:rotate-[360deg] transition-transform duration-700"></i>
            <span className="font-black text-sm uppercase tracking-[0.2em] text-yellow-400">Đánh giá web</span>
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto mt-20 pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="space-y-1 text-center md:text-left">
           <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">© 2025 TOANTHAYHA.BACNINH • ALL RIGHTS RESERVED</p>
           <p className="text-[10px] font-bold text-slate-600">Thiết kế chuyên nghiệp bởi Thầy Hà - THPT Yên Dũng số 2</p>
        </div>
        <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest text-slate-500">
          <a href="#" className="hover:text-blue-400 transition-colors">Điều khoản sử dụng</a>
          <a href="#" className="hover:text-blue-400 transition-colors">Chính sách bảo mật</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

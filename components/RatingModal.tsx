
import React, { useState, useEffect } from 'react';
import { DEFAULT_API_URL } from '../config';

interface RatingModalProps {
  onClose: () => void;
  userName?: string;
}

interface RatingStats {
  average: string;
  total: number;
  counts: Record<string, number>;
}

const SUGGESTIONS = [
  "Hệ thống mượt mà! 🚀",
  "Tài liệu hữu ích ạ! 📚",
  "Giao diện dễ dùng! ✨",
  "Cảm ơn thầy Hà! ❤️",
  "Đề thi rất sát! 💯",
  "Web học toán đỉnh! 🔥"
];

const RatingModal: React.FC<RatingModalProps> = ({ onClose, userName }) => {
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'initial' | 'comment' | 'thankyou'>('initial');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const resp = await fetch(`${DEFAULT_API_URL}?type=getStats&t=${Date.now()}`);
      const res = await resp.json();
      if (res.status === "success") setStats(res.data);
    } catch (e) {}
  };

  const handleRatingSelect = (val: number) => {
    setRating(val);
    setStep('comment');
  };

  const handleSave = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      const payload = {
        type: 'rating',
        stars: rating,
        name: userName || 'Khách ẩn danh',
        comment: comment,
        idNumber: 'WEB_RATING',
        taikhoanapp: 'FREE'
      };
      // Gửi POST lên Google Script
      await fetch(DEFAULT_API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
      
      setStep('thankyou');
      setTimeout(onClose, 2500);
    } catch (e) {
      alert("Lỗi khi gửi đánh giá, vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'thankyou') {
    return (
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
        <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-12 shadow-2xl text-center space-y-6">
          <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Đánh giá Web</h3>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-5xl font-black text-slate-800">
               <i className="fas fa-star text-yellow-400"></i>
               <span>{stats?.average || "4.8"}</span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              dựa trên {(stats?.total || 0) + 1} lượt đánh giá
            </p>
          </div>
          <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce border-4 border-white shadow-lg">
            <i className="fas fa-star text-4xl"></i>
          </div>
          <p className="text-xl font-black text-slate-800 tracking-tight">Cảm ơn bạn đã đánh giá!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col border border-slate-100">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors z-10 p-2">
          <i className="fas fa-times text-2xl"></i>
        </button>

        <div className="p-10 md:p-12 space-y-8">
          <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter text-center">Đánh giá Web</h3>
          
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-3 text-6xl font-black text-slate-800">
               <i className="fas fa-star text-yellow-400"></i>
               <span>{stats?.average || "4.8"}</span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <i className="fas fa-users"></i> dựa trên {stats?.total || 0} lượt đánh giá
            </p>
          </div>

          {step === 'initial' && (
            <div className="space-y-8">
              <div className="flex justify-center gap-2 py-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => handleRatingSelect(star)}
                    className="text-5xl transition-all transform hover:scale-125 active:scale-90"
                  >
                    <i className={`fa-star ${star <= (hoveredStar || rating) ? 'fas text-yellow-400 drop-shadow-lg' : 'far text-slate-200'}`}></i>
                  </button>
                ))}
              </div>

              {stats && (
                <div className="space-y-2.5 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  {[5, 4, 3, 2, 1].map(lvl => {
                    const count = stats.counts[lvl.toString()] || 0;
                    const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
                    return (
                      <div key={lvl} className="flex items-center gap-4">
                        <span className="text-xs font-black text-slate-400 w-3">{lvl}</span>
                        <div className="flex-grow h-3 bg-white rounded-full overflow-hidden border border-slate-100 shadow-inner">
                          <div className="h-full bg-yellow-400 rounded-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 w-10 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 'comment' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-center gap-1.5 mb-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <i key={star} className={`fas fa-star text-3xl ${star <= rating ? 'text-yellow-400' : 'text-slate-100'}`}></i>
                ))}
              </div>
              
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-blue-600 pl-3">Chọn gợi ý nhanh</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s, i) => (
                    <button key={i} onClick={() => setComment(s)} className="text-[10px] font-black px-4 py-2.5 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-500 rounded-full border border-slate-100 transition-all active:scale-95">
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                className="w-full p-6 bg-slate-50 rounded-3xl border-2 border-transparent focus:border-blue-200 transition-all font-bold text-sm h-36 outline-none resize-none shadow-inner"
                placeholder="Chia sẻ cảm nhận của bạn về web..."
                value={comment}
                onChange={e => setComment(e.target.value)}
              ></textarea>

              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="w-full py-5 bg-blue-700 text-white rounded-[2rem] font-black uppercase text-sm shadow-xl hover:bg-blue-800 transition-all border-b-8 border-blue-950 flex items-center justify-center gap-3 active:scale-95"
              >
                {isSubmitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                <span>GỬI ĐÁNH GIÁ NGAY</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RatingModal;

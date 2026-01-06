
import React, { useState, useEffect } from 'react';

interface RatingModalProps {
  onClose: () => void;
  userName?: string;
}

const SUGGESTIONS = [
  "Hệ thống rất mượt mà! 🚀",
  "Tài liệu cực kỳ hữu ích ạ! 📚",
  "Giao diện đẹp và dễ dùng quá! ✨",
  "Cảm ơn thầy Hà đã tận tâm! ❤️",
  "Đề thi sát với thực tế! 💯",
  "Web học toán tốt nhất em từng dùng! 🔥"
];

const RatingModal: React.FC<RatingModalProps> = ({ onClose, userName }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Lưu và lấy dữ liệu từ localStorage để "cập nhật tức thời và lưu lại"
  useEffect(() => {
    const saved = localStorage.getItem('user_rating_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      setRating(parsed.rating);
      setComment(parsed.comment);
    }
  }, []);

  const handleSave = () => {
    const data = { rating, comment, date: new Date().toISOString(), user: userName || 'Khách' };
    localStorage.setItem('user_rating_v2', JSON.stringify(data));
    setIsSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-fade-in">
        <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <i className="fas fa-check text-3xl"></i>
          </div>
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Cảm ơn bạn!</h3>
          <p className="text-slate-500 font-bold text-sm">Đánh giá của bạn đã được ghi lại.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>
        
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors text-2xl">
          <i className="fas fa-times"></i>
        </button>

        <div className="text-center space-y-6">
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mt-4">Đánh giá hệ thống</h3>
          
          <div className="flex justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setRating(star)}
                className="text-5xl transition-all transform hover:scale-125 active:scale-90"
              >
                <i className={`fas fa-star ${star <= (hoveredStar || rating) ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'text-slate-200'}`}></i>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left pl-2">Gợi ý bình luận</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setComment(s)}
                  className="text-[10px] font-bold px-3 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-500 rounded-full border border-slate-100 transition-all active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="relative group">
            <textarea
              className="w-full p-5 bg-slate-50 rounded-3xl border-2 border-transparent focus:border-blue-100 focus:bg-white transition-all font-bold text-sm h-32 outline-none resize-none shadow-inner"
              placeholder="Chia sẻ thêm cảm nhận của bạn về web nhé..."
              value={comment}
              onChange={e => setComment(e.target.value)}
            ></textarea>
            <i className="fas fa-pen-nib absolute bottom-4 right-4 text-slate-200 group-focus-within:text-blue-200 transition-colors"></i>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition-all active:scale-95"
            >
              Để sau
            </button>
            <button
              onClick={handleSave}
              className="flex-[2] py-4 bg-blue-700 text-white rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-blue-800 transition-all active:scale-95 border-b-4 border-blue-900"
            >
              Lưu đánh giá
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;

// *End

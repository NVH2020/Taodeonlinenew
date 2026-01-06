import React, { useState } from 'react';
import { X, Star, Users } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose }) => {
  const { ratingData, addRating } = useApp();
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [hasRated, setHasRated] = useState(false);

  if (!isOpen) return null;

  const handleRate = (stars: number) => {
    addRating(stars);
    setHasRated(true);
    setTimeout(() => {
      onClose();
      setHasRated(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full z-10">
          <X size={24} />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Đánh giá Web</h2>
            <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
              <Star size={24} fill="currentColor" />
              <span className="text-3xl font-black text-gray-900">{ratingData.average}</span>
            </div>
            <p className="text-gray-500 text-sm flex items-center justify-center gap-1">
              <Users size={14} /> dựa trên {ratingData.total} lượt đánh giá
            </p>
          </div>

          {!hasRated ? (
            <>
              <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(null)}
                    onClick={() => handleRate(star)}
                    className="transition-transform active:scale-90"
                  >
                    <Star
                      size={40}
                      fill={(hoveredStar !== null ? star <= hoveredStar : false) ? "#eab308" : "none"}
                      className={ (hoveredStar !== null ? star <= hoveredStar : false) ? "text-yellow-500" : "text-gray-200" }
                    />
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = ratingData.breakdown[star] || 0;
                  const percentage = ratingData.total > 0 ? (count / ratingData.total) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-4">{star}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500" style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span className="text-xs font-medium text-gray-500 w-8">{count}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="py-8 text-center animate-fade-in">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star size={32} fill="currentColor" />
              </div>
              <p className="font-bold text-gray-900">Cảm ơn bạn đã đánh giá!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RatingModal;

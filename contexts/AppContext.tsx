import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ClassInfo, ScheduleGrid, DocumentItem, HeroData, ContactData, RatingData } from '../types';
const INITIAL_RATING: RatingData = {
  average: 4.8,
  total: 124,
  breakdown: { 5: 105, 4: 12, 3: 5, 2: 2, 1: 0 }
};

interface AppContextType {
  ratingData: RatingData;
  addRating: (stars: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
 
  const [heroData, setHeroData] = useStickyState<HeroData>(INITIAL_HERO, 'heroData'); 
  const [ratingData, setRatingData] = useStickyState<RatingData>(INITIAL_RATING, 'ratingData');
  const addRating = (stars: number) => {
    const newBreakdown = { ...ratingData.breakdown };
    newBreakdown[stars] = (newBreakdown[stars] || 0) + 1;
    const newTotal = ratingData.total + 1;
    let sum = 0;
    Object.keys(newBreakdown).forEach(key => {
      sum += Number(key) * newBreakdown[Number(key)];
    });
    setRatingData({
      total: newTotal,
      breakdown: newBreakdown,
      average: Number((sum / newTotal).toFixed(1))
    });
  };

  return (
    <AppContext.Provider value={{ ratingData, addRating
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

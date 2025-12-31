
import { Question } from './types';

// Dữ liệu ngân hàng câu hỏi rút gọn để demo cấu trúc
export const questionsBank: Question[] = [
  // ... (giữ nguyên các câu hỏi hiện có)
];

const shuffleArray = (array: any[]) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export const pickQuestionsSmart = (
  topicIds: number[], 
  counts: { mc: number[], tf: number[], sa: number[] },
  levels: { mc3: number[], mc4: number[], tf3: number[], tf4: number[], sa3: number[], sa4: number[] }
) => {
  let selectedPart1: Question[] = [];
  let selectedPart2: Question[] = [];
  let selectedPart3: Question[] = [];
  
  topicIds.forEach((tid, idx) => {
    const pool = questionsBank.filter(q => q.classTag.toString().startsWith(tid.toString() + "."));
    
    const getSub = (type: string, l3: number, l4: number, total: number) => {
      const typePool = pool.filter(q => q.type === type);
      const p4 = typePool.filter(q => q.classTag.toString().endsWith(".4"));
      const p3 = typePool.filter(q => q.classTag.toString().endsWith(".3"));
      const pOther = typePool.filter(q => !q.classTag.toString().endsWith(".3") && !q.classTag.toString().endsWith(".4"));

      let res4 = shuffleArray(p4).slice(0, l4);
      let deficit4 = l4 - res4.length; 
      let res3 = shuffleArray(p3).slice(0, l3 + deficit4);
      
      let res = [...res4, ...res3];
      const remainingNeeded = total - res.length;
      if (remainingNeeded > 0) {
        res = [...res, ...shuffleArray(pOther).slice(0, remainingNeeded)];
      }
      return res;
    };

    selectedPart1 = [...selectedPart1, ...getSub('mcq', levels.mc3[idx] || 0, levels.mc4[idx] || 0, counts.mc[idx] || 0)];
    selectedPart2 = [...selectedPart2, ...getSub('true-false', levels.tf3[idx] || 0, levels.tf4[idx] || 0, counts.tf[idx] || 0)];
    selectedPart3 = [...selectedPart3, ...getSub('short-answer', levels.sa3[idx] || 0, levels.sa4[idx] || 0, counts.sa[idx] || 0)];
  });

  return [...selectedPart1, ...selectedPart2, ...selectedPart3].map(q => ({
    ...q,
    shuffledOptions: q.o ? shuffleArray(q.o) : undefined,
    // Trộn ngẫu nhiên các ý (statements) trong câu hỏi Đúng/Sai
    s: q.s ? shuffleArray(q.s) : undefined
  }));
};


import React, { useState, useMemo, useEffect } from 'react';
import { Question, Student, ExamCodeDefinition } from '../types';
import { API_ROUTING, DEFAULT_API_URL, TOPICS_DATA, EXAM_CODES } from '../config';
import { pickQuestionsSmart } from '../questions';

interface ExamPortalProps {
  grade: number;
  onBack: () => void;
  onStart: (config: any, student: Student, questions: Question[]) => void;
}

const ExamPortal: React.FC<ExamPortalProps> = ({ grade, onBack, onStart }) => {
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [idInput, setIdInput] = useState("");
  const [sbdInput, setSbdInput] = useState("");
  const [verifiedStudent, setVerifiedStudent] = useState<Student | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const [dynamicCodes, setDynamicCodes] = useState<ExamCodeDefinition[]>([]);

  // Kết hợp mã đề mặc định và mã đề động từ Ma trận
  const allAvailableCodes = useMemo(() => {
    const defaults = EXAM_CODES[grade] || [];
    return [...defaults, ...dynamicCodes];
  }, [grade, dynamicCodes]);

  const currentCodeDef = useMemo(() => allAvailableCodes.find(c => c.code === selectedCode), [selectedCode, allAvailableCodes]);

  const handleVerify = async () => {
    if (!idInput || !sbdInput) return alert("Vui lòng nhập ID Giáo viên và Số báo danh!");
    setIsVerifying(true);
    setVerifiedStudent(null);
    setDynamicCodes([]);
    
    const targetUrl = API_ROUTING[idInput] || DEFAULT_API_URL;
    try {
      // 1. Xác minh học sinh
      const url = new URL(targetUrl);
      url.searchParams.append("idnumber", idInput.trim());
      url.searchParams.append("sbd", sbdInput.trim());
      const resp = await fetch(url.toString());
      const result = await resp.json();
      
      if (result.status === "success") {
        setVerifiedStudent(result.data);
        
        // 2. Tải mã đề từ Ma trận cho ID này và khối lớp này
        const matrixUrl = new URL(targetUrl);
        matrixUrl.searchParams.append("type", "getExamCodes");
        matrixUrl.searchParams.append("idnumber", idInput.trim());
        matrixUrl.searchParams.append("grade", grade.toString());
        const mResp = await fetch(matrixUrl.toString());
        const mResult = await mResp.json();
        if (mResult.status === "success") {
          setDynamicCodes(mResult.data);
        }
      } else {
        alert("Lỗi: " + result.message);
      }
    } catch (e) {
      alert("Lỗi kết nối máy chủ!");
    } finally {
      setIsVerifying(false);
    }
  };

  const resolveCounts = (configValues: number[], targetTopics: number[]) => {
    if (configValues.length === targetTopics.length) return configValues;
    const total = configValues[0] || 0;
    return targetTopics.map((_, i) =>
      Math.floor(total / targetTopics.length) + (i < total % targetTopics.length ? 1 : 0)
    );
  };

  const handleStart = () => {
    if (!verifiedStudent || !selectedCode) return alert("Vui lòng xác minh và chọn mã đề!");
    
    const fc = currentCodeDef?.fixedConfig;
    if (!fc) return alert("Lỗi cấu hình mã đề!");

    const finalConfig = { 
      id: selectedCode, 
      title: currentCodeDef.name, 
      time: fc.duration, 
      mcqPoints: fc.scoreMC, 
      tfPoints: fc.scoreTF, 
      saPoints: fc.scoreSA, 
      gradingScheme: 1 
    };

    const topicsToPick = currentCodeDef.topics === 'manual' ? selectedTopics : (currentCodeDef.topics as number[]);
    if (topicsToPick.length === 0) return alert("Vui lòng chọn ít nhất 1 chuyên đề!");

    const questions = pickQuestionsSmart(
      topicsToPick,
      { 
        mc: resolveCounts(fc.numMC, topicsToPick), 
        tf: resolveCounts(fc.numTF, topicsToPick), 
        sa: resolveCounts(fc.numSA, topicsToPick) 
      },
      { 
        mc3: resolveCounts(fc.mcL3, topicsToPick), 
        mc4: resolveCounts(fc.mcL4, topicsToPick),
        tf3: resolveCounts(fc.tfL3, topicsToPick), 
        tf4: resolveCounts(fc.tfL4, topicsToPick),
        sa3: resolveCounts(fc.saL3, topicsToPick), 
        sa4: resolveCounts(fc.saL4, topicsToPick) 
      }
    );

    if (questions.length === 0) return alert("Ngân hàng không đủ câu hỏi!");
    onStart(finalConfig, verifiedStudent, questions);
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-fade-in border border-slate-100 font-sans">
      <div className="bg-blue-600 p-8 text-white flex justify-between items-center shadow-lg">
        <h2 className="text-3xl font-black mb-1 tracking-tight uppercase">Xác Minh & Chọn Đề</h2>
        <button onClick={onBack} className="bg-white/20 hover:bg-white/30 px-6 py-2.5 rounded-full transition font-black border border-white/40">Thoát</button>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Thí sinh</h3>
          <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4 border border-slate-100 shadow-inner">
            <input type="text" placeholder="ID Giáo viên" className="w-full p-4 bg-white rounded-2xl shadow-sm border-none focus:ring-2 focus:ring-blue-500 font-black outline-none" value={idInput} onChange={e => setIdInput(e.target.value)} />
            <input type="text" placeholder="Số báo danh" className="w-full p-4 bg-white rounded-2xl shadow-sm border-none focus:ring-2 focus:ring-blue-500 font-black outline-none" value={sbdInput} onChange={e => setSbdInput(e.target.value)} />
            <button onClick={handleVerify} disabled={isVerifying} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition active:scale-95 disabled:opacity-50 uppercase tracking-widest">
              <i className="fas fa-check-circle mr-2"></i> {isVerifying ? 'Đang xác minh...' : 'XÁC MINH'}
            </button>
            
            {verifiedStudent && (
              <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl animate-fade-in text-xs font-black text-slate-700 space-y-2">
                <p><span className="text-slate-400 uppercase text-[9px]">👤 Thí sinh:</span> {verifiedStudent.name}</p>
                <p><span className="text-slate-400 uppercase text-[9px]">🏫 Lớp:</span> {verifiedStudent.class}</p>
                <p><span className="text-slate-400 uppercase text-[9px]">🆔 SBD:</span> {verifiedStudent.sbd}</p>
                <p><span className="text-slate-400 uppercase text-[9px]">💎 Tài khoản:</span> {verifiedStudent.taikhoanapp}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Mã đề thi</h3>
          <div className="space-y-4">
            <select className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-blue-700 focus:ring-2 focus:ring-blue-500 shadow-sm outline-none" value={selectedCode} onChange={e => setSelectedCode(e.target.value)}>
              <option value="">-- CHỌN MÃ ĐỀ --</option>
              {allAvailableCodes.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            {currentCodeDef?.fixedConfig && (
              <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] shadow-inner space-y-2">
                 <p className="text-[10px] font-black text-blue-400 uppercase">Cấu hình: {currentCodeDef.fixedConfig.duration} Phút</p>
                 <p className="text-sm font-black text-blue-700 uppercase">
                   {currentCodeDef.fixedConfig.numMC.reduce((a,b)=>a+b,0)} Trắc nghiệm • {currentCodeDef.fixedConfig.numTF.reduce((a,b)=>a+b,0)} Đúng/Sai
                 </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Chuyên đề</h3>
          <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 h-[350px] overflow-y-auto shadow-inner no-scrollbar">
            {currentCodeDef?.topics === 'manual' ? (
              [grade].map(g => (
                <div key={g}>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Lựa chọn chuyên đề:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {TOPICS_DATA[g]?.map(t => (
                      <label key={t.id} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-transparent hover:border-blue-200 cursor-pointer transition shadow-sm group">
                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 mt-0.5" checked={selectedTopics.includes(t.id)} onChange={() => setSelectedTopics(prev => prev.includes(t.id) ? prev.filter(i => i !== t.id) : [...prev, t.id])} />
                        <span className="text-[11px] font-black text-slate-600 leading-tight">{t.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Phạm vi mã đề:</p>
                {(currentCodeDef?.topics as number[])?.map(tid => {
                   const g = Math.floor(tid / 100);
                   const topic = TOPICS_DATA[g]?.find(t => t.id === tid);
                   return topic ? (
                     <div key={tid} className="p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
                       <p className="text-[11px] font-black text-blue-600 leading-tight">{topic.name}</p>
                     </div>
                   ) : null;
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-8 border-t bg-slate-50/50 flex justify-end">
        <button onClick={handleStart} disabled={!verifiedStudent || !selectedCode} className="w-full sm:w-auto px-20 py-5 bg-blue-600 text-white rounded-2xl font-black text-2xl hover:bg-blue-700 transition shadow-2xl disabled:opacity-50 active:scale-95 uppercase tracking-tighter border-b-4 border-blue-900">
          <i className="fas fa-play mr-3"></i> BẮT ĐẦU THI
        </button>
      </div>
    </div>
  );
};

export default ExamPortal;


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

  // Tự động tải mã hệ thống chung cho khối lớp này khi vào trang
  useEffect(() => {
    const fetchSystemCodes = async () => {
      try {
        const url = new URL(DEFAULT_API_URL);
        url.searchParams.append("type", "getExamCodes");
        url.searchParams.append("idnumber", "SYSTEM");
        url.searchParams.append("grade", grade.toString());
        const resp = await fetch(url.toString());
        const res = await resp.json();
        if (res.status === "success") setDynamicCodes(res.data);
      } catch(e) {}
    };
    fetchSystemCodes();
  }, [grade]);

  // Kết hợp mã đề cố định và mã đề động
  const allAvailableCodes = useMemo(() => {
    const defaults = EXAM_CODES[grade] || [];
    // Loại bỏ mã trùng lặp nếu có
    const combined = [...defaults];
    dynamicCodes.forEach(dc => {
      if (!combined.find(c => c.code === dc.code)) combined.push(dc);
    });
    return combined;
  }, [grade, dynamicCodes]);

  const currentCodeDef = useMemo(() => allAvailableCodes.find(c => c.code === selectedCode), [selectedCode, allAvailableCodes]);

  const handleVerify = async () => {
    if (!idInput || !sbdInput) return alert("Vui lòng nhập đầy đủ ID và SBD!");
    setIsVerifying(true);
    setVerifiedStudent(null);
    
    const targetUrl = API_ROUTING[idInput] || DEFAULT_API_URL;
    try {
      // 1. Xác minh thí sinh
      const url = new URL(targetUrl);
      url.searchParams.append("idnumber", idInput.trim());
      url.searchParams.append("sbd", sbdInput.trim());
      const resp = await fetch(url.toString());
      const result = await resp.json();
      
      if (result.status === "success") {
        setVerifiedStudent(result.data);
        
        // 2. Tải mã đề từ Ma trận riêng của Giáo viên này
        const matrixUrl = new URL(targetUrl);
        matrixUrl.searchParams.append("type", "getExamCodes");
        matrixUrl.searchParams.append("idnumber", idInput.trim());
        matrixUrl.searchParams.append("grade", grade.toString());
        const mResp = await fetch(matrixUrl.toString());
        const mResult = await mResp.json();
        if (mResult.status === "success") {
          // Gộp thêm mã đề riêng vào danh sách hiện có
          setDynamicCodes(prev => {
            const newCodes = [...prev];
            mResult.data.forEach((dc: ExamCodeDefinition) => {
              if (!newCodes.find(c => c.code === dc.code)) newCodes.push(dc);
            });
            return newCodes;
          });
        }
      } else {
        alert("Xác minh thất bại: " + result.message);
      }
    } catch (e) { alert("Lỗi kết nối máy chủ!"); } finally { setIsVerifying(false); }
  };

  const resolveCounts = (configValues: number[], targetTopics: number[]) => {
    if (configValues.length === targetTopics.length) return configValues;
    const total = configValues[0] || 0;
    return targetTopics.map((_, i) =>
      Math.floor(total / targetTopics.length) + (i < total % targetTopics.length ? 1 : 0)
    );
  };

  const handleStart = () => {
    if (!verifiedStudent || !selectedCode) return alert("Vui lòng chọn mã đề!");
    const fc = currentCodeDef?.fixedConfig;
    if (!fc) return alert("Lỗi cấu hình đề thi!");

    const finalConfig = { 
      id: selectedCode, title: currentCodeDef.name, time: fc.duration, 
      mcqPoints: fc.scoreMC, tfPoints: fc.scoreTF, saPoints: fc.scoreSA, gradingScheme: 1 
    };

    const topicsToPick = currentCodeDef.topics === 'manual' ? selectedTopics : (currentCodeDef.topics as number[]);
    if (topicsToPick.length === 0) return alert("Vui lòng chọn ít nhất 1 chuyên đề!");

    const questions = pickQuestionsSmart(
      topicsToPick,
      { mc: resolveCounts(fc.numMC, topicsToPick), tf: resolveCounts(fc.numTF, topicsToPick), sa: resolveCounts(fc.numSA, topicsToPick) },
      { mc3: resolveCounts(fc.mcL3, topicsToPick), mc4: resolveCounts(fc.mcL4, topicsToPick), tf3: resolveCounts(fc.tfL3, topicsToPick), tf4: resolveCounts(fc.tfL4, topicsToPick), sa3: resolveCounts(fc.saL3, topicsToPick), sa4: resolveCounts(fc.saL4, topicsToPick) }
    );

    if (questions.length === 0) return alert("Ngân hàng đề hiện chưa đủ câu hỏi cho lựa chọn này!");
    onStart(finalConfig, verifiedStudent, questions);
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-fade-in border border-slate-100 font-sans">
      <div className="bg-blue-700 p-8 text-white flex justify-between items-center shadow-lg">
        <h2 className="text-3xl font-black mb-1 tracking-tighter uppercase">Xác Minh & Chọn Đề</h2>
        <button onClick={onBack} className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-full transition font-black border border-white/40">Quay lại</button>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2"><i className="fas fa-id-card text-blue-600"></i> THÍ SINH</h3>
          <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4 border border-slate-100 shadow-inner">
            <input type="text" placeholder="ID Giáo viên" className="w-full p-4 bg-white rounded-2xl shadow-sm border-none focus:ring-2 focus:ring-blue-600 font-black outline-none uppercase" value={idInput} onChange={e => setIdInput(e.target.value)} />
            <input type="text" placeholder="Số báo danh" className="w-full p-4 bg-white rounded-2xl shadow-sm border-none focus:ring-2 focus:ring-blue-600 font-black outline-none uppercase" value={sbdInput} onChange={e => setSbdInput(e.target.value)} />
            <button onClick={handleVerify} disabled={isVerifying} className="w-full py-4 bg-blue-700 text-white rounded-2xl font-black shadow-lg hover:bg-blue-800 transition active:scale-95 uppercase">
              {isVerifying ? 'ĐANG XỬ LÝ...' : 'XÁC MINH ID'}
            </button>
            
            {verifiedStudent && (
              <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs font-black text-slate-700 space-y-2 animate-fade-in">
                <p><i className="fas fa-user text-emerald-600 mr-2"></i> {verifiedStudent.name}</p>
                <p><i className="fas fa-school text-emerald-600 mr-2"></i> Lớp: {verifiedStudent.class}</p>
                <p><i className="fas fa-hashtag text-emerald-600 mr-2"></i> SBD: {verifiedStudent.sbd}</p>
                <p><i className="fas fa-gem text-emerald-600 mr-2"></i> {verifiedStudent.taikhoanapp}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2"><i className="fas fa-list-ol text-blue-600"></i> MÃ ĐỀ THI</h3>
          <div className="space-y-4">
            <select className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-blue-700 focus:ring-2 focus:ring-blue-600 shadow-sm outline-none border-none" value={selectedCode} onChange={e => setSelectedCode(e.target.value)}>
              <option value="">-- CHỌN MÃ ĐỀ --</option>
              {allAvailableCodes.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            {currentCodeDef?.fixedConfig && (
              <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] shadow-inner space-y-2">
                 <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Thông số đề thi</p>
                 <p className="text-sm font-black text-blue-800 uppercase">{currentCodeDef.fixedConfig.duration} PHÚT</p>
                 <p className="text-xs font-bold text-blue-700">{currentCodeDef.fixedConfig.numMC.reduce((a,b)=>a+b,0)} MCQ | {currentCodeDef.fixedConfig.numTF.reduce((a,b)=>a+b,0)} Đúng/Sai</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2"><i className="fas fa-book text-blue-600"></i> CHUYÊN ĐỀ</h3>
          <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 h-[350px] overflow-y-auto shadow-inner no-scrollbar">
            {currentCodeDef?.topics === 'manual' ? (
              <div className="space-y-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Phạm vi khối {grade}</p>
                <div className="grid grid-cols-1 gap-2">
                  {TOPICS_DATA[grade]?.map(t => (
                    <label key={t.id} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-transparent hover:border-blue-200 cursor-pointer transition shadow-sm group">
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-700 mt-0.5 accent-blue-600" checked={selectedTopics.includes(t.id)} onChange={() => setSelectedTopics(prev => prev.includes(t.id) ? prev.filter(i => i !== t.id) : [...prev, t.id])} />
                      <span className="text-[11px] font-black text-slate-600 leading-tight group-hover:text-blue-700">{t.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phạm vi định sẵn:</p>
                {(currentCodeDef?.topics as number[])?.map(tid => {
                   const g = Math.floor(tid / 100);
                   const topic = TOPICS_DATA[g]?.find(t => t.id === tid);
                   return topic ? (
                     <div key={tid} className="p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
                       <p className="text-[11px] font-black text-blue-800 leading-tight">{topic.name}</p>
                     </div>
                   ) : null;
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-8 border-t bg-slate-50/50 flex justify-end">
        <button onClick={handleStart} disabled={!verifiedStudent || !selectedCode} className="w-full sm:w-auto px-20 py-5 bg-blue-700 text-white rounded-2xl font-black text-2xl hover:bg-blue-800 transition shadow-2xl disabled:opacity-50 active:scale-95 uppercase border-b-4 border-blue-900">
          <i className="fas fa-play-circle mr-3"></i> VÀO THI NGAY
        </button>
      </div>
    </div>
  );
};

export default ExamPortal;

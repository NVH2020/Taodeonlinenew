import React, { useState, useMemo, useEffect } from 'react';
import { Question, Student, ExamCodeDefinition } from '../types';
import { API_ROUTING, DEFAULT_API_URL, TOPICS_DATA, EXAM_CODES } from '../config';
import { pickQuestionsSmart } from '../questions';

/**
 * Thành phần Cổng thông tin xác minh và chọn mã đề thi
 */
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

  // Tải mã hệ thống chung cho khối lớp này
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
    const combined = [...defaults];
    dynamicCodes.forEach(dc => {
      if (!combined.find(c => c.code === dc.code)) combined.push(dc);
    });
    return combined;
  }, [grade, dynamicCodes]);

  const currentCodeDef = useMemo(() => allAvailableCodes.find(c => c.code === selectedCode), [selectedCode, allAvailableCodes]);

  // HÀM MỞ RỘNG CHUYÊN ĐỀ
  const getRelatedGrades = (currentGrade: number) => {
    if (currentGrade === 12) return [10, 11, 12];
    if (currentGrade === 11) return [10, 11];
    if (currentGrade === 10) return [10];
    if (currentGrade === 9) return [7, 8, 9];
    return [currentGrade];
  };

  const combinedTopics = useMemo(() => {
    const relatedGrades = getRelatedGrades(grade);
    let topics: { id: number; name: string; grade: number }[] = [];
    relatedGrades.forEach(g => {
      const gradeTopics = TOPICS_DATA[g] || [];
      topics = [...topics, ...gradeTopics.map(t => ({ ...t, grade: g }))];
    });
    return topics;
  }, [grade]);

  const handleVerify = async () => {
    if (!idInput || !sbdInput) return alert("Vui lòng nhập đầy đủ ID Giáo viên và Số báo danh!");
    setIsVerifying(true);
    setVerifiedStudent(null);
    const targetUrl = API_ROUTING[idInput.trim()] || DEFAULT_API_URL;
    try {
      const url = new URL(targetUrl);
      url.searchParams.append("type", "verifyStudent");
      url.searchParams.append("idnumber", idInput.trim());
      url.searchParams.append("sbd", sbdInput.trim());
      const resp = await fetch(url.toString());
      const result = await resp.json();
      if (result.status === "success") {
        setVerifiedStudent(result.data);
        const matrixUrl = new URL(targetUrl);
        matrixUrl.searchParams.append("type", "getExamCodes");
        matrixUrl.searchParams.append("idnumber", idInput.trim());
        const mResp = await fetch(matrixUrl.toString());
        const mResult = await mResp.json();
        if (mResult.status === "success") {
          setDynamicCodes(prev => {
            const newCodes = [...prev];
            mResult.data.forEach((dc: ExamCodeDefinition) => {
              if (!newCodes.find(c => c.code === dc.code)) newCodes.push(dc);
            });
            return newCodes;
          });
        }
      } else { alert("Xác minh thất bại: " + result.message); }
    } catch (e) { alert("Lỗi kết nối máy chủ xác minh!"); } 
    finally { setIsVerifying(false); }
  };

  const resolveCounts = (configValues: number[], targetTopics: number[]) => {
    if (configValues.length === targetTopics.length) return configValues;
    const total = configValues[0] || 0;
    return targetTopics.map((_, i) => Math.floor(total / targetTopics.length) + (i < total % targetTopics.length ? 1 : 0));
  };

  const handleStart = () => {
    if (!verifiedStudent || !selectedCode) return alert("Vui lòng xác minh thí sinh và chọn mã đề!");
    const fc = currentCodeDef?.fixedConfig;
    if (!fc) return alert("Cấu hình đề thi bị lỗi!");
    const finalConfig = { id: selectedCode, title: currentCodeDef.name, time: fc.duration, mcqPoints: fc.scoreMC, tfPoints: fc.scoreTF, saPoints: fc.scoreSA, gradingScheme: 1 };
    const topicsToPick = currentCodeDef.topics === 'manual' ? selectedTopics : (currentCodeDef.topics as number[]);
    if (topicsToPick.length === 0) return alert("Vui lòng chọn phạm vi chuyên đề!");
    const questions = pickQuestionsSmart(topicsToPick, { mc: resolveCounts(fc.numMC, topicsToPick), tf: resolveCounts(fc.numTF, topicsToPick), sa: resolveCounts(fc.numSA, topicsToPick) }, { mc3: resolveCounts(fc.mcL3, topicsToPick), mc4: resolveCounts(fc.mcL4, topicsToPick), tf3: resolveCounts(fc.tfL3, topicsToPick), tf4: resolveCounts(fc.tfL4, topicsToPick), sa3: resolveCounts(fc.saL3, topicsToPick), sa4: resolveCounts(fc.saL4, topicsToPick) });
    if (questions.length === 0) return alert("Ngân hàng đề hiện chưa đủ câu hỏi cho cấu hình này!");
    onStart(finalConfig, verifiedStudent, questions);
  };

  const isVip = verifiedStudent?.taikhoanapp?.toUpperCase().includes("VIP");

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in border border-slate-100 font-sans">
      <div className="bg-blue-700 p-8 text-white flex justify-between items-center shadow-lg border-b-8 border-blue-900">
        <div>
          <h2 className="text-3xl font-black mb-1 tracking-tighter uppercase">Xác Minh Danh Tính</h2>
          <p className="text-blue-100 text-sm font-bold uppercase tracking-widest opacity-80">Thiết lập bài làm của bạn</p>
        </div>
        <button onClick={onBack} className="bg-white/20 hover:bg-white/30 px-8 py-3 rounded-full transition font-black border border-white/40 flex items-center gap-2 active:scale-95">
          <i className="fas fa-arrow-left"></i> QUAY LẠI
        </button>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Cột 1 */}
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2 border-l-8 border-blue-600 pl-4">Xác Minh</h3>
          <div className="bg-slate-50 p-6 rounded-[2.5rem] space-y-4 border border-slate-200 shadow-inner">
            <div className="relative">
              <i className="fas fa-chalkboard-teacher absolute left-4 top-1/2 -translate-y-1/2 text-blue-400"></i>
              <input type="text" placeholder="ID BẢN QUYỀN" className="w-full p-4 pl-12 bg-white rounded-2xl shadow-sm border-none focus:ring-4 focus:ring-blue-100 font-black outline-none uppercase" value={idInput} onChange={e => setIdInput(e.target.value)} />
            </div>
            <div className="relative">
              <i className="fas fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-blue-400"></i>
              <input type="text" placeholder="SỐ BÁO DANH" className="w-full p-4 pl-12 bg-white rounded-2xl shadow-sm border-none focus:ring-4 focus:ring-blue-100 font-black outline-none uppercase" value={sbdInput} onChange={e => setSbdInput(e.target.value)} />
            </div>
            <button onClick={handleVerify} disabled={isVerifying} className="w-full py-5 bg-blue-700 text-white rounded-2xl font-black shadow-xl hover:bg-blue-800 transition active:scale-95 uppercase tracking-tighter text-lg border-b-4 border-blue-900">
              {isVerifying ? <i className="fas fa-spinner fa-spin"></i> : 'XÁC MINH ID'}
            </button>
            
            {verifiedStudent && (
              <div className="p-6 bg-white border border-blue-100 rounded-3xl text-sm font-black text-slate-700 space-y-4 animate-fade-in shadow-sm relative overflow-hidden">
                <i className="fas fa-check-circle absolute -right-2 -top-2 text-blue-50/50 text-6xl rotate-12"></i>
                <div className="flex items-center gap-3 relative">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0"><i className="fas fa-user"></i></div>
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="truncate text-blue-900">{verifiedStudent.name}</span>
                    <i className="fas fa-check-circle text-blue-500 text-xs shadow-sm"></i>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0"><i className="fas fa-graduation-cap"></i></div>
                  <span>Lớp: {verifiedStudent.class}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600 shrink-0"><i className="fas fa-hashtag"></i></div>
                  <span>SBD: {verifiedStudent.sbd}</span>
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-slate-50">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0"><i className="fas fa-gem"></i></div>
                  <span className={`${isVip ? 'text-amber-500 font-black animate-pulse flex items-center gap-1' : 'text-slate-500'}`}>
                    {isVip && <i className="fas fa-crown text-[10px]"></i>}
                    {verifiedStudent.taikhoanapp}
                    {isVip && <i className="fas fa-check-circle text-amber-500 text-[10px]"></i>}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cột 2 */}
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2 border-l-8 border-blue-600 pl-4">Đề Thi</h3>
          <div className="space-y-4 text-center">
            <select className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-blue-800 outline-none appearance-none shadow-sm" value={selectedCode} onChange={e => setSelectedCode(e.target.value)}>
              <option value="">-- CHỌN MÃ ĐỀ --</option>
              {allAvailableCodes.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            {currentCodeDef?.fixedConfig && (
              <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] shadow-inner space-y-4 transform transition-all">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Cấu hình đề</p>
                <div className="flex justify-center gap-4 text-2xl font-black text-blue-700">
                  <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-blue-100">
                    <p>{currentCodeDef.fixedConfig.duration}</p>
                    <p className="text-[9px] text-slate-400 uppercase">Phút</p>
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-blue-100">
                    <p>{(currentCodeDef.fixedConfig.numMC?.reduce((a,b)=>a+b,0)||0) + (currentCodeDef.fixedConfig.numTF?.reduce((a,b)=>a+b,0)||0) + (currentCodeDef.fixedConfig.numSA?.reduce((a,b)=>a+b,0)||0)}</p>
                    <p className="text-[9px] text-slate-400 uppercase">Câu</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cột 3 */}
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2 border-l-8 border-blue-600 pl-4">Phạm Vi Kiến Thức</h3>
          <div className="bg-slate-50 rounded-[2.5rem] p-6 border border-slate-200 h-[400px] overflow-y-auto shadow-inner no-scrollbar">
            {currentCodeDef?.topics === 'manual' ? (
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase border-b pb-2 mb-4">Lựa chọn chuyên đề liên quan</p>
                {combinedTopics.map(t => (
                  <label key={t.id} className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-sm ${selectedTopics.includes(t.id) ? 'bg-blue-600 border-blue-700 text-white' : 'bg-white border-white'}`}>
                    <input type="checkbox" className="hidden" checked={selectedTopics.includes(t.id)} onChange={() => setSelectedTopics(prev => prev.includes(t.id) ? prev.filter(i => i !== t.id) : [...prev, t.id])} />
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 ${selectedTopics.includes(t.id) ? 'bg-white border-white text-blue-600' : 'bg-slate-50 border-slate-200'}`}>
                      {selectedTopics.includes(t.id) && <i className="fas fa-check text-xs"></i>}
                    </div>
                    <span className="text-[11px] font-black leading-tight">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] mr-2 uppercase ${selectedTopics.includes(t.id) ? 'bg-blue-500' : 'bg-slate-200 text-slate-600'}`}>K{t.grade}</span>
                      {t.name}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {(currentCodeDef?.topics as number[])?.map(tid => {
                  const topic = TOPICS_DATA[Math.floor(tid/100)]?.find(t => t.id === tid);
                  return topic ? (
                    <div key={tid} className="p-5 bg-white rounded-3xl border border-blue-50 shadow-sm flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs shrink-0">{tid}</div>
                      <p className="text-[11px] font-black text-blue-900 leading-tight">{topic.name}</p>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-10 border-t bg-slate-50 flex justify-center">
        <button onClick={handleStart} disabled={!verifiedStudent || !selectedCode} className="w-full max-w-2xl py-6 bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-[2rem] font-black text-2xl hover:scale-[1.02] transition-all shadow-2xl disabled:opacity-50 active:scale-95 uppercase border-b-8 border-blue-950 flex items-center justify-center gap-4">
          <i className="fas fa-play-circle text-4xl"></i> BẮT ĐẦU LÀM BÀI
        </button>
      </div>
    </div>
  );
};

export default ExamPortal;

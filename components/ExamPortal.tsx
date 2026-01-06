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

  const allAvailableCodes = useMemo(() => {
    const defaults = EXAM_CODES[grade] || [];
    const combined = [...defaults];
    dynamicCodes.forEach(dc => {
      if (!combined.find(c => c.code === dc.code)) combined.push(dc);
    });
    return combined;
  }, [grade, dynamicCodes]);

  const currentCodeDef = useMemo(() => allAvailableCodes.find(c => c.code === selectedCode), [selectedCode, allAvailableCodes]);

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
      } else {
        alert("Xác minh thất bại: " + result.message);
      }
    } catch (e) {
      alert("Lỗi kết nối máy chủ xác minh!");
    } finally {
      setIsVerifying(false);
    }
  };

  const resolveCounts = (configValues: number[] | undefined, targetTopics: number[]) => {
    if (!configValues || configValues.length === 0) return targetTopics.map(() => 0);
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
    const questions = pickQuestionsSmart(
      topicsToPick,
      { mc: resolveCounts(fc.numMC, topicsToPick), tf: resolveCounts(fc.numTF, topicsToPick), sa: resolveCounts(fc.numSA, topicsToPick) },
      { mc3: resolveCounts(fc.mcL3, topicsToPick), mc4: resolveCounts(fc.mcL4, topicsToPick), tf3: resolveCounts(fc.tfL3, topicsToPick), tf4: resolveCounts(fc.tfL4, topicsToPick), sa3: resolveCounts(fc.saL3, topicsToPick), sa4: resolveCounts(fc.saL4, topicsToPick) }
    );
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
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2 border-l-8 border-blue-600 pl-4">Xác Minh</h3>
          <div className="bg-slate-50 p-6 rounded-[2.5rem] space-y-4 border border-slate-200 shadow-inner">
            <input type="text" placeholder="ID BẢN QUYỀN" className="w-full p-4 bg-white rounded-2xl font-black outline-none uppercase" value={idInput} onChange={e => setIdInput(e.target.value)} />
            <input type="text" placeholder="SỐ BÁO DANH" className="w-full p-4 bg-white rounded-2xl font-black outline-none uppercase" value={sbdInput} onChange={e => setSbdInput(e.target.value)} />
            <button onClick={handleVerify} disabled={isVerifying} className="w-full py-5 bg-blue-700 text-white rounded-2xl font-black shadow-xl uppercase border-b-4 border-blue-900">
              {isVerifying ? ' ĐANG XỬ LÝ...' : 'XÁC MINH ID'}
            </button>
            {verifiedStudent && (
              <div className="p-4 bg-white border rounded-3xl text-xs font-black space-y-2 shadow-sm">
                <div>Tên: {verifiedStudent.name}</div>
                <div>Lớp: {verifiedStudent.class}</div>
                <div className={isVip ? 'text-amber-500 animate-pulse' : ''}>Loại: {verifiedStudent.taikhoanapp}</div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2 border-l-8 border-blue-600 pl-4">Đề Thi</h3>
          <select className="w-full p-5 bg-slate-50 border-2 rounded-3xl font-black text-blue-800 outline-none" value={selectedCode} onChange={e => setSelectedCode(e.target.value)}>
            <option value="">-- CHỌN MÃ ĐỀ --</option>
            {allAvailableCodes.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
          {currentCodeDef?.fixedConfig && (
            <div className="p-6 bg-blue-50 rounded-[2rem] text-center">
              <p className="text-2xl font-black text-blue-700">{currentCodeDef.fixedConfig.duration} Phút</p>
              <p className="text-xs font-bold text-slate-400">Thời gian làm bài</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2 border-l-8 border-blue-600 pl-4">Chuyên Đề</h3>
          <div className="bg-slate-50 rounded-[2.5rem] p-4 h-[300px] overflow-y-auto no-scrollbar shadow-inner">
            {currentCodeDef?.topics === 'manual' ? (
              TOPICS_DATA[grade]?.map(t => (
                <label key={t.id} className="flex items-center gap-3 p-3 bg-white mb-2 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={selectedTopics.includes(t.id)} onChange={() => setSelectedTopics(prev => prev.includes(t.id) ? prev.filter(i => i !== t.id) : [...prev, t.id])} />
                  <span className="text-[11px] font-bold">{t.name}</span>
                </label>
              ))
            ) : (
              (currentCodeDef?.topics as number[])?.map(tid => (
                <div key={tid} className="p-3 bg-white mb-2 rounded-xl text-[11px] font-bold">Chuyên đề: {tid}</div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="p-10 border-t bg-slate-50 flex justify-center">
        <button onClick={handleStart} disabled={!verifiedStudent || !selectedCode} className="w-full max-w-2xl py-6 bg-blue-700 text-white rounded-[2rem] font-black text-2xl shadow-2xl uppercase border-b-8 border-blue-950">
          BẮT ĐẦU LÀM BÀI
        </button>
      </div>
    </div>
  );
};

export default ExamPortal;

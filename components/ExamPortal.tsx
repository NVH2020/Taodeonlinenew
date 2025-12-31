
import React, { useState, useMemo } from 'react';
import { Question, Student } from '../types';
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

  const availableCodes = useMemo(() => EXAM_CODES[grade] || [], [grade]);
  const currentCodeDef = useMemo(() => availableCodes.find(c => c.code === selectedCode), [selectedCode, availableCodes]);

  const handleVerify = async () => {
    if (!idInput || !sbdInput) return alert("Vui lòng nhập ID Giáo viên và Số báo danh!");
    setIsVerifying(true);
    setVerifiedStudent(null);
    const targetUrl = API_ROUTING[idInput] || DEFAULT_API_URL;
    try {
      const url = new URL(targetUrl);
      url.searchParams.append("idnumber", idInput.trim());
      url.searchParams.append("sbd", sbdInput.trim());
      const resp = await fetch(url.toString());
      const result = await resp.json();
      if (result.status === "success") {
        setVerifiedStudent(result.data);
      } else {
        alert("Lỗi: " + result.message);
      }
    } catch (e) {
      alert("Lỗi kết nối máy chủ!");
    } finally {
      setIsVerifying(false);
    }
  };

  const getTopicRange = () => {
    if (grade === 10) return [10];
    if (grade === 11) return [10, 11];
    if (grade === 12) return [10, 11, 12];
    if (grade === 9) return [7, 8, 9];
    return [grade];
  };

  const handleStart = () => {
    if (!verifiedStudent || !selectedCode) return alert("Vui lòng xác minh và chọn mã đề!");
    
    let questions: Question[] = [];
    let finalConfig: any = {};
    const fc = currentCodeDef?.fixedConfig;

    if (!fc) return alert("Lỗi cấu hình mã đề!");

    finalConfig = { 
      id: selectedCode, 
      title: currentCodeDef.name, 
      time: fc.duration, 
      mcqPoints: fc.scoreMC, 
      tfPoints: fc.scoreTF, 
      saPoints: fc.scoreSA, 
      gradingScheme: 1 
    };

    const topicsToPick = currentCodeDef.topics === 'manual' ? selectedTopics : (currentCodeDef.topics as number[]);
    if (topicsToPick.length === 0) return alert("Vui lòng chọn chuyên đề!");

    const splitCount = (total: number, topics: number[]) => topics.map((_, i) => Math.floor(total / topics.length) + (i < total % topics.length ? 1 : 0));

    questions = pickQuestionsSmart(
      topicsToPick,
      { mc: splitCount(fc.numMC[0], topicsToPick), tf: splitCount(fc.numTF[0], topicsToPick), sa: splitCount(fc.numSA[0], topicsToPick) },
      { 
        mc3: splitCount(fc.mcL3[0], topicsToPick), mc4: splitCount(fc.mcL4[0], topicsToPick),
        tf3: splitCount(fc.tfL3[0], topicsToPick), tf4: splitCount(fc.tfL4[0], topicsToPick),
        sa3: splitCount(fc.saL3[0], topicsToPick), sa4: splitCount(fc.saL4[0], topicsToPick) 
      }
    );

    if (questions.length === 0) return alert("Ngân hàng không đủ câu hỏi!");
    onStart(finalConfig, verifiedStudent, questions);
  };

  const codeInfo = useMemo(() => {
    if (!currentCodeDef?.fixedConfig) return null;
    const f = currentCodeDef.fixedConfig;
    const totalQ = f.numMC[0] + f.numTF[0] + f.numSA[0];
    const level34 = (f.mcL3[0] + f.mcL4[0] + f.tfL3[0] + f.tfL4[0] + f.saL3[0] + f.saL4[0]);
    return {
      parts: `MCQ: ${f.numMC[0]}; TF: ${f.numTF[0]}; SA: ${f.numSA[0]}`,
      l12: `MỨC 1, 2: ${totalQ - level34}`,
      l34: `MỨC 3, 4: ${level34}`
    };
  }, [currentCodeDef]);

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-fade-in border border-slate-100">
      <div className="bg-blue-600 p-8 text-white flex justify-between items-center shadow-lg">
        <h2 className="text-3xl font-black mb-1 tracking-tight uppercase">XÁC MINH - KHỐI {grade}</h2>
        <button onClick={onBack} className="bg-white/20 hover:bg-white/30 px-6 py-2.5 rounded-full transition font-bold border border-white/40">Quay lại</button>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Thí sinh</h3>
          <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4 border border-slate-100 shadow-inner">
            <input type="text" placeholder="ID Giáo viên" className="w-full p-4 bg-white rounded-2xl shadow-sm border-none focus:ring-2 focus:ring-blue-500 font-bold" value={idInput} onChange={e => setIdInput(e.target.value)} />
            <input type="text" placeholder="Số báo danh" className="w-full p-4 bg-white rounded-2xl shadow-sm border-none focus:ring-2 focus:ring-blue-500 font-bold" value={sbdInput} onChange={e => setSbdInput(e.target.value)} />
            <button onClick={handleVerify} disabled={isVerifying} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition active:scale-95 disabled:opacity-50">
              {isVerifying ? 'ĐANG KIỂM TRA...' : 'XÁC MINH'}
            </button>
            {verifiedStudent && (
              <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl animate-fade-in text-xs font-bold text-slate-700 space-y-1">
                <p><span className="text-slate-400 uppercase text-[9px]">Họ tên:</span> {verifiedStudent.name}</p>
                <p><span className="text-slate-400 uppercase text-[9px]">Lớp:</span> {verifiedStudent.class}</p>
                <p><span className="text-slate-400 uppercase text-[9px]">SBD:</span> {verifiedStudent.sbd}</p>
                <p><span className="text-slate-400 uppercase text-[9px]">Lượt thi tối đa:</span> {verifiedStudent.limit}</p>
                <p><span className="text-slate-400 uppercase text-[9px]">Lượt tab tối đa:</span> {verifiedStudent.limittab}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Mã đề</h3>
          <div className="space-y-4">
            <select className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-blue-700 focus:ring-2 focus:ring-blue-500 shadow-sm transition appearance-none" value={selectedCode} onChange={e => setSelectedCode(e.target.value)}>
              <option value="">-- CHỌN MÃ ĐỀ --</option>
              {availableCodes.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            {codeInfo && (
              <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] shadow-inner space-y-2">
                 <p className="text-[10px] font-black text-blue-400 uppercase">TỔNG SỐ CÂU HỎI</p>
                 <p className="text-sm font-black text-blue-700 uppercase">{codeInfo.parts}</p>
                 <p className="text-[10px] font-black text-blue-400 uppercase mt-2">PHÂN PHỐI MỨC ĐỘ</p>
                 <p className="text-sm font-black text-blue-700 uppercase">{codeInfo.l12}</p>
                 <p className="text-sm font-black text-blue-700 uppercase">{codeInfo.l34}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Phạm vi</h3>
          <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 h-[350px] overflow-y-auto shadow-inner">
            {currentCodeDef?.topics === 'manual' ? (
              getTopicRange().map(g => (
                <div key={g} className="mb-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Chuyên đề lớp {g}</p>
                  {TOPICS_DATA[g]?.map(t => (
                    <label key={t.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-xl cursor-pointer transition">
                      <input type="checkbox" className="w-5 h-5 rounded" checked={selectedTopics.includes(t.id)} onChange={() => setSelectedTopics(prev => prev.includes(t.id) ? prev.filter(i => i !== t.id) : [...prev, t.id])} />
                      <span className="text-xs font-bold text-slate-600">{t.name}</span>
                    </label>
                  ))}
                </div>
              ))
            ) : (
              <div className="text-center p-10 text-slate-400 italic text-sm">Cấu hình cố định</div>
            )}
          </div>
        </div>
      </div>

      <div className="p-8 border-t bg-slate-50/50 flex justify-end">
        <button onClick={handleStart} disabled={!verifiedStudent || !selectedCode} className="w-full sm:w-auto px-20 py-5 bg-blue-600 text-white rounded-2xl font-black text-2xl hover:bg-blue-700 transition shadow-2xl disabled:opacity-50 active:scale-95 uppercase tracking-tighter">BẮT ĐẦU THI</button>
      </div>
    </div>
  );
};

export default ExamPortal;

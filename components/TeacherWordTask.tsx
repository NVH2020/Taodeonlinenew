
import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import mammoth from 'mammoth';
import { DANHGIA_URL, DEFAULT_API_URL, API_ROUTING } from '../config';

interface TeacherWordTaskProps {
  onBack: () => void;
}

const TeacherWordTask: React.FC<TeacherWordTaskProps> = ({ onBack }) => {
  const [step, setStep] = useState<'verify' | 'work'>('verify');
  const [loading, setLoading] = useState(false);
  const [gvId, setGvId] = useState('');
  const [gvData, setGvData] = useState<any>(null);

  const [examForm, setExamForm] = useState({
    exams: '', fulltime: 90, mintime: 30, tab: 3, dateclose: '',
    MCQ: 28, scoremcq: 0.25, TF: 4, scoretf: 1, SA: 6, scoresa: 0.5, IDimglink: ''
  });

  const [questions, setQuestions] = useState<any[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [mixForm, setMixForm] = useState({ count: 4, startCode: 101 });

  const handleVerify = async () => {
    if (!gvId) return alert("Vui lòng nhập ID!");
    setLoading(true);
    try {
      const res = await fetch(`${DANHGIA_URL}?action=checkTeacher&idgv=${gvId}`);
      const data = await res.json();
      if (data.status === 'success') {
        setGvData(data.data);
        setStep('work');
      } else {
        alert(data.message);
      }
    } catch (e) { alert("Lỗi kết nối!"); }
    finally { setLoading(false); }
  };

  const handleSaveConfig = async () => {
    if (!examForm.exams) return alert("Vui lòng nhập mã đề (exams)!");
    setLoading(true);
    try {
      const payload = { action: 'saveExamConfig', idgv: gvId, ...examForm };
      const targetUrl = API_ROUTING[gvId] || DEFAULT_API_URL;
      const res = await fetch(`${targetUrl}?action=saveExamConfig`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      alert(result.message);
    } catch (e) { alert("Lỗi ghi dữ liệu!"); }
    finally { setLoading(false); }
  };

  const processWordFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Style map for underlines
      const result = await mammoth.convertToHtml({ arrayBuffer }, { styleMap: ["u => u"] });
      const html = result.value;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Phân tích nội dung HTML sau thành mảng JSON câu hỏi.
      Quy tắc:
      1. Tách 3 phần: PHẦN I (mcq), PHẦN II (true-false), PHẦN III (short-answer).
      2. Đáp án:
         - PHẦN I: Tìm chữ cái A, B, C, D gạch chân (<u>) làm đáp án 'a'.
         - PHẦN II: Tìm ý a, b, c, d gạch chân (<u>) để xác định đúng (T) / sai (F).
         - PHẦN III: Tìm <Key=value> làm đáp án 'a'.
      3. Lời giải: Toàn bộ nội dung từ chữ 'Lời giải' đến hết câu (hoặc trước câu tiếp theo).
      4. Công thức: Chuyển sang LaTeX compatible MathJax (vd: $x^2$).
      5. Hình ảnh: Giữ thẻ <img> nếu có.
      6. Trả về mảng JSON: [{ id: number, classTag: "", part: "...", type: "...", question: "...", o: ["A...", "B..."], a: "...", loigiai: "..." }]
      
      Nội dung: ${html}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      let parsedQuestions = JSON.parse(response.text);

      // Xử lý logic tên ảnh: exams + ddmmyy + index + n
      const now = new Date();
      const ddmmyy = `${now.getDate().toString().padStart(2,'0')}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getFullYear().toString().slice(-2)}`;
      
      const finalQuestions = await Promise.all(parsedQuestions.map(async (q: any, idx: number) => {
        // Giả lập xử lý upload ảnh nếu phát hiện <img> trong question
        // Ở thực tế, Mammoth trích xuất ảnh riêng, ta cần ánh xạ lại.
        return { ...q, id: 100000 + idx };
      }));

      setQuestions(finalQuestions);
      setPreviewOpen(true);
    } catch (err) {
      alert("Lỗi xử lý file Word hoặc Gemini!");
    } finally { setLoading(false); }
  };

  const handleFinalUpload = async () => {
    setLoading(true);
    try {
      const payload = {
        action: 'uploadExamData',
        idgv: gvId,
        examCode: examForm.exams,
        questions: questions
      };
      const targetUrl = API_ROUTING[gvId] || DEFAULT_API_URL;
      const res = await fetch(`${targetUrl}?action=uploadExamData`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      alert(result.message);
      setPreviewOpen(false);
    } catch (e) { alert("Lỗi tải lên!"); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto font-sans bg-white rounded-[3rem] shadow-2xl my-10 border border-slate-50">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-black text-indigo-700 uppercase tracking-tighter italic">Quản lý Giáo Viên & Word</h2>
        <button onClick={onBack} className="bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 px-6 py-2 rounded-full font-black transition-all">THOÁT</button>
      </div>

      {step === 'verify' ? (
        <div className="flex flex-col items-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <i className="fas fa-user-shield text-6xl text-indigo-300 mb-6"></i>
          <p className="font-bold text-slate-500 mb-6 uppercase tracking-widest text-xs">Xác minh quyền giáo viên</p>
          <input 
            type="text" placeholder="NHẬP ID GV..." 
            className="w-full max-w-md p-5 bg-white border-4 border-slate-100 rounded-2xl text-center font-black text-2xl outline-none focus:border-indigo-500 transition-all mb-6 uppercase"
            value={gvId} onChange={e => setGvId(e.target.value)}
          />
          <button onClick={handleVerify} disabled={loading} className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all">
            {loading ? 'ĐANG XỬ LÝ...' : 'VÀO HỆ THỐNG'}
          </button>
        </div>
      ) : (
        <div className="space-y-10 animate-fade-in">
          {/* VÙNG 1: CẤU HÌNH ĐỀ (Ghi vào sheet exams) */}
          <div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100 shadow-sm">
            <h3 className="text-xl font-black text-indigo-900 uppercase mb-6 flex items-center gap-2">
               <i className="fas fa-cog"></i> Cấu hình kỳ thi
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase ml-2">Mã đề (exams)</label>
                <input className="w-full p-3 rounded-xl border-none shadow-inner font-bold" value={examForm.exams} onChange={e=>setExamForm({...examForm, exams: e.target.value})} placeholder="VD: GK1_TOAN10" />
              </div>
              <div><label className="text-[10px] font-black text-indigo-400 uppercase ml-2">T.Gian (phút)</label><input type="number" className="w-full p-3 rounded-xl border-none shadow-inner font-bold" value={examForm.fulltime} onChange={e=>setExamForm({...examForm, fulltime: parseInt(e.target.value)})} /></div>
              <div><label className="text-[10px] font-black text-indigo-400 uppercase ml-2">Nộp tối thiểu</label><input type="number" className="w-full p-3 rounded-xl border-none shadow-inner font-bold" value={examForm.mintime} onChange={e=>setExamForm({...examForm, mintime: parseInt(e.target.value)})} /></div>
              <div><label className="text-[10px] font-black text-indigo-400 uppercase ml-2">Giới hạn Tab</label><input type="number" className="w-full p-3 rounded-xl border-none shadow-inner font-bold" value={examForm.tab} onChange={e=>setExamForm({...examForm, tab: parseInt(e.target.value)})} /></div>
              <div className="col-span-2"><label className="text-[10px] font-black text-indigo-400 uppercase ml-2">Ngày khóa</label><input type="date" className="w-full p-3 rounded-xl border-none shadow-inner font-bold" value={examForm.dateclose} onChange={e=>setExamForm({...examForm, dateclose: e.target.value})} /></div>
              <div><label className="text-[10px] font-black text-blue-500 uppercase ml-2">MCQ Count</label><input type="number" className="w-full p-3 rounded-xl border-none shadow-inner font-bold" value={examForm.MCQ} onChange={e=>setExamForm({...examForm, MCQ: parseInt(e.target.value)})} /></div>
              <div><label className="text-[10px] font-black text-blue-500 uppercase ml-2">MCQ Score</label><input type="number" step="0.01" className="w-full p-3 rounded-xl border-none shadow-inner font-bold" value={examForm.scoremcq} onChange={e=>setExamForm({...examForm, scoremcq: parseFloat(e.target.value)})} /></div>
              <div className="col-span-2"><label className="text-[10px] font-black text-indigo-400 uppercase ml-2">Folder ID Driver (Lưu ảnh)</label><input className="w-full p-3 rounded-xl border-none shadow-inner font-bold" value={examForm.IDimglink} onChange={e=>setExamForm({...examForm, IDimglink: e.target.value})} /></div>
            </div>
            <button onClick={handleSaveConfig} className="mt-6 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase shadow-lg hover:brightness-110 active:scale-95 transition-all">Ghi cấu hình vào Sheet Exams</button>
          </div>

          {/* VÙNG 2: IMPORT WORD & PREVIEW */}
          <div className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100 shadow-sm">
            <h3 className="text-xl font-black text-emerald-900 uppercase mb-6 flex items-center gap-2">
               <i className="fas fa-file-word"></i> Nhập dữ liệu từ Word
            </h3>
            <div className="flex flex-col items-center justify-center border-4 border-dashed border-emerald-200 rounded-[2.5rem] p-10 bg-white hover:bg-emerald-50 transition-all cursor-pointer relative">
              <input type="file" accept=".docx" className="absolute inset-0 opacity-0 cursor-pointer" onChange={processWordFile} disabled={loading} />
              <i className="fas fa-cloud-upload-alt text-6xl text-emerald-300 mb-4"></i>
              <p className="font-black text-emerald-600 uppercase">Chọn file Word đề thi (.docx)</p>
              <p className="text-[10px] text-slate-400 mt-2 italic">Hệ thống sẽ tự động bóc tách LaTeX và xử lý Lời giải riêng biệt</p>
            </div>
          </div>

          {/* VÙNG 3: TRỘN ĐỀ */}
          <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl">
            <h3 className="text-xl font-black uppercase mb-8 flex items-center gap-3">
               <i className="fas fa-random text-blue-400"></i> Tạo các mã đề thi trộn
            </h3>
            <div className="flex flex-wrap gap-6 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Số lượng mã đề</label>
                <input type="number" className="w-full p-4 bg-slate-800 rounded-2xl border-none outline-none font-black text-2xl" value={mixForm.count} onChange={e=>setMixForm({...mixForm, count: parseInt(e.target.value)})} />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Mã đề bắt đầu</label>
                <input type="number" className="w-full p-4 bg-slate-800 rounded-2xl border-none outline-none font-black text-2xl" value={mixForm.startCode} onChange={e=>setMixForm({...mixForm, startCode: parseInt(e.target.value)})} />
              </div>
              <button className="flex-[2] py-5 bg-blue-600 rounded-2xl font-black uppercase text-lg shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">XÁC NHẬN TRỘN ĐỀ</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PREVIEW & EDIT */}
      {previewOpen && (
        <div className="fixed inset-0 z-[300] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full h-full max-w-7xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-fade-in">
            <div className="bg-slate-50 p-8 border-b flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Bảng xem trước dữ liệu</h3>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">Đề: {examForm.exams} • {questions.length} câu hỏi</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setPreviewOpen(false)} className="px-8 py-3 bg-slate-200 rounded-2xl font-black uppercase text-xs">Hủy bỏ</button>
                <button onClick={handleFinalUpload} className="px-10 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-emerald-200">Ghi vào Google Sheets</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
              <table className="w-full border-separate border-spacing-y-4">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase text-left">
                    <th className="px-4">STT</th>
                    <th className="px-4">Phần</th>
                    <th className="px-4 w-[50%]">Question JSON (Cột D)</th>
                    <th className="px-4 w-[40%]">Lời Giải (Cột F)</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q, idx) => (
                    <tr key={idx} className="bg-white rounded-3xl shadow-sm border border-slate-100 group">
                      <td className="p-4 font-black text-indigo-600 text-center text-xl">{idx + 1}</td>
                      <td className="p-4 font-bold text-[10px] text-slate-500 uppercase">{q.part}</td>
                      <td className="p-4">
                        <textarea 
                          className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none text-xs font-mono text-blue-800 h-32 focus:ring-2 ring-indigo-500"
                          value={q.question} onChange={e => {
                            const n = [...questions]; n[idx].question = e.target.value; setQuestions(n);
                          }}
                        />
                      </td>
                      <td className="p-4">
                        <textarea 
                          className="w-full p-4 bg-emerald-50/50 rounded-2xl border-none outline-none text-xs italic text-slate-700 h-32 focus:ring-2 ring-emerald-500"
                          value={q.loigiai} onChange={e => {
                            const n = [...questions]; n[idx].loigiai = e.target.value; setQuestions(n);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherWordTask;

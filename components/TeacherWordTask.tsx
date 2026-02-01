
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
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
    MCQ: 28, scoremcq: 0.25, 
    TF: 4, scoretf: 1, 
    SA: 6, scoresa: 0.5, 
    IDimglink: ''
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
      } else { alert(data.message); }
    } catch (e) { alert("Lỗi xác minh!"); }
    finally { setLoading(false); }
  };

  const handleSaveConfig = async () => {
    if (!examForm.exams) return alert("Vui lòng nhập mã đề!");
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
    } catch (e) { alert("Lỗi lưu cấu hình!"); }
    finally { setLoading(false); }
  };

  const processWordFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer }, { styleMap: ["u => u"] });
      const html = result.value;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Phân tích HTML sau thành JSON danh sách câu hỏi.
      YÊU CẦU CỰC KỲ QUAN TRỌNG:
      1. PHẦN I (mcq): Đáp án 'a' là A, B, C hoặc D nằm trong thẻ <u>...</u>.
      2. PHẦN II (true-false): Mỗi câu có 4 ý a, b, c, d. Ý nào nằm trong <u>...</u> là ĐÚNG (true), ngược lại là SAI (false). Output mảng 's' chứa {text: string, a: boolean}.
      3. PHẦN III (short-answer): Đáp án 'a' nằm trong thẻ <key=...> hoặc <u>...</u> cuối câu.
      4. LaTeX: Chuyển công thức về dạng $...$.
      5. Hình ảnh: Giữ nguyên thẻ <img>.
      Nội dung: ${html}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                classTag: { type: Type.STRING },
                part: { type: Type.STRING },
                type: { type: Type.STRING },
                question: { type: Type.STRING },
                o: { type: Type.ARRAY, items: { type: Type.STRING } },
                a: { type: Type.STRING },
                s: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: {type:Type.STRING}, a: {type:Type.BOOLEAN} } } },
                loigiai: { type: Type.STRING }
              },
              required: ["type", "question"]
            }
          }
        }
      });

      let cleanText = response.text.trim();
      if (cleanText.startsWith("```json")) cleanText = cleanText.substring(7, cleanText.length - 3);
      setQuestions(JSON.parse(cleanText));
      setPreviewOpen(true);
    } catch (err) {
      console.error(err);
      alert("Lỗi xử lý file hoặc Gemini không phản hồi đúng định dạng!");
    } finally { setLoading(false); }
  };

  const handleFinalUpload = async () => {
    setLoading(true);
    try {
      const payload = { action: 'uploadExamData', idgv: gvId, examCode: examForm.exams, questions };
      const targetUrl = API_ROUTING[gvId] || DEFAULT_API_URL;
      const res = await fetch(`${targetUrl}?action=uploadExamData`, { method: 'POST', body: JSON.stringify(payload) });
      const result = await res.json();
      alert(result.message);
      setPreviewOpen(false);
    } catch (e) { alert("Lỗi tải lên!"); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto font-sans bg-white rounded-[3rem] shadow-2xl my-10 border border-slate-50">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-black text-indigo-700 uppercase italic">Quản lý Giáo Viên & Word</h2>
        <button onClick={onBack} className="bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 px-6 py-2 rounded-full font-black">THOÁT</button>
      </div>

      {step === 'verify' ? (
        <div className="flex flex-col items-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <i className="fas fa-user-shield text-6xl text-indigo-300 mb-6"></i>
          <input type="text" placeholder="NHẬP ID GV..." className="w-full max-w-md p-5 bg-white border-4 border-slate-100 rounded-2xl text-center font-black text-2xl uppercase" value={gvId} onChange={e => setGvId(e.target.value)} />
          <button onClick={handleVerify} disabled={loading} className="mt-6 px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl uppercase">
            {loading ? 'ĐANG XÁC MINH...' : 'VÀO HỆ THỐNG'}
          </button>
        </div>
      ) : (
        <div className="space-y-10 animate-fade-in">
          <div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100 shadow-sm">
            <h3 className="text-xl font-black text-indigo-900 uppercase mb-6 flex items-center gap-2">
               <i className="fas fa-cog"></i> Cấu hình đề thi (Sheet Exams)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase ml-2">Mã đề (exams)</label>
                <input className="w-full p-3 rounded-xl font-bold" value={examForm.exams} onChange={e=>setExamForm({...examForm, exams: e.target.value})} placeholder="VD: GK1_TOAN12" />
              </div>
              <div><label className="text-[10px] font-black text-indigo-400 uppercase ml-2">T.Gian (phút)</label><input type="number" className="w-full p-3 rounded-xl font-bold" value={examForm.fulltime} onChange={e=>setExamForm({...examForm, fulltime: parseInt(e.target.value)})} /></div>
              <div><label className="text-[10px] font-black text-indigo-400 uppercase ml-2">Nộp tối thiểu</label><input type="number" className="w-full p-3 rounded-xl font-bold" value={examForm.mintime} onChange={e=>setExamForm({...examForm, mintime: parseInt(e.target.value)})} /></div>
              <div><label className="text-[10px] font-black text-indigo-400 uppercase ml-2">G.Hạn Tab</label><input type="number" className="w-full p-3 rounded-xl font-bold" value={examForm.tab} onChange={e=>setExamForm({...examForm, tab: parseInt(e.target.value)})} /></div>
              <div><label className="text-[10px] font-black text-indigo-400 uppercase ml-2">Ngày đóng</label><input type="date" className="w-full p-3 rounded-xl font-bold" value={examForm.dateclose} onChange={e=>setExamForm({...examForm, dateclose: e.target.value})} /></div>
              
              <div className="bg-blue-100/50 p-2 rounded-xl">
                <label className="text-[10px] font-black text-blue-500 uppercase ml-2">MCQ (Số câu)</label>
                <input type="number" className="w-full p-2 rounded-lg font-bold" value={examForm.MCQ} onChange={e=>setExamForm({...examForm, MCQ: parseInt(e.target.value)})} />
                <label className="text-[9px] font-black text-blue-400 uppercase ml-2">Điểm/câu</label>
                <input type="number" step="0.01" className="w-full p-2 rounded-lg font-bold" value={examForm.scoremcq} onChange={e=>setExamForm({...examForm, scoremcq: parseFloat(e.target.value)})} />
              </div>

              <div className="bg-orange-100/50 p-2 rounded-xl">
                <label className="text-[10px] font-black text-orange-600 uppercase ml-2">TF (Số câu)</label>
                <input type="number" className="w-full p-2 rounded-lg font-bold" value={examForm.TF} onChange={e=>setExamForm({...examForm, TF: parseInt(e.target.value)})} />
                <label className="text-[9px] font-black text-orange-400 uppercase ml-2">Điểm tối đa</label>
                <input type="number" step="0.01" className="w-full p-2 rounded-lg font-bold" value={examForm.scoretf} onChange={e=>setExamForm({...examForm, scoretf: parseFloat(e.target.value)})} />
              </div>

              <div className="bg-purple-100/50 p-2 rounded-xl">
                <label className="text-[10px] font-black text-purple-600 uppercase ml-2">SA (Số câu)</label>
                <input type="number" className="w-full p-2 rounded-lg font-bold" value={examForm.SA} onChange={e=>setExamForm({...examForm, SA: parseInt(e.target.value)})} />
                <label className="text-[9px] font-black text-purple-400 uppercase ml-2">Điểm/câu</label>
                <input type="number" step="0.01" className="w-full p-2 rounded-lg font-bold" value={examForm.scoresa} onChange={e=>setExamForm({...examForm, scoresa: parseFloat(e.target.value)})} />
              </div>

              <div className="col-span-3">
                <label className="text-[10px] font-black text-indigo-400 uppercase ml-2">ID Thư mục Drive (Lưu ảnh)</label>
                <input className="w-full p-3 rounded-xl font-bold" value={examForm.IDimglink} onChange={e=>setExamForm({...examForm, IDimglink: e.target.value})} placeholder="Dán ID thư mục Google Drive..." />
              </div>
            </div>
            <button onClick={handleSaveConfig} className="mt-6 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase">Lưu cấu hình</button>
          </div>

          <div className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100 shadow-sm">
            <h3 className="text-xl font-black text-emerald-900 uppercase mb-6 flex items-center gap-2">
               <i className="fas fa-file-word"></i> Nhập dữ liệu từ Word
            </h3>
            <div className="flex flex-col items-center justify-center border-4 border-dashed border-emerald-200 rounded-[2.5rem] p-10 bg-white relative">
              <input type="file" accept=".docx" className="absolute inset-0 opacity-0 cursor-pointer" onChange={processWordFile} disabled={loading} />
              <i className="fas fa-cloud-upload-alt text-6xl text-emerald-300 mb-4"></i>
              <p className="font-black text-emerald-600 uppercase text-center">
                {loading ? 'ĐANG PHÂN TÍCH...' : 'BẤM ĐỂ CHỌN FILE WORD'}
              </p>
            </div>
          </div>
        </div>
      )}

      {previewOpen && (
        <div className="fixed inset-0 z-[300] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full h-full max-w-7xl rounded-[3rem] flex flex-col overflow-hidden">
            <div className="bg-slate-50 p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800 uppercase">Xem trước {questions.length} câu hỏi</h3>
              <div className="flex gap-4">
                <button onClick={() => setPreviewOpen(false)} className="px-6 py-2 bg-slate-200 rounded-xl font-bold">HỦY</button>
                <button onClick={handleFinalUpload} className="px-8 py-2 bg-emerald-600 text-white rounded-xl font-bold uppercase">TẢI LÊN SHEET</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
              {questions.map((q, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 font-mono text-xs">
                  <p className="text-indigo-600 font-black mb-1">CÂU {idx + 1} - [{q.type}]</p>
                  <pre className="whitespace-pre-wrap">{JSON.stringify(q, null, 2)}</pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherWordTask;

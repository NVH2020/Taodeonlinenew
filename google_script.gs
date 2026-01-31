
/**
 * HỆ THỐNG QUẢN LÝ TỔNG HỢP (HỌC SINH - ADMIN - GIÁO VIÊN)
 * Phiên bản: Super Script v2.0
 * Tác giả: Senior Frontend Engineer
 */

const SPREADSHEET_ID = "16w4EzHhTyS1CnTfJOWE7QQNM0o2mMQIqePpPK8TEYrg";
const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

/**
 * Tạo phản hồi JSON chuẩn
 */
function createResponse(status, message, data) {
  const output = { status: status, message: message };
  if (data) output.data = data;
  return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
}

/*************************************************
 * HÀM XỬ LÝ GET REQUEST (LẤY DỮ LIỆU)
 *************************************************/
function doGet(e) {
  const params = e.parameter;
  const action = params.action;
  const type = params.type;

  try {
    // 1. TRA CỨU LỜI GIẢI (Dành cho học sinh xem lại bài)
    if (action === 'getLG') {
      const sheetNH = ss.getSheetByName("nganhang");
      var idTraCuu = params.id;
      if (!idTraCuu) return ContentService.createTextOutput("Thiếu ID!").setMimeType(ContentService.MimeType.TEXT);
      var data = sheetNH.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0].toString().trim() === idTraCuu.toString().trim()) {
          return ContentService.createTextOutput(String(data[i][4] || "")).setMimeType(ContentService.MimeType.TEXT);
        }
      }
      return ContentService.createTextOutput("Không tìm thấy!").setMimeType(ContentService.MimeType.TEXT);
    }

    // 2. LẤY CẤU HÌNH CHUYÊN ĐỀ (DANH MỤC)
    if (action === 'getAppConfig') {
      var sheetCD = ss.getSheetByName("dangcd");
      if (!sheetCD) return createResponse("error", "Thiếu sheet dangcd");
      var dataCD = sheetCD.getDataRange().getValues();
      var topics = [];
      for (var i = 1; i < dataCD.length; i++) {
        if (dataCD[i][0]) {
          topics.push({ grade: dataCD[i][0], id: dataCD[i][1], name: dataCD[i][2] });
        }
      }
      return createResponse("success", "OK", { topics: topics });
    }

    // 3. LẤY ROUTING (Bản đồ link script giáo viên)
    if (action === "getRouting") {
      const sheet = ss.getSheetByName("idgv");
      if (!sheet) return createResponse("error", "Thiếu sheet idgv");
      const rows = sheet.getDataRange().getValues();
      const data = [];
      for (var i = 1; i < rows.length; i++) {
        data.push({ idNumber: rows[i][0], link: rows[i][2] });
      }
      return createResponse("success", "OK", data);
    }

    // 4. KIỂM TRA GIÁO VIÊN (Dành cho Module Giáo viên)
    if (action === 'checkTeacher') {
      const idgv = params.idgv;
      const sheet = ss.getSheetByName("idgv");
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0].toString().trim() === idgv.trim()) {
          return createResponse("success", "OK", { name: data[i][1], link: data[i][2] });
        }
      }
      return createResponse("error", "ID Giáo viên không tồn tại!");
    }

    // 5. XÁC MINH THÍ SINH (Dành cho Module Thi)
    if (type === 'verifyStudent') {
      const idNumber = params.idnumber;
      const sbd = params.sbd;
      const sheet = ss.getSheetByName("danhsach");
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][5].toString().trim() === idNumber.trim() && data[i][0].toString().trim() === sbd.trim()) {
          return createResponse("success", "OK", {
            name: data[i][1], class: data[i][2], limit: data[i][3],
            limittab: data[i][4], taikhoanapp: data[i][6], idnumber: idNumber, sbd: sbd
          });
        }
      }
      return createResponse("error", "Thí sinh không tồn tại!");
    }

    // 6. LẤY MA TRẬN ĐỀ THI (Exam Codes)
    if (type === 'getExamCodes') {
      const id = params.idnumber;
      const sheetMatrix = ss.getSheetByName("matran");
      const results = [];
      if (sheetMatrix) {
        const data = sheetMatrix.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
          if (data[i][0].toString().trim() === id.trim() || data[i][0].toString() === "SYSTEM") {
            try {
              results.push({
                code: data[i][1].toString(),
                name: data[i][2].toString(),
                topics: JSON.parse(data[i][3]),
                fixedConfig: {
                  duration: parseInt(data[i][4]),
                  numMC: JSON.parse(data[i][5]), scoreMC: parseFloat(data[i][6]),
                  numTF: JSON.parse(data[i][9]), scoreTF: parseFloat(data[i][10]),
                  numSA: JSON.parse(data[i][13]), scoreSA: parseFloat(data[i][14])
                }
              });
            } catch(e) {}
          }
        }
      }
      return createResponse("success", "OK", results);
    }

    // 7. LẤY BẢNG VÀNG TOP 10 QUIZ
    if (type === 'top10') {
      const sheet = ss.getSheetByName("Top10Display");
      if (!sheet) return createResponse("success", "No sheet", []);
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) return createResponse("success", "No data", []);
      const values = sheet.getRange(2, 1, Math.min(10, lastRow - 1), 10).getValues();
      const top10 = values.map((row, index) => ({
        rank: index + 1, name: row[0], phoneNumber: row[1], score: row[2],
        time: row[3], idPhone: row[9]
      }));
      return createResponse("success", "OK", top10);
    }

    // 8. LẤY NGÂN HÀNG CÂU HỎI (Dành cho Admin)
    if (action === "getQuestions") {
      var sheet = ss.getSheetByName("nganhang");
      var rows = sheet.getDataRange().getValues();
      var questions = [];
      for (var i = 1; i < rows.length; i++) {
        if (!rows[i][2]) continue;
        try {
          var raw = rows[i][2];
          var jsonText = raw.replace(/(\w+)\s*:/g, '"$1":').replace(/'/g, '"');
          var obj = JSON.parse(jsonText);
          obj.loigiai = rows[i][4] || "";
          questions.push(obj);
        } catch (e) {}
      }
      return createResponse("success", "OK", questions);
    }

    // 9. LẤY CÂU HỎI LẺ THEO ID (Sửa lỗi)
    if (action === 'getQuestionById') {
      var id = params.id;
      var sheetNH = ss.getSheetByName("nganhang");
      var dataNH = sheetNH.getDataRange().getValues();
      for (var i = 1; i < dataNH.length; i++) {
        if (dataNH[i][0].toString() === id.toString()) {
          return createResponse("success", "OK", {
            idquestion: dataNH[i][0], classTag: dataNH[i][1], 
            question: dataNH[i][2], loigiai: dataNH[i][4]
          });
        }
      }
      return createResponse("error", "Không tìm thấy!");
    }

    // 10. LẤY MẬT KHẨU QUIZ (Hỗ trợ landing)
    if (type === 'getPass') {
      const sheetList = ss.getSheetByName("danhsach");
      const password = sheetList.getRange("H2").getValue();
      return createResponse("success", "OK", { password: password.toString() });
    }

  } catch (err) {
    return createResponse("error", err.toString());
  }
  
  return createResponse("error", "Hành động không hợp lệ");
}

/*************************************************
 * HÀM XỬ LÝ POST REQUEST (GHI DỮ LIỆU)
 *************************************************/
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(30000);
  try {
    const action = e.parameter.action;
    const data = JSON.parse(e.postData.contents);

    // 1. LƯU LỜI GIẢI HÀNG LOẠT (Cột E)
    if (action === 'saveLG') {
      var sheetNH = ss.getSheetByName("nganhang");
      var count = 0;
      data.forEach(item => {
        var id = item.id;
        var lg = item.loigiai || item.lg || "";
        var rows = sheetNH.getDataRange().getValues();
        for (var i = 1; i < rows.length; i++) {
          if (rows[i][0].toString() === id.toString()) {
            sheetNH.getRange(i + 1, 5).setValue(lg);
            count++;
            break;
          }
        }
      });
      return ContentService.createTextOutput("Đã cập nhật " + count + " lời giải!").setMimeType(ContentService.MimeType.TEXT);
    }

    // 2. CẬP NHẬT CÂU HỎI LẺ (Admin sửa)
    if (action === 'updateQuestion') {
      var sheetNH = ss.getSheetByName("nganhang");
      var item = data.data;
      var rows = sheetNH.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0].toString() === item.idquestion.toString()) {
          sheetNH.getRange(i + 1, 2).setValue(item.classTag);
          sheetNH.getRange(i + 1, 3).setValue(item.question);
          sheetNH.getRange(i + 1, 5).setValue(item.loigiai);
          return createResponse("success", "Cập nhật thành công!");
        }
      }
      return createResponse("error", "Không tìm thấy ID");
    }

    // 3. LƯU CÂU HỎI MỚI (Admin import)
    if (action === 'saveQuestions') {
      var sheetNH = ss.getSheetByName("nganhang");
      data.forEach(item => {
        sheetNH.appendRow([item.id, item.classTag, item.question, new Date(), item.loigiai || ""]);
      });
      return createResponse("success", "Đã lưu " + data.length + " câu!");
    }

    // 4. LƯU CẤU HÌNH PHÒNG THI (Teacher)
    if (action === 'saveExamConfig') {
      const gvSS = getSpreadsheetByTarget(data.idgv);
      const sheet = gvSS.getSheetByName("exams") || gvSS.insertSheet("exams");
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["exams", "IdNumber", "fulltime", "mintime", "tab", "dateclose", "MCQ", "scoremcq", "TF", "scoretf", "SA", "scoresa", "IDimglink"]);
      }
      sheet.appendRow([
        data.exams, data.idgv, data.fulltime, data.mintime, 
        data.tab, data.dateclose, data.MCQ, data.scoremcq, 
        data.TF, data.scoretf, data.SA, data.scoresa, data.IDimglink
      ]);
      return createResponse("success", "Lưu cấu hình thành công!");
    }

    // 5. UPLOAD DỮ LIỆU ĐỀ THI TỪ WORD (Teacher)
    if (action === 'uploadExamData') {
      const gvSS = getSpreadsheetByTarget(data.idgv);
      const sheet = gvSS.getSheetByName("exam_data") || gvSS.insertSheet("exam_data");
      const now = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yy");
      data.questions.forEach(q => {
        sheet.appendRow([
          data.examCode, q.classTag || "", q.type, 
          JSON.stringify(q), now, q.loigiai || ""
        ]);
      });
      return createResponse("success", "Đã tải lên " + data.questions.length + " câu!");
    }

    // 6. LƯU KẾT QUẢ QUIZ (Landing Page)
    if (data.type === 'quiz') {
      let sheetQuiz = ss.getSheetByName("ketquaQuiZ") || ss.insertSheet("ketquaQuiZ");
      sheetQuiz.appendRow([
        new Date(), data.examCode || "QUIZ", data.name, data.className, 
        data.school, data.phoneNumber, data.score, data.totalTime, data.stk, data.bank
      ]);
      return createResponse("success", "Lưu kết quả Quiz thành công!");
    }

    // 7. LƯU KẾT QUẢ THI CHÍNH THỨC
    if (data.examCode) {
      let sheetResult = ss.getSheetByName("ketqua") || ss.insertSheet("ketqua");
      sheetResult.appendRow([
        new Date(), data.examCode, data.sbd, data.name, 
        data.className, data.score, data.totalTime, JSON.stringify(data.details)
      ]);
      return createResponse("success", "Lưu kết quả thi thành công!");
    }

    return createResponse("error", "Action không hợp lệ hoặc dữ liệu sai định dạng");
  } catch (err) {
    return createResponse("error", err.toString());
  } finally {
    lock.releaseLock();
  }
}

/**
 * Tìm Spreadsheet đích của giáo viên dựa trên ID
 */
function getSpreadsheetByTarget(idNumber) {
  const sheet = ss.getSheetByName("idgv");
  if (!sheet) return ss;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim() === idNumber.toString().trim()) {
      const link = data[i][2].toString().trim();
      if (link && link.startsWith("http")) {
        try {
          return SpreadsheetApp.openByUrl(link);
        } catch(e) {}
      }
    }
  }
  return ss;
}

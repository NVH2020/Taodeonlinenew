
/**
 * CẤU HÌNH HỆ THỐNG
 */
const SPREADSHEET_ID = "16w4EzHhTyS1CnTfJOWE7QQNM0o2mMQIqePpPK8TEYrg";
const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

function doGet(e) {
  const params = e.parameter;
  const action = params.action;
  const type = params.type;

  // 1. XÁC MINH GIÁO VIÊN TỪ SHEET idgv
  if (action === 'checkTeacher') {
    const idgv = params.idgv;
    const sheet = ss.getSheetByName("idgv");
    if (!sheet) return createResponse("error", "Sheet idgv không tồn tại");
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString().trim() === idgv.trim()) {
        return createResponse("success", "Xác minh thành công", { name: data[i][1], link: data[i][2] });
      }
    }
    return createResponse("error", "ID Giáo viên không đúng hoặc chưa đăng ký!");
  }

  // Lấy ma trận đề thi
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

  if (action === 'getAppConfig') return createResponse("success", "OK", { topics: [] });
  
  return createResponse("error", "Yêu cầu không hợp lệ");
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(30000);
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = e.parameter.action;

    // 1. GHI CẤU HÌNH VÀO SHEET exams
    if (action === 'saveExamConfig') {
      const gvSS = getSpreadsheetByTarget(postData.idgv);
      const sheet = gvSS.getSheetByName("exams") || gvSS.insertSheet("exams");
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["exams", "IdNumber", "fulltime", "mintime", "tab", "dateclose", "MCQ", "scoremcq", "TF", "scoretf", "SA", "scoresa", "IDimglink"]);
      }
      sheet.appendRow([
        postData.exams, postData.idgv, postData.fulltime, postData.mintime, 
        postData.tab, postData.dateclose, postData.MCQ, postData.scoremcq, 
        postData.TF, postData.scoretf, postData.SA, postData.scoresa, postData.IDimglink
      ]);
      return createResponse("success", "Đã lưu cấu hình kỳ thi thành công!");
    }

    // 2. GHI CÂU HỎI VÀO SHEET exam_data (Cột A-F)
    if (action === 'uploadExamData') {
      const gvSS = getSpreadsheetByTarget(postData.idgv);
      const sheet = gvSS.getSheetByName("exam_data") || gvSS.insertSheet("exam_data");
      const now = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yy");
      
      postData.questions.forEach(q => {
        // q.question hiện đang là chuỗi JSON thô từ Preview. Cần xử lý:
        // 1. Xóa "loigiai" bên trong JSON cho cột D
        // 2. Tách "loigiai" ra cột F
        let qObj = JSON.parse(JSON.stringify(q)); 
        const lg = qObj.loigiai || "";
        delete qObj.loigiai;
        
        sheet.appendRow([
          postData.examCode,      // Cột A: exams
          qObj.classTag || "",     // Cột B: classTag
          qObj.type,               // Cột C: type
          JSON.stringify(qObj),    // Cột D: question JSON sạch
          now,                     // Cột E: datetime
          lg                       // Cột F: loigiai
        ]);
      });
      return createResponse("success", "Đã ghi " + postData.questions.length + " câu hỏi vào ngân hàng giáo viên!");
    }

    // 3. XỬ LÝ LƯU ẢNH VÀO DRIVE
    if (action === 'uploadImage') {
      const folderId = postData.folderId;
      const folder = DriveApp.getFolderById(folderId);
      const decoded = Utilities.base64Decode(postData.base64);
      const blob = Utilities.newBlob(decoded, postData.mimeType, postData.filename);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return createResponse("success", "OK", file.getUrl());
    }

    return createResponse("error", "Không tìm thấy hành động phù hợp");
  } catch (err) {
    return createResponse("error", err.toString());
  } finally {
    lock.releaseLock();
  }
}

function getSpreadsheetByTarget(idNumber) {
  const sheet = ss.getSheetByName("idgv");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim() === idNumber.toString().trim()) {
      const link = data[i][2].toString().trim();
      if (link && link.startsWith("http")) return SpreadsheetApp.openByUrl(link);
    }
  }
  return ss;
}

function createResponse(status, message, data) {
  const output = { status: status, message: message };
  if (data) output.data = data;
  return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
}

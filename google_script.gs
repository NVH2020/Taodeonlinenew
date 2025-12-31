
const SPREADSHEET_ID = "1y7OmTFZxgdLgGUtoNpo7WTIVwJyeTVE9rzSzWaY_Btc";

function doGet(e) {
  const idnumber = e.parameter.idnumber;
  const sbd = e.parameter.sbd;
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetList = ss.getSheetByName("danhsach");
  const sheetResult = ss.getSheetByName("ketqua");
  
  if (!sheetList) return createResponse("error", "Không tìm thấy sheet 'danhsach'");

  const data = sheetList.getDataRange().getValues();
  const headers = data[0].map(h => h.toString().toLowerCase().trim());
  
  const idxSbd = headers.indexOf("sbd");
  const idxId = headers.indexOf("idnumber");
  const idxName = headers.indexOf("name");
  const idxClass = headers.indexOf("class");
  const idxLimit = headers.indexOf("limit");
  const idxLimittab = headers.indexOf("limittab");
  const idxTk = headers.indexOf("taikhoanapp"); // Cột G

  let student = null;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idxId].toString().trim() === idnumber && data[i][idxSbd].toString().trim() === sbd) {
      student = {
        sbd: data[i][idxSbd].toString(),
        name: data[i][idxName],
        class: data[i][idxClass],
        limit: parseInt(data[i][idxLimit]) || 1,
        limittab: parseInt(data[i][idxLimittab]) || 3,
        idnumber: data[i][idxId].toString(),
        taikhoanapp: data[i][idxTk]
      };
      break;
    }
  }

  if (!student) return createResponse("error", "Thông tin SBD hoặc ID không khớp!");

  let turnsTaken = 0;
  if (sheetResult) {
    const results = sheetResult.getDataRange().getValues();
    if (results.length > 0) {
      const resHeaders = results[0].map(h => h.toString().toLowerCase().trim());
      const resIdxSbd = resHeaders.indexOf("sbd");
      for (let j = 1; j < results.length; j++) {
        if (results[j][resIdxSbd].toString() === sbd) turnsTaken++;
      }
    }
  }

  if (turnsTaken >= student.limit) {
    return createResponse("error", "Bạn đã hết lượt thi! (Đã thi " + turnsTaken + "/" + student.limit + " lần)");
  }

  return createResponse("success", "Xác minh thành công", student);
}

function doPost(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    const data = JSON.parse(e.postData.contents);
    
    // Xử lý đăng ký / Nâng cấp VIP
    if (data.type === 'register' || data.type === 'vip') {
      let sheetVip = ss.getSheetByName("VIP");
      if (!sheetVip) {
        sheetVip = ss.insertSheet("VIP");
        sheetVip.appendRow(["phoneNumber", "password", "status"]);
      }
      
      const vipData = sheetVip.getDataRange().getValues();
      let rowIndex = -1;
      for (let i = 1; i < vipData.length; i++) {
        if (vipData[i][0].toString().trim() === data.phone.toString().trim()) {
          rowIndex = i + 1;
          break;
        }
      }
      
      if (data.type === 'register') {
        if (rowIndex === -1) {
          sheetVip.appendRow([data.phone, data.pass, "MEMBER"]);
          return createResponse("success", "Đăng ký thành công");
        } else {
          return createResponse("error", "Số điện thoại đã được đăng ký trước đó!");
        }
      } else if (data.type === 'vip') {
        if (rowIndex !== -1) {
          sheetVip.getRange(rowIndex, 3).setValue("VIP");
          return createResponse("success", "Đã nâng cấp lên VIP");
        } else {
          return createResponse("error", "Tài khoản không tồn tại");
        }
      }
    }

    // Xử lý lưu kết quả QuiZ
    if (data.type === 'quiz') {
      let sheetQuiz = ss.getSheetByName("ketquaQuiZ");
      if (!sheetQuiz) {
        sheetQuiz = ss.insertSheet("ketquaQuiZ");
        sheetQuiz.appendRow(["Timestamp", "maQuiZ", "name", "class", "school", "phoneNumber", "tongdiem", "fulltime", "xephangtuan"]);
      }
      sheetQuiz.appendRow([
        data.timestamp,
        data.examCode,
        data.name,
        data.className,
        data.school || "",
        data.phoneNumber || "",
        data.score,
        data.totalTime,
        "" // xephangtuan để trống cho admin cập nhật
      ]);
      return createResponse("success", "Lưu kết quả QuiZ thành công");
    }

    // Xử lý lưu kết quả thi (Exam)
    let sheetResult = ss.getSheetByName("ketqua");
    if (!sheetResult) sheetResult = ss.insertSheet("ketqua");
    if (sheetResult.getLastRow() === 0) {
      sheetResult.appendRow(["Timestamp", "makiemtra", "sbd", "name", "class", "tongdiem", "fulltime", "details"]);
    }

    sheetResult.appendRow([
      data.timestamp,
      data.examCode,
      data.sbd,
      data.name,
      data.className,
      data.score,
      data.totalTime,
      JSON.stringify(data.details)
    ]);

    return createResponse("success", "Lưu kết quả thành công");
  } catch (error) {
    return createResponse("error", error.message);
  } finally {
    lock.releaseLock();
  }
}

function createResponse(status, message, data) {
  const output = { status: status, message: message };
  if (data) output.data = data;
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}


const SPREADSHEET_ID = "1y7OmTFZxgdLgGUtoNpo7WTIVwJyeTVE9rzSzWaY_Btc";

function doGet(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const type = e.parameter.type;

  try {
    // 1. Lấy Top 10 từ sheet Top10Display
    if (type === 'getTop10') {
      const sheet = ss.getSheetByName("Top10Display");
      if (!sheet) return createResponse("error", "Không tìm thấy sheet Top10Display");
      const data = sheet.getDataRange().getValues();
      const results = [];
      for (let i = 1; i < data.length; i++) {
        if (!data[i][0]) continue;
        results.push({
          rank: i,
          name: data[i][0], // Cột A
          score: data[i][1], // Cột B
          time: data[i][2], // Cột C
          phone: data[i][6] ? data[i][6].toString().replace(/'/g, "") : "" // Cột G (idPhone)
        });
      }
      return createResponse("success", "Thành công", results);
    }

    // 2. Lấy Thống kê Đánh giá
    if (type === 'getStats') {
      const stats = { total: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const sheet = ss.getSheetByName("danhgia");
      if (sheet) {
        const data = sheet.getDataRange().getValues();
        stats.total = data.length - 1;
        for (let i = 1; i < data.length; i++) {
          const star = parseInt(data[i][1]);
          if (star >= 1 && star <= 5) stats[star]++;
        }
      }
      return createResponse("success", "Thành công", stats);
    }

    // 3. Kiểm tra Password Quiz (H2 sheet danhsach)
    if (type === 'checkQuizPass') {
      const pass = e.parameter.pass;
      const sheet = ss.getSheetByName("danhsach");
      const dbPass = sheet.getRange("H2").getValue().toString();
      if (pass === dbPass) return createResponse("success", "Mật khẩu đúng");
      return createResponse("error", "Mật khẩu không chính xác");
    }

    // 4. Lấy danh sách mã đề từ Ma trận (Sheet matran)
    if (type === 'getExamCodes') {
      const idnumber = e.parameter.idnumber;
      const grade = e.parameter.grade;
      const sheet = ss.getSheetByName("matran");
      if (!sheet) return createResponse("error", "Không tìm thấy ma trận");
      const data = sheet.getDataRange().getValues();
      const codes = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        // Cột A: ID GV, Cột B: Grade, Cột C: Mã đề, Cột D: Tên đề, Cột E: Cấu hình JSON
        if ((row[0].toString() === idnumber || row[0].toString() === "SYSTEM") && row[1].toString() === grade) {
          codes.push({
            code: row[2].toString(),
            name: row[3].toString(),
            topics: row[4] ? JSON.parse(row[4]).topics : "manual",
            fixedConfig: row[4] ? JSON.parse(row[4]).config : null
          });
        }
      }
      return createResponse("success", "Thành công", codes);
    }

    // 5. Xác minh học sinh (Cũ)
    if (e.parameter.idnumber && e.parameter.sbd) {
      const idNumber = e.parameter.idnumber;
      const sbd = e.parameter.sbd;
      const sheet = ss.getSheetByName("danhsach");
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0].toString() === idNumber && data[i][1].toString() === sbd) {
          return createResponse("success", "OK", {
            name: data[i][2],
            class: data[i][3],
            limit: data[i][4],
            limittab: data[i][5],
            taikhoanapp: data[i][6],
            idnumber: idNumber,
            sbd: sbd
          });
        }
      }
      return createResponse("error", "Không tìm thấy thông tin");
    }

    return createResponse("error", "Yêu cầu không hợp lệ");
  } catch (err) {
    return createResponse("error", err.toString());
  }
}

function doPost(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    const data = JSON.parse(e.postData.contents);
    const formatStr = (v) => v ? "'" + v.toString() : "";

    if (data.type === 'rating') {
      let sheet = ss.getSheetByName("danhgia");
      if (!sheet) sheet = ss.insertSheet("danhgia");
      sheet.appendRow([new Date(), data.stars, data.name, data.comment, formatStr(data.idNumber), data.taikhoanapp]);
      return createResponse("success", "OK");
    }

    if (data.type === 'quiz') {
      let sheet = ss.getSheetByName("ketquaQuiZ");
      if (!sheet) sheet = ss.insertSheet("ketquaQuiZ");
      sheet.appendRow([new Date(), data.examCode, data.name, data.className, data.school, formatStr(data.phoneNumber), data.score, data.totalTime, formatStr(data.stk), data.bank]);
      return createResponse("success", "OK");
    }

    if (data.type === 'exam') {
      let sheet = ss.getSheetByName("ketqua");
      if (!sheet) sheet = ss.insertSheet("ketqua");
      sheet.appendRow([new Date(), data.examCode, formatStr(data.sbd), data.name, data.className, data.score, data.totalTime, JSON.stringify(data.details)]);
      return createResponse("success", "OK");
    }

    return createResponse("error", "Type not found");
  } catch (error) {
    return createResponse("error", error.message);
  } finally {
    lock.releaseLock();
  }
}

function createResponse(status, message, data) {
  const output = { status: status, message: message };
  if (data) output.data = data;
  return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
}

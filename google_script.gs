
const SPREADSHEET_ID = "1y7OmTFZxgdLgGUtoNpo7WTIVwJyeTVE9rzSzWaY_Btc";

function doGet(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const type = e.parameter.type;

  try {
    // 1. Lấy Top 10 từ sheet Top10Display (A: Name, B: Score, C: Time, G: idPhone)
    if (type === 'getTop10') {
      const sheet = ss.getSheetByName("Top10Display");
      if (!sheet) return createResponse("error", "Sheet Top10Display not found");
      const data = sheet.getDataRange().getValues();
      const results = [];
      // Lấy từ hàng 2, tối đa 10 hàng
      for (let i = 1; i < data.length && results.length < 10; i++) {
        if (!data[i][0]) continue;
        results.push({
          rank: results.length + 1,
          name: data[i][0].toString(), // Cột A
          score: data[i][1], // Cột B
          time: data[i][2], // Cột C
          phone: data[i][6] ? data[i][6].toString().replace(/'/g, "") : "" // Cột G
        });
      }
      return createResponse("success", "OK", results);
    }

    // 2. Thống kê đánh giá
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
      return createResponse("success", "OK", stats);
    }

    // 3. Kiểm tra pass Quiz (Sheet danhsach ô H2)
    if (type === 'checkQuizPass') {
      const passInput = e.parameter.pass;
      const sheet = ss.getSheetByName("danhsach");
      const dbPass = sheet.getRange("H2").getValue().toString().trim();
      if (passInput === dbPass) return createResponse("success", "Valid");
      return createResponse("error", "Sai mật khẩu");
    }

    // 4. Lấy mã đề từ Ma trận (Sheet matran)
    if (type === 'getExamCodes') {
      const teacherId = e.parameter.idnumber;
      const grade = e.parameter.grade;
      const sheet = ss.getSheetByName("matran");
      if (!sheet) return createResponse("error", "Matrix sheet not found");
      const data = sheet.getDataRange().getValues();
      const codes = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        // Cột A: TeacherID, B: Grade, C: Code, D: Name, E: Config
        if ((row[0].toString() === teacherId || row[0].toString() === "SYSTEM") && row[1].toString() === grade) {
          try {
            const configObj = JSON.parse(row[4]);
            codes.push({
              code: row[2].toString(),
              name: row[3].toString(),
              topics: configObj.topics,
              fixedConfig: configObj.config
            });
          } catch(e) {
            // Trường hợp Config không phải JSON hợp lệ
            codes.push({ code: row[2].toString(), name: row[3].toString(), topics: 'manual' });
          }
        }
      }
      return createResponse("success", "OK", codes);
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
      return createResponse("error", "Thí sinh không tồn tại");
    }

    return createResponse("error", "Invalid Request");
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

    return createResponse("error", "Unknown Data Type");
  } catch (err) {
    return createResponse("error", err.toString());
  } finally {
    lock.releaseLock();
  }
}

function createResponse(status, message, data) {
  const out = { status, message };
  if (data) out.data = data;
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

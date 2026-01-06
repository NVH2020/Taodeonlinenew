
// Cấu hình ID Spreadsheet - Hãy đảm bảo ID này chính xác
const SPREADSHEET_ID = "1y7OmTFZxgdLgGUtoNpo7WTIVwJyeTVE9rzSzWaY_Btc";

/**
 * Xử lý yêu cầu GET
 */
function doGet(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const params = e.parameter;
  const type = params.type;

  try {
    // 1. Xác minh thí sinh
    if (type === 'verifyStudent') {
      const idNumber = params.idnumber;
      const sbd = params.sbd;
      const sheet = ss.getSheetByName("danhsach");
      if (!sheet) return createResponse("error", "Sheet danhsach không tồn tại");
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0].toString().trim() === idNumber.trim() && data[i][1].toString().trim() === sbd.trim()) {
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
      return createResponse("error", "Thí sinh không tồn tại trên hệ thống!");
    }

    // 2. Lấy mã đề từ Ma trận
    if (type === 'getExamCodes') {
      const teacherId = params.idnumber;
      const sheet = ss.getSheetByName("matran");
      if (!sheet) return createResponse("error", "Sheet matran không tồn tại");
      const data = sheet.getDataRange().getValues();
      const results = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0].toString().trim() === teacherId.trim() || row[0].toString() === "SYSTEM") {
          try {
            results.push({
              code: row[1].toString(),
              name: row[2].toString(),
              topics: JSON.parse(row[3]),
              fixedConfig: {
                duration: parseInt(row[4]),
                numMC: JSON.parse(row[5]),
                scoreMC: parseFloat(row[6]),
                mcL3: JSON.parse(row[7]),
                mcL4: JSON.parse(row[8]),
                numTF: JSON.parse(row[9]),
                scoreTF: parseFloat(row[10]),
                tfL3: JSON.parse(row[11]),
                tfL4: JSON.parse(row[12]),
                numSA: JSON.parse(row[13]),
                scoreSA: parseFloat(row[14]),
                saL3: JSON.parse(row[15]),
                saL4: JSON.parse(row[16])
              }
            });
          } catch(err) {}
        }
      }
      return createResponse("success", "OK", results);
    }

    // 3. Kiểm tra mật khẩu Quiz
    if (type === 'checkQuizPass') {
      const passInput = params.pass;
      const sheet = ss.getSheetByName("danhsach");
      const dbPass = sheet.getRange("H2").getValue().toString().trim();
      if (passInput === dbPass) return createResponse("success", "Hợp lệ");
      return createResponse("error", "Mật khẩu không chính xác");
    }

    // 4. Lấy dữ liệu Top 10
    if (type === 'getTop10') {
      const sheet = ss.getSheetByName("Top10Display");
      if (!sheet) return createResponse("error", "Sheet Top10Display không tìm thấy");
      const data = sheet.getDataRange().getValues();
      const topData = [];
      for (let i = 1; i < data.length && topData.length < 10; i++) {
        if (!data[i][0]) continue;
        topData.push({
          rank: topData.length + 1,
          name: data[i][0].toString(),
          score: data[i][1],
          time: data[i][2],
          phone: data[i][6] ? data[i][6].toString() : ""
        });
      }
      return createResponse("success", "OK", topData);
    }

    // 5. Thống kê đánh giá chi tiết
    if (type === 'getStats') {
      const counts = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
      const sheet = ss.getSheetByName("danhgia");
      let total = 0;
      let sum = 0;
      if (sheet) {
        const data = sheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
          const star = parseInt(data[i][1]);
          if (star >= 1 && star <= 5) {
            counts[star.toString()]++;
            sum += star;
            total++;
          }
        }
      }
      return createResponse("success", "OK", {
        average: total > 0 ? (sum / total).toFixed(1) : "5.0",
        total: total,
        counts: counts
      });
    }

    return createResponse("error", "Tham số type không hợp lệ");
  } catch (err) {
    return createResponse("error", err.toString());
  }
}

/**
 * Xử lý yêu cầu POST
 */
function doPost(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    const data = JSON.parse(e.postData.contents);
    const formatStr = (v) => v ? "'" + v.toString() : "";

    if (data.type === 'rating') {
      let sheet = ss.getSheetByName("danhgia") || ss.insertSheet("danhgia");
      sheet.appendRow([new Date(), data.stars, data.name, data.comment, formatStr(data.idNumber), data.taikhoanapp]);
      return createResponse("success", "Gửi đánh giá thành công");
    }

    if (data.type === 'quiz') {
      let sheet = ss.getSheetByName("ketquaQuiZ") || ss.insertSheet("ketquaQuiZ");
      sheet.appendRow([new Date(), data.examCode, data.name, data.className, data.school, formatStr(data.phoneNumber), data.score, data.totalTime, formatStr(data.stk), data.bank]);
      return createResponse("success", "Lưu kết quả Quiz thành công");
    }

    if (data.type === 'exam') {
      let sheet = ss.getSheetByName("ketqua") || ss.insertSheet("ketqua");
      sheet.appendRow([new Date(), data.examCode, formatStr(data.sbd), data.name, data.className, data.score, data.totalTime, JSON.stringify(data.details)]);
      return createResponse("success", "Lưu kết quả thi thành công");
    }

    return createResponse("error", "Dữ liệu POST không hợp lệ");
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

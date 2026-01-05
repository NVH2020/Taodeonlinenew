
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
    // 1. Xác minh thí sinh (Sửa lỗi: dùng type tường minh)
    if (type === 'verifyStudent') {
      const idNumber = params.idnumber;
      const sbd = params.sbd;
      const sheet = ss.getSheetByName("danhsach");
      if (!sheet) return createResponse("error", "Sheet danhsach không tồn tại");
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        // Cột A: idNumber (0), Cột B: SBD (1)
        if (data[i][0].toString().trim() === idNumber.trim() && data[i][1].toString().trim() === sbd.trim()) {
          return createResponse("success", "OK", {
            name: data[i][2],      // Cột C
            class: data[i][3],     // Cột D
            limit: data[i][4],     // Cột E (Số lần thi)
            limittab: data[i][5],  // Cột F (Giới hạn tab)
            taikhoanapp: data[i][6], // Cột G (Loại TK)
            idnumber: idNumber,
            sbd: sbd
          });
        }
      }
      return createResponse("error", "Thí sinh không tồn tại trên hệ thống!");
    }

    // 2. Lấy mã đề từ Ma trận (Sheet matran - Cấu trúc A-Q)
    if (type === 'getExamCodes') {
      const teacherId = params.idnumber;
      const sheet = ss.getSheetByName("matran");
      if (!sheet) return createResponse("error", "Sheet matran không tồn tại");
      const data = sheet.getDataRange().getValues();
      const results = [];

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        // Cột A: idNumber
        if (row[0].toString().trim() === teacherId.trim() || row[0].toString() === "SYSTEM") {
          try {
            results.push({
              code: row[1].toString(), // Cột B: makiemtra
              name: row[2].toString(), // Cột C: name
              topics: JSON.parse(row[3]), // Cột D: topics (JSON)
              fixedConfig: {
                duration: parseInt(row[4]), // Cột E
                numMC: JSON.parse(row[5]),  // Cột F
                scoreMC: parseFloat(row[6]),// Cột G
                mcL3: JSON.parse(row[7]),   // Cột H
                mcL4: JSON.parse(row[8]),   // Cột I
                numTF: JSON.parse(row[9]),  // Cột J
                scoreTF: parseFloat(row[10]),// Cột K
                tfL3: JSON.parse(row[11]),  // Cột L
                tfL4: JSON.parse(row[12]),  // Cột M
                numSA: JSON.parse(row[13]), // Cột N
                scoreSA: parseFloat(row[14]),// Cột O
                saL3: JSON.parse(row[15]),  // Cột P
                saL4: JSON.parse(row[16])   // Cột Q
              }
            });
          } catch(err) {
            console.error("Lỗi parse dữ liệu dòng " + (i+1));
          }
        }
      }
      return createResponse("success", "OK", results);
    }

    // 3. Kiểm tra mật khẩu Quiz (Sheet danhsach - ô H2)
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

    // 5. Thống kê đánh giá
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

// *End

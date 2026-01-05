
// Cấu hình ID Spreadsheet
const SPREADSHEET_ID = "1y7OmTFZxgdLgGUtoNpo7WTIVwJyeTVE9rzSzWaY_Btc";

/**
 * Xử lý yêu cầu GET
 */
function doGet(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const type = e.parameter.type;

  try {
    // 1. Lấy dữ liệu Top 10 từ sheet Top10Display
    if (type === 'getTop10') {
      const sheet = ss.getSheetByName("Top10Display");
      if (!sheet) return createResponse("error", "Sheet Top10Display không tồn tại");
      const data = sheet.getDataRange().getValues();
      const results = [];
      for (let i = 1; i < data.length && results.length < 10; i++) {
        if (!data[i][0]) continue;
        results.push({
          rank: results.length + 1,
          name: data[i][0].toString(),
          score: data[i][1],
          time: data[i][2],
          phone: data[i][6] ? data[i][6].toString().replace(/'/g, "") : ""
        });
      }
      return createResponse("success", "OK", results);
    }

    // 2. Lấy thống kê đánh giá sao
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

    // 3. Kiểm tra mật khẩu Quiz nhận quà (H2 sheet danhsach)
    if (type === 'checkQuizPass') {
      const passInput = e.parameter.pass;
      const sheet = ss.getSheetByName("danhsach");
      const dbPass = sheet.getRange("H2").getValue().toString().trim();
      return (passInput === dbPass) ? createResponse("success", "Valid") : createResponse("error", "Sai pass");
    }

    // 4. Lấy mã đề từ ma trận (Sheet matran) theo cấu trúc ảnh người dùng cung cấp
    if (type === 'getExamCodes') {
      const teacherId = e.parameter.idnumber;
      const sheet = ss.getSheetByName("matran");
      if (!sheet) return createResponse("error", "Sheet matran không tồn tại");
      const data = sheet.getDataRange().getValues();
      const codes = [];

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        // Lọc theo ID Giáo viên (Cột A)
        if (row[0].toString() === teacherId || row[0].toString() === "SYSTEM") {
          try {
            // Cấu trúc cột dựa trên ảnh:
            // A: idNumber, B: makiemtra, C: name, D: topics, E: duration
            // F: numMC, G: scoreMC, H: mcL3, I: mcL4
            // J: numTF, K: scoreTF, L: tfL3, M: tfL4
            // N: numSA, O: scoreSA, P: saL3, Q: saL4
            
            codes.push({
              code: row[1].toString(), // Cột B
              name: row[2].toString(), // Cột C
              topics: JSON.parse(row[3]), // Cột D (mảng JSON)
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
            console.error("Lỗi parse dòng " + (i+1) + ": " + err.message);
          }
        }
      }
      return createResponse("success", "OK", codes);
    }

    // 5. Xác minh thí sinh (Sheet danhsach)
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
            limit: data[i][4],     // Số lần thi
            limittab: data[i][5],  // Số lần chuyển tab
            taikhoanapp: data[i][6],
            idnumber: idNumber,
            sbd: sbd
          });
        }
      }
      return createResponse("error", "Không tìm thấy thí sinh với ID " + idNumber + " và SBD " + sbd);
    }

    return createResponse("error", "Yêu cầu không hợp lệ");
  } catch (err) {
    return createResponse("error", err.toString());
  }
}

/**
 * Xử lý yêu cầu POST (Lưu kết quả/Đánh giá)
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
      return createResponse("success", "OK");
    }

    if (data.type === 'quiz') {
      let sheet = ss.getSheetByName("ketquaQuiZ") || ss.insertSheet("ketquaQuiZ");
      sheet.appendRow([new Date(), data.examCode, data.name, data.className, data.school, formatStr(data.phoneNumber), data.score, data.totalTime, formatStr(data.stk), data.bank]);
      return createResponse("success", "OK");
    }

    if (data.type === 'exam') {
      let sheet = ss.getSheetByName("ketqua") || ss.insertSheet("ketqua");
      sheet.appendRow([new Date(), data.examCode, formatStr(data.sbd), data.name, data.className, data.score, data.totalTime, JSON.stringify(data.details)]);
      return createResponse("success", "OK");
    }

    return createResponse("error", "Type không xác định");
  } catch (err) {
    return createResponse("error", err.toString());
  } finally {
    lock.releaseLock();
  }
}

/**
 * Tạo JSON Response
 */
function createResponse(status, message, data) {
  const out = { status, message };
  if (data) out.data = data;
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

// *End


const SPREADSHEET_ID = "1y7OmTFZxgdLgGUtoNpo7WTIVwJyeTVE9rzSzWaY_Btc";

function doGet(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const type = e.parameter.type;

  // 1. Lấy thống kê đánh giá và TOP 10 Quiz thực tế
  if (type === 'getStats') {
    const stats = {
      ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      top10: []
    };

    // Thống kê sao từ sheet danhgia (Cột B - index 1)
    const sheetRate = ss.getSheetByName("danhgia");
    if (sheetRate) {
      const rateData = sheetRate.getDataRange().getValues();
      for (let i = 1; i < rateData.length; i++) {
        const star = parseInt(rateData[i][1]);
        if (star >= 1 && star <= 5) stats.ratings[star]++;
      }
    }

    // Lấy Top 10 Quiz từ sheet ketquaQuiZ
    const sheetQuiz = ss.getSheetByName("ketquaQuiZ");
    if (sheetQuiz) {
      const quizData = sheetQuiz.getDataRange().getValues();
      const results = [];
      for (let i = 1; i < quizData.length; i++) {
        results.push({
          name: quizData[i][2], // Cột C
          score: parseFloat(quizData[i][6]), // Cột G
          time: quizData[i][7], // Cột H
          phone: quizData[i][5].toString() // Cột F
        });
      }
      // Sắp xếp: Điểm cao trước, thời gian ít sau
      results.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.time.localeCompare(b.time);
      });
      stats.top10 = results.slice(0, 10).map((r, idx) => ({
        rank: idx + 1,
        ...r
      }));
    }

    return createResponse("success", "Lấy dữ liệu thành công", stats);
  }

  // 2. Xác minh thí sinh
  const idnumber = e.parameter.idnumber;
  const sbd = e.parameter.sbd;
  const sheetList = ss.getSheetByName("danhsach");
  
  if (!sheetList) return createResponse("error", "Không tìm thấy sheet 'danhsach'");

  const data = sheetList.getDataRange().getValues();
  const headers = data[0].map(h => h.toString().toLowerCase().trim());
  
  const idxSbd = headers.indexOf("sbd");
  const idxId = headers.indexOf("idnumber");
  const idxName = headers.indexOf("name");
  const idxClass = headers.indexOf("class");
  const idxLimit = headers.indexOf("limit");
  const idxLimittab = headers.indexOf("limittab");
  const idxTk = headers.indexOf("taikhoanapp");

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
  return createResponse("success", "Xác minh thành công", student);
}

function doPost(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    const data = JSON.parse(e.postData.contents);
    
    // Xử lý đánh giá: Timestamp, sosao, name, class, idNumber, taikhoanapp
    if (data.type === 'rating') {
      let sheetRate = ss.getSheetByName("danhgia");
      if (!sheetRate) {
        sheetRate = ss.insertSheet("danhgia");
        sheetRate.appendRow(["Timestamp", "sosao", "name", "class", "idNumber", "taikhoanapp"]);
      }
      sheetRate.appendRow([
        new Date(), 
        data.stars, 
        data.name, 
        data.class, 
        data.idNumber, 
        data.taikhoanapp
      ]);
      return createResponse("success", "Lưu đánh giá thành công");
    }

    // Xử lý lưu kết quả QuiZ vào sheet riêng
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
        ""
      ]);
      return createResponse("success", "Lưu kết quả Quiz thành công");
    }

    // Xử lý lưu kết quả thi (Exam) vào sheet ketqua
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

    return createResponse("success", "Lưu kết quả thi thành công");
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
// Hàm thực hiện việc xóa dữ liệu
function resetWeeklyQuiz() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetQuiz = ss.getSheetByName("ketquaQuiZ");
  
  if (sheetQuiz) {
    const lastRow = sheetQuiz.getLastRow();
    if (lastRow > 1) {
      // Giữ lại hàng tiêu đề (hàng 1), xóa toàn bộ từ hàng 2
      sheetQuiz.deleteRows(2, lastRow - 1);
      console.log("Đã tự động reset bảng xếp hạng tuần vào đêm Chủ Nhật.");
    }
  }
}

// Hàm tạo Trigger tự động (Bạn chỉ cần chọn và nhấn Chạy hàm này 1 lần duy nhất)
function createWeeklySundayTrigger() {
  // Xóa các trigger cũ cùng tên để tránh chạy trùng lặp
  const allTriggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < allTriggers.length; i++) {
    if (allTriggers[i].getHandlerFunction() === 'resetWeeklyQuiz') {
      ScriptApp.deleteTrigger(allTriggers[i]);
    }
  }
  
  // Tạo lịch: Chạy vào Chủ Nhật hàng tuần, trong khoảng từ 23h - 00h
  ScriptApp.newTrigger('resetWeeklyQuiz')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(23)
    .nearMinute(59) 
    .create();
}

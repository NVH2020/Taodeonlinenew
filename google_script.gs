
const SPREADSHEET_ID = "1y7OmTFZxgdLgGUtoNpo7WTIVwJyeTVE9rzSzWaY_Btc";

function doGet(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const type = e.parameter.type;

  // 1. Lấy thống kê đánh giá và TOP 10
  if (type === 'getStats') {
    const stats = {
      ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      top10: []
    };

    // Thống kê sao
    const sheetRate = ss.getSheetByName("danhgia");
    if (sheetRate) {
      const rateData = sheetRate.getDataRange().getValues();
      for (let i = 1; i < rateData.length; i++) {
        const star = parseInt(rateData[i][2]);
        if (star >= 1 && star <= 5) stats.ratings[star]++;
      }
    }

    // Lấy Top 10 Quiz
    const sheetQuiz = ss.getSheetByName("ketquaQuiZ");
    if (sheetQuiz) {
      const quizData = sheetQuiz.getDataRange().getValues();
      const results = [];
      for (let i = 1; i < quizData.length; i++) {
        results.push({
          name: quizData[i][2],
          score: parseFloat(quizData[i][6]),
          time: quizData[i][7],
          phone: quizData[i][5].toString()
        });
      }
      // Sắp xếp: điểm cao trước, thời gian ít sau
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

  // 2. Xác minh thí sinh (giữ nguyên logic cũ)
  const idnumber = e.parameter.idnumber;
  const sbd = e.parameter.sbd;
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
    
    if (data.type === 'rating') {
      let sheetRate = ss.getSheetByName("danhgia");
      if (!sheetRate) {
        sheetRate = ss.insertSheet("danhgia");
        sheetRate.appendRow(["Timestamp", "Phone", "Stars", "Comment"]);
      }
      sheetRate.appendRow([new Date(), data.phone, data.stars, data.comment]);
      return createResponse("success", "Cảm ơn bạn đã đánh giá!");
    }

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

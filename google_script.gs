
const SPREADSHEET_ID = "1y7OmTFZxgdLgGUtoNpo7WTIVwJyeTVE9rzSzWaY_Btc";

/**
 * Hàm xóa dữ liệu Quiz vào 23:59 Chủ Nhật hàng tuần.
 */
function clearWeeklyQuizData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("ketquaQuiZ");
  if (sheet && sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
}

function doGet(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const type = e.parameter.type;

  // 1. Lấy dữ liệu Top 10 từ sheet Top10Display
  if (type === 'getTop10') {
    const sheet = ss.getSheetByName("Top10Display");
    if (!sheet) return createResponse("error", "Không tìm thấy sheet Top10Display");
    const data = sheet.getDataRange().getValues();
    const results = [];
    for (let i = 1; i < data.length; i++) {
      results.push({
        rank: i,
        name: data[i][0], // Cột A
        score: data[i][1], // Cột B
        time: data[i][2], // Cột C
        phone: data[i][6] ? data[i][6].toString() : "" // Cột G
      });
    }
    return createResponse("success", "Thành công", results);
  }

  // 2. Lấy thống kê đánh giá
  if (type === 'getStats') {
    const stats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const sheet = ss.getSheetByName("danhgia");
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        const star = parseInt(data[i][1]);
        if (star >= 1 && star <= 5) stats[star]++;
      }
    }
    return createResponse("success", "Thành công", stats);
  }

  // 3. Đăng nhập
  if (type === 'login') {
    const phone = e.parameter.phone;
    const pass = e.parameter.pass;
    const sheet = ss.getSheetByName("thongtintk");
    if (!sheet) return createResponse("error", "Hệ thống chưa có dữ liệu tài khoản");
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][1].toString() === phone && data[i][2].toString() === pass) {
        return createResponse("success", "Đăng nhập thành công", {
          name: data[i][0],
          phone: data[i][1],
          isVip: data[i][3] === "VIP"
        });
      }
    }
    return createResponse("error", "Sai số điện thoại hoặc mật khẩu");
  }

  // 4. Xác minh thí sinh
  const idnumber = e.parameter.idnumber;
  const sbd = e.parameter.sbd;
  const sheetList = ss.getSheetByName("danhsach");
  if (!sheetList) return createResponse("error", "Không tìm thấy sheet danhsach");
  const dataList = sheetList.getDataRange().getValues();
  for (let i = 1; i < dataList.length; i++) {
    if (dataList[i][1].toString() === idnumber && dataList[i][0].toString() === sbd) {
      return createResponse("success", "Xác minh thành công", {
        sbd: dataList[i][0].toString(),
        name: dataList[i][2],
        class: dataList[i][3],
        limit: dataList[i][4],
        limittab: dataList[i][5],
        idnumber: dataList[i][1].toString(),
        taikhoanapp: dataList[i][6] || "Free"
      });
    }
  }
  return createResponse("error", "Thông tin SBD hoặc ID không khớp!");
}

function doPost(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    const data = JSON.parse(e.postData.contents);

    // Xử lý mất số 0 bằng cách thêm dấu '
    const formatPhone = (p) => p ? "'" + p.toString() : "";

    if (data.type === 'register') {
      let sheet = ss.getSheetByName("thongtintk");
      if (!sheet) {
        sheet = ss.insertSheet("thongtintk");
        sheet.appendRow(["Họ tên", "Số điện thoại", "Mật khẩu", "Trạng thái"]);
      }
      sheet.appendRow([data.name, formatPhone(data.phone), data.pass, "Free"]);
      return createResponse("success", "Đăng ký thành công");
    }

    if (data.type === 'vip') {
      let sheet = ss.getSheetByName("VIP");
      if (!sheet) sheet = ss.insertSheet("VIP");
      sheet.appendRow([new Date(), formatPhone(data.phone), "Yêu cầu nâng cấp VIP"]);
      return createResponse("success", "Đã gửi yêu cầu VIP");
    }

    if (data.type === 'rating') {
      let sheet = ss.getSheetByName("danhgia");
      if (!sheet) sheet = ss.insertSheet("danhgia");
      sheet.appendRow([new Date(), data.stars, data.name, data.comment, formatPhone(data.idNumber), data.taikhoanapp]);
      return createResponse("success", "OK");
    }

    if (data.type === 'quiz') {
      let sheet = ss.getSheetByName("ketquaQuiZ");
      if (!sheet) sheet = ss.insertSheet("ketquaQuiZ");
      sheet.appendRow([new Date(), data.examCode, data.name, data.className, data.school, formatPhone(data.phoneNumber), data.score, data.totalTime, formatPhone(data.stk), data.bank]);
      return createResponse("success", "OK");
    }

    if (data.type === 'exam') {
      let sheet = ss.getSheetByName("ketqua");
      if (!sheet) sheet = ss.insertSheet("ketqua");
      sheet.appendRow([new Date(), data.examCode, formatPhone(data.sbd), data.name, data.className, data.score, data.totalTime, JSON.stringify(data.details)]);
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

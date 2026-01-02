
const SPREADSHEET_ID = "1y7OmTFZxgdLgGUtoNpo7WTIVwJyeTVE9rzSzWaY_Btc";

/**
 * Hàm xóa dữ liệu Quiz vào 23:59 Chủ Nhật hàng tuần.
 * Tự động dọn dẹp để bắt đầu tuần mới.
 */
function clearWeeklyQuizData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("ketquaQuiZ");
  if (sheet && sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
    console.log("Đã dọn dẹp bảng ketquaQuiZ hàng tuần.");
  }
}

function doGet(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const type = e.parameter.type;

  try {
    // 1. Lấy dữ liệu Top 10 từ sheet Top10Display
    if (type === 'getTop10') {
      const sheet = ss.getSheetByName("Top10Display");
      if (!sheet) return createResponse("error", "Không tìm thấy sheet Top10Display");
      const data = sheet.getDataRange().getValues();
      const results = [];
      // Lấy từ dòng 2 (index 1)
      for (let i = 1; i < data.length; i++) {
        if (!data[i][0]) continue; // Bỏ qua dòng trống
        results.push({
          rank: i,
          name: data[i][0], // Cột A: Tên
          score: data[i][1], // Cột B: Điểm
          time: data[i][2], // Cột C: Thời gian
          phone: data[i][6] ? data[i][6].toString() : "" // Cột G: SĐT
        });
      }
      return createResponse("success", "Thành công", results);
    }

    // 2. Lấy thống kê đánh giá từ sheet danhgia
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

    // 3. Đăng nhập - So khớp sheet thongtintk
    if (type === 'login') {
      const phone = e.parameter.phone;
      const pass = e.parameter.pass;
      const sheet = ss.getSheetByName("thongtintk");
      if (!sheet) return createResponse("error", "Hệ thống chưa có dữ liệu tài khoản");
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        const dbPhone = data[i][1].toString().replace(/'/g, "");
        if (dbPhone === phone && data[i][2].toString() === pass) {
          return createResponse("success", "Đăng nhập thành công", {
            name: data[i][0],
            phone: dbPhone,
            isVip: data[i][3] === "VIP"
          });
        }
      }
      return createResponse("error", "Số điện thoại hoặc mật khẩu không đúng!");
    }

    // 4. Xác minh thí sinh thi chính thức (Sheet danhsach)
    if (e.parameter.idnumber && e.parameter.sbd) {
      const idnumber = e.parameter.idnumber;
      const sbd = e.parameter.sbd;
      const sheetList = ss.getSheetByName("danhsach");
      if (!sheetList) return createResponse("error", "Không tìm thấy sheet danhsach");
      const dataList = sheetList.getDataRange().getValues();
      for (let i = 1; i < dataList.length; i++) {
        const dbId = dataList[i][1].toString().replace(/'/g, "");
        const dbSbd = dataList[i][0].toString().replace(/'/g, "");
        if (dbId === idnumber && dbSbd === sbd) {
          return createResponse("success", "Xác minh thành công", {
            sbd: dbSbd,
            name: dataList[i][2],
            class: dataList[i][3],
            limit: dataList[i][4],
            limittab: dataList[i][5],
            idnumber: dbId,
            taikhoanapp: dataList[i][6] || "Free"
          });
        }
      }
      return createResponse("error", "Thông tin SBD hoặc ID không khớp!");
    }

    return createResponse("error", "Yêu cầu không hợp lệ");
  } catch (err) {
    return createResponse("error", "Lỗi máy chủ: " + err.toString());
  }
}

function doPost(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    const data = JSON.parse(e.postData.contents);
    const formatValue = (v) => v ? "'" + v.toString() : "";

    // A. Đăng ký tài khoản mới (Sheet thongtintk)
    if (data.type === 'register') {
      let sheet = ss.getSheetByName("thongtintk");
      if (!sheet) {
        sheet = ss.insertSheet("thongtintk");
        sheet.appendRow(["Họ tên", "Số điện thoại", "Mật khẩu", "Trạng thái"]);
      }
      sheet.appendRow([data.name, formatValue(data.phone), data.pass, "Free"]);
      return createResponse("success", "Đăng ký thành công");
    }

    // B. Yêu cầu nâng cấp VIP (Sheet VIP)
    if (data.type === 'vip') {
      let sheetVip = ss.getSheetByName("VIP");
      if (!sheetVip) {
        sheetVip = ss.insertSheet("VIP");
        sheetVip.appendRow(["Thời gian", "SĐT", "Trạng thái"]);
      }
      sheetVip.appendRow([new Date(), formatValue(data.phone), "Đang chờ duyệt"]);
      return createResponse("success", "Đã gửi yêu cầu VIP");
    }

    // C. Đánh giá Web (Sheet danhgia)
    if (data.type === 'rating') {
      let sheet = ss.getSheetByName("danhgia");
      if (!sheet) {
        sheet = ss.insertSheet("danhgia");
        sheet.appendRow(["Thời gian", "Số sao", "Tên", "Nhận xét", "ID/SĐT", "Loại TK"]);
      }
      sheet.appendRow([new Date(), data.stars, data.name, data.comment, formatValue(data.idNumber), data.taikhoanapp]);
      return createResponse("success", "Cảm ơn bạn đã đánh giá");
    }

    // D. Lưu kết quả QUIZ (Sheet ketquaQuiZ)
    if (data.type === 'quiz') {
      let sheet = ss.getSheetByName("ketquaQuiZ");
      if (!sheet) {
        sheet = ss.insertSheet("ketquaQuiZ");
        sheet.appendRow(["Thời gian", "Mã Quiz", "Họ tên", "Lớp", "Trường", "SĐT", "Điểm", "Thời gian làm", "STK", "Bank"]);
      }
      sheet.appendRow([
        new Date(), 
        data.examCode, 
        data.name, 
        data.className, 
        data.school, 
        formatValue(data.phoneNumber), 
        data.score, 
        data.totalTime, 
        formatValue(data.stk), 
        data.bank
      ]);
      return createResponse("success", "Đã lưu kết quả Quiz");
    }

    // E. Lưu kết quả KIỂM TRA (Sheet ketqua)
    if (data.type === 'exam') {
      let sheet = ss.getSheetByName("ketqua");
      if (!sheet) {
        sheet = ss.insertSheet("ketqua");
        sheet.appendRow(["Thời gian", "Mã đề", "SBD", "Họ tên", "Lớp", "Điểm", "Thời gian làm", "Vi phạm", "Chi tiết"]);
      }
      sheet.appendRow([
        new Date(), 
        data.examCode, 
        formatValue(data.sbd), 
        data.name, 
        data.className, 
        data.score, 
        data.totalTime, 
        data.tabSwitches, 
        JSON.stringify(data.details)
      ]);
      return createResponse("success", "Đã lưu kết quả kiểm tra");
    }

    return createResponse("error", "Loại dữ liệu POST không hợp lệ");
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

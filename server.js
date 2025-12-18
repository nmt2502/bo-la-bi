import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import { buildPattern, duDoanTheoThuatToan } from "./thuattoan.js";

const app = express();
const PORT = 3000;

const API_LICH_SU = "https://sunwin-ai-bot.onrender.com/api/taixiu/history";
const FILE_THONG_KE = "./thongke.json";
const FILE_LAST_PREDICT = "./last_prediction.json";

/* ===== TIỆN ÍCH ===== */
function today() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function loadJSON(file, def) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(def, null, 2));
  }
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}
function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

/* ===== XỬ LÝ ===== */
async function xuLy() {
  const res = await fetch(API_LICH_SU);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Không có dữ liệu lịch sử");
  }

  /* ===== LOAD THỐNG KÊ ===== */
  let thongKe = loadJSON(FILE_THONG_KE, {
    NGAY: today(),
    TONG_THANG: 0,
    TONG_THUA: 0,
    PHIEN_DA_TINH: null
  });

  /* ===== RESET MỖI NGÀY ===== */
  if (thongKe.NGAY !== today()) {
    thongKe = {
      NGAY: today(),
      TONG_THANG: 0,
      TONG_THUA: 0,
      PHIEN_DA_TINH: null
    };
    saveJSON(FILE_THONG_KE, thongKe);
  }

  const lastPredict = loadJSON(FILE_LAST_PREDICT, {
    PHIEN: null,
    DU_DOAN: null
  });

  const phienTruoc = data[0];
  const phienHienTai = phienTruoc.session + 1;

  /* ===== PATTERN ===== */
  const chuoiTX = data.map(i => i.tx);
  const pattern = buildPattern(chuoiTX);

  /* ===== DỰ ĐOÁN MỚI ===== */
  const duDoanMoi = duDoanTheoThuatToan(pattern);

  /* ===== ĐÁNH GIÁ PHIÊN TRƯỚC ===== */
  let danhGia = "Chờ Kết Quả";

  const duDieuKienTinh =
    lastPredict.PHIEN === phienTruoc.session &&
    phienTruoc.result &&
    thongKe.PHIEN_DA_TINH !== phienTruoc.session;

  if (duDieuKienTinh) {
    const thang =
      lastPredict.DU_DOAN.toLowerCase() ===
      phienTruoc.result.toLowerCase();

    if (thang) thongKe.TONG_THANG++;
    else thongKe.TONG_THUA++;

    thongKe.PHIEN_DA_TINH = phienTruoc.session;
    saveJSON(FILE_THONG_KE, thongKe);

    danhGia = thang ? "Thắng" : "Thua";
  }

  /* ===== LƯU DỰ ĐOÁN CHO PHIÊN HIỆN TẠI ===== */
  saveJSON(FILE_LAST_PREDICT, {
    PHIEN: phienHienTai,
    DU_DOAN: duDoanMoi.DU_DOAN
  });

  return {
    PHIEN_HIEN_TAI: {
      PHIÊN: phienHienTai,
      DU_DOAN: duDoanMoi.DU_DOAN,
      DO_TIN_CAY: duDoanMoi.DO_TIN_CAY,
      DANH_GIA: "Chờ Kết Quả",
      PATTERN: pattern,
      THUAT_TOAN: duDoanMoi.THUAT_TOAN
    },
    PHIEN_TRUOC: {
      PHIÊN: phienTruoc.session,
      DU_DOAN: lastPredict.DU_DOAN,
      XUC_XAC: phienTruoc.dice,
      KET_QUA: phienTruoc.result,
      DANH_GIA: danhGia
    },
    THONG_KE: thongKe
  };
}

/* ===== API ===== */
app.get("/api/du-doan", async (req, res) => {
  try {
    res.json(await xuLy());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server chạy http://localhost:${PORT}`);
});

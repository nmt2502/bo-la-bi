import fs from "fs";

const raw = fs.readFileSync("./thuattoan.json", "utf-8");
const DATA = JSON.parse(raw);

const MAP = DATA.PREDICTION_MAP || {};
const DO_DAI = DATA.DO_DAI_PATTERN || 8;

/**
 * Build PATTERN
 * - lấy từ dưới đi lên
 * - trái → phải
 */
export function buildPattern(lichSu) {
  if (!Array.isArray(lichSu)) return "";

  return lichSu
    .slice(0, DO_DAI)
    .reverse()
    .join("");
}

/**
 * Dự đoán theo thuật toán
 */
export function duDoanTheoThuatToan(pattern) {
  if (!pattern || pattern.length < DO_DAI) {
    return {
      DU_DOAN: "Tài",
      DO_TIN_CAY: 50,
      THUAT_TOAN: "MAC_DINH"
    };
  }

  const kq = MAP[pattern];

  if (kq) {
    return {
      DU_DOAN: kq,
      DO_TIN_CAY: 75,
      THUAT_TOAN: DATA.TEN_THUAT_TOAN
    };
  }

  return {
    DU_DOAN: "Tài",
    DO_TIN_CAY: 50,
    THUAT_TOAN: "KHONG_KHOP_PATTERN"
  };
}

const bookingStatus: Record<string, string> = {
  pending: "รออนุมัติ",
  accepted: "ยืนยันแล้ว",
  completed: "เสร็จสิ้น",
  rejected: "ปฏิเสธแล้ว",
  cancelled: "ยกเลิกแล้ว",
};

const goals: Record<string, string> = {
  weight_loss: "ลดน้ำหนัก",
  muscle_gain: "เพิ่มกล้ามเนื้อ",
  body_recomposition: "ปรับรูปร่าง",
  strength_training: "เพิ่มความแข็งแรง",
  general_fitness: "สุขภาพทั่วไป",
};

const levels: Record<string, string> = {
  beginner: "เริ่มต้น",
  intermediate: "ปานกลาง",
  advanced: "ชำนาญ",
  any: "ทุกระดับ",
};

const styles: Record<string, string> = {
  strict: "เข้มงวด",
  supportive: "ให้กำลังใจ",
  analytical: "วิเคราะห์ละเอียด",
  flexible: "ยืดหยุ่น",
};

const modalities: Record<string, string> = {
  gym: "ฟิตเนส",
  home: "ที่บ้าน",
  online: "ออนไลน์",
};

export function bookingStatusTh(value: string | null | undefined) {
  if (!value) return "-";
  return bookingStatus[value] ?? value;
}

export function goalTh(value: string | null | undefined) {
  if (!value) return "ยังไม่ได้ตั้งค่า";
  return goals[value] ?? value.replaceAll("_", " ");
}

export function levelTh(value: string | null | undefined) {
  if (!value) return "-";
  return levels[value] ?? value;
}

export function styleTh(value: string | null | undefined) {
  if (!value) return "-";
  return styles[value] ?? value;
}

export function modalityTh(value: string | null | undefined) {
  if (!value) return "-";
  return modalities[value] ?? value;
}

import { Check, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

interface StreakCalendarProps {
  trackedDays: number[];
  pointDates: number[];
  currentMonth: Date;
}

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const THAI_DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const StreakCalendar = ({ trackedDays, pointDates, currentMonth: initialMonth }: StreakCalendarProps) => {
  const [viewDate, setViewDate] = useState(initialMonth);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // Calculate streaks
  const sortedDays = [...trackedDays].sort((a, b) => a - b);
  let streakCount = 0;
  let consecutiveDays = 0;
  const pointDays: number[] = [];

  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0 || sortedDays[i] === sortedDays[i - 1] + 1) {
      consecutiveDays++;
    } else {
      consecutiveDays = 1;
    }
    if (consecutiveDays % 3 === 0) {
      streakCount++;
      pointDays.push(sortedDays[i]);
    }
  }

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="w-full">
      {/* 1. ส่วนหัวเดือนและปี (ดีไซน์เดิม) */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="p-2 text-muted-foreground/50 hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="font-heading text-lg font-bold text-foreground">
          {THAI_MONTHS[month]} {year + 543}
        </h3>
        <button onClick={nextMonth} className="p-2 text-muted-foreground/50 hover:text-foreground">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* 2. หัวข้อวันในสัปดาห์ */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {THAI_DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground opacity-70 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* 3. ตารางวันที่ */}
      <div className="grid grid-cols-7 gap-y-3 gap-x-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />;

          const isTracked = trackedDays.includes(day);
          const isPointDay = pointDates.includes(day);
          const isToday = isCurrentMonth && day === today.getDate();

          return (
            <div key={day} className="relative flex justify-center items-center h-10 w-full">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                // ✅ ขั้นตอนที่ 1: กำหนดให้กรอบเป็น relative เพื่อให้ดาวยึดตามขอบนี้
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                  isTracked
                    ? "bg-[hsl(155,45%,45%)]/20 text-[hsl(155,45%,45%)]" 
                    : isToday
                    ? "bg-[hsl(154,49%,67%)] text-white" 
                    : "text-muted-foreground/80"
                }`}
              >
                {isTracked ? <Check className="h-5 w-5 stroke-[3]" /> : <span>{day}</span>}
                
                {/* ✅ ขั้นตอนที่ 2: จัดวางดาวให้ติดมุมขวาบน และใช้ค่าลบเล็กน้อยเพื่อให้ดาวเกาะอยู่บนขอบพอดี */}
                {isPointDay && (
                  <div className="absolute -top-1.5 -right-1.5 z-10 pointer-events-none">
                    <Star 
                      className="h-5 w-5 fill-yellow-400 text-yellow-500 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" 
                    />
                  </div>
                )}
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* 4. สรุปผลด้านล่าง (ตามดีไซน์ image_f5f8ba.png) */}
      <div className="mt-8 flex items-center justify-between rounded-2xl border border-muted bg-muted/10 px-5 py-4">
        <span className="text-sm font-medium text-muted-foreground">
          บันทึกแล้ว <span className="text-foreground font-bold">{trackedDays.length}</span> วัน
        </span>
        <div className="flex items-center gap-1.5 text-sm font-bold text-[hsl(155,45%,45%)]">
          <Star className="h-4 w-4 fill-current" />
          <span>{pointDates.length} แต้ม</span>
        </div>
      </div>
    </div>
  );
};

export default StreakCalendar;
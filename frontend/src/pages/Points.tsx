import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Trophy, Star, Calendar as CalendarIcon } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import api from "@/lib/axios";

const Points = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<string[]>([]); // เก็บเฉพาะวันที่ ["2024-03-01", ...]
  const [points, setPoints] = useState(0);
  const [pointDates, setPointDates] = useState<number[]>([]); // วันที่จะโชว์ดาวในเดือนนั้น
  const [isLoading, setIsLoading] = useState(true);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setPoints(user.total_points || 0);

      const res = await api.get("/index.php?page=food-log&action=daily_all");
      if (res.data.status === "success" && Array.isArray(res.data.data)) {
        const allLogs = res.data.data;
        
        // 1. ดึงวันที่บันทึกอาหาร (สำหรับมาร์คสีเขียว)
        const loggedDatesStr = allLogs
          .filter((log: any) => log.total_sodium_daily > 0)
          .map((log: any) => log.log_date);
        setLogs(loggedDatesStr);

        const tempPointDates: number[] = [];
        const uniqueDaysCumulative = new Set<string>();

        // 🌟 เพิ่มลอจิก: ดาวจาก Pretest (เช็คจาก user object ใน localStorage)
        if (Number(user.pretest_done) === 1 && user.updated_at) {
          const testDate = new Date(user.updated_at.replace(/-/g, "/"));
          if (testDate.getMonth() === currentMonth && testDate.getFullYear() === currentYear) {
            tempPointDates.push(testDate.getDate()); // เพิ่มดาวในวันทำ Pretest
          }
        }

        // 🌟 เพิ่มลอจิก: ดาวจาก Posttest
        if (Number(user.posttest_done) === 1) {
          // สามารถเพิ่มเงื่อนไขแสดงดาววันทำ Posttest ได้ในลักษณะเดียวกัน
        }

        // 2. คำนวณดาวจากการบันทึกอาหาร (ทุก 3 วันสะสม)
        const sortedLogs = [...allLogs].sort((a, b) => a.log_date.localeCompare(b.log_date));
        sortedLogs.forEach((log: any) => {
          if (log.total_sodium_daily <= 0) return;
          const dateKey = log.log_date;
          if (!uniqueDaysCumulative.has(dateKey)) {
            uniqueDaysCumulative.add(dateKey);
            if (uniqueDaysCumulative.size % 3 === 0) {
              const d = new Date(dateKey);
              if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                tempPointDates.push(d.getDate());
              }
            }
          }
        });

        setPointDates(tempPointDates);
      }
    } catch (error) {
      console.error("Failed to fetch points data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // สร้าง Array สำหรับวาดปฏิทิน (ป้องกัน Error .map is not a function)
  const numDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: numDays }, (_, i) => i + 1);
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <PageLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-20">
        
        {/* 1. ส่วนบอกวันที่ปัจจุบัน (ตามโจทย์ข้อ 1) */}
        <div className="flex items-center gap-3 px-2">
          <div className="bg-primary/10 p-2.5 rounded-2xl text-primary">
            <CalendarIcon size={20} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Today</p>
            <p className="text-sm font-black text-foreground">
              {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Header แต้มสะสม */}
        <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-3xl p-8 text-white text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20"><Trophy size={80} /></div>
          <div className="relative z-10">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30">
              <Trophy className="text-white" size={32} />
            </div>
            <p className="text-sm font-bold opacity-90 mb-1 uppercase tracking-widest">แต้มสะสมปัจจุบัน</p>
            <div className="flex items-end justify-center gap-2">
              <span className="text-6xl font-black">{points}</span>
              <span className="text-xl font-bold mb-2">แต้ม</span>
            </div>
          </div>
        </div>

        {/* ปฏิทินสะสมแต้ม */}
        <div className="glass-card rounded-3xl p-6 shadow-xl border border-white/20 bg-white/50">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-base font-bold flex items-center gap-2">
              <Star className="text-orange-500 fill-orange-500" size={18} /> ตารางสะสมแต้ม
            </h2>
            <div className="flex items-center gap-4 bg-secondary/50 px-3 py-1.5 rounded-xl">
              <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1))} className="hover:text-primary"><ChevronLeft size={20}/></button>
              <span className="text-sm font-bold min-w-[100px] text-center">
                {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1))} className="hover:text-primary"><ChevronRight size={20}/></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-muted-foreground py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {blanks.map(i => <div key={`b-${i}`} />)}
            {/* ใช้ daysArray.map แทน daysInMonth.map เพื่อแก้ Error หน้าขาว */}
            {daysArray.map((d) => {
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              
              // ข้อ 2: มาร์คสีเขียวถ้ามีการบันทึก
              const isTracked = logs.includes(dateStr); 
              
              // ข้อ 3: แสดงดาวถ้าเป็นวันที่ครบทุก 3 ครั้ง
              const showStar = pointDates.includes(d);

              return (
                <div key={d} className="relative aspect-square p-1">
                  <div className={`w-full h-full rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isTracked 
                      ? "bg-emerald-500 text-white font-bold shadow-md scale-105" 
                      : "bg-secondary/30 text-muted-foreground/40"
                  }`}>
                    <span className="text-xs">{d}</span>
                    {showStar && (
                      <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm"
                      >
                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* คำอธิบายสัญลักษณ์ */}
          <div className="mt-6 pt-4 border-t border-border/50 flex flex-wrap gap-4 text-[10px] text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span>บันทึกอาหารแล้ว</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-white border border-gray-200 flex items-center justify-center">
                <Star size={8} className="text-yellow-400 fill-yellow-400" />
              </div>
              <span>ได้รับดาว (สะสมครบ 3 วัน)</span>
            </div>
          </div>
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default Points;

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import api from "@/lib/axios";
import NoData from "@/components/NoData";

const limit = 2000;

const WeeklyTracking = () => {
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWeekly = async () => {
      try {
        setIsLoading(true);
        // 🌟 ดึง ID จาก LocalStorage เพื่อใช้ยืนยันตัวตนบนมือถือ
        const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = savedUser.user_id;

        if (!userId) {
          console.warn("User ID not found in localStorage");
          setIsLoading(false);
          return;
        }

        // 🌟 ส่ง user_id แนบไปกับ Query String
        const res = await api.get(`/index.php?page=food-log&action=weekly&user_id=${userId}`);
        
        if (res.data.status === "success") {
          const formatted = res.data.data.map((d: any) => {
            // แก้ปัญหาการ Parse วันที่ให้รองรับ Safari/iOS
            const dateObj = new Date(d.log_date.replace(/-/g, "/"));
            return {
              date: d.log_date.split('-')[2],
              month: dateObj.toLocaleDateString('th-TH', { month: 'short' }),
              sodium: Number(d.total_sodium_daily)
            };
          });
          setWeeklyData(formatted);
        }
      } catch (error) {
        console.error("Fetch weekly failed", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWeekly();
  }, []);

  const totalWeekly = weeklyData.reduce((sum, d) => sum + d.sodium, 0);

  return (
    <PageLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h2 className="font-heading text-lg font-bold text-foreground">
          สถิติโซเดียมรายสัปดาห์
        </h2>

        {/* แสดง NoData เฉพาะตอนที่โหลดเสร็จแล้วแต่ไม่มีข้อมูลจริงๆ */}
        {!isLoading && weeklyData.length === 0 && (
          <div className="py-10">
            <NoData />
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 text-center text-muted-foreground animate-pulse italic">
            กำลังดึงข้อมูลรายสัปดาห์...
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {!isLoading && weeklyData.map((day, i) => {
            const isOver = day.sodium > limit;
            return (
              <motion.div
                key={`${day.date}-${i}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card flex items-center gap-3 rounded-2xl p-4 shadow-sm border border-border/40"
              >
                <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-primary/10">
                  <span className="text-[10px] font-bold text-primary">{day.month}</span>
                  <span className="font-heading text-lg font-bold text-primary">{day.date}</span>
                </div>
                <div className="flex-1">
                  <p className="font-heading font-bold text-foreground">
                    {day.sodium.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">mg</span>
                  </p>
                  <div className="flex items-center gap-1.5">
                     <div className={`h-2 w-2 rounded-full ${isOver ? "bg-destructive" : "bg-emerald-500"}`} />
                     <p className={`text-xs font-semibold ${isOver ? "text-destructive" : "text-emerald-600"}`}>
                        {isOver ? "เกินเป้าหมาย" : "อยู่ในเกณฑ์"}
                     </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Total bar */}
        {!isLoading && weeklyData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between rounded-2xl p-5 shadow-lg"
            style={{ background: "linear-gradient(135deg, #FFB800 0%, #FF8A00 100%)" }}
          >
            <div>
              <p className="text-xs font-bold text-white/80 uppercase tracking-wider">รวมสัปดาห์นี้</p>
              <p className="font-heading text-xl font-black text-white">
                {totalWeekly.toLocaleString()} mg
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
               <span className="text-white font-bold">{weeklyData.length}ว.</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </PageLayout>
  );
};

export default WeeklyTracking;

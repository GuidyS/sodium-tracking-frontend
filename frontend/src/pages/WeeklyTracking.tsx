import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import api from "@/lib/axios";
import NoData from "@/components/NoData";

const limit = 2000;

const WeeklyTracking = () => {
  
  const [weeklyData, setWeeklyData] = useState<any[]>([]);

  useEffect(() => {
    const fetchWeekly = async () => {
      const res = await api.get("/index.php?page=food-log&action=weekly");
      if (res.data.status === "success") {
        const formatted = res.data.data.map((d: any) => ({
          date: d.log_date.split('-')[2],
          month: "มีนา", // หรือทำตัวแปลงเดือน
          sodium: Number(d.total_sodium_daily)
        }));
        setWeeklyData(formatted);
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
          อาหารที่คุณรับประทานไปวันนี้
        </h2>

        <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <NoData />
            </div>
          {weeklyData.map((day, i) => {
            const isOver = day.sodium > limit;
            return (
              <motion.div
                key={`${day.date}-${i}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card flex items-center gap-3 rounded-2xl p-4 shadow-sm"
              >
                <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-secondary">
                  <span className="text-[10px] font-bold text-muted-foreground">{day.month}</span>
                  <span className="font-heading text-lg font-bold text-foreground">{day.date}</span>
                </div>
                <div>
                  <p className="font-heading font-bold text-foreground">
                    {day.sodium.toLocaleString()} mg
                  </p>
                  <p className={`text-xs font-semibold ${isOver ? "text-destructive" : "text-accent"}`}>
                    {isOver ? "เกินเป้าหมาย" : "อยู่ในเกณฑ์"}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Total bar */}
        {weeklyData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex items-center justify-between rounded-2xl p-5 shadow-lg"
            style={{ background: "linear-gradient(135deg, hsl(45 90% 55%), hsl(25 85% 55%))" }}
          >
            <p className="font-heading text-lg font-bold text-white">รวม</p>
            <p className="font-heading text-xl font-bold text-white">
              {totalWeekly.toLocaleString()} mg
            </p>
          </motion.div>
        )}
      </motion.div>
    </PageLayout>
  );
};

export default WeeklyTracking;

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from "recharts";
import PageLayout from "@/components/PageLayout";
import api from "@/lib/axios";

const Stats = () => {

  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const res = await api.get("/index.php?page=food-log&action=stats");
      if (res.data.status === "success") {
        // ✅ เพิ่ม .map เพื่อใส่สี (color) เข้าไปในแต่ละตัวแปร entry
        const dataWithColors = res.data.data.map((item: any, index: number) => ({
          ...item,
          sodium: Number(item.sodium),
          // กำหนดสีตรงนี้ เช่น สลับสีตามลำดับ หรือใช้สีเดียวทั้งหมด
          color: index % 2 === 0 ? "hsl(25 90% 50%)" : "hsl(155 55% 40%)" 
        }));
        setMonthlyData(dataWithColors);
      }
    };
    fetchStats();
  }, []);

  const avgDaily = monthlyData.length > 0 
    ? Math.round(monthlyData.reduce((s, d) => s + (Number(d.sodium) || 0), 0) / (monthlyData.length * 30))
    : 0; // ✅ ป้องกัน NaN ถ้าไม่มีข้อมูล

  return (
    <PageLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-2xl p-5 shadow-md text-center">
            <p className="font-heading text-base font-semibold text-foreground">เฉลี่ยต่อวัน</p>
            <p className="font-heading text-xl font-bold mt-1" style={{ color: "hsl(25 90% 50%)" }}>{avgDaily.toLocaleString()} mg</p>
          </div>
          <div className="glass-card rounded-2xl p-5 shadow-md text-center">
            <p className="font-heading text-base font-semibold text-foreground">เป้าหมาย</p>
            <p className="font-heading text-xl font-bold mt-1" style={{ color: "hsl(155 55% 40%)" }}>2,000 mg</p>
          </div>
        </div>

        {/* Chart */}
        <div className="glass-card rounded-2xl p-5 shadow-lg">
          <h2 className="font-heading text-lg font-semibold text-foreground">ปริมาณโซเดียม</h2>
          <p className="mb-4 text-xs text-muted-foreground">รายเดือน(mg)</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                  formatter={(value: number) => [`${value.toLocaleString()} mg`, "โซเดียม"]}
                />
                <Bar dataKey="sodium" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="hsl(25 90% 50%)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default Stats;

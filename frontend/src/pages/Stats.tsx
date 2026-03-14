import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from "recharts";
import PageLayout from "@/components/PageLayout";
import api from "@/lib/axios";

const Stats = () => {
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/index.php?page=food-log&action=stats");
        if (res.data.status === "success") {
          const dataWithColors = res.data.data.map((item: any, index: number) => ({
            ...item,
            sodium: Number(item.sodium),
            color: index % 2 === 0 ? "hsl(25 90% 50%)" : "hsl(155 55% 40%)" 
          }));
          setMonthlyData(dataWithColors);
        }
      } catch (e) {
        console.error("Fetch stats failed", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  // 🌟 คำนวณค่าเฉลี่ยจากข้อมูลที่มีการบันทึกจริง
  const totalSodium = monthlyData.reduce((s, d) => s + (Number(d.sodium) || 0), 0);
  const avgDaily = monthlyData.length > 0 ? Math.round(totalSodium / 30) : 0; 
  // หมายเหตุ: ถ้าต้องการเฉลี่ยตามจำนวนวันที่บันทึกจริง ให้ใช้ค่าอื่นหารแทน 30

  return (
    <PageLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-2xl p-5 shadow-md text-center border border-primary/10">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">เฉลี่ยต่อวัน</p>
            <p className="font-heading text-xl font-black mt-1 text-primary">{avgDaily.toLocaleString()} mg</p>
          </div>
          <div className="glass-card rounded-2xl p-5 shadow-md text-center border border-emerald-100">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">เป้าหมาย</p>
            <p className="font-heading text-xl font-black mt-1 text-emerald-600">2,000 mg</p>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6 shadow-xl border border-white/20">
          <div className="mb-6">
            <h2 className="font-heading text-lg font-bold text-foreground">แนวโน้มโซเดียม</h2>
            <p className="text-xs text-muted-foreground">สรุปปริมาณที่ได้รับรายเดือน (mg)</p>
          </div>
          
          <div className="h-64 w-full">
            {monthlyData.length > 0 && monthlyData[0].sodium > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fontWeight: 'bold' }} 
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ borderRadius: "15px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
                    formatter={(value: number) => [`${value.toLocaleString()} mg`, "โซเดียมรวม"]}
                  />
                  <Bar dataKey="sodium" radius={[10, 10, 0, 0]} barSize={40}>
                    {monthlyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">
                ยังไม่มีข้อมูลสถิติสำหรับเดือนนี้
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default Stats;

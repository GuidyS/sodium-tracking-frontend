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
        setIsLoading(true);
        const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = savedUser.user_id;

        if (!userId) {
          setIsLoading(false);
          return;
        }

        const res = await api.get(`/index.php?page=food-log&action=stats&user_id=${userId}`);
        
        if (res.data.status === "success") {
          const dataWithColors = res.data.data.map((item: any, index: number) => ({
            ...item,
            sodium: Number(item.sodium),
            color: index === res.data.data.length - 1 ? "hsl(25 90% 50%)" : "hsl(155 55% 40%)" 
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

  // 🌟 คำนวณค่าเฉลี่ยต่อวันของ "เดือนล่าสุด" (ยอดรวมเดือนล่าสุด / 30)
  const latestMonthSodium = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].sodium : 0;
  const avgDaily = Math.round(latestMonthSodium / 30);

  return (
    <PageLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 pb-10"
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="font-heading text-2xl font-bold text-foreground">สถิติรวม</h1>
          <p className="text-sm text-muted-foreground">วิเคราะห์แนวโน้มการบริโภคโซเดียมรายเดือน</p>
        </div>

        {/* Summary Mini Cards - ขยับขึ้นมาเป็นส่วนหลัก */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            whileHover={{ y: -2 }}
            className="glass-card rounded-2xl p-5 shadow-md text-center bg-white border border-border/50"
          >
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">เฉลี่ยต่อวัน (เดือนนี้)</p>
            <p className="font-heading text-2xl font-black mt-1 text-orange-500">
              {isLoading ? "..." : avgDaily.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">mg</span>
            </p>
          </motion.div>
          <motion.div 
            whileHover={{ y: -2 }}
            className="glass-card rounded-2xl p-5 shadow-md text-center bg-white border border-border/50"
          >
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">เป้าหมายมาตรฐาน</p>
            <p className="font-heading text-2xl font-black mt-1 text-emerald-600">
              2,000 <span className="text-xs font-normal text-muted-foreground">mg</span>
            </p>
          </motion.div>
        </div>

        {/* Monthly Chart */}
        <div className="glass-card rounded-3xl p-6 shadow-xl border border-white/20 bg-white/50">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground">แนวโน้มรายเดือน</h2>
              <p className="text-[10px] text-muted-foreground italic">ข้อมูลสรุปยอดรวมแต่ละเดือน</p>
            </div>
            <div className="text-[10px] font-bold px-2 py-1 bg-primary/10 text-primary rounded-lg uppercase">Unit: mg</div>
          </div>
          
          <div className="h-72 w-full">
            {!isLoading && monthlyData.length > 0 ? (
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
                    formatter={(value: number) => [`${value.toLocaleString()} mg`, "โซเดียมสะสม"]}
                  />
                  <Bar dataKey="sodium" radius={[10, 10, 10, 10]} barSize={45}>
                    {monthlyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                <p className="italic text-sm">{isLoading ? "กำลังโหลดข้อมูล..." : "ยังไม่มีข้อมูลสถิติ"}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default Stats;

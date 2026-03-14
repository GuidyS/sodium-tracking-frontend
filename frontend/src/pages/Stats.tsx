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

  // 🌟 คำนวณยอดรวมทั้งหมด (Total All-time)
  const totalAllTime = monthlyData.reduce((s, d) => s + (Number(d.sodium) || 0), 0);
  
  // 🌟 คำนวณค่าเฉลี่ยต่อวัน (คำนวณจากยอดรวมหาร 30 เพื่อดูค่าเฉลี่ยรายเดือน)
  const avgDaily = monthlyData.length > 0 ? Math.round(totalAllTime / 30) : 0; 

  return (
    <PageLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 pb-10"
      >
        {/* Header สถิติรวม */}
        <div className="text-center space-y-1">
          <h1 className="font-heading text-2xl font-bold text-foreground">สถิติรวมทั้งหมด</h1>
          <p className="text-sm text-muted-foreground">สรุปพฤติกรรมการบริโภคโซเดียมสะสม</p>
        </div>

        {/* Big Total Card - แสดงยอดรวมสะสมทั้งหมด */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="glass-card rounded-3xl p-8 text-center shadow-2xl border-2 border-primary/20 bg-gradient-to-b from-white to-primary/5"
        >
          <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-2">โซเดียมสะสมทั้งหมด</p>
          <div className="flex items-baseline justify-center gap-2">
            <span className="font-heading text-6xl font-black text-foreground">
              {totalAllTime.toLocaleString()}
            </span>
            <span className="text-xl font-bold text-muted-foreground">mg</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-4 italic">เริ่มบันทึกข้อมูลตั้งแต่วันที่ 14 มีนาคม 2569</p>
        </motion.div>

        {/* Summary Mini Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card rounded-2xl p-5 shadow-md text-center bg-white">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">เฉลี่ยต่อวัน (เดือนนี้)</p>
            <p className="font-heading text-xl font-black mt-1 text-orange-500">{avgDaily.toLocaleString()} mg</p>
          </div>
          <div className="glass-card rounded-2xl p-5 shadow-md text-center bg-white">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">เป้าหมายมาตรฐาน</p>
            <p className="font-heading text-xl font-black mt-1 text-emerald-600">2,000 mg</p>
          </div>
        </div>

        {/* Monthly Chart */}
        <div className="glass-card rounded-3xl p-6 shadow-xl border border-white/20 bg-white/50">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground">แนวโน้มรายเดือน</h2>
              <p className="text-[10px] text-muted-foreground italic">เปรียบเทียบยอดรวมแต่ละเดือน</p>
            </div>
            <div className="text-[10px] font-bold px-2 py-1 bg-primary/10 text-primary rounded-lg uppercase">Unit: mg</div>
          </div>
          
          <div className="h-64 w-full">
            {!isLoading && monthlyData.length > 0 && monthlyData[0].sodium > 0 ? (
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
                <p className="italic text-sm">ยังไม่มีสถิติสำหรับแสดงกราฟ</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default Stats;

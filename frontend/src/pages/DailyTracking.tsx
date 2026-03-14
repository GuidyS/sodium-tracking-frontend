import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Plus, Calendar } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import NoData from "@/components/NoData";

const DailyTracking = () => {
  const navigate = useNavigate();
  const [allFoods, setAllFoods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDaily = async () => {
      try {
        setIsLoading(true);
        // ดึงข้อมูลทั้งหมด (อย่าลืมแก้ไฟล์ food-log.php ให้เอา CURDATE ออกตามที่แนะนำก่อนหน้า)
        const res = await api.get("/index.php?page=food-log&action=daily");
        if (res.data.status === "success") {
          setAllFoods(res.data.data);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDaily();
  }, []);

  // 🌟 คำนวณโซเดียมรวม "เฉพาะของวันนี้เท่านั้น" สำหรับแสดงใน Banner
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySodium = allFoods
    .filter(f => f.log_date === todayStr)
    .reduce((sum, f) => sum + Number(f.sodium_mg), 0);
  
  const limit = 2000;
  const isOver = todaySodium > limit;

  const idToWord: Record<number, string> = { 
    0: "zero", 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 
    7: "seven", 8: "eight", 9: "nine", 10: "ten", 11: "eleven", 12: "twelve", 
    13: "thirteen", 14: "fourteen", 15: "fifteen", 16: "sixteen", 17: "seventeen", 18: "eighteen"
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString.replace(/-/g, "/"));
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
  };

  const getDateLabel = (dateString: string) => {
    const d = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "วันนี้";
    if (d.toDateString() === yesterday.toDateString()) return "เมื่อวานนี้";
    
    return d.toLocaleDateString('th-TH', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    target.src = "/foods/default-food.png";
  };

  return (
    <PageLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col min-h-[70vh] space-y-6 pb-24" 
      >
        {/* Header Section */}
        <div className="flex items-center justify-between shrink-0 px-1">
          <div>
            <h2 className="font-heading text-xl font-black text-foreground">บันทึกอาหาร</h2>
            <p className="text-xs text-muted-foreground">รายการอาหารที่คุณรับประทาน</p>
          </div>
          <button 
            onClick={() => navigate("/food-log")} 
            className="flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 active:scale-95 transition-transform"
          >
            <Plus className="h-4 w-4" />
            เพิ่มมื้ออาหาร
          </button>
        </div>

        {/* 🌟 Banner สรุปโซเดียม (แสดงเฉพาะยอดของวันนี้) */}
        {todaySodium > 0 && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`flex items-center justify-between rounded-3xl p-5 shadow-sm border ${
              isOver ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${isOver ? "bg-red-500" : "bg-emerald-500"} text-white`}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isOver ? "text-red-500" : "text-emerald-600"}`}>
                  โซเดียมรวมวันนี้
                </p>
                <p className={`text-2xl font-black ${isOver ? "text-red-600" : "text-emerald-700"}`}>
                  {todaySodium.toLocaleString()} <span className="text-sm font-bold">mg</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground font-bold">เป้าหมาย</p>
              <p className="text-sm font-bold text-foreground">{limit.toLocaleString()} mg</p>
            </div>
          </motion.div>
        )}

        {/* Content Area */}
        {allFoods.length === 0 && !isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <NoData />
          </div>
        ) : (
          <div className="space-y-8">
            {allFoods.map((food, i) => {
              // เช็คเพื่อแสดงหัวข้อวันที่
              const showDateHeader = i === 0 || allFoods[i-1].log_date !== food.log_date;
              
              return (
                <div key={food.item_id || i} className="space-y-4">
                  {showDateHeader && (
                    <div className="flex items-center gap-2 sticky top-0 bg-background/80 backdrop-blur-md py-2 z-10">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      <h3 className="text-sm font-black text-foreground">
                         {getDateLabel(food.log_date)}
                      </h3>
                      <div className="flex-1 h-[1px] bg-border/50" />
                    </div>
                  )}
                  
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="glass-card flex items-center gap-4 rounded-3xl p-4 shadow-sm border border-white/20 bg-white/40"
                  >
                    <div className="h-16 w-16 rounded-2xl overflow-hidden shrink-0 shadow-inner bg-secondary/30">
                      <img 
                        src={`/foods/location_${idToWord[food.location_id]}/restaurant_${idToWord[food.restaurant_id]}/${food.food_image}`} 
                        alt={food.food_name}
                        className="h-full w-full object-cover"
                        onError={handleImageError}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-foreground truncate">{food.food_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                          food.meal_type === 'breakfast' ? 'bg-orange-100 text-orange-600' : 
                          food.meal_type === 'lunch' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                        }`}>
                          {food.meal_type === 'breakfast' ? 'เช้า' : 
                           food.meal_type === 'lunch' ? 'กลางวัน' : 'เย็น'}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {formatTime(food.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-heading font-black text-lg text-primary">
                        {Number(food.sodium_mg).toLocaleString()}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">mg</p>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </PageLayout>
  );
};

export default DailyTracking;

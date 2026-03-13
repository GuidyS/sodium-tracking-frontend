import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Plus } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { useNavigate } from "react-router-dom";
import { Navigate } from "react-router-dom";
import api from "@/lib/axios";
import NoData from "@/components/NoData";

const DailyTracking = () => {
  
  const navigate = useNavigate();
  const [todayFoods, setTodayFoods] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchDaily = async () => {
      const res = await api.get("/index.php?page=food-log&action=daily");
      if (res.data.status === "success") setTodayFoods(res.data.data);
    };
    fetchDaily();
  }, []);

  const totalSodium = todayFoods.reduce((sum, f) => sum + f.sodium_mg, 0);
  const limit = 2000;
  const isOver = totalSodium > limit;

  const idToWord: Record<number, string> = { 
  0: "zero", 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 
  7: "seven", 8: "eight", 9: "nine", 10: "ten", 11: "eleven", 12: "twelve", 
  13: "thirteen", 14: "fourteen", 15: "fifteen", 16: "sixteen", 17: "seventeen", 18: "eighteen"
  };

  // ✅ เพิ่มฟังก์ชันช่วยแปลงรูปแบบเวลา
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
  };

  // ✅ ฟังก์ชันตรวจสอบว่าเป็นวันนี้หรือเมื่อวาน
  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString).toDateString();
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date === today) return "วันนี้";

    // ✅ เปลี่ยนคำว่า "เมื่อวาน" เป็นคำที่คุณต้องการที่นี่
    if (date === yesterday.toDateString()) return "เมื่อวาน"; 
  
  // หรือถ้าต้องการให้แสดงเป็นวันที่แทนคำว่า "เมื่อวาน" ให้ใช้บรรทัดนี้:
    if (date === yesterday.toDateString()) return new Date(dateString).toLocaleDateString('th-TH', { day: 'numeric', month: 'long' });
    return new Date(dateString).toLocaleDateString('th-TH');
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    const currentSrc = target.src;
    if (currentSrc.endsWith('.png')) target.src = currentSrc.replace('.png', '.jpg');
    else if (currentSrc.endsWith('.jpg')) target.src = currentSrc.replace('.jpg', '.jpeg');
    else if (currentSrc.endsWith('.jpeg')) target.src = currentSrc.replace('.jpeg', '.webp');
    else if (currentSrc.endsWith('.webp')) target.src = currentSrc.replace('.webp', '.HEIC');
    else target.src = "/foods/default-food.png";
  };

  return (
    <PageLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        // ✅ ใช้ flex-col และกำหนดความสูงขั้นต่ำให้ชัดเจน
        className="flex flex-col min-h-[70vh] space-y-4" 
      >
        {/* Header row - ✅ เพิ่ม relative และ z-10 เพื่อให้ปุ่มอยู่บนสุดเสมอ */}
        <div className="flex items-center justify-between shrink-0 relative z-10">
          <h2 className="font-heading text-lg font-bold text-foreground">
            อาหารที่คุณรับประทานไปวันนี้
          </h2>
          <button 
            onClick={() => navigate("/food-log")} 
            className="flex items-center gap-1 rounded-xl bg-secondary px-3 py-2 text-xs font-semibold text-foreground active:scale-95 transition-transform"
          >
            <Plus className="h-4 w-4" />
            เพิ่มรายการอาหาร
          </button>
        </div>

        {/* Content Area */}
        {todayFoods.length === 0 ? (
          // ✅ ใช้ flex-1 เพื่อให้พื้นที่ที่เหลือทั้งหมดถูกใช้จัดกึ่งกลาง NoData
          <div className="flex items-center justify-center">
            <NoData />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status banner */}
            {isOver && (
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="flex items-center justify-between rounded-2xl bg-red-100 p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="font-heading font-bold text-destructive">เกินกว่ากำหนด !</p>
                    <p className="text-xs text-destructive/70">เป้าหมายของคุณคือ {limit.toLocaleString()} mg/วัน</p>
                  </div>
                </div>
                <p className="font-heading text-2xl font-bold text-destructive">
                  {totalSodium.toLocaleString()} mg
                </p>
              </motion.div>
            )}

            {/* Food list */}
            <div className="space-y-3">
              {todayFoods.map((food, i) => {
                const showDateHeader = i === 0 || getDateLabel(todayFoods[i-1].log_date) !== getDateLabel(food.log_date);
                return (
                  <div key={i} className="space-y-3">
                    {showDateHeader && (
                      <h3 className="text-sm font-bold text-primary px-1 pt-2">
                        📅 {getDateLabel(food.log_date)}
                      </h3>
                    )}
                    
                    <motion.div className="glass-card flex items-center gap-4 rounded-2xl p-4 shadow-sm">
                      <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0">
                        <img 
                          src={`/foods/location_${idToWord[food.location_id]}/restaurant_${idToWord[food.restaurant_id]}/${food.food_image}`} 
                          alt={food.food_name}
                          className="h-full w-full object-cover"
                          onError={handleImageError}
                        />
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-heading font-semibold text-foreground">{food.food_name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
                            {food.meal_type === 'breakfast' ? '🌅 เช้า' : 
                             food.meal_type === 'lunch' ? '☀️ กลางวัน' : '🌙 เย็น'}
                            {` • บันทึกเมื่อ ${formatTime(food.created_at)}`}
                          </p>
                        </div>
                      </div>
                      
                      <p className="font-heading font-bold text-foreground">
                        {Number(food.sodium_mg).toLocaleString()} mg
                      </p>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </PageLayout>
  );
};

export default DailyTracking;

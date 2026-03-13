import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowLeft, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast"; 
import PageLayout from "@/components/PageLayout";
import api from "@/lib/axios";

const mealTypes = [
  { id: "breakfast", label: "มื้อเช้า", emoji: "🌅" },
  { id: "lunch", label: "มื้อกลางวัน", emoji: "☀️" },
  { id: "dinner", label: "มื้อเย็น", emoji: "🌙" },
];

// ✅1. เพิ่มตัวแปลงเลข ID เป็นตัวหนังสือให้ตรงกับชื่อโฟลเดอร์ของคุณ
const idToWord: Record<number, string> = { 
  0: "zero" , 1: "one", 2: "two", 3: "three", 4: "four", 5: "five" , 6: "six" , 7: "seven" , 8: "eight" , 9: "nine" , 10: "ten" , 11: "eleven" , 12: "twelve" , 13: "thirteen" , 14: "fourteen" , 15: "fifteen" , 16: "sixteen" , 17: "seventeen" , 18: "eighteen"
};

const FoodItem = ({ 
    food, 
    isSelected, 
    onToggle 
  }: { 
    food: any, 
    isSelected: boolean, 
    onToggle: (f: any) => void 
  }) => {

    // ฟังก์ชันสำหรับจัดการเมื่อโหลดรูปไม่สำเร็จ
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const target = e.currentTarget;
      const currentSrc = target.src;

      // วนลูปเปลี่ยนนามสกุลไฟล์ไปเรื่อยๆ จนกว่าจะเจอไฟล์ที่มีอยู่จริงในโฟลเดอร์
      if (currentSrc.endsWith('.png')) {
        target.src = currentSrc.replace('.png', '.jpg');
      } else if (currentSrc.endsWith('.jpg')) {
        target.src = currentSrc.replace('.jpg', '.jpeg');
      } else if (currentSrc.endsWith('.jpeg')) {
        // ✅ ลองโหลดไฟล์ .webp ต่อจาก .jpeg
        target.src = currentSrc.replace('.jpeg', '.webp');
      } else if (currentSrc.endsWith('.webp')) {
        // ✅ ลองโหลดไฟล์ .HEIC ต่อจาก .webp
        target.src = currentSrc.replace('.webp', '.HEIC');
      } else if (currentSrc.endsWith('.HEIC')) {
        // ✅ ลองโหลดไฟล์ .heic (ตัวพิมพ์เล็ก) เผื่อกรณีเคสเซนสิทีฟ
        target.src = currentSrc.replace('.HEIC', '.heic');
      } else {
        // ถ้าลองครบทุกนามสกุลแล้วยังไม่เจอ ให้ใช้รูป Default
        target.src = "/foods/default-food.png";
      }
    };

    return (
        <button 
          onClick={() => onToggle(food)} // ✅ ใช้ onToggle จาก Props
          className={`glass-card flex items-center gap-4 p-3 rounded-2xl transition-all ${
            isSelected ? "ring-2 ring-primary" : "" // ✅ ใช้ isSelected จาก Props
          }`}
        >
          <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0">
            <img 
              src={`/foods/location_${idToWord[food.location_id]}/restaurant_${idToWord[food.restaurant_id]}/${food.food_image}`} 
              alt={food.food_name}
              className="h-full w-full object-cover"
              onError={handleImageError}
            />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-sm line-clamp-1">{food.food_name}</p>
            <p className="text-xs text-muted-foreground">{Number(food.sodium_mg).toLocaleString()} mg โซเดียม</p>
          </div>
        </button>
      );
    };

const FoodLog = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedFoods, setSelectedFoods] = useState<any[]>([]); // เก็บ Object อาหารที่เลือก
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // ✅ 1. เพิ่ม State สำหรับเปิด/ปิด Modal มื้ออาหาร
  const [showMealModal, setShowMealModal] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [activeLocation, setActiveLocation] = useState(0); // เก็บ Index ของ Location ที่เลือก
  const [activeRestaurantId, setActiveRestaurantId] = useState<number | null>(null);

  // ✅ 2. เพิ่ม Function สำหรับกดปุ่มบันทึกเพื่อเปิด Modal
  const handleSaveClick = () => {
    if (selectedFoods.length > 0) {
      setShowMealModal(true);
    }
  };

  useEffect(() => {
    if (locations[activeLocation]?.restaurants) {
      const restaurantIds = Object.keys(locations[activeLocation].restaurants);
      if (restaurantIds.length > 0) {
        // เลือกช้อยส์แรกให้โดยอัตโนมัติ
        setActiveRestaurantId(Number(restaurantIds[0]));
      } else {
        setActiveRestaurantId(null);
      }
    }
  }, [activeLocation, locations]);

  useEffect(() => {
    const fetchGroupedFoods = async () => {
      const response = await api.get("/index.php?page=food-log");
      if (response.data.status === "success") {
        setLocations(response.data.data);
      }
    };
    fetchGroupedFoods();
  }, []);

  const toggleFood = (food: any) => {
    setSelectedFoods((prev) => {
      const isExist = prev.find((item) => item.food_id === food.food_id);
      if (isExist) {
        // ถ้าเลือกอยู่แล้ว ให้เอาออก
        return prev.filter((item) => item.food_id !== food.food_id);
      } else {
        // ถ้ายังไม่ได้เลือก ให้เพิ่มเข้าไป
        return [...prev, food];
      }
    });
  };

  // 1. แก้การคำนวณโซเดียม (เพราะ selectedFoods เป็น array ของ object)
  const totalSodium = selectedFoods.reduce((sum, item) => sum + (Number(item.sodium_mg) || 0), 0);

  // ✅ 3. สร้างรายการอาหารแบบ "แบน" เพื่อใช้ค้นหาข้ามหมวดหมู่
  const allFoods = locations.flatMap(loc => 
    Object.values(loc.restaurants).flatMap((res: any) => res.foods)
  );

  const filteredFoods = allFoods.filter((f) =>
    f.food_name.toLowerCase().includes(search.toLowerCase())
  );

  // 4. ฟังก์ชันบันทึกข้อมูลไปยังฐานข้อมูล
  const handleMealSelect = async (mealId: string) => {
    try {
      const response = await api.post("/index.php?page=food-log", {
        foods: selectedFoods,
        meal_type: mealId // แม้ใน DB จะยังไม่มี field นี้ แต่ส่งไปเผื่อขยายผลได้ครับ
      });
      
      if (response.data.status === "success") {
        toast({ title: "บันทึกสำเร็จ", description: "บันทึกข้อมูลอาหารเรียบร้อยแล้ว" });
        navigate("/dashboard");
      }
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถบันทึกข้อมูลได้", variant: "destructive" });
    }
  };

  // ✅ 1. ตรวจสอบว่า Location ปัจจุบันควรมีแถบเลือกย่อย (Restaurant) หรือไม่
    const currentLocation = locations[activeLocation];
    const isRestaurantLocation = currentLocation?.restaurants && 
      Object.values(currentLocation.restaurants).some((res: any) => 
        res.foods.some((f: any) => f.has_restaurant === 1)
  );

  return (
    <PageLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5"
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            กรอกข้อมูลอาหาร
          </h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="ค้นหารายการอาหาร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card/50 py-3 pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        {/* 1. ส่วนเลือกสถานที่ (Main Tabs) */}
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {locations.map((loc, index) => (
        <button
          key={index}
          onClick={() => {
            setActiveLocation(index);
            setActiveRestaurantId(null); // Reset เมื่อเปลี่ยนสถานที่
          }}
          className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
            activeLocation === index ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
          }`}
        >
          {loc.location_name}
        </button>
      ))}
    </div>

    {/* ✅ 2. แสดง Sub-tabs เฉพาะสถานที่ที่มี restaurant (โรงเย็น/โรงร้อน) */}
    {!search && isRestaurantLocation && (
    <div className="relative w-full max-w-xs mb-4">
      {/* ปุ่มกด Dropdown */}
      <button
        onClick={() => setIsShopOpen(!isShopOpen)}
        className="flex w-full items-center justify-between rounded-2xl border border-border bg-card/50 p-4 text-sm font-medium text-foreground shadow-sm backdrop-blur-md transition-all hover:bg-secondary/50"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🏪</span>
          {/* แสดงชื่อร้านที่เลือกจาก activeRestaurantId จริงในฐานข้อมูล */}
          {activeRestaurantId 
            ? currentLocation.restaurants[activeRestaurantId]?.restaurant_name 
            : "เลือกร้านค้า"}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isShopOpen ? "rotate-180" : ""}`} />
      </button>

      {/* รายการร้านค้าที่ดึงมาจาก Database */}
      <AnimatePresence>
        {isShopOpen && (
          <>
            {/* Overlay สำหรับปิดเมื่อกดข้างนอก */}
            <div className="fixed inset-0 z-40" onClick={() => setIsShopOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card/90 shadow-xl backdrop-blur-xl"
            >
              <div className="max-h-60 overflow-y-auto p-1 scrollbar-hide">
                {Object.values(currentLocation.restaurants).map((res: any) => (
                  <button
                    key={res.restaurant_id}
                    onClick={() => {
                      setActiveRestaurantId(res.restaurant_id); // ✅ อัปเดต ID ร้านเพื่อกรองอาหาร
                      setIsShopOpen(false); // ปิด Dropdown
                    }}
                    className={`flex w-full items-center rounded-xl px-4 py-3 text-sm transition-colors ${
                      activeRestaurantId === res.restaurant_id
                        ? "bg-primary text-white"
                        : "text-foreground hover:bg-primary/10"
                    }`}
                  >
                    {res.restaurant_name}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )}

    {/* 3. รายการอาหาร */}
    <div className="mt-4 space-y-4 pb-32">
      {search ? (
        <div className="grid gap-3">
          {filteredFoods.map((food) => (
            <FoodItem 
              key={food.food_id} 
              food={food} 
              // ✅ ต้องส่ง Props 2 ตัวนี้ไปด้วยเพื่อให้กดได้และไม่กะพริบ
              isSelected={selectedFoods.some(f => f.food_id === food.food_id)}
              onToggle={toggleFood}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {isRestaurantLocation ? (
            // กรณีมีร้านอาหาร
            activeRestaurantId && 
            currentLocation.restaurants[activeRestaurantId]?.foods.map((food: any) => (
              <FoodItem 
                key={food.food_id} 
                food={food} 
                // ✅ เพิ่ม Props ที่นี่ด้วย
                isSelected={selectedFoods.some(f => f.food_id === food.food_id)}
                onToggle={toggleFood}
              />
            ))
          ) : (
            // กรณีไม่มีร้านอาหาร (ชั้น 8 / คาเฟ่)
            currentLocation?.restaurants && 
            Object.values(currentLocation.restaurants).flatMap((res: any) => res.foods).map((food: any) => (
              <FoodItem 
                key={food.food_id} 
                food={food} 
                // ✅ และเพิ่ม Props ที่จุดนี้ด้วย
                isSelected={selectedFoods.some(f => f.food_id === food.food_id)}
                onToggle={toggleFood}
              />
            ))
          )}
        </div>
      )}
    </div>

        {/* Save button */}
        {selectedFoods.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            // ✅ เพิ่ม bg-background/80 และ backdrop-blur เพื่อให้ข้อความอ่านง่ายแม้เลื่อนผ่านรายการอาหาร
            className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-t border-border pb-10 pt-4 px-6"
          >
            <div className="mx-auto max-w-md">
              <div className="mb-3 text-center text-sm font-medium text-muted-foreground">
                เลือก {selectedFoods.length} รายการ · <span className="text-primary font-bold">{totalSodium.toLocaleString()} mg</span> โซเดียม
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveClick}
                // ✅ เปลี่ยนจาก gradient-btn เป็นการระบุสีตรงๆ เพื่อป้องกันสีเพี้ยน
                className="w-full rounded-2xl gradient-btn py-4 font-heading text-lg font-bold text-primary-foreground shadow-[0_8px_30px_rgb(var(--primary)/0.3)] transition-all gradient-btn:hover"
              >
                บันทึกมื้ออาหาร
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Meal type modal */}
      <AnimatePresence>
        {showMealModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMealModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-[90%] max-w-sm rounded-3xl bg-card p-6 shadow-2xl"
            >
              <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-muted" />
              <h2 className="font-heading text-xl font-bold text-foreground text-center mb-2">
                เลือกมื้ออาหาร
              </h2>
              <p className="text-sm text-muted-foreground text-center mb-6">
                {selectedFoods.length} รายการ · {totalSodium.toLocaleString()} mg โซเดียม
              </p>
              <div className="space-y-3">
                {mealTypes.map((meal) => (
                  <motion.button
                    key={meal.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleMealSelect(meal.id)}
                    className="flex w-full items-center gap-4 rounded-2xl bg-secondary p-4 text-left transition-colors hover:bg-secondary/80"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                      {meal.emoji}
                    </div>
                    <span className="font-heading text-lg font-semibold text-foreground">
                      {meal.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
};

export default FoodLog;

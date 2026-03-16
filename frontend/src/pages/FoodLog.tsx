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

const idToWord: Record<number, string> = { 
  0: "zero" , 1: "one", 2: "two", 3: "three", 4: "four", 5: "five" , 6: "six" , 7: "seven" , 8: "eight" , 9: "nine" , 10: "ten" , 11: "eleven" , 12: "twelve" , 13: "thirteen" , 14: "fourteen" , 15: "fifteen" , 16: "sixteen" , 17: "seventeen" , 18: "eighteen"
};

const FoodItem = ({ food, isSelected, onToggle }: { food: any, isSelected: boolean, onToggle: (f: any) => void }) => {
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    const currentSrc = target.src;
  
    // ใช้ Regex /\.นามสกุล$/i เพื่อเช็คโดยไม่สนตัวพิมพ์เล็ก/ใหญ่ (Case-insensitive)
    if (/\.png$/i.test(currentSrc)) {
      target.src = currentSrc.replace(/\.png$/i, '.jpg');
    } else if (/\.jpg$/i.test(currentSrc)) {
      target.src = currentSrc.replace(/\.jpg$/i, '.jpeg');
    } else if (/\.jpeg$/i.test(currentSrc)) {
      target.src = currentSrc.replace(/\.jpeg$/i, '.webp');
    } else if (/\.webp$/i.test(currentSrc)) {
      target.src = currentSrc.replace(/\.webp$/i, '.heic');
    } else if (/\.heic$/i.test(currentSrc)) {
      target.src = currentSrc.replace(/\.heic$/i, '.avif');
    } else {
      // ถ้าลองทุกนามสกุล (รวมถึง .AVIF / .avif แล้ว) ยังไม่เจอ ให้ใช้รูป Default
      // เนื่องด้วยไฟล์บางประเภท เช่น .HEIC ไม่รองรับในทุกเบราว์เซอร์ การใช้รูปสำรองจึงสำคัญมากครับ
      target.src = "/foods/default-food.png";
    }
  };

    return (
        <button 
          onClick={() => onToggle(food)} 
          className={`glass-card flex items-center gap-4 p-3 rounded-2xl transition-all ${isSelected ? "ring-2 ring-primary bg-primary/5" : ""}`}
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
  const [selectedFoods, setSelectedFoods] = useState<any[]>([]);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [activeLocation, setActiveLocation] = useState(0);
  const [activeRestaurantId, setActiveRestaurantId] = useState<number | null>(null);

  useEffect(() => {
    const fetchGroupedFoods = async () => {
      try {
        // 🌟 ดึง ID จาก LocalStorage เพื่อให้ค้นหาอาหารขึ้นบนมือถือ
        const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const response = await api.get(`/index.php?page=food-log&user_id=${savedUser.user_id}`);
        if (response.data.status === "success") {
          setLocations(response.data.data);
        }
      } catch (error) {
        console.error("Fetch foods failed", error);
      }
    };
    fetchGroupedFoods();
  }, []);

  useEffect(() => {
    if (locations[activeLocation]?.restaurants) {
      const restaurantIds = Object.keys(locations[activeLocation].restaurants);
      if (restaurantIds.length > 0) setActiveRestaurantId(Number(restaurantIds[0]));
      else setActiveRestaurantId(null);
    }
  }, [activeLocation, locations]);

  const toggleFood = (food: any) => {
    setSelectedFoods((prev) => {
      const isExist = prev.find((item) => item.food_id === food.food_id);
      return isExist ? prev.filter((item) => item.food_id !== food.food_id) : [...prev, food];
    });
  };

  const totalSodium = selectedFoods.reduce((sum, item) => sum + (Number(item.sodium_mg) || 0), 0);

  const allFoods = locations.flatMap(loc => 
    Object.values(loc.restaurants).flatMap((res: any) => res.foods)
  );

  const filteredFoods = allFoods.filter((f) =>
    f.food_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleMealSelect = async (mealId: string) => {
    try {
      // 🌟 ดึง ID มาแนบตอนส่งข้อมูลไปบันทึก
      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await api.post("/index.php?page=food-log", {
        foods: selectedFoods,
        meal_type: mealId,
        user_id: savedUser.user_id 
      });
      
      if (response.data.status === "success") {
        toast({ title: "บันทึกสำเร็จ", description: "บันทึกข้อมูลอาหารเรียบร้อยแล้ว" });
        navigate("/daily");
      }
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถบันทึกข้อมูลได้", variant: "destructive" });
    }
  };

  const currentLocation = locations[activeLocation];
  const isRestaurantLocation = currentLocation?.restaurants && 
    Object.values(currentLocation.restaurants).some((res: any) => 
      res.foods.some((f: any) => f.has_restaurant === 1)
  );

  return (
    <PageLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="p-2"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="font-heading text-2xl font-bold">กรอกข้อมูลอาหาร</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="ค้นหารายการอาหาร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card/50 py-3 pl-11 pr-4 text-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {locations.map((loc, index) => (
            <button
              key={index}
              onClick={() => { setActiveLocation(index); setActiveRestaurantId(null); }}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${activeLocation === index ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}
            >
              {loc.location_name}
            </button>
          ))}
        </div>

        {!search && isRestaurantLocation && (
          <div className="relative w-full mb-4">
            <button
              onClick={() => setIsShopOpen(!isShopOpen)}
              className="flex w-full items-center justify-between rounded-2xl border bg-card/50 p-4 text-sm font-medium"
            >
              <div className="flex items-center gap-2"> {activeRestaurantId ? currentLocation.restaurants[activeRestaurantId]?.restaurant_name : "เลือกร้านค้า"}</div>
              <ChevronDown className={`h-4 w-4 transition-transform ${isShopOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {isShopOpen && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 mt-2 w-full rounded-2xl border bg-card shadow-xl overflow-hidden">
                  <div className="max-h-60 overflow-y-auto p-1">
                    {Object.values(currentLocation.restaurants).map((res: any) => (
                      <button key={res.restaurant_id} onClick={() => { setActiveRestaurantId(res.restaurant_id); setIsShopOpen(false); }} className={`flex w-full px-4 py-3 text-sm ${activeRestaurantId === res.restaurant_id ? "bg-primary text-white" : "hover:bg-primary/10"}`}>{res.restaurant_name}</button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="mt-4 space-y-3 pb-32">
          {search ? (
            filteredFoods.map((food) => <FoodItem key={food.food_id} food={food} isSelected={selectedFoods.some(f => f.food_id === food.food_id)} onToggle={toggleFood} />)
          ) : (
            isRestaurantLocation ? (
              activeRestaurantId && currentLocation.restaurants[activeRestaurantId]?.foods.map((food: any) => <FoodItem key={food.food_id} food={food} isSelected={selectedFoods.some(f => f.food_id === food.food_id)} onToggle={toggleFood} />)
            ) : (
              currentLocation?.restaurants && Object.values(currentLocation.restaurants).flatMap((res: any) => res.foods).map((food: any) => <FoodItem key={food.food_id} food={food} isSelected={selectedFoods.some(f => f.food_id === food.food_id)} onToggle={toggleFood} />)
            )
          )}
        </div>

        {selectedFoods.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-t pb-10 pt-4 px-6">
            <div className="mx-auto max-w-md">
              <div className="mb-3 text-center text-sm font-medium">เลือก {selectedFoods.length} รายการ · <span className="text-primary font-bold">{totalSodium.toLocaleString()} mg</span></div>
              <button onClick={() => setShowMealModal(true)} className="w-full rounded-2xl bg-primary text-white py-4 text-lg font-bold shadow-lg">บันทึกมื้ออาหาร</button>
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showMealModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowMealModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-[90%] max-w-sm rounded-3xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-center mb-6">เลือกมื้ออาหาร</h2>
              <div className="space-y-3">
                {mealTypes.map((meal) => (
                  <button key={meal.id} onClick={() => handleMealSelect(meal.id)} className="flex w-full items-center gap-4 rounded-2xl bg-secondary p-4 hover:bg-secondary/80">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">{meal.emoji}</div>
                    <span className="text-lg font-semibold">{meal.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
};

export default FoodLog;

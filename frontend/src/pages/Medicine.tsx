import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Pill, Leaf, ChevronRight, X, AlertTriangle, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import api from "@/lib/axios";

type DetailItem = {
  id: number;
  name: string;
  detail: string;
  warning?: string;
  image?: string;
};

type Category = {
  title: string;
  description: string;
  icon: typeof Pill;
  color: string;
  infographic: string;
  items: DetailItem[];
};

  const Medicine = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]); // ✅ เปลี่ยนมาใช้ State
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [expandedItem, setExpandedItem] = useState<string | null>(null);

    useEffect(() => {
    const fetchMedicineData = async () => {
      try {
        const response = await api.get("/index.php?page=medicine-info");
        if (response.data.status === "success") {
          const { medicines, herbs } = response.data.data;

          // ✅ 1. ลอจิกสำหรับกลุ่ม "ยา" (NSAIDs / Corticosteroid) - เก็บรายละเอียดไว้ครบถ้วน
          const mapMedicine = (m: any) => ({
            id: m.med_id,
            name: m.title,
            detail: `ข้อบ่งใช้: ${m.content["ข้อบ่งใช้หลัก"] || ""}\n\nข้อควรระวัง: ${m.content["ข้อควรระวังเฉพาะตัว & สำคัญ"] || ""}\n\nใครไม่ควรใช้: ${m.content["ใครบ้างที่ไม่ควรซื้อใช้เอง"] || ""}`,
            warning: m.content["อาการเตือนที่ควรหยุดยา"] || "",
            image: m.image_path ? `/med-herb/${m.image_path}` : undefined 
          });

          // ✅ 2. ลอจิกสำหรับกลุ่ม "สมุนไพร" - ตัด ข้อควรระวัง และ ใครไม่ควรใช้ออก
          const mapHerb = (h: any) => ({
            id: h.herb_id,
            name: h.title,
            detail: `ข้อมูล: ${h.content.detail || ""}`, // แสดงเฉพาะรายละเอียดพื้นฐาน
            warning: h.content.warning || "",
            image: h.image_path ? `/med-herb/${h.image_path}` : undefined
          });

          const formattedCategories: Category[] = [
            {
              title: "NSAIDs",
              description: "ยาแก้ปวดลดอักเสบที่อาจส่งผลต่อไต",
              icon: Pill,
              color: "from-[hsl(255,60%,65%)] to-[hsl(280,60%,60%)]",
              infographic: "/infographic/info-nsaids.jpg",
              items: medicines.filter((m: any) => m.med_category === "NSAIDs").map(mapMedicine)
            },
            {
              title: "Corticosteroid",
              description: "ยาสเตียรอยด์ที่อาจทำให้ร่างกายกักเก็บโซเดียม",
              icon: Pill,
              color: "from-[hsl(200,60%,55%)] to-[hsl(220,70%,65%)]",
              infographic: "/infographic/info-corticosteroid.jpg",
              items: medicines.filter((m: any) => m.med_category === "Corticosteroid").map(mapMedicine)
            },
            {
              title: "สมุนไพรที่มีพิษต่อไต",
              description: "สมุนไพรที่ควรระวังเพราะอาจส่งผลเสียต่อไต",
              icon: Leaf,
              color: "from-[hsl(30,70%,55%)] to-[hsl(15,70%,55%)]",
              infographic: "/infographic/info-herbs.jpg",
              items: herbs.map(mapHerb) // ✅ ใช้ฟังก์ชัน mapHerb ที่ตัดข้อมูลส่วนเกินออกแล้ว
            }
          ];
          setCategories(formattedCategories);
        }
      } catch (error) {
        console.error("Failed to fetch medicine data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMedicineData();
  }, []);

  if (isLoading) return <div className="p-10 text-center">กำลังโหลดข้อมูล...</div>;

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
            ความรู้เกี่ยวกับยา
          </h1>
        </div>

        <div className="space-y-4">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            const isOpen = expandedCategory === cat.title;
            return (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl overflow-hidden shadow-md"
              >
                {/* Header - click to view infographic */}
                <div
                  className={`bg-gradient-to-r ${cat.color} p-4 cursor-pointer active:scale-[0.98] transition-transform`}
                  onClick={() => setViewingImage(cat.infographic)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-6 w-6 text-white" />
                      <h2 className="font-heading text-lg font-bold text-white">{cat.title}</h2>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/70" />
                  </div>
                  <p className="mt-1 text-xs text-white/80">{cat.description}</p>
                </div>

                {/* Tags area - click to expand dropdown */}
                <div
                  className="p-3 cursor-pointer"
                  onClick={() => {
                    setExpandedCategory(isOpen ? null : cat.title);
                    setExpandedItem(null);
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {cat.items.slice(0, 4).map((item) => (
                        <span key={item.name} className="text-xs bg-secondary/60 text-foreground rounded-full px-2.5 py-1">
                          {item.name}
                        </span>
                      ))}
                      {cat.items.length > 4 && (
                        <span className="text-xs bg-secondary/60 text-muted-foreground rounded-full px-2.5 py-1">
                          +{cat.items.length - 4} รายการ
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {/* Dropdown detail list */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-2">
                        {cat.items.map((item, idx) => {
                          const isItemExpanded = expandedItem === item.name;
                          return (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="bg-secondary/40 rounded-xl overflow-hidden cursor-pointer mb-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedItem(isItemExpanded ? null : item.name);
                              }}
                            >
                              <div className="p-3 flex items-center gap-3">
                                {item.image && (
                                  <img src={item.image} alt={item.name} className="h-10 w-10 rounded-sm object-cover shrink-0"
                                  onError={(e) => (e.currentTarget.src = "/med-herb/pill.png")}
                                   />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-heading text-sm font-bold text-foreground">{item.name}</h4>
                                </div>
                                <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isItemExpanded ? "rotate-180" : ""}`} />
                              </div>

                              <AnimatePresence>
                                {isItemExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-3 pb-3 space-y-3">
                                      {item.image && (
                                        <img src={item.image} alt={item.name} className="w-full max-h-48 object-contain rounded-xl bg-secondary/30" />
                                      )}
                                      {/* ✅ แสดงรายละเอียดทั้งหมดที่จัดรูปแบบมาแล้ว */}
                                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                        {item.detail}
                                      </p>
                                      
                                      {/* แจ้งเตือนอันตราย */}
                                      {item.warning && (
                                        <div className="flex items-start gap-1.5 bg-destructive/10 rounded-lg p-2">
                                          <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                                          <span className="text-xs text-destructive font-medium">{item.warning}</span>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Image Lightbox */}
      <AnimatePresence>
        {viewingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setViewingImage(null)}
          >
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/20 rounded-full p-2 z-10"
            >
              <X className="h-5 w-5" />
            </button>
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              src={viewingImage}
              alt="Infographic"
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
};

export default Medicine;
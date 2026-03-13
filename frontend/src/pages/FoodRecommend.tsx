import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Leaf, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import infographicHealthy from "@/assets/infographic-healthy.jpg";
import infographicHighSodium from "@/assets/infographic-high-sodium.jpg";

const FoodRecommend = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"healthy" | "highSodium">("healthy");

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
            แนะนำรายการอาหาร
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl bg-secondary p-1">
          <button
            onClick={() => setActiveTab("healthy")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              activeTab === "healthy"
                ? "gradient-btn text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Leaf className="h-4 w-4" />
            อาหารมีประโยชน์
          </button>
          <button
            onClick={() => setActiveTab("highSodium")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              activeTab === "highSodium"
                ? "gradient-btn text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            อาหารโซเดียมสูง
          </button>
        </div>

        {/* Infographic Image */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="glass-card rounded-2xl overflow-hidden shadow-lg"
        >
          <img
            src={activeTab === "healthy" ? infographicHealthy : infographicHighSodium}
            alt={activeTab === "healthy" ? "10 เมนูอาหารมีประโยชน์ ดีต่อไต" : "15 เมนูอาหารโซเดียมสูง"}
            className="w-full h-auto object-contain"
          />
        </motion.div>
      </motion.div>
    </PageLayout>
  );
};

export default FoodRecommend;

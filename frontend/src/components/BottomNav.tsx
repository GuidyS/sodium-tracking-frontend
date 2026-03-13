import { useLocation, useNavigate } from "react-router-dom";
import { Home, Calendar, CalendarDays, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { path: "/dashboard", label: "หน้าหลัก", icon: Home },
  { path: "/daily", label: "รายวัน", icon: Calendar },
  { path: "/weekly", label: "รายสัปดาห์", icon: CalendarDays },
  { path: "/stats", label: "สถิติรวม", icon: BarChart3 },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-md">
        <div className="glass-card mx-4 mb-4 flex items-center justify-around rounded-2xl p-2 shadow-lg">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 gradient-btn rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className="relative z-10 h-5 w-5" />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;

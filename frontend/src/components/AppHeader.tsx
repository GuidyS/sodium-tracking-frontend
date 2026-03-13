import { Settings, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AppHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between rounded-2xl px-5 py-3 mb-4 shadow-md"
      style={{ background: "linear-gradient(135deg, hsl(155 45% 45%), hsl(140 40% 55%))" }}
    >
      <h1 className="text-xl font-extrabold tracking-wide text-white drop-shadow-sm font-body italic">
        Sodium <span className="opacity-90">Tracking</span>
      </h1>
      <div className="flex items-center gap-5">
        <button onClick={() => navigate("/settings")} className="text-white/80 hover:text-white transition-colors">
          <Settings className="h-5 w-5" />
        </button>
        <button onClick={() => navigate("/profile")} className="text-white/80 hover:text-white transition-colors">
          <UserCircle className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default AppHeader;

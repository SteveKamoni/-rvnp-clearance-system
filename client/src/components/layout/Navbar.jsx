// import React from "react";
import { Bell, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";

const Navbar = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="w-full bg-[#0D1B3E] text-white shadow-lg">
      <div className="mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#102552] border-2 border-[#C9A84C] shadow-md">
            <span className="text-lg font-bold tracking-wide text-[#C9A84C]">
              RV
            </span>
          </div>

          <div>
            <h1 className="text-lg font-semibold leading-tight">
              Clearance Portal
            </h1>

            <p className="text-sm text-slate-300">
              Rift Valley National Polytechnic
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-full p-2 transition hover:bg-[#173067]"
          >
            <Bell size={22} />

            {/* Notification Indicator */}
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#C9A84C]" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-[#C9A84C] px-4 py-2 font-medium text-[#C9A84C] transition hover:bg-[#C9A84C] hover:text-[#0D1B3E]"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Dashboard", path: "dashboard" },
  { label: "Candidates", path: "candidates" },
  { label: "Job Descriptions", path: "jobs" },
  { label: "Settings", path: "settings" },
];

function Navbar({ activePage, onNavigate }) {
  return (
    <nav className="bg-forest h-17 px-9 flex items-center justify-between">
      <div className="flex items-center gap-11">
        {/* Brand */}
        <div className="flex items-center gap-2.5 text-white">
          <img
            src="/teyzix-logo.png"
            alt="Teyzix Core"
            className="w-9 h-9 rounded-lg object-contain bg-white p-0.5"
          />
          <span className="font-heading font-bold text-base">Teyzix Core</span>
        </div>

        {/* Nav tabs */}
        <div className="flex gap-1.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 relative ${
                activePage === item.path
                  ? "bg-white/12 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/6"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <button className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/15 transition-colors duration-200">
          🔔
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gold flex-shrink-0 flex items-center justify-center font-heading font-bold text-forest-deep text-base">
          H
        </div>
          <div>
            <div className="text-xs font-semibold text-white">Haseeb Ul Hassan</div>
            <div className="text-[10px] text-white/60">AI Intern</div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
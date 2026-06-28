// import React from "react";

const tabs = [
  {
    id: "overview",
    label: "Overview",
  },
  {
    id: "departments",
    label: "Departments",
  },
  {
    id: "details",
    label: "My Details",
  },
];

const TabNav = ({ activeTab, onTabChange }) => {
  return (
    <div className="w-full bg-[#0D1B3E] border-t border-[#1b2d59]">
      <div className="mx-auto flex items-center px-4 sm:px-6 lg:px-8">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`
                relative px-6 py-4 text-sm font-semibold transition-all duration-200
                border-b-4
                ${
                  active
                    ? "border-[#C9A84C] text-[#C9A84C]"
                    : "border-transparent text-slate-300 hover:text-white hover:border-slate-500"
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabNav;
// import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Clock3,
} from "lucide-react";

const SummaryStats = ({ stats }) => {
  const cards = [
    {
      id: "cleared",
      title: "Cleared",
      value: stats.cleared,
      icon: CheckCircle2,
      bg: "bg-green-50",
      border: "border-green-200",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      textColor: "text-green-700",
    },
    {
      id: "deductions",
      title: "Deductions",
      value: stats.deductions,
      icon: AlertTriangle,
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      textColor: "text-amber-700",
    },
    {
      id: "pending",
      title: "Pending",
      value: stats.pending,
      icon: Clock3,
      bg: "bg-slate-50",
      border: "border-slate-200",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      textColor: "text-slate-700",
    },
  ];

  return (
    <section className="grid gap-6 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.id}
            className={`${card.bg} ${card.border} rounded-2xl border p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {card.title}
                </p>

                <h2
                  className={`mt-3 text-4xl font-bold ${card.textColor}`}
                >
                  {card.value}
                </h2>
              </div>

              <div
                className={`${card.iconBg} rounded-xl p-3`}
              >
                <Icon
                  size={28}
                  className={card.iconColor}
                />
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default SummaryStats;
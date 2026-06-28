// import React from "react";

const ProgressRing = ({
  percentage = 0,
  size = 140,
  strokeWidth = 12,
  color = "#C9A84C",
  trackColor = "#E5E7EB",
  label = "Completed",
}) => {
  const normalizedPercentage = Math.min(Math.max(percentage, 0), 100);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset =
    circumference - (normalizedPercentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="-rotate-90 transform"
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />

          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition:
                "stroke-dashoffset 0.8s ease-in-out",
            }}
          />
        </svg>

        {/* Center Text */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-[#0D1B3E]">
            {normalizedPercentage}%
          </span>

          <span className="mt-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProgressRing;
import React from 'react';

export const ProgressBar = ({ progress = 0, status = 'default', showLabel = true, height = 'h-2' }) => {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));

  const colorClasses = {
    default: 'bg-[#E96A1C]',
    completed: 'bg-emerald-500',
    failed: 'bg-rose-500',
    cancelled: 'bg-amber-500',
  };

  const barColor = colorClasses[status] || colorClasses.default;

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center text-xs mb-1 font-medium text-gray-600">
          <span className="capitalize">{status}</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${height}`}>
        <div
          className={`${height} ${barColor} transition-all duration-300 rounded-full`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
